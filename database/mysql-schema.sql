DROP DATABASE IF EXISTS events;
CREATE DATABASE events;

use events;

CREATE TABLE org (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_name VARCHAR(255),
  org_private BOOLEAN
);

CREATE TABLE series (
  id INT AUTO_INCREMENT PRIMARY KEY,
  series_description VARCHAR(255),
  day_of_week VARCHAR(255),
  series_interval INT
);

CREATE TABLE person (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  identifier VARCHAR(255)
);

CREATE TABLE event (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  local_date_time DATETIME,
  org_id INT,
  FOREIGN KEY (org_id)
    REFERENCES org (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  series_id INT,
  FOREIGN KEY (series_id)
    REFERENCES series (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE org_person (
  id INT AUTO_INCREMENT PRIMARY KEY,
  org_id INT,
  FOREIGN KEY (org_id)
    REFERENCES org (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  person_id INT,
  FOREIGN KEY (person_id)
    REFERENCES person (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  founder BOOLEAN,
  member BOOLEAN
);