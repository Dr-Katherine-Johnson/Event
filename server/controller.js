const Event = require('../database/Event.js');
const Org = require('../database/Org.js');

const errorBody = {
  status: 'error',
  message: 'That event does not exist',
};

module.exports = {
  getEvent(req, res, next) {
    const eventData = {
      org_private: false,
    };
    return Event.findOne({ eventId: req.params.eventId })
      .then((event) => {
        if (event === null) {
          res.status(404).json(errorBody);
        } else {
          eventData.title = event.title;
          eventData.local_date_time = event.local_date_time;
          return Org.findOne({ orgId: event.orgId }, 'org_name org_private')
            .then((org) => {
              eventData.org_name = org.org_name;
              eventData.org_private = org.org_private;
              eventData.orgId = event.orgId;
              res.status(200).json(eventData);
            });
        }
      })
      .catch(err => {
        console.log(err);
        res.send(err);
      })
  },

  addEvent(req, res, next) {
    const eventData = {
      eventId: req.params.eventId,
      title: req.body.title,
      local_date_time: req.body.local_date_time,
      orgId: req.body.orgId,
      series: req.body.series // TODO: what happens if series is not provided??
    }

    Event.create(eventData)
      .then(results => {
        res.status(200).json(results);
      })
      .catch(err => {
        console.log(err);

        res.status(400).send(err);
      })
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
        res.status(400).send(err);
      })
  },

  deleteEvent(req, res, next) {
    Event.deleteOne({ eventId: req.params.eventId })
      .then(results => {
        res.status(200).json(results);
      })
      .catch(err => {
        console.log(err);
        res.status(400).send(err);
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
  }
}