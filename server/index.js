const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

const controller = require('./controller.js');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

const errorBody = {
  status: 'error',
  message: 'That event does not exist',
};

app.get('/event(/summary)?/:eventId', controller.getEventSummary);
app.get('/event/org/members/:eventId', controller.getEventMembers);
app.get('/event/timedate/:eventId', controller.getEventTimeDate);

app.listen(PORT, () => {
  console.log(`Event module listening on port ${PORT}`);
});
