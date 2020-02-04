const faker = require('faker');
// const db = require('./index-cassandra.js');
const Event = require('./Event.js');
const Org = require('./Org.js');
const cassandra = require('cassandra-driver')
const Uuid = cassandra.types.Uuid;

const db = require('./index-mysql.js');
const mysql = require('mysql');

// Given a maximum quantity max, returns an array of memberIds between 1 and max
const memberIds = (max) => {
  const ids = [];
  const numberOfElements = faker.random.number({ min: 1, max });
  for (let i = 0; i < numberOfElements; i += 1) {
    const newId = `m${faker.random.number(499)}`; // changing this to have first_name and last_name with a unique id (ie, b/c member numbers could repeat ...)
    ids.push(newId);
  }
  return ids;
};
// Each organization has between 1 and 4 founders and up to 50 members
let orgMembers = () => {
  return { founders: memberIds(4), group_members: memberIds(50) };
};
// some, but not all events might repeat
let eventSeries = () => {
  const repeat = faker.random.boolean();
  const ordinals = ['1st', '2nd', '3rd'];
  const frequency = {
    day_of_week: faker.date.weekday(),
    interval: faker.random.number(2),
  };
  const newSeries = {
    description: `Every ${ordinals[frequency.interval]} ${frequency.day_of_week} of the month until May 2020`,
    frequency,
  };
  return repeat ? newSeries : null;
};

const NUMBERS = {
  EVENTS: 10000000, // target 10,000,000
  ORGS: 1000, // target 1,000
  PEOPLE: 1000 // target 1,000
  // EVENTS: 100,
  // ORGS: 100,
  // PEOPLE: 100
};

// mysql version
const generateSeries = (useMySQL = true, cb) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const ordinalList = ['1st', '2nd', '3rd'];

  const args = [];
  for (let i = 1; i <= 3; i++) {
    const ordinal = ordinalList[i];
    for (let j = 1; j <= 7; j++) {
      const day_of_week = days[j];
      args.push([`Every ${ordinal} ${day_of_week} of the month until May 2020`, day_of_week, i]);
    }
  }

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

const generateOrg = (times, cb, count = 0) => {
  if (times === 0) {
    return cb(null, null);
  }

  const args = [faker.company.companyName(), faker.random.number(1) === 0 ? true : false];
  db.query('INSERT INTO org (org_name, org_private) VALUES (?, ?)', args, (err, results, fields) => {
    if (err) throw err;
    generateOrg(times - 1, cb, count + 1);
  });
}

const generatePerson = (times, cb) => {
  if (times === 0) {
    return cb(null, null);
  }

  const args = [faker.name.firstName(), faker.name.lastName()];
  db.query('INSERT INTO person (first_name, last_name) VALUES (?, ?)', args, (err, results, fields) => {
    if (err) throw err;
    generatePerson(times - 1, cb);
  });
}

const generateEvent = (times, cb) => {
  if (times === 0) { return cb(null, null); }

  const args = [
    faker.company.catchPhrase(),
    faker.date.between('2019-10-01', '2020-4-30'),
    faker.random.number({ min: 1, max: NUMBERS.ORGS }),
    faker.random.number({ min: 1, max: 21 })
  ];
  const statement = `INSERT INTO event (title, local_date_time, org_id, series_id uuid) VALUES (?, ?, ?, ?);`;
  db.query(statement, args, (err, results, fields) => {
    if (err) throw err;
    generateEvent(times - 1, cb);
  })
}

const generateOrgPerson = (org_id = 1, person_id = 0, numFounders = 0, numMembers = 0, founder = false, member = false, cb) => {
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
    generateOrgPerson(org_id, person_id, numFounders, numMembers, founder, member, cb);
  });
}

// const events = [];
// const organizations = [];

// //  events: {
// //     eventId: Number (integer),
// //     title: String,
// //     local_date_time: ISO 8601,
// //     orgId: String,
// //     series: {
// //       description: String,
// //       frequency: {
// //         day_of_week: String,
// //         interval: Number,
// //        },
// //      },
// //   }

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
  // identifier text
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
  // identifier text

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

const seed = (useMySQL = true) => {
  if (useMySQl) {
    console.time('series');
    generateSeries(() => {
      console.timeEnd('series');
      console.time('org');
      generateOrg(NUMBERS.ORGS, () => {
        console.timeEnd('org');
        console.time('person');
        generatePerson(NUMBERS.PEOPLE, () => {
          console.timeEnd('person');
          console.time('event');
          generateEvent(NUMBERS.EVENTS, () => {
            console.timeEnd('event');
            console.time('org_person');
            generateOrgPerson(1, 0, 0, 0, false, false, () => {
              console.timeEnd('org_person');
              console.log('finished seeding database!');
              db.end();
            });
          });
        });
      });
    });
  } else {

  }
}

// seed(true); MySQL
seed(false); Cassandra

// // console.time('event');
// // // cassandra version
// // let generateEvents = (times) => {
// //   if (times === 0) { return console.timeEnd('event'); }
// //   const event = {
// //     event_id: Uuid.random(),
// //     title: faker.company.catchPhrase(),
// //     local_date_time: faker.date.between('2019-10-01', '2020-4-30'),
// //     org_id: Uuid.random(),
// //     series: Uuid.random(),
// //   };
// //   Event.insert(event)
// //     .then(result => {
// //       // console.count();
// //       generateEvents(times - 1);
// //     })
// //     .catch(err => {
// //       console.log(err);
// //     })
// // };

// // Org =
// // {
// //  orgId: Number(integer),
// //  org_name: String,
// //  org_private: boolean,
// //  members: {
// //    founders: [ memberId, otherMemberId, …],
// //    group_members: [ memberId, otherMemberId , …],
// //  }

// // // There are usually less organizations than there are events
// // // Or, in other words, each organization can hold multiple events, of which there are 100
// // // With 20 events distributed evenly that is an average of 5 events per org
// // let generateOrgs = () => {
// //   for (let i = 0; i < 20; i += 1) {
// //     organizations.push({
// //       orgId: `o${i}`,
// //       org_name: faker.company.companyName(),
// //       org_private: faker.random.boolean(),
// //       members: orgMembers(),
// //     });
// //   }
// // };

// // generateOrgs();
// // generateEvents();

// // module.exports.organizations = organizations;
// // module.exports.events = events;

// // const insertSampleEventsAndOrgs = () => {
// //   console.time('org');
// //   Org.create(organizations)
// //     .then((results) => {
// //       console.timeEnd('org');
// //       console.log('orgs seeded');
// //       console.time('event');
// //       return Event.create(events);
// //     })
// //     .then((results) => {
// //       console.log('NUMBER_OF_EVENTS: ', NUMBER_OF_EVENTS);
// //       console.timeEnd('event');
// //       console.log('events seeded');
// //       console.log('finished seeding database!');
// //       db.close();
// //     });
// // };
// // insertSampleEventsAndOrgs();