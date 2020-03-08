// TODO automate CircleCI build and deployment to AWS

// TODO: add .env package to read these from the .env file into the webpack bundle
const eventAPI = 'http://localhost:5000/event/';
const rsvpAPI = 'http://localhost:3001/rsvp/';

// Given the address to the api endpoint and '/eventId' fetches data for that specific event
const fetchEventDataFromAPI = (API, eventId, endpoint) => {
  const address = endpoint ? `${API}${endpoint}/${eventId}` : `${API}${eventId}`;
  return fetch(address)
    .then((response) => response.json())
    .then((data) => data);
};

// const fetchAllEventData = (eventId) => (
//   Promise.all([
//     fetchEventDataFromAPI(eventAPI, eventId),
//     fetchEventDataFromAPI(rsvpAPI, eventId, 'hosts'),
//   ]).then(([event, hosts]) => {
//     return { event, hosts };
//   }));

// TODO: for load testing this component in isolation
const fetchAllEventData = (eventId) => (
  Promise.all([
    fetchEventDataFromAPI(eventAPI, eventId),
    // fetchEventDataFromAPI(rsvpAPI, eventId, 'hosts'),
  ]).then(([event]) => {
    return { event };
  }));

export default fetchAllEventData;
