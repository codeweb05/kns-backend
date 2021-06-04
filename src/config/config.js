'use strict';
const dotenv = require('dotenv');
const path = require('path');
const Joi = require('@hapi/joi');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const envVarsSchema = Joi.object()
	.keys({
		NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
		PORT: Joi.number().default(3000),
		MONGODB_URL: Joi.string().required().description('Mongo DB url'),
		GOOGLE_CLIENT_ID: Joi.string().required().description('Google client id'),
		GOOGLE_SECRET: Joi.string().required().description('Google secret'),
		GOOGLE_CALLBACK_URL: Joi.string().required().description('Google callback url'),
		JWT_SECRET: Joi.string().required().description('JWT secret key')
	})
	.unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
	throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
	env: envVars.NODE_ENV,
	port: envVars.PORT,
	mongoose: {
		url: envVars.NODE_ENV === 'test' ? 'mongodb://localhost/chatter' : envVars.MONGODB_URL,
		options: {
			useCreateIndex: true,
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false
		}
	},
	google: {
		clientId: envVars.GOOGLE_CLIENT_ID,
		secret: envVars.GOOGLE_SECRET,
		callbackUrl: envVars.GOOGLE_CALLBACK_URL
	},
	whitelist: null,
	jwt: {
		secret: envVars.JWT_SECRET,
		accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
		refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
		resetPasswordExpirationMinutes: 10
	},
	appOrigin: envVars.APP_ORIGIN,
	appSecret: envVars.APP_SECRET,
	email: {
		smtp: {
			service: envVars.SMTP_SERVICE,
			port: envVars.SMTP_PORT,
			secure: false,
			auth: {
				user: envVars.SMTP_USERNAME,
				pass: envVars.SMTP_PASSWORD
			}
		},
		from: envVars.EMAIL_FROM
	}
};
