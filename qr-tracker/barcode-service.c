#include <string.h>
#include <time.h>
#include <assert.h>
#include <stdbool.h>
#include <zbar.h>
#include <librdkafka/rdkafka.h>

#define BROKER_URI "192.168.0.131:9092"
#define TOPIC_NAME "qr-tracking"
#define PARTITION_NUMBER 0
#define QR_JSON_CORNERS "{\"camera\" : \"%s\", \"time\" : \"%ld\", \"payload\" : \"%s\", \"corners\" : [{\"x\" : %d, \"y\" : %d}, {\"x\" : %d, \"y\" : %d}, {\"x\" : %d, \"y\" : %d}, {\"x\" : %d, \"y\" : %d}]}"
#define QR_JSON "{\"camera\" : \"%s\", \"time\" : \"%lu\", \"payload\" : \"%s\"}"
#define TMP_CAMERA_ID "camera_1"
#define IMAGE_WIDTH 640
#define IMAGE_HEIGHT 480

#define FOURCC(a, b, c, d)                      \
    ((long)(a) | ((long)(b) << 8) |             \
        ((long)(c) << 16) | ((long)(d) << 24))

int
main(int argc, char** argv)
{
    rd_kafka_t* kafka = NULL;
    rd_kafka_topic_t* topic = NULL;
    zbar_image_scanner_t* scanner = NULL;
    zbar_video_t* video = NULL;

    kafka = rd_kafka_new(RD_KAFKA_PRODUCER, NULL, NULL, 0);

    assert(kafka != NULL);

    rd_kafka_brokers_add(kafka, BROKER_URI);

    topic = rd_kafka_topic_new(kafka, TOPIC_NAME, NULL);

    assert(topic != NULL);

    scanner = zbar_image_scanner_create();

    assert(scanner != NULL);

    zbar_image_scanner_set_config(scanner, 0, ZBAR_CFG_ENABLE, false);
    zbar_image_scanner_set_config(scanner, ZBAR_QRCODE, ZBAR_CFG_ENABLE, true);
    zbar_image_scanner_enable_cache(scanner, true);

    video = zbar_video_create();

    assert(video != NULL);

    zbar_video_open(video, "/dev/video0");
    zbar_video_request_size(video, IMAGE_WIDTH, IMAGE_HEIGHT);

    zbar_video_enable(video, true);

    while (true)
    {
        zbar_image_t* _image = zbar_video_next_image(video);
        zbar_image_t* image = zbar_image_convert(_image, FOURCC('Y', '8', '0', '0'));
        int num_codes = 0;

        num_codes = zbar_scan_image(scanner, image);

        printf("Found %d barcodes\n", num_codes);

        for (const zbar_symbol_t* symbol = zbar_image_first_symbol(image);
             symbol != NULL; symbol = zbar_symbol_next(symbol))
        {
            zbar_symbol_type_t type = zbar_symbol_get_type(symbol);
            const char* payload = zbar_symbol_get_data(symbol);
            char json[1000];
            time_t time_stamp = time(NULL);

            if (zbar_symbol_get_loc_size(symbol)  == 4)
            {
                sprintf(json, QR_JSON_CORNERS, TMP_CAMERA_ID, time_stamp, payload,
                    zbar_symbol_get_loc_x(symbol, 0), zbar_symbol_get_loc_y(symbol, 0),
                    zbar_symbol_get_loc_x(symbol, 1), zbar_symbol_get_loc_y(symbol, 1),
                    zbar_symbol_get_loc_x(symbol, 2), zbar_symbol_get_loc_y(symbol, 2),
                    zbar_symbol_get_loc_x(symbol, 3), zbar_symbol_get_loc_y(symbol, 3));
            }
            else
                sprintf(json, QR_JSON, TMP_CAMERA_ID, time_stamp, payload);

            rd_kafka_produce(topic, PARTITION_NUMBER, RD_KAFKA_MSG_F_COPY,
                json, strlen(json), NULL, 0, NULL);
        }

        zbar_image_destroy(image);
        zbar_image_destroy(_image);

    }

    zbar_image_scanner_destroy(scanner);
    zbar_video_destroy(video);
}
