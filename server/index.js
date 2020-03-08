if (process.env.NEW_RELIC_IS_ON) { require('newrelic'); }

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.API_SERVER_PORT || 80;

const controller = require('./controller.js');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

app.all('/event(/timedate)?(/org/members)?/:eventId', controller.checkEventId);

app.get('/event/:eventId', controller.getEvent);
app.post('/event/:eventId', controller.addEvent);
app.put('/event/:eventId', controller.updateEvent);
app.delete('/event/:eventId', controller.deleteEvent);

app.get('/event/org/members/:eventId', controller.getEventMembers);
app.get('/event/timedate/:eventId', controller.getEventTimeDate);

app.listen(PORT, () => console.log(`Event microservice listening on port ${PORT}`));