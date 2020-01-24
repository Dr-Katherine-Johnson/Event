// // for legacy Database - MongoDB
// const mongoose = require('mongoose');
// const mongoUri = 'mongodb://localhost/event';
// // Mongo deprecated a function Mongoose uses internally, this should address the issue
// mongoose.set('useFindAndModify', false);
// mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
// const db = mongoose.connection;
// module.exports = db;