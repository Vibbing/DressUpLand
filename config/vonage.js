const vonage = require('@vonage/server-sdk')


const vonageApiKey = '79903602';
const vonageApiSecret = 'EZhUZUEi3vQrVNMQ';

const vonageClient = new vonage({
  apiKey: vonageApiKey,
  apiSecret: vonageApiSecret
});

module.exports = vonageClient;
