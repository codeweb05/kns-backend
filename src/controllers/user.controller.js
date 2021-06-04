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
	res.status(httpStatus.OK).json({ ...rest, isGoogleLogin: !!refresh_token });
};

const saveUser = async (req, res) => {
	await userService.saveUser(req.body, req.user._id);
	res.status(httpStatus.CREATED).json({ message: 'success' });
};

module.exports = {
	getAllUsers,
	getUser,
	saveUser
};
