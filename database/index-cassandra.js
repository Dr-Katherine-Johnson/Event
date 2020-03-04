const cassandra = require('cassandra-driver');

const db = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
  keyspace: 'events'
});

db.connect();
module.exports = db;