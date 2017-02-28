#include <glib.h>
#include <glib-object.h>
#include <gio/gio.h>
#include <libsoup/soup.h>
#include <librdkafka/rdkafka.h>
#include <string.h>

#define BROKER_URI "localhost:9092"
#define TOPIC_NAME "qr-tracking"
#define CONSUME_TIMEOUT 1000 //ms
#define PARTITION_NUMBER 0

typedef rd_kafka_t RdKafka;
typedef rd_kafka_topic_t RdKafkaTopic;
typedef rd_kafka_topic_conf_t RdKafkaTopicConf;
typedef rd_kafka_message_t RdKafkaMessage;

static GApplication* app;
static SoupServer* soup;
static RdKafka* kafka;
static RdKafkaTopic* topic;
static GThread* thread;
static gboolean run_thread = TRUE;
static SoupWebsocketConnection* conn;

static gpointer
handle_message_cb(gpointer data)
{
    g_print("Running thread\n");

    while (run_thread)
    {
        RdKafkaMessage* msg;

        msg = rd_kafka_consume(topic, PARTITION_NUMBER, CONSUME_TIMEOUT);

        if (!msg) continue;

        const gchar* str = msg->payload;

        g_print("Message received %s %lu %lu\n", str, msg->len, strlen(str));

        if (msg->len > 0)
            soup_websocket_connection_send_text(conn, str);

        rd_kafka_message_destroy(msg);
    }

    return NULL;
}

static void
websocket_cb(SoupServer* server,
    SoupWebsocketConnection* connection, const gchar* path,
    SoupClientContext* client, gpointer udata)
{
    g_print("Web socket opened\n");

    conn = g_object_ref(connection);

    /* g_signal_connect(connection, "message", G_CALLBACK(handle_message_cb), NULL); */
}

static void
startup_cb(GApplication* app, gpointer udata)
{
    g_print("Startup\n");
}

static void
activate_cb(GApplication* app, gpointer udata)
{
    g_print("Activate\n");

    thread = g_thread_new("websocket-service-thread",
        handle_message_cb, NULL);
}

gint
main(gint argc, gchar** argv)
{
    soup = soup_server_new(NULL, NULL);

    soup_server_add_websocket_handler(soup,
        "/websocket/kafka", NULL, NULL,
        websocket_cb, NULL, NULL);

    soup_server_listen_all(soup, 9001, SOUP_SERVER_LISTEN_IPV4_ONLY, NULL);

    kafka = rd_kafka_new(RD_KAFKA_CONSUMER, NULL, NULL, 0);

    rd_kafka_brokers_add(kafka, BROKER_URI);

    rd_kafka_poll_set_consumer(kafka);

    topic = rd_kafka_topic_new(kafka, TOPIC_NAME, NULL);

    rd_kafka_consume_start(topic, PARTITION_NUMBER, RD_KAFKA_OFFSET_END);

    app = g_application_new("com.vinszent.WebSocketService",
        G_APPLICATION_FLAGS_NONE);

    g_signal_connect(app, "startup", G_CALLBACK(startup_cb), NULL);
    g_signal_connect(app, "activate", G_CALLBACK(activate_cb), NULL);

    g_application_hold(app);

    return g_application_run(G_APPLICATION(app), argc, argv);

}
