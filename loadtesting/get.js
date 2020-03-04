import { check, sleep } from 'k6';
import http from 'k6/http';

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
  let res = http.get(url);

  check(res, {
    "is status 200": (r) => r.status === 200
  });

  sleep(sleepTime);
};