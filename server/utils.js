module.exports = {
/**
 *
 * Designed to transform the RowDataPackets returned from MySQL into arrays of key, value pairs that can be stored in Redis
 * @param {*} RowDataPacket (ie, an object with only primitive values)
 * @returns Array of the key value pairs
 */
// TODO: add tests
forRedis: function(obj) {
  const result = [];
  for (let key in obj) {
    result.push(key);
    if (key === 'local_date_time') {
      result.push(obj[key].toISOString());
    } else {
      result.push(obj[key]);
    }
  }
  return result;
}
}