'use strict';
const Joi = require('@hapi/joi');

const register = {
	body: Joi.object().keys({
		email: Joi.string().trim().required().email(),
		firstName: Joi.string().trim().required(),
		lastName: Joi.string().trim().required(),
		contactNumber: Joi.string().trim().required(),
		password: Joi.string().trim().required().min(8),
		city: Joi.string().trim(),
		country: Joi.string().trim(),
		userName: Joi.string().trim().required(),
		address: Joi.string().trim(),
		state: Joi.string().trim()
	})
};

const login = {
	body: Joi.object().keys({
		email: Joi.string().required().trim().email(),
		password: Joi.string().required().trim().min(8)
	})
};

module.exports = {
	register,
	login
};
