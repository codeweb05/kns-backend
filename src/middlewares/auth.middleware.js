'use strict';
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');
const config = require('../config/config');
const { User } = require('../models');
const jwt = require('jsonwebtoken');

const auth =
	(...requiredRights) =>
		async (req, res, next) => {
			try {
				if (!req.header('Authorization')) {
					throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
				}
				const token = req.header('Authorization').replace('Bearer ', '');
				const decoded = jwt.verify(token, config.jwt.secret);

				const user = await User.findOne({
					_id: decoded._id,
					'tokens.token': token
				});
				if (!user) {
					throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
				}

				if (requiredRights.length) {
					const userRights = roleRights.get(user.role);
					const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
					if (!hasRequiredRights) {
						throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
					}
				}
				req.user = user;
				next();
			} catch (e) {
				next(e);
			}
		};

module.exports = auth;
