/* eslint-disable camelcase */
'use strict';
const httpStatus = require('http-status');
const { User, Customer } = require('../models');
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

const getAnalytics = async (user) => {
	const query = [];
	if (user.role === 'user') {
		query.push({
			$match: {
				manager: { $eq: user._id }
			}
		});
	}
	query.push({ $group: { _id: '$stage', count: { $sum: 1 } } });
	const counts = await Customer.aggregate(query);
	let total = 0;
	const mappedCounts = {};
	counts.forEach((count) => {
		if (mappedCounts[count._id]) {
			mappedCounts[count._id] += count.count;
		} else {
			mappedCounts[count._id] = count.count;
		}
		total += count.count;
	});

	// const query2 = [];
	// if (user.role === 'user') {
	// 	query2.push({
	// 		$match: {
	// 			manager: { $eq: user._id }
	// 		}
	// 	});
	// }

	// const monthEnd = new Date();
	// var n = d.toISOString();

	// query2.push({
	// 	$match: {
	// 		manager: { $eq: user._id }
	// 	}
	// });
	// query2.push({ $group: { _id: '$stage', count: { $sum: 1 } } });

	const grp = await Customer.aggregate([
		{
			$group: {
				_id: { manager: '$manager', stage: '$stage' },
				stages: { $push: '$stage' },
				total: { $sum: 1 }
			}
		},
		{
			$group: {
				_id: { manager: '$_id.manager' },
				stage: { $addToSet: { stage: '$_id.stage', sum: '$total' } }
			}
		}
	]);

	// const grp = await Customer.aggregate([
	// 	{
	// 		$group: {
	// 			_id: { manager: '$manager', stage: '$stage' },
	// 			stages: { $push: '$stage' },
	// 			total: { $sum: 1 }
	// 		}
	// 	},
	// 	{
	// 		$group: {
	// 			_id: { manager: '$_id.manager' },
	// 			stage: { $addToSet: { stage: '$_id.stage', sum: '$total' } }
	// 		}
	// 	}
	// ]);
	return {
		totalCounts: { ...mappedCounts, total },
		monthlyCounts: {},
		yearlyCounts: grp
	};
};

const getUserData = async (id) => {
	const meetingData = await Customer.find(
		{
			manager: id,
			meetingLink: { $nin: [null, ''] }
		},
		{ meetingLink: 1, meetingStart: 1, _id: 0, name: 1 }
	)
		.sort({ meetingStart: 1 })
		.lean();
	return {
		meetingData,
		slotData: {}
	};
};

module.exports = {
	createUser,
	login,
	getAllUsers,
	saveUser,
	getAnalytics,
	getUserData
};
