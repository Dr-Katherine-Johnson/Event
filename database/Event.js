const cassandra = require('cassandra-driver');
const Mapper = cassandra.mapping.mapper;
const db = require('./index.js');

const mapper = new Mapper(db, {
  models: {
    'Event': { tables: ['events']}
  }
});

const eventMapper = mapper.forModel('Video');

// const eventSchema = new Schema({
//   eventId: Number,
//   title: String,
//   local_date_time: Date,
//   orgId: String,
//   series: {
//     description: String,
//     frequency: {
//       day_of_week: String,
//       interval: Number,
//     },
//   },
// });

module.exports = eventMapper;