import java.net.URL;
import java.sql.*;
import java.util.*;
import org.postgresql.*;
import kafka.consumer.Consumer;
import kafka.consumer.ConsumerConfig;
import kafka.consumer.ConsumerIterator;
import kafka.consumer.KafkaStream;
import kafka.javaapi.consumer.ConsumerConnector;

public class kandarb {
 	String USERNAME = "tda357_036";
 	String PASSWORD = "UjQBkoqK";
 	ConsumerConnector consConn = null;
 	String topic ="kandarb";
 	
 	//Connects to Kafka
 	void initialize() {
 		Properties props = new Properties();
 		props.put("zookeeper.connect", "localhost:xxxx"); //Remember to put numbers in xxxx
 		props.put("group.id","testgroup"); //is it needed?
 		props.put("zookeeper.session.timeout.ms","4000"); //Considered dead after 4 seconds
 		props.put("zookeeper.sync.time.ms","300"); //How far ZK follower can be behind a ZK leader
 		props.put("auto.commit.interval.ms", "1000"); 
 		ConsumerConfig conConfig = new ConsumerConfig(props);
 		consConn = Consumer.createJavaConsumerConnector(conConfig);
 	}
 	//Start consumer
 	void consume() {
 		//Key = topic name, Value = No. of threads for topic
 		Map<String, Integer> topicCount = new HashMap<String, Integer>();       
        topicCount.put(topic, new Integer(1));
 		Map<String,List<KafkaStream<byte[] ,byte[]>>> consStreams = consConn.createMessageStreams(topicCount);
 		List<KafkaStream<byte[],byte[]>> kStreamList = consStreams.get(topic);
 		for(final KafkaStream<byte[],byte[]> kStreams : kStreamList) {
 			ConsumerIterator<byte[],byte[]> consumerIte = kStreams.iterator();
 			
 			while(consumerIte.hasNext()) {
 				//parse and gather
 			}
 			if(consConn != null) {consConn.shutdown();}
 		}
 		
 		
 	}
 	
 	void insertKloss(Connection conn, String id, String color) throws SQLException  {
 		PreparedStatement st = conn.prepareStatement("INSERT INTO Kloss VALUES (cast(? as INT),?)");
	    st.setString(1, id);
	    st.setString(2, color);
	    int rs = st.executeUpdate();
	    st.close();
 	}
 	void insertEvent(Connection conn,String eventId,String intid, String uttid) throws SQLException {
 		PreparedStatement st = conn.prepareStatement("INSERT INTO Events VALUES (?,cast(? as LONG),cast(? as LONG))");
	    st.setString(1, eventId);
	    st.setString(2, intid);
	    st.setString(3, uttid);
	    int rs = st.executeUpdate();
	    st.close();
 	}
 	
 	void insertOrder(Connection conn, String orderId) throws SQLException {
 		PreparedStatement st = conn.prepareStatement("INSERT INTO Order VALUES (cast(? as INT))");
	    st.setString(1, orderId);
	    int rs = st.executeUpdate();
	    st.close();
 	}
 	void insertKlossOrder(Connection conn, String orderId,String klossId) throws SQLException {
 		PreparedStatement st = conn.prepareStatement("INSERT INTO KlossOrder VALUES (cast(? as INT),cast(? as INT))");
	    st.setString(1, orderId);
	    st.setString(2, klossId);
	    int rs = st.executeUpdate();
	    st.close();
 	}
 	void insertKlossinEvent(Connection conn, String eventId, String klossId, String intid, String uttid) throws SQLException {
 		PreparedStatement st = conn.prepareStatement("INSERT INTO KlossinEvent VALUES (?,cast(? as INT),cast(? as LONG),cast(? as LONG))");
	    st.setString(1, eventId);
	    st.setString(2, klossId);
	    st.setString(3, intid);
	    st.setString(4, uttid);
	    int rs = st.executeUpdate();
	    st.close();
 	}
 	void insertEventOrder(Connection conn,String eventId,String orderId,String intid) throws SQLException {
 		PreparedStatement st = conn.prepareStatement("INSERT INTO EventOrder VALUES (?,cast(? as INT),cast(? as LONG))");
	    st.setString(1, eventId);
	    st.setString(2, orderId);
	    st.setString(3, intid);
	    int rs = st.executeUpdate();
	    st.close();
 	}
 	void insertKamera(Connection conn,String eventId, String intid, String uttid, String koord) throws SQLException {
 		PreparedStatement st = conn.prepareStatement("INSERT INTO Kamera VALUES (?,cast(? as LONG),cast(? as LONG),?)");
	    st.setString(1, eventId);
	    st.setString(3, uttid);
	    st.setString(2, intid);
	    st.setString(4, koord);
	    int rs = st.executeUpdate();
	    st.close();
 	}
 	void getHistoryDate(Connection conn, String fromMe, String gtThis, String stThis) throws SQLException {
 		PreparedStatement st = conn.prepareStatement("SELECT * FROM ? WHERE  intid >= cast(? as LONG) AND intid <= cast(? as LONG)");
 		//Above line is conceptual and can be changed if a better idea occurs
 		st.setString(1, fromMe);
 		st.setString(2, gtThis);
 		st.setString(3, stThis);
 		ResultSet rs = st.executeQuery();
 		while (rs.next()) {
 			//do stuff
 		}
 	}
 	void getOrderIdInfo(Connection conn, String orderId) throws SQLException {
 		PreparedStatement st = conn.prepareStatement("SELECT * FROM EventOrder WHERE orderId = ?");
 		st.setString(1, orderId);
 		ResultSet rs = st.executeQuery();
 		while (rs.next()) {
 			//do stuff
 		}
 	}
 	void getKlossinfo(Connection conn, String klossId) throws SQLException {
 		PreparedStatement st = conn.prepareStatement("SELECT * FROM KlossInEvent WHERE klossId = cast(? AS INT");
 		st.setString(1, klossId);
 		ResultSet rs = st.executeQuery();
 		while(rs.next()) {
 			//do stuff
 		}
 	}
 	void getAllTableInfo(Connection conn, String fromTable) throws SQLException {
 		PreparedStatement st = conn.prepareStatement("SELECT * FROM ? ");
 		st.setString(1, fromTable);
 		ResultSet rs = st.executeQuery();
 		while(rs.next()) {
 			//do stuff
 		}
 	}
}
