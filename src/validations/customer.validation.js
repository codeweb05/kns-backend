'use strict';
const Joi = require('@hapi/joi');
const { objectId } = require('./custom.validation');

const createCustomer = {
	body: Joi.object().keys({
		manager: Joi.string().trim().allow(''),
		name: Joi.string().required().trim(),
		contactNumber: Joi.string().trim(),
		email: Joi.string().required().trim().email(),
		stage: Joi.string().trim().required().valid('interested', 'contacted', 'demo', 'qualified', 'unqualified'),
		source: Joi.string().trim().required().valid('KNS Ojas', 'KNS Nester', 'KNS Ethos')
	})
};

const booking = {
	body: Joi.object().keys({
		customerId: Joi.string().required().custom(objectId),
		time: Joi.date().timestamp().required()
	})
};

module.exports = {
	createCustomer,
	booking
};
