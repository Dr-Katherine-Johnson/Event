const Event = require('../database/Event.js');
const Org = require('../database/Org.js');
const db = require('../database/index-mysql.js');

const errorBody = {
  status: 'error',
  message: 'That event does not exist',
};

module.exports = {
  getEvent(req, res, next) {
    // MySQL version
    const statement = `SELECT event.id, event.title, event.local_date_time, event.org_id, org.org_name, org.org_private FROM event INNER JOIN org ON event.org_id=org.id WHERE event.id=?;`
    const args = [req.params.eventId];
    db.query(statement, args, (error, results, fields) => {
      if (error) {
        return res.status(500).send();
      }
      res.status(200).json(results[0]);
    });
  },

  addEvent(req, res, next) {
    const { series } = req.body;
    const seriesArgs = [series.frequency.day_of_week, series.frequency.interval, series.description]
    const seriesStatement = `SELECT * FROM series WHERE day_of_week=? AND series_interval=? AND series_description=?;`;
    db.query(seriesStatement, seriesArgs, (error, results, fields) => {
      if (error) { return res.status(500).send(error); }
      const { title, local_date_time, orgId } = req.body;
      const args = [title, new Date(local_date_time), orgId, results[0].id]
      const statement = `INSERT INTO event (title, local_date_time, org_id, series_id) VALUES (?, ?, ?, ?);`
      db.query(statement, args, (error, results, fields) => {
        if (error) { return res.status(500).send(error); }
        res.status(200).send();
      });
    });
  },

  updateEvent(req, res, next) {
    let eventData = {
      title: req.body.title,
      local_date_time: req.body.local_date_time,
      orgId: req.body.orgId,
    }

    // necessary to set fields in embedded documents in Mongo
    // https://docs.mongodb.com/manual/reference/operator/update/set/#set-fields-in-embedded-documents
    let dayOfWeek = {};
    let interval = {};
    let description = {};
    if (req.body.series) {
      description = { 'series.description': req.body.series.description }

      if (req.body.series.frequency) {
        dayOfWeek = { 'series.frequency.day_of_week': req.body.series.frequency.day_of_week }
        interval = { 'series.frequency.interval': req.body.series.frequency.interval }
      }
    }
    eventData = Object.assign({}, eventData, dayOfWeek, interval, description);

    Event.findOneAndUpdate({ eventId: req.params.eventId }, eventData, { omitUndefined: true })
      .then(results => {
        res.status(200).json(results);
      })
      .catch(err => {
        console.log(err);
        res.status(500).send();
      })
  },

  deleteEvent(req, res, next) {
    Event.deleteOne({ eventId: req.params.eventId })
      .then(results => {
        res.status(200).json(results);
      })
      .catch(err => {
        console.log(err);
        res.status(500).send();
      })
  },

  getEventMembers(req, res, next) {
    Event.findOne({ eventId: req.params.eventId })
      .then((event) => {
        if (event === null) {
          res.status(404).json(errorBody);
        } else {
          return Org.findOne({ orgId: event.orgId }, 'members')
            .then((org) => {
              res.status(200).json(org.members);
            });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(400).send(err);
      })
  },

  getEventTimeDate(req, res, next) {
    Event.findOne({ eventId: req.params.eventId })
      .then((event) => {
        if (event !== null) {
          const timedate = {
            local_date_time: event.local_date_time,
            description: event.series.description ? event.series.description : '',
            series: event.series ? event.series : ''
          };
          res.status(200).json(timedate);
        } else {
          res.status(404).json(errorBody);
        }
      })
      .catch(err => {
        console.log(err);
        res.status(400).send(err);
      })
  },

  checkEventId(req, res, next) {
    if (!Number.isFinite(Number(req.params.eventId))) {
      throw new Error('The eventId route parameter must be a number. Please check the API section of the README');
    } else {
      next();
    }
  }
}