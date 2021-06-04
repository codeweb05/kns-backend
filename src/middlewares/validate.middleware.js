'use strict';
const Joi = require('@hapi/joi');
const httpStatus = require('http-status');
const { pick, ApiError } = require('../utils');

const validate = (schema) => (req, res, next) => {
	const validSchema = pick(schema, ['params', 'query', 'body']);
	const object = pick(req, Object.keys(validSchema));
	const { value, error } = Joi.compile(validSchema)
		.prefs({ errors: { label: 'key' } })
		.validate(object);

	if (error) {
		const errorMessage = error.details.map((details) => details.message).join(', ');
		return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
	}
	Object.assign(req, value);
	return next();
};

module.exports = validate;
