CREATE TABLE Kloss(
id INT PRIMARY KEY CHECK (id > 0),
color TEXT NOT NULL 
);

CREATE TABLE Events (
eventId TEXT NOT NULL,
intid LONG NOT NULL CHECK (intid > 0),
uttid LONG NOT NULL CHECK (uttid >= intid),
);

CREATE TABLE Order (
orderId NUMERIC NOT NULL PRIMARY KEY,
);

CREATE TABLE KlossOrder (
orderID NUMERIC,
klossID INT,
FOREIGN KEY orderId REFERENCES Order(orderId)
FOREIGN KEY klossId REFERENCES Kloss(id) 

CREATE TABLE KlossinEvent (
eventId TEXT ,
klossId INT,
intid LONG NOT NULL CHECK (intid > 0),
uttid LONG NOT NULL CHECK (uttid >= intid),
PRIMARY KEY(eventId,klossId,intid),
FOREIGN KEY(klossId) REFERENCES Kloss(id),
FOREIGN KEY(eventId) REFERENCES Events(eventId),

);
CREATE TABLE EventOrder
eventId TEXT ,
orderId NUMERIC,
intid LONG
PRIMARY KEY (eventId,intid)
FOREIGN KEY(orderId) REFERENCES Order(orderId)
FOREIGN KEY(eventId,intid) REFERENCES Events(eventId,intid)

CREATE TABLE Kamera (
eventId TEXT PRIMARY KEY, 
intid LONG,
uttid LONG,
koord TEXT NOT NULL,
FOREIGN KEY(intid,uttid,eventId) REFERENCES Events(intid,uttid,eventId)




