const Events = require('../database/Event.js');
const Orgs = require('../database/Org.js');

const errorBody = {
  status: 'error',
  message: 'That event does not exist',
};

module.exports = {
  getEventSummary(req, res, next) {
    const eventData = {
      title: '',
      org_name: '',
      org_private: false,
    };
    return Events.findOne({ eventId: req.params.eventId })
      .then((event) => {
        if (event === null) {
          res.status(404).json(errorBody);
        } else {
          eventData.title = event.title;
          // if the request is not for summary add date and time
          if (!/summary/.test(req.url)) {
            eventData.local_date_time = event.local_date_time;
          }
          return Orgs.findOne({ orgId: event.orgId }, 'org_name org_private')
            .then((org) => {
              eventData.org_name = org.org_name;
              eventData.org_private = org.org_private;
              res.status(200).json(eventData);
            });
        }
      });
  },

  getEventMembers(req, res, next) {
    Events.findOne({ eventId: req.params.eventId })
      .then((event) => {
        if (event === null) {
          res.status(404).json(errorBody);
        } else {
          return Orgs.findOne({ orgId: event.orgId }, 'members')
            .then((org) => {
              res.status(200).json(org.members);
            });
        }
      })
  },

  getEventTimeDate(req, res, next) {
    Events.findOne({ eventId: req.params.eventId })
      .then((event) => {
        if (event !== null) {
          const timedate = {
            local_date_time: event.local_date_time,
            description: event.series.description ? event.series.description : '',
          };
          res.status(200).json(timedate);
        } else {
          res.status(404).json(errorBody);
        }
      })
  }
}