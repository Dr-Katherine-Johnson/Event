const faker = require('faker');
const cassandraDB = require('./index-cassandra.js');
const Event = require('./Event.js');
const Org = require('./Org.js');
const cassandra = require('cassandra-driver')
const Uuid = cassandra.types.Uuid;

const db = require('./index-mysql.js');
const mysql = require('mysql');

const NUMBERS = {
  // EVENTS: 10000000, // target 10,000,000
  ORGS: 1000, // target 1,000
  PEOPLE: 1000, // target 1,000
  EVENTS: 100,
  // ORGS: 100,
  // PEOPLE: 100
};

// TODO: make return values from util functions a consistent format ...
const utils = {
  makePerson() {
    return {
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(), // TODO: fix how the member and founder interacts with each event / org ... currently quite wrong ... either member should be true, OR both member and founder should be true, or member should be false and founder should be true
      member: faker.random.boolean(), // TODO: improvement, cap each organization at 50 members and 4 founders
      founder: faker.random.boolean()
    }
  },

  makeSeries() {
    const days = [null, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const ordinalList = [null, '1st', '2nd', '3rd'];

    const args = [];
    for (let i = 1; i <= 3; i++) {
      const ordinal = ordinalList[i];
      for (let j = 1; j <= 7; j++) {
        const day_of_week = days[j];
        args.push([`Every ${ordinal} ${day_of_week} of the month until May 2020`, day_of_week, i]);
      }
    }

    return args;
  },

  makeOrg() {
    return {
      org_name: faker.company.companyName(),
      org_private: faker.random.number(1) === 0 ? true : false
    }
  },

  makeEvent() {
    return {
      title: faker.company.catchPhrase(),
      local_date_time: faker.date.between('2019-10-01', '2020-4-30')
    }
  }
}

// mysql version
const generateSeries = (useMySQL = true, cb) => {
  const args = utils.makeSeries();
  if (useMySQL) {
    let statement = `INSERT INTO series (series_description, day_of_week, series_interval) VALUES ?;`;
    db.query(statement, [args], (err, results, fields) => {
      if (err) throw err;
      cb(null, results);
    });
  } else {
    // TODO ...
  }

};

const generateOrg = (useMySQL = true, times, cb, count = 0) => {
  if (times === 0) {
    return cb(null, null);
  }

  let args = utils.makeOrg();

  if (useMySQL) {
    args = [args.org_name, args.org_private];
    db.query('INSERT INTO org (org_name, org_private) VALUES (?, ?)', args, (err, results, fields) => {
      if (err) throw err;
      generateOrg(useMySQL, times - 1, cb, count + 1);
    });
  } else {
    // TODO:
    // need to get a list from the db of all the
      // org_id
      // org_name
      // org_private
    // to ensure that they are the same values when we add person and founder / member details
  }
}

const generatePerson = (useMySQL = true, times, cb) => {
  if (times === 0) {
    return cb(null, null);
  }

  const args = utils.makePerson();

  if (useMySQL) {
    args = [args.first_name, args.last_name];
    db.query('INSERT INTO person (first_name, last_name) VALUES (?, ?)', args, (err, results, fields) => {
      if (err) throw err;
      generatePerson(useMySQL, times - 1, cb);
    });
  } else {
    // TODO: ...
  }
}

const generateEvent = (useMySQL = true, times, options = { sameEvent: false, persons: []}, cb) => {
  if (times === 0) { return cb(null, null); }

  let args = utils.makeEvent();
  let statement;

  if (useMySQL) {
    args = [
      args.title,
      args.local_date_time,
      faker.random.number({ min: 1, max: NUMBERS.ORGS }),
      faker.random.number({ min: 1, max: 21 })
    ];

    statement = `INSERT INTO event (title, local_date_time, org_id, series_id uuid) VALUES (?, ?, ?, ?);`;
    db.query(statement, args, (err, results, fields) => {
      if (err) throw err;
      generateEvent(useMySQL, times - 1, {}, cb);
    })
  } else {
    // TODO: currently only seeding event_by_id ... also need to seed org_by_id ???

    const series = utils.makeSeries() // this is an array of arrays
    let personI = Math.floor(Math.random() * 1000);
    let orgI = Math.floor(Math.random() * 1000);
    let seriesI = Math.floor(Math.random() * 21);

    // TODO: will these uuid's line up with other uuid's for the same data in other tables??
    if (personsToAdd > 0) {
      // set flag sameEvent to true
      options.sameEvent = true;
      // use the same eventUuid, ie, we're adding another person to the event
    } else {
      // set flag sameEvent to false
      options.sameEvent = false;
      // new event
      // create a new eventUuid
      options.eventUuid = Uuid.random();
      // reset personsToAdd to a new number
      options.personsToAdd = Math.floor(Math.random() * 50)
      // reset personIndices to a blank object
      options.personIndices = {};
    }

    // {
    //   sameEvent: false,
    //   personsToAdd: 0 - 50,
    //   personIndices: { 0: false, 1: true, 2: false, 3: true, etc...}
    // }

    // for each event that gets created
      // recurse an additional, random, number of times between 0 and 50
        // create numPersons
        // the only fields that are different are
          // person_id, first_name, last_name, founder, member
          // can't use any of the other person objects that were already used on this event

    args = [
      options.eventUuid,
      persons[personI].uuid,
      args.title,
      args.local_date_time,
      orgs[orgI].uuid,
      orgs[orgI].org_name,
      orgs[orgI].org_private,
      seriesUuids[seriesI],
      series[seriesI][0],
      series[seriesI][1],
      series[seriesI][2],
      persons[personI].first_name,
      persons[personI].last_name,
      persons[personI].founder,
      persons[personI].member,
    ];
    statement = `INSERT INTO event_by_id (event_id, person_id, title, local_date_time, org_id, org_name, org_private, series_id, series_description, day_of_week, series_interval, first_name, last_name, founder, member) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      cassandraDB.execute(statement, args, (err, result) => {
        if (err) { throw err; }
        generateEvent(useMySQL, options.sameEvent ? times : times - 1, options, cb);
      })
  }
}

const generateOrgPerson = (useMySQL = true, org_id = 1, person_id = 0, numFounders = 0, numMembers = 0, founder = false, member = false, cb) => {
  if (person_id === NUMBERS.PEOPLE) {
    if (org_id === NUMBERS.ORGS) {
      // base case
      return;
    } else { // new org
      org_id += 1;
      person_id = 1;
      numFounders = 0;
      numMembers = 0;
      founder = false;
      member = false;
    }
  } else { // new person
    person_id += 1;
    founder = false;
    member = false;
  }
  // this section should get executed in everything except the base case
  // up to 4 founders, up to 50 members
  if (numFounders < 4 && Math.random() >= 0.5) {
    founder = true;
    numFounders++;
  }
  if (numMembers < 50 && Math.random() >= 0.5) {
    member = true;
    numMembers++;
  }

  db.query(`INSERT INTO org_person (org_id, person_id, founder, member) VALUES (?, ?, ?, ?);`, [org_id, person_id, founder, member], (err, results, fields) => {
    if (err) throw err;
    if (results.insertId === NUMBERS.ORGS * NUMBERS.PEOPLE) { cb(null, null); }
    generateOrgPerson(useMySQL, org_id, person_id, numFounders, numMembers, founder, member, cb);
  });
}

const cassandraNotes = {
  // TODO: cassandra questions
  // how does denormalized data stay in sync with other denormalized data??

  // TODO: also, when seeding, how do I ensure that the duplicated data between cassandra tables has the same relationship in every table that it appears in. ie, the same event belongs to the same organization and has the same series in all the tables that have that event, whether querying by_date, by_id, by_person, etc ...

  // common queries
  // Q1 view events by date or date range
  // Q2 view details about a given event,
    // its organization details
    // series details (time frequency)
  // Q3 view events a particular person has attended / plans to attend
  // Q4 view events an organization has created
  // Q5 view events by day_of_week
  // Q5A view events by interval

  // TODO: how to handle these??
  // Q6 add an event
  // Q7 update an event by Id
  // Q8 delete an event by Id

  // Q9 view people in an organization
  // view founders
  // view members
  // Q9A view attendees by event_id
  // Q9B view person by id

  // TODO: how to handle these??
  // Q10 create a new organization
  // Q11 update an organization
  // Q12 delete an organization

  // view all organizations a person interacts with:
  // Q13 as a founder
  // Q13A as a member
  // Q13B view org details by id

  // TODO: how to handle these??
  // Q14 create a new person
  // Q15 update a person
  // Q16 delete a person

  // THEY'RE OBJECTS!

  // OPTION1: Troy did this >>> generating data into a csv and then copying the CSV into cassandra

  // TODO: create Chebotko logical data models to support these queries

  // TODO: should the org_id, series_id uuid, person_id key's be replaced with data from their various Cassandra columns in their respective Cassandra tables in CQL? or should the same data for the same entity get repeated in each different partition key?

  // --> Q1
  // -- events_by_date --
  // local_date_time timestamp K
  // event_id uuid
  // title text
  // org_id uuid
  // series_id uuid

  // --> Q2
  // -- event_details_by_id --
  // event_id uuid K
  // org_id uuid
  // series_id uuid

  // --> Q3
  // -- events_by_person --
  // person_id uuid K
  // event_id uuid

  // --> Q4
  // -- events_by_organization --
  // org_id uuid K
  // event_id uuid

  // --> Q5
  // -- events_by_day_of_week --
  // day_of_week text K
  // series_interval tinyint C^
  // event_id uuid
  // series_description text

  // --> Q5A
  // -- events_by_series_interval --
  // series_interval tinyint K
  // day_of_week text C^
  // event_id uuid
  // series_description text

  // --> Q9
  // -- person_by_org_name --
  // org_name text K
  // person_id uuid C^
  // // TODO: or only the person_id ?? repetition of the data, probably
  // first_name text
  // last_name text
  // founder boolean
  // member boolean

  // --> Q9A
  // -- person_by_event --
  // event_id uuid K
  // person_id uuid C^
  // org_id uuid

  // --> Q9B
  // -- person_by_id --
  // person_id uuid K
  // first_name text
  // last_name text

  // --> Q13
  // -- org_by_person_founder --
  // person_id uuid K
  // founder boolean C^
  // org_id uuid

  // --> Q13A
  // -- org_by_person_member --
  // person_id uuid K
  // member boolean C^
  // org_id uuid

  // --> Q13B
  // -- org_by_id --
  // org_id uuid K
  // org_name text
  // org_private boolean

  // TODO: add tables for series by id ??
};

const orgs = [];
const persons = [];
const seriesUuids = [];

const seed = (useMySQL = true) => {
  if (useMySQL) {
    console.time('series');
    generateSeries(useMySQL, () => {
      console.timeEnd('series');
      console.time('org');
      generateOrg(useMySQL, NUMBERS.ORGS, () => {
        console.timeEnd('org');
        console.time('person');
        generatePerson(useMySQL, NUMBERS.PEOPLE, () => {
          console.timeEnd('person');
          console.time('event');
          generateEvent(useMySQL, NUMBERS.EVENTS, {}, () => {
            console.timeEnd('event');
            console.time('org_person');
            generateOrgPerson(useMySQL, 1, 0, 0, 0, false, false, () => {
              console.timeEnd('org_person');
              console.log('finished seeding database!');
              db.end();
            });
          });
        });
      });
    });
  } else {
    // TODO: does this ensure that I now have 1,000 uuid's each for org_id & person_id that won't be used for anything else?

    for (let i = 0; i < NUMBERS.ORGS; i++) {
      orgs.push(Object.assign({}, utils.makeOrg(), { uuid: Uuid.random()}));
      persons.push(Object.assign({}, utils.makePerson(), { uuid: Uuid.random()}));
    }

    for (let i = 0; i < 21; i++) {
      seriesUuids.push(Uuid.random());
    }

    // TWO main queries for Cassandra
      // event_by_id
      // org_by_id

    console.time('event_by_id');
    generateEvent(useMySQL, NUMBERS.EVENTS, {}, () => {
      console.timeEnd('event_by_id'); // takes about 8min to seed 10M records on laptop
      console.log('finished seeding database!');
    })
  }
}

// seed(true); // MySQL
seed(false); // Cassandra