const host = 'ec2-18-209-1-80.compute-1.amazonaws.com' || 'localhost';

import { check, sleep } from 'k6';
import http from 'k6/http';

const desiredRPS = 30000;
const RPSperVU = 20;
const VUsRequired = Math.round(desiredRPS/RPSperVU);

const sleepTime = 0.05;
export let options = {
  vus: VUsRequired,
  // duration: '600s'
  duration: '7200s'
}

// let counter = 600000;

export default function() {
  // const event_id = Math.floor(Math.random() * 1000000) + 9000000;
  let event_id;
  do {
    event_id = Math.floor(Math.random() * 1000000);
  } while (event_id === 0)

  // if (counter > 1300000) { counter = 600000; }
  const url = `http://${host}:80/event/${event_id}`;
  let res = http.get(url);
  // ++counter;

  check(res, {
    "is status 200": (r) => r.status === 200
  });

  sleep(sleepTime);
};