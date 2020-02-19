import { check } from 'k6';
import http from 'k6/http';

const desiredRPS = 50000;
const RPSperVU = 250;
const VUsRequired = Math.round(desiredRPS/RPSperVU);

export let options = {
  vus: VUsRequired,
  duration: '2s'
}

export default function() {
  const event_id = Math.floor(Math.random() * 100);

  let res = http.get(`http://localhost:5000/?event_id=${event_id}`);
  check(res, {
    "is status 200": (r) => r.status === 200
  });
};