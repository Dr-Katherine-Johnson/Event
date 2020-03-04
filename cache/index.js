const config = require('config');
const redisConfig = config.get('cache.redisConfig');

const redis = require('redis');
const redisClient = redis.createClient(redisConfig);
redisClient.on('error', (error) => console.log(error));

module.exports = redisClient;