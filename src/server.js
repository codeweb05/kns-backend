'use strict';
const http = require('http');
const app = require('./app');
const server = http.createServer(app);
const config = require('./config/config');
const logger = require('./config/logger');
require('./database');

server.listen(config.port, () => {
	logger.info(`Listening to port ${config.port}`);
});
