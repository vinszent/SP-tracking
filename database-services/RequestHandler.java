import java.sql.*;
import java.util.*;

import java.io.IOException;
import java.io.OutputStream;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import org.json.*;

public class RequestHandler implements HttpHandler {
    private Connection dbConn;

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
        
        String requestType = request.get("requestType");
        response.put("requestType", requestType);
        
        int compId, orderId;
        List<Object[]> history;
        JSONArray times, resources, actions;
        try
        {
            switch (requestType) {
                case "color":
                    compId = Integer.parseInt(request.get("compId"));
                    response.put("color", getComponentColor(compId));
                    response.put("compId", compId);
                    response.put("succeeded", true);
                    break;

                case "cycletime":
                    orderId = Integer.parseInt(request.get("orderId"));
                    long cycleTime = getCycleTime(orderId);
                    response.put("cycleTime", cycleTime);
                    response.put("orderId", orderId);
                    response.put("succeeded", true);
                    break;

                case "componentHistory":
                    orderId = Integer.parseInt(request.get("orderId"));
                    compId = Integer.parseInt(request.get("compId"));
                    history = getComponentHistory(orderId, compId);
                    times = new JSONArray();
                    resources = new JSONArray();
                    actions = new JSONArray();
                    for (Object[] o : history)
                    {
                        times.put(o[0]);
                        resources.put(o[1]);
                        actions.put(o[2]);
                    }
                    response.put("times", times);
                    response.put("resources", resources);
                    response.put("actions", actions);
                    response.put("succeeded", true);
                    break;

                case "orderHistory":
                    orderId = Integer.parseInt(request.get("orderId"));
                    history = getOrderHistory(orderId);
                    times = new JSONArray();
                    resources = new JSONArray();
                    actions = new JSONArray();
                    for (Object[] o : history)
                    {
                        times.put(o[0]);
                        resources.put(o[1]);
                        actions.put(o[2]);
                    }
                    response.put("times", times);
                    response.put("resources", resources);
                    response.put("actions", actions);
                    response.put("succeeded", true);
                    break;

                case "throughput":
                    response.put("throughput", getThroughput());
                    response.put("succeeded", true);
                    break;

                case "orders":
                    List<Integer> orders = getOrders();
                    JSONArray ordersArray = new JSONArray();
                    for (Integer i : orders)
                    {
                        ordersArray.put(i.intValue());
                    }
                    response.put("orders", ordersArray);
                    response.put("succeeded", true);
                    break;

                case "components":
                    orderId = Integer.parseInt(request.get("orderId"));
                    List<Integer> components = getComponents(orderId);
                    JSONArray componentsArray = new JSONArray();
                    for (Integer i : components)
                    {
                        componentsArray.put(i.intValue());
                    }
                    response.put("components", componentsArray);
                    response.put("orderId", orderId);
                    response.put("succeeded", true);
                    break;

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
        exchange.getResponseHeaders().add("Content-Type", "text/plain");
        exchange.sendResponseHeaders(200, responseString.length());
        OutputStream os = exchange.getResponseBody();
        os.write(responseString.getBytes());
        os.close();
    }

    private List<Integer> getOrders() throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("SELECT id FROM Orders");
        ResultSet result = statement.executeQuery();
        
        List<Integer> orders = new ArrayList<>();
        while (result.next())
        {
            orders.add(result.getInt("id"));
        }
        
        statement.close();
        
        return orders;
    }

    private List<Integer> getComponents(int orderId) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("SELECT DISTINCT comp_id FROM ComponentsInTrackingEvents WHERE order_id = ?");
        statement.setInt(1, orderId);
        ResultSet result = statement.executeQuery();
        
        List<Integer> components = new ArrayList<>();
        while (result.next())
        {
            components.add(result.getInt("comp_id"));
        }
        
        statement.close();
        
        return components;
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

    // TODO (pontus): Figure out suitable values through testing
    private final int[] xRefs = {100, 200, 300, 400}, yRefs = {500, 600};
    
    private List<Object[]> getComponentHistory(int orderId, int compId) throws SQLException
    {
        PreparedStatement statement;
        ResultSet result;

        // The Object arrays are of the form {(long)time, "resource", "action"}
        List<Object[]> history = new ArrayList<>();

        // __Tracking events__
        statement = dbConn.prepareStatement("SELECT camera_id, MIN(time) AS time FROM ComponentsInTrackingEvents WHERE order_id = ? AND comp_id = ? GROUP BY camera_id");
        statement.setInt(1, orderId);
        statement.setInt(2, compId);
        result = statement.executeQuery();
        while (result.next())
        {
            Object[] o = new Object[3];
            o[0] = result.getLong("time");
            o[1] = result.getString("camera_id");
            o[2] = "spotted";
            history.add(o);
        }

        // __System events__
        // TODO (pontus): Find a better heuristic for figuring out which events apply to the component
        /* Currently, we assume most events happen once for each pallet.
           So, figure out which of the two pallets the component is on, and then
           get either the first or last executing step of each event. */
        statement = dbConn.prepareStatement("SELECT x_coord, y_coord, time FROM ComponentsInTrackingEvents WHERE order_id = ? AND comp_id = ? AND camera_id = 'camera_1' ORDER BY time DESC LIMIT 1");
        statement.setInt(1, orderId);
        statement.setInt(2, compId);
        result = statement.executeQuery();
        result.next();
        int xCoord = result.getInt("x_coord");
        int yCoord = result.getInt("y_coord");
        long lastCamTime = result.getLong("time");
        
        statement = dbConn.prepareStatement("SELECT MIN(time) AS time first FROM PLCEvents NATURAL JOIN PSL WHERE order_id = ? AND resource = 'H2' AND action = 'up' AND state = 2");
        statement.setInt(1, orderId);
        result = statement.executeQuery();
        long firstElevatorTime = result.getLong("time");

        boolean first = false; // Used to decide which events apply to the component
        if (lastCamTime < firstElevatorTime)
        {
            first = true;
        }

        // Get the bulk of the system events
        String minOrMax = first ? "MIN" : "MAX";
        statement = dbConn.prepareStatement("SELECT ?(time) AS time, resource, action FROM PLCEvents NATURAL JOIN PSL WHERE order_id = ? AND state = 2 AND resource NOT IN ('R4', 'R5') GROUP BY resource, action");
        statement.setString(1, minOrMax);
        statement.setInt(2, orderId);
        result = statement.executeQuery();
        while (result.next())
        {
            Object[] o = new Object[3];
            o[0] = result.getLong("time");
            o[1] = result.getString("resource");
            o[2] = result.getString("action");
            history.add(o);
        }

        // Get the component's position on the pallet and then the associated build events
        int tol = 20;
        boolean located = false;
        int i = 0, j = 0;
        while (!located)
        {
            outer:
            for (i = 0; i < xRefs.length; i++)
            {
                for (j = 0; i < yRefs.length; i++)
                {
                    if (   xRefs[i] - tol <= xCoord && xCoord <= xRefs[i] + tol
                           && yRefs[j] - tol <= yCoord && yCoord <= yRefs[j] + tol)
                    {
                        located = true;
                        break outer;
                    }
                }
            }
            tol += 5;
        }
        
        String buildResource = first ? "R4" : "R5";
        int palletPosition = i + 4*j + 1; // One of the 8 positions on the pallet
        int pickPosition1, pickPosition2;
        if (first)
        {
            pickPosition1 = palletPosition;
            pickPosition2 = 10 + palletPosition;
        }
        else
        {
            pickPosition1 = 20 + palletPosition;
            pickPosition2 = 30 + palletPosition;
        }

        statement = dbConn.prepareStatement("SELECT MIN(time) AS time FROM PLCEvents NATURAL JOIN PSL WHERE order_id = ? AND resource = ? AND action = pickBlock.pos AND state IN (?, ?)");
        statement.setInt(1, orderId);
        statement.setString(2, buildResource);
        statement.setInt(3, pickPosition1);
        statement.setInt(4, pickPosition2);
        result = statement.executeQuery();
        long buildStartTime = result.getLong("time");
        
        statement = dbConn.prepareStatement("SELECT MIN(time) AS time, resource, action FROM PLCEvents NATURAL JOIN PSL WHERE order_id = ? AND time > ? AND resource = ? AND action IN ('pickBlock', 'placeBlock') AND state = 2");
        statement.setInt(1, orderId);
        statement.setLong(2, buildStartTime);
        statement.setString(3, buildResource);
        result = statement.executeQuery();
        while (result.next())
        {
            Object[] o = new Object[3];
            o[0] = result.getLong("time");
            o[1] = result.getString("resource");
            o[2] = result.getString("action");
            history.add(o);
        }

        // Sort and wrap up
        Collections.sort(history, new Comparator<Object[]>()
        {
            public int compare(Object[] object, Object[] otherObject)
            {
                return ((Long)object[0]).compareTo((Long)otherObject[0]);
            }
        });

        statement.close();
        
        return history;
    }

    private List<Object[]> getOrderHistory(int orderId) throws SQLException
    {
        PreparedStatement statement;
        ResultSet result;
        
        // The Object arrays are of the form {(long)time, "resource", "action"}
        List<Object[]> history = new ArrayList<>();

        // Get all the seperately executed events in the order
        statement = dbConn.prepareStatement("SELECT resource, action, state, time FROM PLCEvents NATURAL JOIN PSL ORDER BY resource, action, time ASC");
        result = statement.executeQuery();
        
        int state, oldState;
        state = oldState = 0;
        while (result.next())
        {
            state = result.getInt("state");
            if (state == 2 && oldState != 2)
            {
                Object[] o = new Object[3];
                o[0] = result.getLong("time");
                o[1] = result.getString("resource");
                o[2] = result.getString("action");
                history.add(o);
            }
            oldState = state;
        }

        // Sort and wrap up
        Collections.sort(history, new Comparator<Object[]>()
        {
            public int compare(Object[] object, Object[] otherObject)
            {
                return ((Long)object[0]).compareTo((Long)otherObject[0]);
            }
        });

        statement.close();
        
        return history;
    }

    private long getCycleTime(int orderId) throws SQLException
    {
        PreparedStatement statement;
        ResultSet result;

        statement = dbConn.prepareStatement("SELECT * FROM PLCEvents NATURAL JOIN PSL WHERE order_id = ? AND resource = 'R2' AND action = 'deliverTower' AND value = 2");
        statement.setInt(1, orderId);
        result = statement.executeQuery();
        if (!result.next()) // If the order hasn't been completed
        {
            return -1;
        }
        
        statement = dbConn.prepareStatement("SELECT MIN(time) AS start, MAX(time) AS end FROM PLCEvents WHERE order_id = ?");
        statement.setInt(1, orderId);
        result = statement.executeQuery();
        result.next();
        long startTime = result.getLong("start");
        long endTime = result.getLong("end");

        statement.close();
        
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

        statement = dbConn.prepareStatement("SELECT MIN(time) AS start, MAX(time) AS end FROM PLCEvents");
        result = statement.executeQuery();
        result.next();
        long startTime = result.getLong("start");
        long endTime = result.getLong("end");
        
        statement.close();

        return numOfCompleted / (startTime - endTime);
    }
}
