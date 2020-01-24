const mysql = require('mysql');
const connection = mysql.createConnection({
  host: 'localhost',
  database: 'events'
});

connection.connect((err) => {
  if (err) throw err;
  console.log(`Connected to MySQL as ID ${connection.threadId}`);
});

module.exports = connection;