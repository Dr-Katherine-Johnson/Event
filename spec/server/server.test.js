const _ = require('lodash');
const { expect } = require('chai');
const sinon = require('sinon');
require('sinon-mongoose');
const request = require('request');

const server = 'http://localhost:5000';
// TODO: this will probably need to change when benchmarking and stress testing the db ...
const MAX_NUMBER_OF_EVENTS = 100;

describe('Event API', () => {
  const randomEventId = Math.floor(Math.random() * 100);
  describe('GET /event/summary/:eventId', () => {
    const eventDataKeys = ['title', 'org_name', 'org_private'];
    const url = `${server}/event/summary/${randomEventId}`;
    test('Should return event data necessary to render the Event module: event title, name of the organization hosting it, and whether that organization is public or private', (done) => {
      request.get(url, (err, res, body) => {
        // make sure the resonse contains a status code and that it's 200 since it's successful
        expect(res.statusCode).to.equal(200);
        // the response should be JSON
        expect(res.headers['content-type']).to.contain('application/json');
        // convert the JSON response
        const parsedBody = JSON.parse(body);
        // should have the right key value pairs
        expect(parsedBody).to.include.all.keys(eventDataKeys);
        done();
      });
    });
    test('Values should be of the right type', (done) => {
      request.get(url, (err, res, body) => {
        const parsedBody = JSON.parse(body);
        const rightTypes = _.reduce(parsedBody, (acc, value, key) => {
          let rightType;
          if (key === 'org_private') {
            rightType = (typeof value === 'boolean');
          } else {
            rightType = (typeof value === 'string');
          }
          return acc && rightType;
        }, true);
        expect(rightTypes).to.equal(true);
        done();
      });
    });
  });

  describe('GET /event/:eventId', () => {
    const url = `${server}/event/${randomEventId}`;
    test('Should return the date and time as well as the summary of the event', (done) => {
      const eventDataKeys = ['title', 'local_date_time', 'org_name', 'org_private'];
      request.get(url, (err, res, body) => {
        // make sure the resonse contains a status code and that it's 200 since it's successful
        expect(res.statusCode).to.equal(200);
        // the response should be JSON
        expect(res.headers['content-type']).to.contain('application/json');
        // convert the JSON response
        const parsedBody = JSON.parse(body);
        expect(parsedBody).to.include.all.keys(eventDataKeys);
        done();
      });
    });
    test('Values of date and time should be of the right type in the response', (done) => {
      request.get(url, (err, res, body) => {
        const parsedBody = JSON.parse(body);
        expect(typeof parsedBody.local_date_time).to.equal('string');
        done();
      });
    });
  });

  describe('GET /event/org/members/:eventId', () => {
    const url = `${server}/event/org/members/${randomEventId}`;
    test('Should return the organization members and founders', (done) => {
      const memberDataKeys = ['founders', 'group_members'];
      request.get(url, (err, res, body) => {
        // make sure the resonse contains a status code and that it's 200 since it's successful
        expect(res.statusCode).to.equal(200);
        // the response should be JSON
        expect(res.headers['content-type']).to.contain('application/json');
        // convert the JSON response
        const parsedBody = JSON.parse(body);
        expect(parsedBody).to.include.all.keys(memberDataKeys);
        done();
      });
    });
    test('Values of founders and members should be of the right type in the response', (done) => {
      request.get(url, (err, res, body) => {
        const parsedBody = JSON.parse(body);
        expect(Array.isArray(parsedBody.founders)).to.equal(true);
        expect(Array.isArray(parsedBody.group_members)).to.equal(true);
        done();
      });
    });
  });

  // TODO: this is integration testing ... need to mock the db interactions to unit test the API routes
  describe('Integration tests', () => {
    const url = `${server}/event/${MAX_NUMBER_OF_EVENTS}`;

    let sample = {
      title: 'Testing API integration',
      local_date_time: new Date(),
      orgId: 'o10',
      series: {
        description: 'Every 2nd Sunday of the month until April 2020',
        frequency: {
          day_of_week: 'Monday',
          interval: 2,
        },
      },
    };
    let options = {
      url,
      body: sample,
      json: true
    }

    test('GET, POST, PUT, DELETE on /event/:eventId & GET on /event/timedate/:eventId', (done) => {

      // TODO: assert that the db has a certain number of documents to start

      // hit the endpoint with a POST
      request.post(options, (err, res, body) => {
        expect(res.statusCode).to.equal(200);

        sample = {
          title: 'Testing API integration',
          local_date_time: new Date(),
          orgId: 'o10',
          series: {
            description: 'This is a different description',
            frequency: {
              day_of_week: 'Friday',
              interval: 4,
            },
          },
        };
        options = {
          url,
          body: sample,
          json: true
        }

        // update the document we just created
        request.put(options, (err, res, body) => {
          expect(res.statusCode).to.equal(200);

          request.get({ url, json: true }, (err, res, body) => {
            expect(res.statusCode).to.equal(200);

            // expect to get back parts of the record we just updated
            expect(body.title).to.equal(sample.title);
            expect(new Date(body.local_date_time).toString()).to.equal(sample.local_date_time.toString());
            expect(body.orgId).to.equal(sample.orgId); // TODO: confirm that changing the GET /event/summary/:eventId to include the orgId doesn't break the UI

            // second GET request to a different endpoint to confirm parts of the document that the first endpoint did not return, were updated
            request.get({ url: `${server}/event/timedate/${MAX_NUMBER_OF_EVENTS}`, json: true }, (err, res, body) => {
              expect(res.statusCode).to.equal(200);

              // expect to get back parts of the updated record we just inserted
              expect(body.series.description).to.equal(sample.series.description);
              expect(body.series.frequency.day_of_week).to.equal(sample.series.frequency.day_of_week);
              expect(body.series.frequency.interval).to.equal(sample.series.frequency.interval);


              // remove the document inserted from this test
              request.delete(url, (err, res, body) => {
                expect(res.statusCode).to.equal(200);
                // TODO: assert that the db has the same number of documents it had before this test.
                done();
              });
            });
          })
        })
      })
    });
  });

  describe('Should throw an error', () => {
    const badEventId = 999;
    const endPoints = [`${server}/event/summary/${badEventId}`, `${server}/event/timedate/${badEventId}`, `${server}/event/org/members/${badEventId}`];
    describe('if the event doesn\'t exist', () => {
      test('on the Summary or Event endpoint', (done) => {
        request.get(endPoints[0], (err, res, body) => {
          expect(res.statusCode).to.equal(404);
          expect(res.headers['content-type']).to.contain('application/json');
          const parsedBody = JSON.parse(body);
          expect(parsedBody.status).to.equal('error');
          expect(parsedBody.message).to.equal('That event does not exist');
          done();
        });
      });
      test('on the timedate endpoint', (done) => {
        request.get(endPoints[1], (err, res, body) => {
          expect(res.statusCode).to.equal(404);
          expect(res.headers['content-type']).to.contain('application/json');
          const parsedBody = JSON.parse(body);
          expect(parsedBody.status).to.equal('error');
          expect(parsedBody.message).to.equal('That event does not exist');
          done();
        });
      });
      test('on the organization members endpoint', (done) => {
        request.get(endPoints[2], (err, res, body) => {
          expect(res.statusCode).to.equal(404);
          expect(res.headers['content-type']).to.contain('application/json');
          const parsedBody = JSON.parse(body);
          expect(parsedBody.status).to.equal('error');
          expect(parsedBody.message).to.equal('That event does not exist');
          done();
        });
      });
    });
  });

  // TODO: add mocks and tests for each of the routes 4 verbs
  describe('when stubbed', () => {
    beforeEach(() => {
      this.get = sinon.stub(request, 'get'); // TODO: what is this here??
    });

    // TODO: mock the db query(ies), so the endpoints are still hit, but the endpoint code is provided fake data from the db queries ... look into sinon and sinon-mongoose
    xtest('POST /event/summary/:eventId', () => {

    });
    xtest('PUT /event/summary/:eventId', () => {

    });
    xtest('DELETE /event/summary/:eventId', () => {

    });
    afterEach(() => {
      request.restore();
    });
    // test cases
  });
});
