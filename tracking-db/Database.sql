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

CREATE TABLE Events (
  order_id INT,
  type TEXT,
  action TEXT,
  intime BIGINT NOT NULL,
  outtime BIGINT,
  PRIMARY KEY (order_id, type, action, intime),
  FOREIGN KEY (order_id) REFERENCES Orders(id),
  FOREIGN KEY (type, action) REFERENCES Resources(type, action),
  CONSTRAINT in_before_out CHECK (intime > outtime)
);

CREATE TABLE ComponentsInEvents (
  comp_id INT,
  event_order_id INT,
  event_type TEXT,
  event_action TEXT,
  event_intime BIGINT,
  PRIMARY KEY (comp_id, event_order_id, event_type, event_action, event_intime),
  FOREIGN KEY (comp_id) REFERENCES Components(id),
  FOREIGN KEY (event_order_id, event_type, event_action, event_intime)
  REFERENCES Events(order_id, type, action, intime)
);
