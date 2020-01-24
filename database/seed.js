/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable prefer-const */
const faker = require('faker');
const db = require('./index.js');
const Event = require('./Event.js');
const Org = require('./Org.js');

// Given a maximum quantity max, returns an array of memberIds between 1 and max
const memberIds = (max) => {
  const ids = [];
  const numberOfElements = faker.random.number({ min: 1, max });
  for (let i = 0; i < numberOfElements; i += 1) {
    const newId = `m${faker.random.number(499)}`;
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

const events = [];

//  events: {
//     eventId: Number (integer),
//     title: String,
//     local_date_time: ISO 8601,
//     orgId: String,
//     series: {
//       description: String,
//       frequency: {
//         day_of_week: String,
//         interval: Number,
//        },
//      },
//   }

const NUMBER_OF_EVENTS = 100;
let generateEvents = () => {
  for (let i = 0; i < NUMBER_OF_EVENTS; i += 1) {
    events.push({
      eventId: i,
      title: faker.company.catchPhrase(),
      local_date_time: faker.date.between('2019-10-01', '2020-4-30'),
      orgId: `o${faker.random.number(19)}`,
      series: eventSeries(),
    });
  }
  return events;
};

const organizations = [];

// Org =
// {
//  orgId: Number(integer),
//  org_name: String,
//  org_private: boolean,
//  members: {
//    founders: [ memberId, otherMemberId, …],
//    group_members: [ memberId, otherMemberId , …],
//  }

// There are usually less organizations than there are events
// Or, in other words, each organization can hold multiple events, of which there are 100
// With 20 events distributed evenly that is an average of 5 events per org
let generateOrgs = () => {
  for (let i = 0; i < 20; i += 1) {
    organizations.push({
      orgId: `o${i}`,
      org_name: faker.company.companyName(),
      org_private: faker.random.boolean(),
      members: orgMembers(),
    });
  }
};

generateOrgs();
generateEvents();

module.exports.organizations = organizations;
module.exports.events = events;

// const insertSampleEventsAndOrgs = () => {
//   console.time('org');
//   Org.create(organizations)
//     .then((results) => {
//       console.timeEnd('org');
//       console.log('orgs seeded');
//       console.time('event');
//       return Event.create(events);
//     })
//     .then((results) => {
//       console.log('NUMBER_OF_EVENTS: ', NUMBER_OF_EVENTS);
//       console.timeEnd('event');
//       console.log('events seeded');
//       console.log('finished seeding database!');
//       db.close();
//     });
// };

// insertSampleEventsAndOrgs();