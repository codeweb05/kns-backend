/* eslint-disable camelcase */
'use strict';
const httpStatus = require('http-status');
const { User } = require('../models');
const bycrypt = require('bcryptjs');
const ApiError = require('../utils/apiError');

const createUser = async (params) => {
	if (await User.exists({ email: params.email })) {
		throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
	}
	if (params.userName) {
		if (await User.exists({ userName: params.userName })) {
			throw new ApiError(httpStatus.BAD_REQUEST, 'User Name already taken');
		}
	}
	return await User.create({ ...params });
};

const login = async ({ email, password }) => {
	const user = await User.findByCredentials(email, password);
	const { __v, updatedAt, createdAt, role, refresh_token, ...rest } = JSON.parse(JSON.stringify(user));
	const token = await user.generateToken();
	return { token, ...rest, isAdmin: role === 'admin', isGoogleLogin: !!refresh_token };
};

const getAllUsers = async (query) => {
	const searchText = query.searchText;
	const page = query.page;
	const limit = query.limit;
	const startingIndex = (page - 1) * limit;
	const endingIndex = page * limit;
	const users = await User.find({ email: { $regex: '.*' + searchText + '.*' } }).lean();
	const total = users.length;
	const userList = users
		.slice(startingIndex, endingIndex)
		.map(({ __v, updatedAt, createdAt, role, tokens, password, refresh_token, ...rest }) => {
			return {
				...rest,
				isGoogleLogin: !!refresh_token
			};
		});
	return { userList, total };
};

const saveUser = async (data, _id) => {
	if (data.password) {
		data.password = await bycrypt.hash(data.password, 8);
	} else {
		delete data.password;
	}
	return await User.findOneAndUpdate({ _id }, { ...data });
};

module.exports = {
	createUser,
	login,
	getAllUsers,
	saveUser
};
