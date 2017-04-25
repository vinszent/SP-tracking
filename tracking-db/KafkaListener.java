import java.sql.*;
import java.util.*;

import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.ConsumerRecord;

import org.json.*;

public class KafkaListener extends Thread
{
    private Connection dbConn;
    private KafkaConsumer<String, String> consumer;
    
    public KafkaListener(String kafkaUrl, String topic, String dbUrl, String dbUsername, String dbPassword)
    {
        this.dbConn = DBService.getDatabaseConnection(dbUrl, dbUsername, dbPassword);

        Properties props = new Properties();
        props.put("bootstrap.servers", kafkaUrl);
        props.put("group.id", "default");
        props.put("enable.auto.commit", "true");
        props.put("auto.commit.interval.ms", "1000");
        props.put("session.timeout.ms", "5000");
        props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
        
        consumer = new KafkaConsumer<String, String>(props);
        consumer.subscribe(Arrays.asList(topic));
        System.out.println("KafkaListener subscribed to topic " + topic);
    }

    public void run()
    {
        int orderId, compId, cameraId, xCoord, yCoord;
        long time;
        String eventType, type, action;
        JSONObject data;
        ConsumerRecords<String, String> records;
        while (true)
        {
            records = consumer.poll(500);
            for (ConsumerRecord<String, String> record : records)
            {
                try
                {
                    data = new JSONObject(record.value());

                    orderId = getCurrentOrder();
                    if (!hasOrder(orderId))
                        insertOrder(orderId);
                    
                    time = data.getLong("time");
                    
                    eventType = (String) data.get("event");
                    switch (eventType) {
                        // Example of a possible tracking event: {"event" : "tracking", "camera" : 6, "payload" : 6, "time" : 666, "x" : 6, "y" : 6}
                        case "tracking":
                            compId = data.getInt("payload");
                            cameraId = data.getInt("camera");
                            xCoord = data.getInt("x");
                            yCoord = data.getInt("y");
                            
                            if (!hasComponent(compId))
                                insertComponent(compId, DBService.idToComponentColor(compId));

                            if (!hasTrackingEvent(orderId, cameraId, time))
                                insertTrackingEvent(orderId, cameraId, time);
                            
                            insertComponentInTrackingEvent(orderId, compId, cameraId, time, xCoord, yCoord);
                            break;

                            // Example of a possible system event: {"event" : "system", "type" : "R5", "action" : "move", "time" : 666}
                        case "system":
                            type = data.getString("type");
                            action = data.getString("action");

                            if (!hasResource(type, action))
                                insertResource(type, action);
                                    
                            insertSystemEvent(orderId, type, action, time);
                            break;
                            
                        default:
                            System.out.println("KafkaListener: Unknown event encountered.");
                    }
                }
                catch (Exception e)
                {
                    System.out.println("KafkaListener: Encountered an exception: " + e);
                }
            }
        }
    }

    private boolean hasComponent(int compId) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("SELECT * FROM Components WHERE id = ?");
        statement.setInt(1, compId);
        ResultSet result = statement.executeQuery();
        boolean exists = result.next();
        statement.close();
        return exists;
    }

    private boolean hasOrder(int orderId) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("SELECT * FROM Orders WHERE id = ?");
        statement.setInt(1, orderId);
        ResultSet result = statement.executeQuery();
        boolean exists = result.next();
        statement.close();
        return exists;        
    }

    private boolean hasResource(String type, String action) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("SELECT * FROM Resources WHERE type = ? AND action = ?");
        statement.setString(1, type);
        statement.setString(2, action);
        ResultSet result = statement.executeQuery();
        boolean exists = result.next();
        statement.close();
        return exists;
    }

    private boolean hasTrackingEvent(int orderId, int cameraId, long time) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("SELECT * FROM TrackingEvents WHERE order_id = ? AND camera_id = ? AND time = ?");
        statement.setInt(1, orderId);
        statement.setInt(2, cameraId);
        statement.setLong(3, time);
        ResultSet result = statement.executeQuery();
        boolean exists = result.next();
        statement.close();
        return exists;
    }
    
    private int getCurrentOrder() throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("SELECT current FROM CurrentOrder");
        ResultSet result = statement.executeQuery();
        result.next();
        int currentOrder = result.getInt("current");
        statement.close();
        return currentOrder;
    }

    private void insertComponent(int compId, String color) throws SQLException
    {
 		PreparedStatement statement = dbConn.prepareStatement("INSERT INTO Components VALUES (?, ?)");
	    statement.setInt(1, compId);
	    statement.setString(2, color);
	    statement.executeUpdate();
	    statement.close();
 	}

    private void insertComponentInTrackingEvent(int orderId, int compId, int cameraId, long time, int xCoord, int yCoord) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("INSERT INTO ComponentsInTrackingEvents VALUES (?, ?, ?, ?, ?, ?)");
	    statement.setInt(1, orderId);
	    statement.setInt(2, compId);
	    statement.setInt(3, cameraId);
	    statement.setLong(4, time);
	    statement.setInt(5, xCoord);
	    statement.setInt(6, yCoord);
	    statement.executeUpdate();
	    statement.close();
    }

    private void insertOrder(int orderId) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("INSERT INTO Orders VALUES (?)");
        statement.setInt(1, orderId);
        statement.executeUpdate();
        statement.close();
    }

    private void insertSystemEvent(int orderId, String type, String action, long time) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("INSERT INTO SystemEvents VALUES (?, ?, ?, ?)");
        statement.setInt(1, orderId);
        statement.setString(2, type);
        statement.setString(3, action);
        statement.setLong(4, time);
        statement.executeUpdate();
        statement.close();
    }

    private void insertResource(String type, String action) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("INSERT INTO Resources VALUES (?, ?)");
        statement.setString(1, type);
        statement.setString(2, action);
        statement.executeUpdate();
        statement.close();
    }

    private void insertTrackingEvent(int orderId, int cameraId, long time) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("INSERT INTO TrackingEvents VALUES (?, ?, ?)");
        statement.setInt(1, orderId);
        statement.setInt(2, cameraId);
        statement.setLong(3, time);
        statement.executeUpdate();
        statement.close();
    }
}
