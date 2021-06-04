'use strict';
const mongoose = require('mongoose');
const config = require('./config/config');
const logger = require('./config/logger');

// Exit application on error
mongoose.connect(config.mongoose.url, config.mongoose.options);
const conn = mongoose.connection;
conn.on('error', (err) => {
	logger.error(`MongoDB connection error: ${err}`);
	process.exit(-1);
});

conn.once('open', () => {
	logger.info('db connection success!');
});
