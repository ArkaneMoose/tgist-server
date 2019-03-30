const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();
const server = http.createServer(app);
require('express-ws')(app, server);

const apiRouter = require('./routes/api');
const wsRouter = require('./routes/ws');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', apiRouter);
app.use('/ws', wsRouter);

module.exports = { app, server };
