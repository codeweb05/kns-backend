'use strict';
const Joi = require('@hapi/joi');
// const { objectId } = require('./custom.validation');

const createCustomer = {
	body: Joi.object().keys({
		manager: Joi.string().trim().allow(''),
		name: Joi.string().required().trim(),
		contactNumber: Joi.string().trim(),
		email: Joi.string().required().trim().email(),
		stage: Joi.string().trim().required().valid('inserted', 'contacted', 'demo', 'qualified', 'unqualified'),
		source: Joi.string().trim().required().valid('KNS Ojas', 'KNS Nester', 'KNS Ethos')
	})
};

module.exports = {
	createCustomer
};
