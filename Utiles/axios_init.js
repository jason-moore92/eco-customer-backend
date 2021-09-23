
const axios = require('axios')
const http = require('http');
const https = require('https');


const instance = axios.create({
    httpAgent: new http.Agent(),
    httpsAgent: new https.Agent(),
});

module.exports = instance;