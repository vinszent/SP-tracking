CC = gcc

CFLAGS += `pkg-config --cflags glib-2.0 gobject-2.0 gio-2.0 gstreamer-1.0 gstreamer-app-1.0 libsoup-2.4 zbar`
CFLAGS += -std=gnu11 -g

QR-SERVICE_LIBS += `pkg-config --libs glib-2.0 gobject-2.0 gio-2.0 gstreamer-1.0 gstreamer-app-1.0`
QR-SERVICE_LIBS += -lquirc -lrdkafka -lm

WEBSOCKET-SERVICE_LIBS += `pkg-config --libs glib-2.0 gobject-2.0 libsoup-2.4`
WEBSOCKET-SERVICE_LIBS += -lrdkafka

BARCODE-SERVICE_LIBS += `pkg-config --libs glib-2.0 gobject-2.0 gio-2.0 gstreamer-1.0 gstreamer-app-1.0 zbar`
BARCODE-SERVICE_LIBS += -lrdkafka

all: qr-service websocket-service

qr-service: qr-service.o
	$(CC) -o qr-service qr-service.o $(QR-SERVICE_LIBS)

websocket-service: websocket-service.o
	$(CC) -o websocket-service websocket-service.o $(WEBSOCKET-SERVICE_LIBS)

barcode-service: barcode-service.o
	$(CC) -o barcode-service barcode-service.o $(BARCODE-SERVICE_LIBS)

clean:
	rm -f *.o
	rm -f qr-service
	rm -f websocket-service
	rm -f barcode-service
