DROP KEYSPACE IF EXISTS event;

CREATE KEYSPACE event
  WITH replication = {'class': 'SimpleStrategy', 'replication_factor' : 3};

use event;

// user table
CREATE TABLE events (
  event_id uuid,
  title text,
  local_date_time timestamp,
  org_id uuid,
  series uuid,
  PRIMARY KEY (event_id)
);