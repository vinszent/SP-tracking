/* Notes
 * In PLC, 16-bit integers (WORDS) are represented by two 8-bit unsigned integers.
 * Similarly 32-bit integers (DWORDS) are represented by 4 8-bit unsigned integers.
 *
 * Status is represented by:
 *    0 : Not ready
 *    1 : Ready
 *    2 : Executing
 *    3 : Completed
 */

#include <librdkafka/rdkafka.h>
#include <glib.h>
#include <glib-object.h>
#include <json-glib/json-glib.h>
#include <string.h>
#include "snap7.h"

#define PLC_ADDRESS "172.16.205.11"
#define PLC_RACK 0
#define PLC_SLOT 1
#define PLC_TICK 1

#define KAFKA_BROKER_URI ""
#define TOPIC_NAME "plc"
#define PARTITION_NUMBER 0
#define CONSUME_TIMEOUT 1000 //ms
#define PLC_MESSAGE_BIT_JSON "{\"db\" : %d,  \"address\" : %d, \"bit\" : %d, \"value\" : %s}"
#define PLC_MESSAGE_INT_JSON "{\"db\" : %d,  \"address\" : %d, \"value\" : %ld}"

#define CONVERT_PLC_INT16(i) (gint16) (((i >> 8) & 0xFF) | ((i << 8) & 0xFF00))

typedef rd_kafka_t RdKafka;
typedef rd_kafka_topic_t RdKafkaTopic;
typedef rd_kafka_topic_conf_t RdKafkaTopicConf;
typedef rd_kafka_message_t RdKafkaMessage;

static S7Object      plc_client;
static RdKafka*      consumer        = NULL;
static RdKafka*      producer        = NULL;
static RdKafkaTopic* consumer_topic  = NULL;
static RdKafkaTopic* producer_topic  = NULL;
static GThread*      consumer_thread = NULL;
static GThread*      producer_thread = NULL;
static JsonParser*   json_parser     = NULL;
static JsonReader*   json_reader     = NULL;
static GList*        subscribe_list  = NULL;

typedef enum
{
    PLC_TYPE_BIT,
    PLC_TYPE_INT8,
    PLC_TYPE_INT16,
} PlcType;

typedef struct
{
    gint64 db;
    gint64 address;
    PlcType type;
    gint bit;
} SubscribeData;

SubscribeData subscribe_arr[] =
{
    /* H2 */
    {135, 2, PLC_TYPE_INT16},   /* H3.Up.Mode */
    {135, 4, PLC_TYPE_INT16},   /* H3.Down.Mode */

    /* H3 */
    {140, 2, PLC_TYPE_INT16},   /* H3.Up.Mode */
    {140, 4, PLC_TYPE_INT16},   /* H3.Down.Mode */

    /* R4 */
    {128, 2, PLC_TYPE_INT16},   /* R4.PickBlock.Mode */
    {128, 4, PLC_TYPE_INT16},   /* R4.PlaceBlock.Mode */
    {128, 6, PLC_TYPE_INT16},   /* R4.ToHome.Mode */
    {128, 8, PLC_TYPE_INT16},   /* R4.ToDodge.Mode */
    {128, 10, PLC_TYPE_INT16},  /* R4.PickBlock/PlaceBlock.Mode */

    /* R5 */
    {132, 2, PLC_TYPE_INT16},   /* R4.PickBlock.Mode */
    {132, 4, PLC_TYPE_INT16},   /* R4.PlaceBlock.Mode */
    {132, 6, PLC_TYPE_INT16},   /* R4.ToHome.Mode */
    {132, 8, PLC_TYPE_INT16},   /* R4.ToDodge.Mode */
    {132, 10, PLC_TYPE_INT16},  /* R4.PickBlock/PlaceBlock.Pos */

    /* R2 */
    {126, 2, PLC_TYPE_INT16, 0},  /* R2.Elevator2ToHomeTable.Mode */
    {126, 6, PLC_TYPE_INT16, 0},  /* R2.HomeTableToElevator3.Mode */
    {126, 10, PLC_TYPE_INT16, 0}, /* R2.PlaceAtPos.Mode */
    {126, 12, PLC_TYPE_INT16, 0}, /* R2.PickAtPos.Mode */
    {126, 14, PLC_TYPE_INT16, 0}, /* R2.DeliverTower.Mode */
    {126, 16, PLC_TYPE_INT16, 0}, /* R2.PickBuildPlate.Mode */
    {126, 18, PLC_TYPE_INT16, 0}, /* R2.PickAtPos.Pos */

    /* Flexlink */
};


static inline gint
ipow(gint base, gint exp)
{
    gint result = 1;
    while (exp)
    {
        if (exp & 1)
            result *= base;
        exp >>= 1;
        base *= base;
    }

    return result;
}

static inline PlcType
parse_type_from_string(const gchar* str)
{
    if (g_strcmp0(str, "bit") == 0)
        return PLC_TYPE_BIT;
    else if (g_strcmp0(str, "int8") == 0)
        return PLC_TYPE_INT8;
    else if (g_strcmp0(str, "int16") == 0)
        return PLC_TYPE_INT16;
}

static inline gsize
size_of_type(PlcType type)
{
    switch (type)
    {
        case PLC_TYPE_BIT:
            return 1;
        case PLC_TYPE_INT8:
            return 1;
        case PLC_TYPE_INT16:
            return 2;
        default:
            g_assert_not_reached();
    }
}

static void
handle_message(JsonReader* reader)
{
    const gchar* action = NULL;

    json_reader_read_member(json_reader, "action");
    action = json_reader_get_string_value(reader);
    json_reader_end_member(json_reader);

    if (g_strcmp0(action, "subscribe") == 0)
    {
        SubscribeData* sub = g_slice_new0(SubscribeData);

        json_reader_read_member(json_reader, "parameter");

        json_reader_read_member(json_reader, "db");
        sub->db = json_reader_get_int_value(reader);
        json_reader_end_member(json_reader);

        json_reader_read_member(json_reader, "address");
        sub->address = json_reader_get_int_value(reader);
        json_reader_get_int_value(reader);

        json_reader_read_member(json_reader, "type");
        sub->type = parse_type_from_string(json_reader_get_string_value(reader));
        json_reader_end_member(json_reader);

        if (sub->type == PLC_TYPE_BIT)
        {
            json_reader_read_member(json_reader, "bit");
            sub->bit = json_reader_get_int_value(reader);
            json_reader_end_member(reader);
        }

        json_reader_end_member(json_reader);

        subscribe_list = g_list_append(subscribe_list, sub);
    }
}

static gpointer
producer_thread_func(gpointer data)
{
    while (TRUE)
    {
        /* for (GList* l = subscribe_list; l != NULL; l = l->next) */
        for (gint i = 0; i < sizeof(subscribe_arr) / sizeof(SubscribeData); i++)
        {
            SubscribeData sub = subscribe_arr[i];
            gint ret;
            gchar* json = NULL;
            gint64 data = 0;

            ret = Cli_DBRead(plc_client, sub.db, sub.address, size_of_type(sub.type), &data);

            if (ret != 0)
            {
                gchar text[1000];

                Cli_ErrorText(ret, text, 1000);
                g_print("Error %s\n", text);

                continue;
            }
            switch (sub.type)
            {
                case PLC_TYPE_BIT:
                {
                    gboolean val;

                    val = (data & ipow(2, sub.bit)) != 0;

                    json = g_strdup_printf(PLC_MESSAGE_BIT_JSON,
                        sub.db, sub.address, sub.bit, val ? "true" : "false");
                    break;
                }
                case PLC_TYPE_INT8:
                case PLC_TYPE_INT16:
                {
                    data = CONVERT_PLC_INT16(data);
                    json = g_strdup_printf(PLC_MESSAGE_INT_JSON,
                        sub.db, sub.address, data);
                    break;
                }
            }

            /* g_print("JSON %s\n", json); */

            rd_kafka_produce(producer_topic, PARTITION_NUMBER, RD_KAFKA_MSG_F_FREE,
                json, strlen(json), NULL, 0, NULL);
        }

        /* g_print("\n"); */

        g_usleep(G_USEC_PER_SEC * PLC_TICK);
    }

    return NULL;
}

static gpointer
consumer_thread_func(gpointer data)
{
    while (TRUE)
    {
        RdKafkaMessage* msg;

        msg = rd_kafka_consume(consumer_topic, PARTITION_NUMBER, CONSUME_TIMEOUT);

        if (!msg) continue;

        g_print("Message received %s %lu", (gchar*) msg->payload, msg->len);

        if (msg->len > 0)
        {
            g_autoptr(GError) err = NULL;
            const gchar* action = NULL;

            json_parser_load_from_data(json_parser, msg->payload, msg->len, &err);

            if (err)
            {
                g_print("Could not parse json\n");
                break;
            }

            json_reader_set_root(json_reader, json_parser_get_root(json_parser));

            handle_message(json_reader);
        }

        rd_kafka_message_destroy(msg);
    }

    return NULL;
}

int
main(int argc, char** argv)
{
    plc_client = Cli_Create();

    Cli_ConnectTo(plc_client, PLC_ADDRESS, PLC_RACK, PLC_SLOT);

    producer = rd_kafka_new(RD_KAFKA_PRODUCER, NULL, NULL, 0);
    consumer = rd_kafka_new(RD_KAFKA_CONSUMER, NULL, NULL, 0);

    g_assert(producer != NULL);
    g_assert(consumer != NULL);

    rd_kafka_brokers_add(producer, KAFKA_BROKER_URI);
    rd_kafka_brokers_add(consumer, KAFKA_BROKER_URI);

    producer_topic = rd_kafka_topic_new(producer, TOPIC_NAME, NULL);
    consumer_topic = rd_kafka_topic_new(consumer, TOPIC_NAME, NULL);

    g_assert(producer_topic != NULL);
    g_assert(consumer_topic != NULL);

    json_parser = json_parser_new();

    g_assert_nonnull(json_parser);

    json_reader = json_reader_new(NULL);

    g_assert_nonnull(json_reader);

    producer_thread = g_thread_new("plc_producer_thread", producer_thread_func, NULL);

    g_thread_join(producer_thread);
}
