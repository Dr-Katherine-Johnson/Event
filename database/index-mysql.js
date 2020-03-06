const mysql = require('mysql');
const config = require('config');

const dbConfig = config.get('database.dbConfig');

console.log('dbConfig: ', dbConfig);

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.log('dbConfig: ', dbConfig);
    // TODO: better error handling?
    // throw err;
    console.log(err);
  };
  console.log(`Connected to MySQL as ID ${connection.threadId}`);
});

module.exports = connection;