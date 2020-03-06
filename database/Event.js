// TODO: remove this

// const cassandra = require('cassandra-driver');
// const Mapper = cassandra.mapping.Mapper;
// const db = require('./index-cassandra.js');

// const mapper = new Mapper(db, {
//   models: {
//     'Event': { tables: ['events']}
//   }
// });

// const eventMapper = mapper.forModel('Event');

// // const eventSchema = new Schema({
// //   eventId: Number,
// //   title: String,
// //   local_date_time: Date,
// //   orgId: String,
// //   series: {
// //     description: String,
// //     frequency: {
// //       day_of_week: String,
// //       interval: Number,
// //     },
// //   },
// // });

// module.exports = eventMapper;