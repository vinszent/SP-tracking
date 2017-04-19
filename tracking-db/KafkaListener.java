import java.sql.*;
import java.util.*;

import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.ConsumerRecord;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;

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
        JSONParser parser = new JSONParser();
        while (true)
        {
            ConsumerRecords<String, String> records = consumer.poll(500);
            for (ConsumerRecord<String, String> record : records)
            {
                try
                {
                    JSONObject obj = (JSONObject) parser.parse(record.value());

                    if (!obj.containsKey("resource")) continue; // Skip if not data

                    // Example of JSON: {"resource" : "camera", "payload" : 6, "time" : "666"}
                    // TODO: Handle all difference kinds of data
                    String res = (String) obj.get("resource");
                    
                    switch (res) {
                        case "camera":
                            int id = ((Long) obj.get("payload")).intValue();
                            insertComponent(id, DBService.idToComponentColor(id));
                            System.out.printf("KafkaListener: A component with id %d was added to the database.\n", id);
                            break;
                            
                        default:
                            System.out.println("KafkaListener: Unknown system resource encountered.");
                    }
                }
                catch (Exception e)
                {
                    System.out.println("KafkaListener: Encountered an exception: " + e);
                }
            }
        }
    }

    private void insertComponent(int id, String color) throws SQLException
    {
 		PreparedStatement statement = dbConn.prepareStatement("INSERT INTO Components VALUES (?, ?)");
	    statement.setInt(1, id);
	    statement.setString(2, color);
	    statement.executeUpdate();
	    statement.close();
 	}
}
