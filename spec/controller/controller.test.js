const _ = require('lodash');
const chai = require('chai');
const { expect } = chai;
const sinonChai = require('sinon-chai');
const sinon = require('sinon');
require('sinon-mongoose');
const controller = require('../../server/controller.js');
const { mockReq, mockRes } = require('sinon-express-mock');
const Event = require('../../database/Event.js');

chai.use(sinonChai);

// TODO: this will probably need to change when benchmarking and stress testing the db ...
const MAX_NUMBER_OF_EVENTS = 100;

const params = {
  params: {
    eventId: 100
  }
}

let eventMock;
const returnedEvent = {
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

describe('controller', () => {
  beforeEach(() => { eventMock = sinon.mock(Event); });
  afterEach(() => { eventMock.restore(); })

  describe('getEventTimeDate', () => {
    test('calls the mongoose findOne() method', () => {
      const mockedFindOne = eventMock.expects('findOne');
      mockedFindOne.returns(Promise.resolve(returnedEvent));
      mockedFindOne.withExactArgs({ eventId: MAX_NUMBER_OF_EVENTS })

      const req = mockReq(params);
      const res = mockRes();
      controller.getEventTimeDate(req, res, null);
      mockedFindOne.verify();
    });
  });

  describe('getEventMembers', () => {
    // TODO: implement test
  });

  describe('deleteEventAndOrSummary', () => {
    test('calls the mongoose deleteOne method', () => {
      const mockedDeleteOne = eventMock.expects('deleteOne');
      mockedDeleteOne.returns(Promise.resolve('a value'));
      mockedDeleteOne.withExactArgs({ eventId: MAX_NUMBER_OF_EVENTS });

      const req = mockReq(params);
      const res = mockRes();
      controller.deleteEventAndOrSummary(req, res, null)
      mockedDeleteOne.verify();
    });
  });

  describe('UpdateEventAndOrSummary', () => {
    test('calls the mongoose deleteOne method', () => {
      const mockedDeleteOne = eventMock.expects('deleteOne');
      mockedDeleteOne.returns(Promise.resolve('a value'));
      mockedDeleteOne.withExactArgs({ eventId: MAX_NUMBER_OF_EVENTS });

      const req = mockReq(params);
      const res = mockRes();
      controller.deleteEventAndOrSummary(req, res, null)
      mockedDeleteOne.verify();
    });
  });
});


describe('API routes', () => {
  const randomEventId = Math.floor(Math.random() * 100);
  // TODO: add mocks and tests for each of the routes 4 verbs

  // unit tests for the API routes would be something like
    // mock the mongoose db queries
    // call each method in the controller
    // asserting that certain mongoose queries were called with certain parameters (behavior verification instead of state verification)
    // I could also do additional state verification if the response from the mongoose query is significantly different from what the API route sends back ...

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
