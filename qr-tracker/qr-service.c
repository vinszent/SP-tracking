#include <glib.h>
#include <glib-object.h>
#include <gio/gio.h>
#include <gst/gst.h>
#include <gst/app/gstappsink.h>
#include <librdkafka/rdkafka.h>
#include <quirc.h>
#include <string.h>

#define BROKER_URI "localhost:9092"
#define TOPIC_NAME "qr-tracking"
#define PARTITION_NUMBER 0
/* #define PIPELINE_STR "v4l2src ! videoconvert ! video/x-raw, width=640, height=480, format=GRAY8 ! appsink name=appsink" */
/* #define PIPELINE_STR "tcpclientsrc host=192.168.0.134 port=5000 ! jpegdec ! appsink name=appsink" */
#define PIPELINE_STR "udpsrc port=5000 caps=\"application/x-rtp\" ! rtph264depay ! decodebin !  videoconvert ! video/x-raw, format=GRAY8 ! appsink name=appsink"
#define QR_JSON "{\"camera\" : \"%s\", \"time\" : \"%ld\", \"payload\" : \"%s\", \"corners\" : [{\"x\" : %d, \"y\" : %d}, {\"x\" : %d, \"y\" : %d}, {\"x\" : %d, \"y\" : %d}, {\"x\" : %d, \"y\" : %d}]}"
#define TMP_CAMERA_ID "camera_1"

typedef rd_kafka_t RdKafka;
typedef rd_kafka_topic_t RdKafkaTopic;
typedef rd_kafka_topic_conf_t RdKafkaTopicConf;
typedef rd_kafka_message_t RdKafkaMessage;
typedef struct quirc Quirc;
typedef struct quirc_code QuircCode;
typedef struct quirc_data QuircData;

static GApplication* app;
static GstElement* pipeline;
static GstElement* app_sink;
static GstBus* bus;
static Quirc* quirc;
static RdKafka* kafka;
static RdKafkaTopic* topic;

static GstFlowReturn
new_sample_cb(GstAppSink* sink, gpointer udata)
{
    GstSample* sample = NULL;
    GstBuffer* buffer = NULL;
    GstMapInfo map;
    gint w, h;
    uint8_t* image = NULL;
    gint64 timestamp = g_get_monotonic_time();
    gint num_codes;

    /* g_print("New sample\n"); */

    sample = gst_app_sink_pull_sample(sink);

    buffer = gst_sample_get_buffer(sample);

    gst_buffer_map(buffer, &map, GST_MAP_READ);

    image = quirc_begin(quirc, &w, &h);

    g_assert_cmpint(w, ==, 640);
    g_assert_cmpint(h, ==, 480);

    memmove(image, map.data, map.size);

    quirc_end(quirc);

    num_codes = quirc_count(quirc);

    for (gint i = 0; i < num_codes; i++)
    {
        QuircCode code;
        QuircData data;

        g_print("Found qr code\n");

        quirc_extract(quirc, i, &code);

        quirc_decode_error_t err = quirc_decode(&code, &data);

        /* if (err) */
        /*     g_print("Error occurred trying to decode QR code: %s\n", quirc_strerror(err)); */
        /* else */
        if (!err)
        {
            gchar* json = g_strdup_printf(QR_JSON, TMP_CAMERA_ID,
                timestamp, (gchar*) data.payload,
                code.corners[0].x, code.corners[0].y,
                code.corners[1].x, code.corners[1].y,
                code.corners[2].x, code.corners[2].y,
                code.corners[3].x, code.corners[3].y);

            g_print("Successful decode\n");

            rd_kafka_produce(topic, PARTITION_NUMBER, RD_KAFKA_MSG_F_FREE,
                json, strlen(json), NULL, 0, NULL);
        }
    }

    gst_buffer_unmap(buffer, &map);

    gst_sample_unref(sample);

    return GST_FLOW_OK;
}

static GstAppSinkCallbacks callbacks = {NULL, NULL, new_sample_cb};

static void
startup_cb(GApplication* app, gpointer udata)
{

}

static void
activate_cb(GApplication* app, gpointer udata)
{
    gst_element_set_state(pipeline, GST_STATE_PLAYING);
}

gint
main(gint argc, gchar** argv)
{
    GError* err = NULL;

    gst_init(&argc, &argv);

    quirc = quirc_new();

    quirc_resize(quirc, 640, 480);

    kafka = rd_kafka_new(RD_KAFKA_PRODUCER, NULL, NULL, 0);

    g_assert_nonnull(kafka);

    rd_kafka_brokers_add(kafka, BROKER_URI);

    topic = rd_kafka_topic_new(kafka, TOPIC_NAME, NULL);

    pipeline = gst_parse_launch(PIPELINE_STR, &err);

    g_assert_no_error(err);

    app_sink = gst_bin_get_by_name(GST_BIN(pipeline), "appsink");

    bus = gst_element_get_bus(pipeline);

    gst_app_sink_set_callbacks(GST_APP_SINK(app_sink), &callbacks, NULL, NULL);

    app = g_application_new("com.vinszent.QrService",
        G_APPLICATION_FLAGS_NONE);

    g_signal_connect(app, "startup", G_CALLBACK(startup_cb), NULL);
    g_signal_connect(app, "activate", G_CALLBACK(activate_cb), NULL);

    g_application_hold(app);

    return g_application_run(G_APPLICATION(app), argc, argv);
}
