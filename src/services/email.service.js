'use strict';
const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
	transport
		.verify()
		.then(() => logger.info('Connected to email server'))
		.catch(() =>
			logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env')
		);
}

const sendMail = async (options) => {
	const msg = { from: config.email.from, ...options };
	await transport.sendMail(msg);
};

module.exports = {
	sendMail
};
