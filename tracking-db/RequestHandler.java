import java.sql.*;
import java.util.*;

import java.io.IOException;
import java.io.OutputStream;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

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
        String response = ""; // Default response if query throws exception
        try
        {
            if (request.containsKey("id"))
            {
                response = getCubeColor(Integer.parseInt(request.get("id")));
            }
        }
        catch (Exception e)
        {
            // TODO: Figure out how to handle empty queries, for now they end up here
            System.out.println("RequestHandler: Encountered an exception: " + e);
        }
        
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(200, response.length());
        OutputStream os = exchange.getResponseBody();
        os.write(response.getBytes());
        os.close();
    }

    private String getCubeColor(int id) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("SELECT color FROM Cubes WHERE id = ?");
        statement.setInt(1, id);
        
        ResultSet resultSet = statement.executeQuery();
        resultSet.next();
        return resultSet.getString("color");
    }
}
