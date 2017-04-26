CC = gcc

CFLAGS += -g
CFLAGS += `pkg-config --cflags glib-2.0 gobject-2.0 json-glib-1.0`

LIBS += `pkg-config --libs glib-2.0 gobject-2.0 json-glib-1.0`
LIBS += -lrdkafka -lsnap7

all: plc-kafka

plc-kafka: plc-kafka.o
	$(CC) -o plc-kafka plc-kafka.o $(LIBS)

clean:
	rm -f *.o
	rm -f plc-kafka
