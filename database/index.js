const cassandra = require('cassandra-driver');

const db = new cassandra.Client({
  contactPoints: ['localhost'],
  localDataCenter: 'datacenter1',
  keyspace: 'event'
});

db.connect();
export default db;