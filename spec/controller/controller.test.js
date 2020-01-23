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
const expect = chai.expect;

// TODO: this will probably need to change when benchmarking and stress testing the db ...
const MAX_NUMBER_OF_EVENTS = 100;
let sampleReq = {
  params: {
    eventId: MAX_NUMBER_OF_EVENTS
  }
}

const errorBody = {
  status: 'error',
  message: 'That event does not exist',
};

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

  describe('checkEventId', () => {
    test('calls the next middleware when eventId is a number', () => {
      const nextSpy = sinon.spy();
      const goodFn = () => controller.checkEventId(sampleReq, {}, nextSpy);
      expect(goodFn).to.not.throw();
      expect(nextSpy.calledOnce).to.be.true;
    });

    test('throws an error when eventId is NOT a number', () => {
      ['salmon', '', -0.12, Infinity, NaN, true, false, undefined, null, {}, []].forEach(badEventId => {
        const nextSpy = sinon.spy();
        const badFn = () => controller.checkEventId(badEventId, {}, nextSpy);
        expect(badFn).to.throw();
        expect(nextSpy.notCalled).to.be.true;
      });
    });
  });

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

    test.only('calls res.json with correct error body if the database does not have an event with that eventId', () => {
      const mockedFindOne = eventMock.expects('findOne');
      mockedFindOne.returns(Promise.resolve(null));
      mockedFindOne.withExactArgs({ eventId: 101 });
      const req = mockReq({ params: { eventId: 101 }});
      const res = mockRes();
      const jsonSpy = sinon.spy(res.json);
      controller.getEventTimeDate(req, res, null);
      jsonSpy.calledOnceWithExactly(errorBody);
      mockedFindOne.verify();
    });
  });

  // TODO: add at least one non-happy-path test for each route
  describe('getEventMembers', () => {
    // TODO: implement test
  });

  describe('deleteEvent', () => {
    test('calls the mongoose deleteOne method', () => {
      const mockedDeleteOne = eventMock.expects('deleteOne');
      mockedDeleteOne.returns(Promise.resolve('a value'));
      mockedDeleteOne.withExactArgs({ eventId: MAX_NUMBER_OF_EVENTS });

      const req = mockReq(sampleReq);
      const res = mockRes();
      controller.deleteEvent(req, res, null)
      mockedDeleteOne.verify();
    });

    test('sends a 500 error back to the client when there\'s a db error', () => {
      const mockedDeleteOne = eventMock.expects('deleteOne');
      mockedDeleteOne.returns(Promise.reject());
      const req = mockReq(sampleReq);
      const res = mockRes();
      const sendSpy = sinon.spy(res.send);
      sendSpy.calledOnceWithExactly();
      const statusSpy = sinon.spy(res.status);
      statusSpy.calledOnceWithExactly(500);
      controller.deleteEvent(req, res, null);
      mockedDeleteOne.verify();
    });
  });

  describe('updateEvent', () => {
    let mockedFindOneAndUpdate = null;
    beforeEach(() => {
      mockedFindOneAndUpdate = eventMock.expects('findOneAndUpdate');
    });
    afterEach(() => {
      mockedFindOneAndUpdate = null;
    })

    test('calls the mongoose findOneAndUpdate method', () => {
      mockedFindOneAndUpdate.returns(Promise.resolve('a value'));
      mockedFindOneAndUpdate.withArgs({ eventId: MAX_NUMBER_OF_EVENTS });

      const req = mockReq(sampleReq);
      const res = mockRes();
      controller.updateEvent(req, res, null)
      mockedFindOneAndUpdate.verify();
    });

    test('', () => {
      mockedFindOneAndUpdate.returns(Promise.reject());
      const req = mockReq(sampleReq);
      const res = mockRes();
      statusSpy = sinon.spy(res.status);
      sendSpy = sinon.spy(res.send);
      controller.updateEvent(req, res, null);
      statusSpy.calledOnceWithExactly(500)
      sendSpy.calledOnceWithExactly();
      mockedFindOneAndUpdate.verify();
    });

    // TODO: should probably add other tests that verify the arguments to findOneAndUpdate change depending on the req object
  });

  // TODO: add at least one non-happy-path test for each route
  describe('addEvent', () => {
    test('calls the mongoose create method with the correct arguments', () => {
      const mockedCreate = eventMock.expects('create');
      mockedCreate.returns(Promise.resolve());
      mockedCreate.withArgs(Object.assign({}, { eventId: MAX_NUMBER_OF_EVENTS }, returnedEvent));
      const req = mockReq(Object.assign({}, { params: { eventId: MAX_NUMBER_OF_EVENTS }}, { body: returnedEvent }));
      const res = mockRes();
      controller.addEvent(req, res, null)
      mockedCreate.verify();
    });
  });

  // TODO: add at least one non-happy-path test for each route
  describe('getEvent', () => {
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
      controller.getEvent(req, res, null);
      mockedEventFindOne.verify();
    });
  });
});