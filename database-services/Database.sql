CREATE TABLE Orders (
  id INT PRIMARY KEY
);

INSERT INTO Orders VALUES (0);

CREATE TABLE PLCEvents (
  order_id INT NOT NULL,
  datablock INT,
  address NUMERIC,
  time BIGINT,
  signal BOOLEAN,
  state INT,
  PRIMARY KEY (datablock, address, time),
  FOREIGN KEY (order_id) REFERENCES Orders(id)
);

CREATE TABLE PSL (
  datablock INT,
  address NUMERIC,
  resource TEXT,
  action TEXT,
  PRIMARY KEY (datablock, address)
);

INSERT INTO PSL VALUES
(135, 2.0, 'H2', 'up'),
(135, 4.0, 'H2', 'down'),
(140, 2.0, 'H3', 'up'),
(140, 4.0, 'H3', 'down'),
(139, 2.0, 'Flexlink', 'fixtureToOperator'),
(139, 4.0, 'Flexlink', 'fixtureToRobot'),
(139, 6.0, 'Flexlink', 'fixtureToOperator.no'),
(139, 10.0, 'Flexlink', 'fixtureToRobot.pos'),
(138, 16.0, 'Flexlink', 'start'),
(138, 16.1, 'Flexlink', 'stop'),
(138, 16.2, 'Flexlink', 'onoroff'),
(132, 2.0, 'R5', 'pickBlock'),
(132, 10.0, 'R5', 'pickBlock.pos'),
(132, 4.0, 'R5', 'placeBlock'),
(132, 6.0, 'R5', 'toHome'),
(132, 8.0, 'R5', 'toDodge'),
(128, 10.0, 'R4', 'pickBlock.pos'),
(128, 2.0, 'R4', 'pickBlock'),
(128, 4.0, 'R4', 'placeBlock'),
(128, 6.0, 'R4', 'toHome'),
(128, 8.0, 'R4', 'toDodge'),
(126, 2.0, 'R2', 'elevatorStn2ToHomeTable'),
(126, 6.0, 'R2', 'homeTableToElevatorStn3'),
(126, 10.0, 'R2', 'placeAtPos'),
(126, 18.0, 'R2', 'pickAtPos.pos'),
(126, 12.0, 'R2', 'pickAtPos'),
(126, 14.0, 'R2', 'deliverTower'),
(126, 16.0, 'R2', 'pickBuildPlate'),
(126, 4.0, 'R2', 'homeTableToHomeBP'),
(126, 8.0, 'R2', 'homeBPToHomeTable'),
(141, 0.1, 'Safety', 'manmode'),
(141, 0.0, 'Safety', 'forcereset'),
(141, 0.2, 'Safety', 'Forcepalett0'),
(141, 0.3, 'Safety', 'Forcepalett1');

-- Return latest order, unless it's finished, in which case return latest+1
CREATE VIEW CurrentOrder AS (
  WITH num_of_end_signals AS (
      SELECT COUNT(*) as num FROM PLCEvents NATURAL JOIN PSL WHERE order_id = (SELECT MAX(id) FROM Orders) AND resource = 'R2' AND action = 'deliverTower' AND state = 2
  )
  SELECT
  CASE WHEN (SELECT num FROM num_of_end_signals) >= 1
    THEN (SELECT MAX(id) FROM Orders) + 1
    ELSE (SELECT MAX(id) FROM Orders)
  END AS current
);

CREATE TABLE Components (
  id INT PRIMARY KEY,
  color TEXT
);

CREATE TABLE TrackingEvents (
  order_id INT,
  camera_id TEXT,
  time BIGINT NOT NULL,
  PRIMARY KEY (order_id, camera_id, time),
  FOREIGN KEY (order_id) REFERENCES Orders(id)
);

CREATE TABLE ComponentsInTrackingEvents (
  order_id INT,
  comp_id INT,
  camera_id TEXT,
  time BIGINT,
  x_coord INT,
  y_coord INT,
  PRIMARY KEY (order_id, comp_id, camera_id, time),
  FOREIGN KEY (order_id) REFERENCES Orders(id),
  FOREIGN KEY (comp_id) REFERENCES Components(id),
  FOREIGN KEY (order_id, camera_id, time) REFERENCES TrackingEvents(order_id, camera_id, time)
);
