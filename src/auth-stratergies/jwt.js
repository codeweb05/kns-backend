'use strict';
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('../config/config');
const { User } = require('../models');

module.exports = function (passport) {
	const strategyOptions = {
		secretOrKey: config.jwt.secret,
		jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
	};

	const jwtVerify = async (payload, done) => {
		try {
			const user = await User.findById(payload.userId);
			if (!user) {
				return done(null, false);
			}
			done(null, user);
		} catch (error) {
			done(error, false);
		}
	};

	const jwtStrategy = new JwtStrategy(strategyOptions, jwtVerify);
	passport.use('jwt', jwtStrategy);
};
