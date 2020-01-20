const _ = require('lodash');
const chai = require('chai');
const sinonChai = require('sinon-chai');
const sinon = require('sinon');
require('sinon-mongoose');
const controller = require('../../server/controller.js');
const { mockReq, mockRes } = require('sinon-express-mock');
const Event = require('../../database/Event.js');
const Org = require('../../database/Org.js');

chai.use(sinonChai); // TODO: change from using Sinon's assertion style

// TODO: this will probably need to change when benchmarking and stress testing the db ...
const MAX_NUMBER_OF_EVENTS = 100;
let sampleReq = {
  params: {
    eventId: MAX_NUMBER_OF_EVENTS
  }
}

let eventMock;
let orgMock;
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
  beforeEach(() => {
    eventMock = sinon.mock(Event);
    orgMock = sinon.mock(Org);
  });
  afterEach(() => {
    eventMock.restore();
    orgMock.restore();
  })

  describe('getEventTimeDate', () => {
    test('calls the mongoose findOne() method', () => {
      const mockedFindOne = eventMock.expects('findOne');
      mockedFindOne.returns(Promise.resolve(returnedEvent));
      mockedFindOne.withExactArgs({ eventId: MAX_NUMBER_OF_EVENTS });
      const req = mockReq(sampleReq);
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

      const req = mockReq(sampleReq);
      const res = mockRes();
      controller.deleteEventAndOrSummary(req, res, null)
      mockedDeleteOne.verify();
    });
  });

  describe('updateEventAndOrSummary', () => {
    test('calls the mongoose findOneAndUpdate method', () => {
      const mockedFindOneAndUpdate = eventMock.expects('findOneAndUpdate');
      mockedFindOneAndUpdate.returns(Promise.resolve('a value'));
      mockedFindOneAndUpdate.withArgs({ eventId: MAX_NUMBER_OF_EVENTS });

      const req = mockReq(sampleReq);
      const res = mockRes();
      controller.updateEventAndOrSummary(req, res, null)
      mockedFindOneAndUpdate.verify();
    });

    // TODO: should probably add other tests that verify the arguments to findOneAndUpdate change depending on the req object
  });

  describe('addEventAndOrSummary', () => {
    test('calls the mongoose create method with the correct arguments', () => {
      const mockedCreate = eventMock.expects('create');
      mockedCreate.returns(Promise.resolve());
      mockedCreate.withArgs(Object.assign({}, { eventId: MAX_NUMBER_OF_EVENTS }, returnedEvent));
      const req = mockReq(Object.assign({}, { params: { eventId: MAX_NUMBER_OF_EVENTS }}, { body: returnedEvent }));
      const res = mockRes();
      controller.addEventAndOrSummary(req, res, null)
      mockedCreate.verify();
    });
  });

  describe('getEventAndOrSummary', () => {
    test('calls the mongoose findOne method on both the Event & Org models', () => {
      const mockedOrgFindOne = orgMock.expects('findOne');
      mockedOrgFindOne.returns(Promise.resolve({ org_name: "", org_private: true, orgId: 'o10'}));
      mockedOrgFindOne.once();

      const mockedEventFindOne = eventMock.expects('findOne');
      mockedEventFindOne.returns(Promise.resolve(returnedEvent));
      mockedEventFindOne.withArgs({ eventId: MAX_NUMBER_OF_EVENTS });
      mockedEventFindOne.once();
      const req = mockReq(sampleReq);
      const response = {
        status: () => { return response },
        json: () => {
          mockedOrgFindOne.verify(); // this feels hacky ...
        }
      };
      const res = mockRes(response);
      controller.getEventAndOrSummary(req, res, null);
      mockedEventFindOne.verify();
    });
  });
});