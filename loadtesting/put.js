import { sleep, check } from 'k6';
import http from 'k6/http';
// used browserify with the standalone option to generate a Universal Module Definition bundle (which I'm calling fakerbundle.js). The k6 import statement can then access it (it's not a Node.js import statement)
// https://docs.k6.io/docs/modules#section-npm-modules
import faker from '../fakerbundle.js';
// import faker from 'cdnjs.com/libraries/Faker'; // alternatively, getting the bundle from a cdn also works


const desiredRPS = 30000;
const RPSperVU = 20;
const VUsRequired = Math.round(desiredRPS/RPSperVU);

const sleepTime = 0.05;
export let options = {
  vus: VUsRequired,
  duration: '600s'
}

export default function() {
  const event_id = Math.floor(Math.random() * 1000000) + 9000000;
  const url = `http://localhost:5000/event/${event_id}`;
  const params = { headers: { "Content-Type": "application/json" }}

  let payload = {
    title: faker.name.firstName(),
    local_date_time: (new Date()).toISOString(),
    series: {
      frequency: {
        day_of_week: faker.date.weekday(),
        interval: Math.floor(Math.random() * 4) + 1
      },
      description: faker.lorem.sentence()
    }
  };

  payload = JSON.stringify(payload);
  let res = http.put(url, payload, params);

  check(res, {
    "is status 200": (r) => r.status === 200
  });

  sleep(sleepTime);
}