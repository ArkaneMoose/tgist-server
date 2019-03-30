const express = require('express');
const request = require('request');
const package = require('../package.json');
const router = express.Router();

const SPEECH_SUBSCRIPTION_KEY = '***REMOVED***';
const SPEECH_TOKEN_ENDPOINT = 'https://eastus.api.cognitive.microsoft.com/sts/v1.0/issuetoken';

router.get('/version', (req, res, next) => {
  res.send({ 'version': package.version });
});

router.get('/speechtoken', (req, res, next) => {
  request.post({
    url: SPEECH_TOKEN_ENDPOINT,
    json: true,
    body: {},
    headers: { 'Ocp-Apim-Subscription-Key': SPEECH_SUBSCRIPTION_KEY },
  }).pipe(res);
});

module.exports = router;
