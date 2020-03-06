const faker = require('faker');
const Event = require('./Event.js');
const Org = require('./Org.js');

// TODO: remove these on new commits
let cassandraDB, cassandra, Uuid;
cassandra = require('cassandra-driver')
// cassandraDB = require('./index-cassandra.js');
Uuid = cassandra.types.Uuid;

const db = require('./index-mysql.js');
const mysql = require('mysql');

const NUMBERS = {
  // EVENTS: 10000000, // target 10,000,000
  // ORGS: 1000, // target 1,000
  // PEOPLE: 1000, // target 1,000
  EVENTS: 1000,
  ORGS: 100,
  PEOPLE: 100
};

// TODO: make return values from util functions a consistent format ...
const utils = {
  makePerson() {
    // TODO: improvement, cap each organization at 50 members and 4 founders
    const member = faker.random.boolean();
    return {
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      member,
      founder: member ? faker.random.boolean() : true
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
    // for additional cassandra queries
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
    // for additional cassandra queries
  }
}

const generatePerson = (useMySQL = true, times, cb) => {
  if (times === 0) {
    return cb(null, null);
  }

  let args = utils.makePerson();

  if (useMySQL) {
    args = [args.first_name, args.last_name];
    db.query('INSERT INTO person (first_name, last_name) VALUES (?, ?)', args, (err, results, fields) => {
      if (err) throw err;
      generatePerson(useMySQL, times - 1, cb);
    });
  } else {
    // for additional cassandra queries
  }
}

const generateEvent = (useMySQL = true, times, options, cb) => {
  if (times === 0) { return cb(null, null); }

  options = options || {
    eventUuid: Uuid.random(),
    personsToAdd: 5,
    personIndices: {},
    personI: 0,
    orgI: Math.floor(Math.random() * 1000),
    seriesI: Math.floor(Math.random() * 21),
    eventDetails: utils.makeEvent()
  }

  let statement;

  if (useMySQL) {
    args = [
      options.eventDetails.title,
      options.eventDetails.local_date_time,
      faker.random.number({ min: 1, max: NUMBERS.ORGS }),
      faker.random.number({ min: 1, max: 21 })
    ];

    statement = `INSERT INTO event (title, local_date_time, org_id, series_id) VALUES (?, ?, ?, ?);`;
    db.query(statement, args, (err, results, fields) => {
      if (err) throw err;

      options = {
        eventDetails: utils.makeEvent()
      };

      generateEvent(useMySQL, times - 1, options, cb);
    })
  } else {
    // event_by_id is the one Cassandra table needed
    const series = utils.makeSeries() // an array of arrays
    let concurrentInsertions = [];

    while (options.personsToAdd > 0) {

      // this section prepares options.personsToAdd number of insert queries that will run concurrently for the same event, with only person details being different
      options.personI = Math.floor(Math.random() * 1000);
      while (options.personIndices[options.personI]) {
        // generate random person indexes until we have one that is NOT in personIndices for this event
        options.personI = Math.floor(Math.random() * 1000)
      }
      // add the index of the person we just selected to personIndices
      options.personIndices[options.personI] = true;
      options.personsToAdd = options.personsToAdd - 1;

      args = [
        options.eventUuid,
        persons[options.personI].uuid,
        options.eventDetails.title,
        options.eventDetails.local_date_time,
        orgs[options.orgI].uuid,
        orgs[options.orgI].org_name,
        orgs[options.orgI].org_private,
        seriesUuids[options.seriesI],
        series[options.seriesI][0],
        series[options.seriesI][1],
        series[options.seriesI][2],
        persons[options.personI].first_name,
        persons[options.personI].last_name,
        persons[options.personI].founder,
        persons[options.personI].member,
      ];
      statement = `INSERT INTO event_by_id (event_id, person_id, title, local_date_time, org_id, org_name, org_private, series_id, series_description, day_of_week, series_interval, first_name, last_name, founder, member) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      concurrentInsertions.push(cassandraDB.execute(statement, args));
    }

    // once all the insertions for that one event have finished, move on to a different event
    Promise.all(concurrentInsertions)
      .then(() => {
        // new event, so reset options
        options = {
          eventUuid: Uuid.random(),
          personsToAdd: Math.floor(Math.random() * 50) + 1,
          personIndices: {},
          personI: Math.floor(Math.random() * 1000),
          orgI: Math.floor(Math.random() * 1000),
          seriesI: Math.floor(Math.random() * 21),
          eventDetails: utils.makeEvent()
        };

        // add the index of the 1 person for this new event to personIndices
        options.personIndices[options.personI] = true;

        args = [
          options.eventUuid,
          persons[options.personI].uuid,
          options.eventDetails.title,
          options.eventDetails.local_date_time,
          orgs[options.orgI].uuid,
          orgs[options.orgI].org_name,
          orgs[options.orgI].org_private,
          seriesUuids[options.seriesI],
          series[options.seriesI][0],
          series[options.seriesI][1],
          series[options.seriesI][2],
          persons[options.personI].first_name,
          persons[options.personI].last_name,
          persons[options.personI].founder,
          persons[options.personI].member,
        ];
        statement = `INSERT INTO event_by_id (event_id, person_id, title, local_date_time, org_id, org_name, org_private, series_id, series_description, day_of_week, series_interval, first_name, last_name, founder, member) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          cassandraDB.execute(statement, args, (err, result) => {
            if (err) { throw err; }
            console.log(`${times} more events to seed`);
            generateEvent(useMySQL, times - 1, options, cb);
          })
      })
      .catch((err) => {
        throw err;
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
  // Main Query
  // Q1A event by event id

  // --> Q1A
  // -- event_details_by_id --
  // event_id uuid K
  // person_id uuid C^
  // title text
  // local_date_time timestamp
  // org_id uuid
  // org_name text
  // org_private boolean
  // series_id uuid
  // series_description text
  // day_of_week text
  // series_interval double
  // first_name text
  // last_name text
  // founder boolean
  // member boolean

  // Cassandra verbiage is misleading, they're more like objects, and less like SQL tables ...

  // OPTION1: Troy did this >>> generating data into a csv and then copying the CSV into cassandra

  // other common queries
  // Q1 view events by date or date range
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

  // --> Q1
  // -- events_by_date --
  // local_date_time timestamp K
  // event_id uuid
  // title text
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
          generateEvent(useMySQL, NUMBERS.EVENTS, null, () => {
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
    // TODO: does this ensure that I now have 1000 uuid's each for org_id & person_id that won't be used for anything else?

    for (let i = 0; i < NUMBERS.ORGS; i++) {
      orgs.push(Object.assign({}, utils.makeOrg(), { uuid: Uuid.random()}));
      persons.push(Object.assign({}, utils.makePerson(), { uuid: Uuid.random()}));
    }

    for (let i = 0; i < 21; i++) {
      seriesUuids.push(Uuid.random());
    }
    console.time('event_by_id');
    generateEvent(useMySQL, NUMBERS.EVENTS, {}, () => {
      console.timeEnd('event_by_id');
      console.log(`seeded ${NUMBERS.EVENTS} events`);
      cassandraDB.shutdown();
    })
  }
}

seed(true); // MySQL
// seed(false); // Cassandra