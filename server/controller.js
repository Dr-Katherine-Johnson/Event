const Event = require('../database/Event.js');
const Org = require('../database/Org.js');
const db = require('../database/index-mysql.js');

const utils = require('./utils');

const redis = require('redis');
const redisClient = redis.createClient();
redisClient.on('error', (error) => console.log(error));

const errorBody = {
  status: 'error',
  message: 'That event does not exist',
};

module.exports = {
  getEvent(req, res, next) {
    const args = [req.params.eventId];

    // look for this ID in redis
    redisClient.hgetall(`event:${args[0]}`, (error, response) => {
      if (error) { console.log(error); return res.status(500).send(); }

      // if it's there
      if (response) {
        // return data retrieved from redis
        res.status(200).send(response);
      } else {
        // get it from MySQL
        const statement = `SELECT event.id, event.title, event.local_date_time, event.org_id, org.org_name, org.org_private FROM event INNER JOIN org ON event.org_id=org.id WHERE event.id=?;`

        db.query(statement, args, (error, results) => {
          if (error) { console.log(error); return res.status(500).send(); }

          // the RowDataPacket object that comes back from MySQL will only ever be ONE LEVEL DEEP (ie, with NO NESTED objects or arrays, because it's coming back from a SQL database)
          // for that reason (ie, because we're guaranteed that each value will be a primitive - or convertible to a primitive in the case of DATE objects - ISO 8601 String) it's safe to for...in over the keys and store the values in a hash in redis, (without having to flatten the object)

          // update redis with the returned query
          redisClient.hmset(...[`event:${args[0]}`].concat(utils.forRedis(results[0])), (error, response) => {
            if (error) { console.log(error); return res.status(500).send(); }

            // send the returned query back to the client
            res.status(200).json(results[0]);
          });
        });
      }
    });
  },

  addEvent(req, res, next) {
    const { series } = req.body;
    const args = [series.frequency.day_of_week, series.frequency.interval, series.description]
    const seriesStatement = `SELECT * FROM series WHERE day_of_week=? AND series_interval=? AND series_description=?;`;
    db.query(seriesStatement, args, (error, results, fields) => {
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

  // TODO: add redis
  // TODO: refactor tests to use MySQL
  updateEvent(req, res, next) {
    const update = (updateSeries = false, updateEvent = false, req, series_id) => {
      let args = [];
      let pairs = [];

      // determine if I need to update any event fields
      if (req.body.title !== undefined || req.body.local_date_time !== undefined ) {
        updateEvent = true;
        if (req.body.title !== undefined) {
          pairs.push('title = ?');
          args.push(req.body.title);
          req.body.title = undefined;
        }

        if (req.body.local_date_time !== undefined) {
          pairs.push('local_date_time = ?');
          args.push(new Date(req.body.local_date_time));
          req.body.local_date_time = undefined;
        }

        args.push(req.params.eventId);
      } else {
        // determine if I need to update any series fields
        const series = req.body.series;
        if (series.description !== undefined) {
          pairs.push('series_description = ?');
          args.push(series.description);
          req.body.series.description = undefined;
        }

        if (series.frequency !== undefined) {
          if (series.frequency.day_of_week !== undefined) {
            pairs.push('day_of_week = ?');
            args.push(series.frequency.day_of_week);
            req.body.series.frequency.day_of_week = undefined;
          }

          if (series.frequency.interval !== undefined) {
            pairs.push('series_interval = ?');
            args.push(series.frequency.interval);
            req.body.series.frequency.interval = undefined;
          }
        }

        if (args.length !== 0) {
          updateSeries = true;
          args.push(series_id);
        }
      }

      // base case
      if (!updateSeries && !updateEvent) { return res.status(200).send(); }

      // prepare and make the query
      let table = '';
      if (updateSeries) { table = 'series'; }
      if (updateEvent) { table = 'event'; }

      statement = `UPDATE ${table} SET ${pairs.join(', ')}  where id=?;`;
      db.query(statement, args, (error, results, fields) => {
        if (error) { console.log(error); return res.status(500).send(); }

        // remove the outdated event from redis
        // TODO: is there a better approach here? perhaps updating the redis cache with the values that got changed?
        redisClient.del(`event:${req.params.eventId}`, (error, result) => {
          if (error) { console.log(error); return res.status(500).send(); }

          // make additional queries, if any
          update(table === 'series' ? false : updateSeries, table === 'event' ? false : updateEvent, req, series_id);
        });

      });
    };

    // get the current foreign key for the relevant row in the series table
    let statement = 'SELECT * FROM event WHERE id=?';
    let args = [req.params.eventId];

    db.query(statement, args, (error, results, fields) => {
      if (error) { console.log(error); return res.status(500).send(); }
      // recurse, and run necessary queries
      update(false, false, req, results[0].series_id);
    });
  },

  // TODO: refactor tests to us MySQL
  deleteEvent(req, res, next) {
    const statement = `DELETE FROM event WHERE id=?`;
    const args = [req.params.eventId];

    db.query(statement, args, (error, results, fields) => {
      if (error) { return res.status(500).send(error); }
      res.status(200).send(results);
    });
  },

  // TODO: refactor to use MySQL along with tests
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

  // TODO: refactor to use MySQL along with tests
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

  // TODO: refactor to use MySQL along with tests
  checkEventId(req, res, next) {
    if (!Number.isFinite(Number(req.params.eventId))) {
      throw new Error('The eventId route parameter must be a number. Please check the API section of the README');
    } else {
      next();
    }
  },
}