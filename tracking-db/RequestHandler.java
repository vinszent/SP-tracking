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
            if (pairArray.length > 1)
                request.put(pairArray[0], pairArray[1]);
            else
                request.put(pairArray[0], "");
        }

        // TODO: Parse all requests and fetch data accordingly
        JSONObject response = new JSONObject().put("succeeded", false); //
        try
        {
            if (request.containsKey("id"))
            {
                int id = Integer.parseInt(request.get("id"));
                response.put("id", id);
                response.put("color", getComponentColor(id));
                response.put("succeeded", true);
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
        
        ResultSet resultSet = statement.executeQuery();
        resultSet.next();
        return resultSet.getString("color");
    }
}
