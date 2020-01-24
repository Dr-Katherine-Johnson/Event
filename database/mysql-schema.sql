DROP DATABASE IF EXISTS events;
CREATE DATABASE events;

CREATE TABLE org (
  org_id INT AUTO_INCREMENT,
  org_name VARCHAR(255),
  org_private BOOLEAN,
  PRIMARY KEY (org_id)
);

CREATE TABLE series (
  series_id INT AUTO_INCREMENT,
  description VARCHAR(255),
  day_of_week datetime,
  interval INT,
  PRIMARY KEY (series_id)
);

CREATE TABLE person (
  person_id INT AUTO_INCREMENT,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  identifier VARCHAR(255),
  PRIMARY KEY (person_id)
);

CREATE TABLE event (
  event_id INT AUTO_INCREMENT,
  title VARCHAR(255),
  local_date_time datetime,
  org_id INT,
  FOREIGN KEY (org_id)
    REFERENCES org (org_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE
  series_id INT,
  FOREIGN KEY (series_id)
    REFERENCES series (series_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE
  PRIMARY KEY (event_id)
);

CREATE TABLE org_person (
  org_person_id INT AUTO_INCREMENT,
  org_id INT,
  FOREIGN KEY (org_id)
    REFERENCES org (org_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE
  person_id INT,
  FOREIGN KEY (person_id)
    REFERENCES person (person_id)
    ON UPDATE RESTRICT
    ON DELETE CASCADE
  founder BOOLEAN,
  member BOOLEAN,
  PRIMARY KEY (org_person_id)
);