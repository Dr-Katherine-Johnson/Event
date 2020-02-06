DROP KEYSPACE IF EXISTS events;

CREATE KEYSPACE events
  WITH replication = {'class': 'SimpleStrategy', 'replication_factor' : 3};

use events;

-- TODO: improvement: change the type of series_interval ... Cassandra-Driver assumes a JS Number type is a CQL double ...

-- 1 main query
CREATE TABLE events.event_by_id (
  event_id uuid,
  person_id uuid,
  title text,
  local_date_time timestamp,
  org_id uuid,
  org_name text,
  org_private boolean,
  series_id uuid,
  series_description text,
  day_of_week text,
  series_interval double,
  first_name text,
  last_name text,
  founder boolean,
  member boolean,
  PRIMARY KEY ((event_id), person_id)
)
  WITH comment = 'Q2 view event details by id'
;

-- unneeded queries?

-- CREATE TABLE event.org_by_id (
--   org_id uuid,
--   person_id uuid,
--   org_name text,
--   org_private boolean,
--   first_name text,
--   last_name text,
--   founder boolean,
--   member boolean,
--   PRIMARY KEY ((org_id), person_id)
-- )
--   WITH comment = 'Q13B view org details by id'
-- ;

-- CREATE TABLE event.events_by_date (
--   local_date_time timestamp,
--   event_id uuid,
--   title text,
--   org_id uuid,
--   org_name text,
--   org_private boolean,
--   series_id uuid,
--   series_description text,
--   day_of_week text,
--   series_interval double,
--   PRIMARY KEY (local_date_time)
-- )
--   WITH comment = 'Q1 view events by date'
-- ;

-- CREATE TABLE event.events_by_person (
--   person_id uuid,
--   first_name text,
--   last_name text,
--   event_id uuid,
--   title text,
--   local_date_time timestamp,
--   org_id uuid,
--   org_name text,
--   org_private boolean,
--   series_id uuid,
--   series_description text,
--   day_of_week text,
--   series_interval double,
--   PRIMARY KEY (person_id)
-- )
--   WITH comment = 'Q3 view events a particular person has attended / plans to attend'
-- ;

-- CREATE TABLE event.events_by_organization (
--   org_id uuid,
--   event_id uuid,
--   title text,
--   local_date_time timestamp,
--   org_name text,
--   org_private boolean,
--   series_id uuid,
--   series_description text,
--   day_of_week text,
--   series_interval double,
--   PRIMARY KEY (org_id)
-- )
--   WITH comment = 'Q4 view events an organization has created'
-- ;

-- CREATE TABLE event.events_by_day_of_week (
--   day_of_week text,
--   series_interval double,
--   event_id uuid,
--   title text,
--   local_date_time timestamp,
--   org_id uuid,
--   org_name text,
--   org_private boolean,
--   series_id uuid,
--   series_description text,
--   PRIMARY KEY ((day_of_week), series_interval)
-- )
--   WITH comment = 'Q5 view events by day_of_week'
-- ;

-- CREATE TABLE event.events_by_series_interval (
--   series_interval double,
--   day_of_week text,
--   event_id uuid,
--   title text,
--   local_date_time timestamp,
--   org_id uuid,
--   org_name text,
--   org_private boolean,
--   series_id uuid,
--   series_description text,
--   PRIMARY KEY ((series_interval), day_of_week)
-- )
--   WITH comment = 'Q5A view events by interval'
-- ;

-- CREATE TABLE event.person_by_org_name (
--   org_name text,
--   person_id uuid,
--   first_name text,
--   last_name text,
--   org_id uuid,
--   org_private boolean,
--   founder boolean,
--   member boolean,
--   PRIMARY KEY ((org_name), person_id)
-- )
--   WITH comment = 'Q9 view people in an organization'
-- ;

-- CREATE TABLE event.person_by_event (
--   event_id uuid,
--   person_id uuid,
--   first_name text,
--   last_name text,
--   org_id uuid,
--   org_name text,
--   org_private boolean,
--   founder boolean,
--   member boolean,
--   PRIMARY KEY ((event_id), person_id)
-- )
--   WITH comment = 'Q9A view attendees by event_id'
-- ;

-- CREATE TABLE event.person_by_id (
--   person_id uuid,
--   first_name text,
--   last_name text,
--   PRIMARY KEY (person_id)
-- )
--   WITH comment = 'Q9B view person by id'
-- ;

-- CREATE TABLE event.org_by_person_founder (
--   person_id uuid,
--   founder boolean,
--   org_id uuid,
--   org_name text,
--   org_private boolean,
--   member boolean,
--   PRIMARY KEY ((person_id), founder)
-- )
--   WITH comment = 'Q13 view all organizations a person interacts with as a founder'
-- ;

-- CREATE TABLE event.org_by_person_member (
--   person_id uuid,
--   member boolean,
--   org_id uuid,
--   org_name text,
--   org_private boolean,
--   founder boolean,
--   PRIMARY KEY ((person_id), member)
-- )
--   WITH comment = 'Q13A view all organizations a person interacts with as a member'
-- ;

-- --   // TODO: how to handle these??
-- --   // Q10 create a new organization
-- --   // Q11 update an organization
-- --   // Q12 delete an organization

-- --   // TODO: how to handle these??
-- --   // Q14 create a new person
-- --   // Q15 update a person
-- --   // Q16 delete a person