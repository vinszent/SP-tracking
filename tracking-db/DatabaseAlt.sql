CREATE TABLE Orders (
  id INT PRIMARY KEY
);

CREATE TABLE Components (
  id INT PRIMARY KEY,
  color TEXT
);

CREATE TABLE Resources (
  type TEXT,
  action TEXT,
  PRIMARY KEY (type, action)
);

CREATE TABLE SystemEvents (
  order_id INT,
  type TEXT,
  action TEXT,
  time BIGINT NOT NULL,
  PRIMARY KEY (order_id, type, action, time),
  FOREIGN KEY (order_id) REFERENCES Orders(id),
  FOREIGN KEY (type, action) REFERENCES Resources(type, action)
);

CREATE TABLE TrackingEvents (
  order_id INT,
  camera_id INT,
  time BIGINT NOT NULL,
  PRIMARY KEY (order_id, camera_id, time),
  FOREIGN KEY (order_id) REFERENCES Orders(id)
);

CREATE TABLE ComponentsInTrackingEvents (
  comp_id INT,
  order_id INT,
  camera_id INT,
  time BIGINT,
  PRIMARY KEY (comp_id, order_id, camera_id, time),
  FOREIGN KEY (comp_id) REFERENCES Components(id),
  FOREIGN KEY (order_id, camera_id, time) REFERENCES TrackingEvents(order_id, camera_id, time)
);

CREATE VIEW CurrentOrder AS (
  WITH num_of_end_signals AS (
      SELECT COUNT(*) as num FROM SystemEvents WHERE order_id = (SELECT MAX(id) FROM Orders) AND type = 'end'
    )
  SELECT
  CASE WHEN (SELECT num FROM num_of_end_signals) >= 1
    THEN (SELECT MAX(id) FROM Orders) + 1
    ELSE (SELECT MAX(id) FROM Orders)
  END
);
