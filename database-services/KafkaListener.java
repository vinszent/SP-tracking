import java.sql.*;
import java.sql.Types;
import java.util.*;

import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.ConsumerRecord;

import org.json.*;

public class KafkaListener extends Thread
{
    private Connection dbConn;
    private KafkaConsumer<String, String> consumer;
    
    public KafkaListener(String kafkaUrl, List topics, String dbUrl, String dbUsername, String dbPassword)
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
        consumer.subscribe(topics);
        consumer.seekToEnd(consumer.assignment());
    }

    public void run()
    {
        JSONObject data;
        int orderId, compId, datablock, address, bit, state, x, y;
        long time;
        String cameraId;
        Object value;
        boolean endIsNear = false;
        JSONArray coords;
        Set<Integer> addedOrders = new HashSet<>();
        Set<Integer> addedComponents = new HashSet<>();

        orderId = compId = 0;
        try
        {
            orderId = getCurrentOrder();
            
            PreparedStatement statement = dbConn.prepareStatement("SELECT id FROM Orders");
            ResultSet result = statement.executeQuery();
            while (result.next())
            {
                orderId = result.getInt("id");
                addedOrders.add(orderId);
            }
            
            statement = dbConn.prepareStatement("SELECT id FROM Components");
            result = statement.executeQuery();
            while (result.next())
            {
                compId = result.getInt("id");
                addedComponents.add(compId);
            }
            
            statement.close();
        }
        catch (SQLException e)
        {
            System.out.println("KafkaListener encountered an exception while starting: " + e);
        }

        ConsumerRecords<String, String> records;
        while (true)
        {
            records = consumer.poll(500);
            for (ConsumerRecord<String, String> record : records)
            {
                try
                {
                    data = new JSONObject(record.value());
                    
                    time = data.getLong("time");
                    
                    if (data.has("camera"))
                    {
                        compId = data.getInt("payload");
                        if (!addedComponents.contains(compId))
                        {
                            addedComponents.add(compId);
                            insertComponent(compId, DBService.idToComponentColor(compId));
                        }
                        
                        cameraId = data.getString("camera");

                        x = y = 0;
                        if (data.has("corners"))
                        {
                            coords = data.getJSONArray("corners");

                            // Find the midpoint of the four corners
                            x = y = 0;
                            for (int i = 0; i < 4; i++)
                            {
                                x += coords.getJSONObject(i).getInt("x");
                                y += coords.getJSONObject(i).getInt("y");
                            }
                            x /= 4;
                            y /= 4;
                        }

                        try
                        {
                            insertTrackingEvent(orderId, cameraId, time);
                        }
                        catch (SQLException e) {} // If event already added, ignore

                        try
                        {
                            insertComponentInTrackingEvent(orderId, compId, cameraId, time, x, y);
                        }
                        catch (SQLException e) {}

                    }
                    
                    else if (data.has("db"))
                    {
                        datablock = data.getInt("db");
                        address = data.getInt("address");
                        value = data.get("value");

                        if (value instanceof Boolean)
                        {
                            bit = data.getInt("bit");
                            insertPLCState(orderId, datablock, address + 0.1*bit, time, (Boolean) value, null);
                        }
                        else if (value instanceof Integer)
                        {
                            state = ((Integer) value).intValue();
                            
                            if (datablock == 126 && address == 14 && state == 2)
                                endIsNear = true;

                            if (datablock == 126 && address == 14 && state != 2 && endIsNear)
                            {
                                orderId += 1;
                                insertOrder(orderId);
                                endIsNear = false;
                            }
                            
                            insertPLCState(orderId, datablock, address, time, null, (Integer) value);
                        }
                    }
                }
                catch (Exception e)
                {
                    System.out.println("KafkaListener encountered an exception while running: " + e);
                }
            }
        }
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
    
    private void insertOrder(int orderId) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("INSERT INTO Orders VALUES (?)");
        statement.setInt(1, orderId);
        statement.executeUpdate();
        statement.close();
    }

    private void insertComponent(int compId, String color) throws SQLException
    {
 		PreparedStatement statement = dbConn.prepareStatement("INSERT INTO Components VALUES (?, ?)");
	    statement.setInt(1, compId);
	    statement.setString(2, color);
	    statement.executeUpdate();
	    statement.close();
    }
    
    private void insertTrackingEvent(int orderId, String cameraId, long time) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("INSERT INTO TrackingEvents VALUES (?, ?, ?)");
        statement.setInt(1, orderId);
        statement.setString(2, cameraId);
        statement.setLong(3, time);
        statement.executeUpdate();
        statement.close();
    }
    
    private void insertComponentInTrackingEvent(int orderId, int compId, String cameraId, long time, int xCoord, int yCoord) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("INSERT INTO ComponentsInTrackingEvents VALUES (?, ?, ?, ?, ?, ?)");
	    statement.setInt(1, orderId);
	    statement.setInt(2, compId);
	    statement.setString(3, cameraId);
	    statement.setLong(4, time);
	    statement.setInt(5, xCoord);
	    statement.setInt(6, yCoord);
	    statement.executeUpdate();
	    statement.close();
    }

    private void insertPLCState(int orderId, int datablock, double address, long time, Boolean signal, Integer state) throws SQLException
    {
        PreparedStatement statement = dbConn.prepareStatement("INSERT INTO PLCEvents VALUES (?, ?, ?, ?, ?, ?)");
        statement.setInt(1, orderId);
        statement.setInt(2, datablock);
        statement.setDouble(3, address);
        statement.setLong(4, time);
        
        if (signal != null)
            statement.setBoolean(5, signal);
        else
            statement.setNull(5, Types.BOOLEAN);
        
        if (state != null)
            statement.setInt(6, state);
        else
            statement.setNull(6, Types.INTEGER);
        
        statement.executeUpdate();
        statement.close();
    }
}
