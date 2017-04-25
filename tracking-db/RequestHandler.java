import java.sql.*;
import java.util.*;

import java.io.IOException;
import java.io.OutputStream;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import org.json.*;

public class RequestHandler implements HttpHandler {
    private Connection dbConn;

    private static final int[] xRef = {100, 200, 300, 400};
    private static final int[] yRef = {500, 600};
    
    public RequestHandler(String dbUrl, String dbUsername, String dbPassword)
    {
        this.dbConn = DBService.getDatabaseConnection(dbUrl, dbUsername, dbPassword);
    }
    
    @Override
    public void handle(HttpExchange exchange) throws IOException
    {
        String query = exchange.getRequestURI().getQuery();
            
        Map<String, String> request = new HashMap<>();
        for (String pair : query.split("&"))
        {
            String[] pairArray = pair.split("=");
            request.put(pairArray[0], pairArray.length > 1 ? pairArray[1] : "");
        }

        JSONObject response = new JSONObject().put("succeeded", false);
        
        String requestType = request.get("type");
        try
        {
            switch (requestType) {
                case "color":
                    {
                    int compId = Integer.parseInt(request.get("compId"));
                    response.put("color", getComponentColor(compId));
                    response.put("succeeded", true);
                    break;
                    }

                case "cycletime":
                    {
                    int orderId = Integer.parseInt(request.get("orderId"));
                    long cycleTime = getCycleTime(orderId);
                    response.put("cycleTime", cycleTime);
                    response.put("succeeded", true);
                    break;
                    }

                case "history":
                    {
                    int orderId = Integer.parseInt(request.get("orderId"));
                    int compId = Integer.parseInt(request.get("compId"));
                    List<Object[]> history = getComponentHistory(orderId, compId);
                    for (Object[] o : history) {
                        response.accumulate("time", o[0]);
                        response.accumulate("type", o[1]);
                        response.accumulate("action", o[2]);
                    }
                    response.put("succeeded", true);
                    break;
                    }

                case "throughput":
                    {
                    double throughput = getThroughput();
                    response.put("throughput", throughput);
                    response.put("succeeded", true);
                    break;
                    }

                default:
                    System.out.println("RequestHandler: Unknown HTTP request received.");
            }
        }
        catch (Exception e)
        {
            System.out.println("RequestHandler: Encountered an exception: " + e);
        }

        String responseString = response.toString();
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(200, responseString.length());
        OutputStream os = exchange.getResponseBody();
        os.write(responseString.getBytes());
        os.close();
    }

    private String getComponentColor(int id) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("SELECT color FROM Components WHERE id = ?");
        statement.setInt(1, id);
        ResultSet result = statement.executeQuery();
        result.next();
        String color = result.getString("color");
        statement.close();
        return color;
    }

    private List<Object[]> getComponentHistory(int orderId, int compId) throws SQLException
    {
        // The Object arrays are of the form {(long)time, "type", "action"}
        List<Object[]> history = new ArrayList<>();

        PreparedStatement statement;
        ResultSet result;

        // __TRACKING EVENTS__
        // Fetch all TrackingEvents that contain component compId
        // Choose the earliest time for each camera
        statement = dbConn.prepareStatement("SELECT camera_id, MIN(time) AS time FROM ComponentsInTrackingEvents WHERE order_id = ? AND comp_id = ? GROUP BY camera_id");
        statement.setInt(1, orderId);
        statement.setInt(2, compId);
        result = statement.executeQuery();
        while (result.next())
        {
            Object[] o = new Object[3];
            o[0] = result.getLong("time");
            o[1] = "Camera" + result.getInt("camera_id");
            o[2] = "Spotted";
            history.add(o);
        }

        // __SYSTEM EVENTS__
        // Fetch all events that apply to all components, e.g. Big Arm
        statement = dbConn.prepareStatement("SELECT type, action, time FROM SystemEvents WHERE order_id = ?");
        statement.setInt(1, orderId);
        result = statement.executeQuery();
        while (result.next())
        {
            Object[] o = new Object[3];
            o[0] = result.getLong("time");
            o[1] = result.getString("type");
            o[2] = result.getString("action");
            history.add(o);
        }

        // Figure out which component is in which spot:
        // Fetch all tracking events from the Big Arm camera or the band camera
        // Find the most robust (middle?) occurence of compId and the corresponding coordinates
        // Check coordinates against references and associate with corresponding system event
        // (Now we also know where the component ended up in the final product)
        try
        {
            statement = dbConn.prepareStatement("SELECT COUNT(*) AS count FROM ComponentsInTrackingEvents WHERE order_id = ? AND comp_id = ? AND camera_id = 3");
            statement.setInt(1, orderId);
            statement.setInt(2, compId);
            result = statement.executeQuery();
            result.next();
            int length = result.getInt("count"); // If 0 we throw, catch and stop
            int mid = length == 1 ? 1 : length / 2;
            
            statement = dbConn.prepareStatement("SELECT x_coord, y_coord FROM ComponentsInTrackingEvents WHERE order_id = ? AND comp_id = ? AND camera_id = 3");
            statement.setInt(1, orderId);
            statement.setInt(2, compId);
            result = statement.executeQuery();

            for (int i = 0; i < mid; i++)
            {
                result.next();
            }

            int x = result.getInt("x_coord");
            int y = result.getInt("y_coord");
            int tol = 50;
            boolean located = false;

            int i = 0, j = 0;
            while (!located)
            {
                outer:
                for (i = 0; i < xRef.length; i++)
                {
                    for (j = 0; i < yRef.length; i++)
                    {
                        if (   xRef[i] - tol <= x && x <= xRef[i] + tol
                               && yRef[j] - tol <= y && y <= yRef[j] + tol)
                        {
                            located = true;
                            break outer;
                        }
                    }
                }
                tol += 5;
            }

            int position = i + 4*j + 1; // One of the 8 positions on the pallet
            statement = dbConn.prepareStatement("SELECT type, action, time FROM SystemEvents WHERE order_id = ? AND action LIKE %?%");
            statement.setInt(1, position);
            result = statement.executeQuery();
            while (result.next())
            {
                Object[] o = new Object[3];
                o[0] = result.getLong("time");
                o[1] = result.getString("type");
                o[2] = result.getString("action");
                history.add(o);
            }
        }
        catch (Exception e)
        {
            System.out.printf("RequestHandler: There isn't enough system data unique to component %d to get its unique history.\n", compId);
        }

        // Sort by time
        Collections.sort(history, new Comparator<Object[]>()
        {
            public int compare(Object[] object, Object[] otherObject)
            {
                return ((Long)object[0]).compareTo((Long)otherObject[0]);
            }
        });

        return history;
    }

    private long getCycleTime(int orderId) throws SQLException
    {
        PreparedStatement statement;
        ResultSet result;
        
        statement = dbConn.prepareStatement("SELECT time FROM SystemEvents WHERE order_id = ? AND type = 'start'");
        statement.setInt(1, orderId);
        result = statement.executeQuery();
        result.next();
        long startTime = result.getLong("time");

        statement = dbConn.prepareStatement("SELECT time FROM SystemEvents WHERE order_id = ? AND type = 'end'");
        statement.setInt(1, orderId);
        result = statement.executeQuery();
        result.next();
        long endTime = result.getLong("time");

        return endTime - startTime;
    }

    private double getThroughput() throws SQLException
    {
        PreparedStatement statement;
        ResultSet result;
        statement = dbConn.prepareStatement("SELECT (MAX(id) - MIN(id)) AS num_of_completed FROM Orders");
        result = statement.executeQuery();
        result.next();
        int numOfCompleted = result.getInt("num_of_completed");

        if (numOfCompleted == 0)
            return 0;

        statement = dbConn.prepareStatement("SELECT MIN(time) AS time FROM SystemEvents WHERE type = 'start'");
        result = statement.executeQuery();
        result.next();
        long startTime = result.getLong("time");

        statement = dbConn.prepareStatement("SELECT MAX(time) AS time FROM SystemEvents WHERE type = 'end'");
        result = statement.executeQuery();
        result.next();
        long endTime = result.getLong("time");

        return numOfCompleted / (startTime - endTime);
    }
}
