import java.sql.*;
import java.util.*;

import java.net.InetSocketAddress;
import com.sun.net.httpserver.HttpServer;

/* The following jar files were used when compiling with 'javac -cp 'jars/*':. DBService.java':
json-20160810.jar
kafka-clients-0.10.2.0.jar
postgresql-42.0.0.jar
slf4j-api-1.7.25.jar
slf4j-simple-1.7.25.jar
*/

public class DBService
{
    public static Connection getDatabaseConnection(String url, String username, String password)
    {
        try
        {
            Class.forName("org.postgresql.Driver"); // Loads PostgreSQL driver
            
            Properties props = new Properties();
            props.setProperty("user", username);
            props.setProperty("password", password);
            
            return DriverManager.getConnection(url, props);
        }
        catch (Exception e)
        {
            System.out.println("DBService: Could not connect to the database: " + e);
            return null;
        }
    }

    public static String idToComponentColor(int id)
    {
        if (1 <= id && id <= 8) return "yellow";
        else if (9 <= id && id <= 16) return "green";
        else if (17 <= id && id <= 24) return "blue";
        else if (25 <= id && id <= 32) return "red";
        else return "titanium hwite";
    }
    
    public static void main(String[] args) throws Exception
    {
        String dbUrl = "jdbc:postgresql:DatabaseName";
        String dbUsername = "username";
        String dbPassword = "password";

        String hostIP = "0.0.0.0";

        RequestHandler requestHandler = new RequestHandler(dbUrl, dbUsername, dbPassword);
        
        HttpServer server = HttpServer.create(new InetSocketAddress(hostIP, 8000), 0);
        server.createContext("/", requestHandler);
        server.start();

        String kafkaUrl = hostIP + ":9092";
        List topics = Arrays.asList("qr-tracking", "plc-tracking");
        
        KafkaListener kl = new KafkaListener(kafkaUrl, topics, dbUrl, dbUsername, dbPassword);
        kl.start();
    }
}
