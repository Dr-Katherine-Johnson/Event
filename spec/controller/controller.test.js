const _ = require('lodash');
const chai = require('chai');
const sinon = require('sinon');
require('sinon-mongoose');
const controller = require('../../server/controller.js');
const { mockReq, mockRes } = require('sinon-express-mock');
const Event = require('../../database/Event.js');
const Org = require('../../database/Org.js');
const db = require('../../database/index-mysql');

const expect = chai.expect;

// TODO: decide on using either stubs or mocks for each describe bloc, not both ...


// TODO: refactor to make this test suite DRYer
// TODO: this will need to change when benchmarking and stress testing the db
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
let dbMock;
const sampleEvent = {
  title: 'Controller unit tests',
  local_date_time: new Date(),
  orgId: 1,
  series: {
    description: 'Every 1st Saturday of the month until May 2020',
    frequency: {
      day_of_week: 'Saturday',
      interval: 1,
    },
  },
};

describe.only('controller', () => {
  beforeEach(() => {
    // dbMock = sinon.mock(db);
  });
  afterEach(() => {
    // dbMock.restore();
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
      mockedFindOne.returns(Promise.resolve(sampleEvent));
      mockedFindOne.withExactArgs({ eventId: MAX_NUMBER_OF_EVENTS });
      const req = mockReq(sampleReq);
      const res = mockRes();
      controller.getEventTimeDate(req, res, null);
      mockedFindOne.verify();
    });

    test('calls res.json with correct error body if the database does not have an event with that eventId', () => {
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

    test('sends a 500 error back to the client when there\'s a db error', () => {
      mockedFindOneAndUpdate.returns(Promise.reject());
      const req = mockReq(sampleReq);
      const res = mockRes();
      const statusSpy = sinon.spy(res.status);
      const sendSpy = sinon.spy(res.send);
      controller.updateEvent(req, res, null);
      statusSpy.calledOnceWithExactly(500)
      sendSpy.calledOnceWithExactly();
      mockedFindOneAndUpdate.verify();
    });

    // TODO: should probably add other tests that verify the arguments to findOneAndUpdate change depending on the req object
  });

  describe('addEvent', () => {
    let mockedDbQuery = null;
    beforeEach(() => {
      // dbMock = sinon.mock(db);
      // mockedDbQuery = dbMock.expects('query');
    });
    afterEach(() => {
      // dbMock.restore();
      // mockedDbQuery = null;
    })

    test('Correctly queries for the series_id', () => {
      dbMock = sinon.mock(db);
      mockedDbQuery = dbMock.expects('query');

      // assert that mockedDbQuery is called with the correct arguments
      const seriesStatement = `SELECT * FROM series WHERE day_of_week=? AND series_interval=? AND series_description=?;`;
      const req = mockReq(Object.assign({}, { params: { eventId: MAX_NUMBER_OF_EVENTS }}, { body: sampleEvent })); // TODO: this params is not required here, but it does keep the tests consistent with each other ...
      const res = mockRes();

      const seriesArgs = [sampleEvent.series.frequency.day_of_week, sampleEvent.series.frequency.interval, sampleEvent.series.description]
      mockedDbQuery.once();
      mockedDbQuery.withArgs(seriesStatement, seriesArgs);

      controller.addEvent(req, res, null);
      mockedDbQuery.verify();

      dbMock.restore();
      mockedDbQuery = null;
    });

    test('Calls the INSERT query with the correct arguments', () => {
      const stub = sinon.stub(db, 'query');

      const statement = `INSERT INTO event (title, local_date_time, org_id, series_id) VALUES (?, ?, ?, ?);`;
      const req = mockReq(Object.assign({}, { params: { eventId: MAX_NUMBER_OF_EVENTS }}, { body: sampleEvent })); // TODO: this params is not required here, but it does keep the tests consistent with each other ...
      const res = mockRes();

      expect(stub.notCalled).to.be.true;
      // call the first query's cb with specific arguments, through Sinon
      stub.yieldsRight(null, [{id: 1}]);
      controller.addEvent(req, res, null);

      // then assert that the stub's second call was called with the correct arguments
      const args = [sampleEvent.title, sampleEvent.local_date_time, sampleEvent.orgId, 1]
      stub.getCall(1).calledWithExactly(statement, args);
      expect(stub.calledTwice).to.be.true;

      const statusSpy = sinon.spy(res.status);
      const sendSpy = sinon.spy(res.send);
      statusSpy.calledOnceWithExactly(200);
      sendSpy.calledOnceWithExactly();

      stub.restore();
    });

    test('sends a 500 error back to the client when the first query errors', () => {
      const stub = sinon.stub(db, 'query');
      stub.yieldsRight(new Error());

      const req = mockReq(Object.assign({}, { params: { eventId: MAX_NUMBER_OF_EVENTS }}, { body: sampleEvent })); // TODO: this params is not required here, but it does keep the tests consistent with each other ...
      const res = mockRes();

      const statusSpy = sinon.spy(res.status);
      const sendSpy = sinon.spy(res.send);
      controller.addEvent(req, res, null);
      statusSpy.calledOnceWithExactly(500);
      sendSpy.calledOnceWithExactly();

      stub.restore();
    });

    test('sends a 500 error back to the client when the second query errors', () => {
      const stub = sinon.stub(db, 'query');

      stub.onCall(0).yieldsRight(null, [{id: 1}]);
      stub.onCall(1).yieldsRight(new Error());

      const req = mockReq(Object.assign({}, { params: { eventId: MAX_NUMBER_OF_EVENTS }}, { body: sampleEvent })); // TODO: this params is not required here, but it does keep the tests consistent with each other ...
      const res = mockRes();

      const statusSpy = sinon.spy(res.status);
      const sendSpy = sinon.spy(res.send);
      controller.addEvent(req, res, null);
      statusSpy.calledOnceWithExactly(500);
      sendSpy.calledOnceWithExactly();

      stub.restore();
    });
  });

  describe('getEvent', () => {
    let mockedDbQuery = null;
    beforeEach(() => {
      dbMock = sinon.mock(db);
      mockedDbQuery = dbMock.expects('query');
    });
    afterEach(() => {
      mockedDbQuery = null;
      dbMock.restore();
    })

    test('calls the db.query method with the correct arguments', () => {
      // mock the db.query method, and assert that it was called with the correct statement & args
      const statement = `SELECT event.id, event.title, event.local_date_time, event.org_id, org.org_name, org.org_private FROM event INNER JOIN org ON event.org_id=org.id WHERE event.id=?;`
      const req = mockReq(sampleReq);
      const response = {
        status: () => { return response },
        json: () => {
          mockedDbQuery.verify(); // this feels hacky ...
        }
      };
      const res = mockRes(response);
      const args = [req.params.eventId];
      mockedDbQuery.once();
      mockedDbQuery.withArgs(statement, args);

      mockedDbQuery.yields(null, ['results']);
      controller.getEvent(req, res, null);
    });

    test('sends a 500 error back to the client when there\'s a db error', () => {
      mockedDbQuery.yields(new Error());
      const req = mockReq(sampleReq);
      const res = mockRes();
      const statusSpy = sinon.spy(res.status);
      const sendSpy = sinon.spy(res.send);
      controller.getEvent(req, res, null);
      statusSpy.calledOnceWithExactly(500);
      sendSpy.calledOnceWithExactly();
      mockedDbQuery.verify();
    });
  });

  describe('', () => {
    test('', () => {

    });
  });


  describe.only('spies', () => {
    test('withArgs', () => {
      const object = { method: function(arg) { console.log('called! with ' + arg); }};
      const spy = sinon.spy(object, 'method');

      object.method(42);
      object.method(1);

      console.log(spy.callCount);

      const fortyTwoSpy = spy.withArgs(42);
      expect(fortyTwoSpy.calledOnce).to.be.true;
      expect(spy.withArgs(1).calledOnce).to.be.true;
      expect(spy.calledTwice).to.be.true;
      object.method(42)
      expect(fortyTwoSpy.calledTwice).to.be.true;
      expect(spy.withArgs(1).calledOnce).to.be.true;
      expect(spy.calledThrice).to.be.true;
      console.log(spy.callCount);


      expect(spy.notCalled).to.be.false;

      expect(spy.calledWith(42)).to.be.true;
      expect(spy.calledWith(1)).to.be.true;
      expect(spy.calledWith(56)).to.be.false;

      expect(spy.calledWithExactly(42)).to.be.true;
      expect(spy.calledWithExactly(1)).to.be.true;

      expect(spy.neverCalledWith(56)).to.be.true;

      expect(spy.threw()).to.be.false;

      const spyCalls = spy.getCalls();
      expect(spyCalls).to.have.lengthOf(3);

      const spyExceptions = spy.exceptions;
      console.log(spyExceptions);
    });
  });
});