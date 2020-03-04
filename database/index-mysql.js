const mysql = require('mysql');
const config = require('config');

const dbConfig = config.get('database.dbConfig');
const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) throw err;
  // console.log(`Connected to MySQL as ID ${connection.threadId}`);
});

module.exports = connection;