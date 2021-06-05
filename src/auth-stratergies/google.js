'use strict';
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const config = require('../config/config');
const { User } = require('../models');
const httpStatus = require('http-status');
const ApiError = require('../utils/apiError');

module.exports = function (passport) {
	const strategyOptions = {
		clientID: config.google.clientId,
		clientSecret: config.google.secret,
		callbackURL: config.google.callbackUrl
	};
	const verifyCallback = async (accessToken, refreshToken, profile, done) => {
		const email = profile.emails[0].value;
		const user = await User.findOne({ email });
		if (user) {
			done(null, refreshToken);
		} else {
			done(new ApiError(httpStatus.BAD_REQUEST, 'Please use same account'), null);
		}
	};
	passport.use(new GoogleStrategy(strategyOptions, verifyCallback));
};
