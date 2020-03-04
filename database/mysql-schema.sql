DROP DATABASE IF EXISTS events;
CREATE DATABASE events;

use events;

CREATE TABLE org (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  org_name VARCHAR(255) NOT NULL,
  org_private BOOLEAN NOT NULL
);

CREATE TABLE series (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  series_description VARCHAR(255) NOT NULL,
  day_of_week VARCHAR(255) NOT NULL,
  series_interval INT NOT NULL
);

CREATE TABLE person (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL
  -- this was a holdover from the legacy database (MongoDB), where the identifier for each person was a string like `m0` `m145` `m487` etc...
  -- identifier VARCHAR(255) NOT NULL
);

CREATE TABLE event (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  title VARCHAR(255) NOT NULL,
  local_date_time DATETIME NOT NULL,
  org_id INT NOT NULL,
  FOREIGN KEY (org_id)
    REFERENCES org (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  series_id INT NOT NULL,
  FOREIGN KEY (series_id)
    REFERENCES series (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE org_person (
  id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
  org_id INT NOT NULL,
  FOREIGN KEY (org_id)
    REFERENCES org (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  person_id INT NOT NULL,
  FOREIGN KEY (person_id)
    REFERENCES person (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  founder BOOLEAN NOT NULL,
  member BOOLEAN NOT NULL
);

-- -- Benchmarking queries
-- OPTION1, with WHERE statement
-- SELECT
--   *
-- FROM (
--   event, org, series, org_person, person )
-- WHERE
--     event.id=9999990
--   AND
--     org.id=event.org_id
--   AND
--     series.id=event.series_id
--   AND
--     event.org_id=org_person.org_id
--   AND (
--     org_person.founder=TRUE OR org_person.member=TRUE )
--   AND org_person.person_id=person.id
-- ;

-- -- OPTION2, with INNER JOINS
-- SELECT * FROM event
-- INNER JOIN org
--   ON event.org_id=org.id
-- INNER JOIN series
--   ON event.series_id=series.id
-- INNER JOIN org_person
--   ON event.org_id=org_person.org_id
-- INNER JOIN person
--   ON org_person.person_id=person.id
-- WHERE
--     event.id=9999990
--   AND
--     (org_person.founder=TRUE OR org_person.member=TRUE)
-- ;


-- -- Timing queries
-- SELECT EVENT_ID, TRUNCATE(TIMER_WAIT/1000000000,6) as Duration, SQL_TEXT
--        FROM performance_schema.events_statements_history_long WHERE SQL_TEXT like '%9999990%';

-- SELECT event_name AS Stage, TRUNCATE(TIMER_WAIT/1000000000,6) AS Duration
-- FROM performance_schema.events_stages_history_long WHERE NESTING_EVENT_ID=76;



-- TODO: columns that I actually want ...
--   event.id,
--   event.title,
--   event.local_date_time,
--   event.org_id,
--   event.series_id,
--   org.org_name,
--   org.org_private,
--   series.series_description,
--   series.day_of_week,
--   series.series_interval,
--   org_person.founder,
--   org_person.member,
--   person.first_name,
--   person.last_name