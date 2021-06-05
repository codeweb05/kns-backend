/* eslint-disable camelcase */
'use strict';
const httpStatus = require('http-status');
const { userService } = require('../services');

const getAllUsers = async (req, res) => {
	const users = await userService.getAllUsers(req.query);
	res.status(httpStatus.OK).json(users);
};

const getUser = async (req, res) => {
	const { __v, updatedAt, createdAt, role, refresh_token, ...rest } = JSON.parse(JSON.stringify(req.user));
	const user = { ...rest, isGoogleLogin: !!refresh_token };
	const userData = await userService.getUserData(req.user);
	res.status(httpStatus.OK).json({ user, ...userData });
};

const saveUser = async (req, res) => {
	await userService.saveUser(req.body, req.user._id);
	res.status(httpStatus.CREATED).json({ message: 'success' });
};

const getAnalytics = async (req, res) => {
	const analytics = await userService.getAnalytics(req.user);
	res.status(httpStatus.OK).json(analytics);
};

module.exports = {
	getAllUsers,
	getUser,
	saveUser,
	getAnalytics
};
