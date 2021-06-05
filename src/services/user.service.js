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
	let query = [];
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

	query = [];
	if (user.role === 'user') {
		query.push({
			$match: {
				manager: { $eq: user._id }
			}
		});
	}

	const yearStartDate = new Date();
	yearStartDate.setMonth(yearStartDate.getMonth() - 11);
	yearStartDate.setDate(1);
	yearStartDate.setHours(0);
	yearStartDate.setMinutes(0);
	yearStartDate.setSeconds(0);

	query.push({ $match: { createdAt: { $gt: yearStartDate } } });
	query.push({ $project: { createdAt: 1, _id: 0 } });
	query.push({ $sort: { createdAt: 1 } });

	const monthNames = [
		{ name: 'Jan', uv: 0 },
		{ name: 'Feb', uv: 0 },
		{ name: 'Mar', uv: 0 },
		{ name: 'Apr', uv: 0 },
		{ name: 'May', uv: 0 },
		{ name: 'Jun', uv: 0 },
		{ name: 'Jul', uv: 0 },
		{ name: 'Aug', uv: 0 },
		{ name: 'Sep', uv: 0 },
		{ name: 'Oct', uv: 0 },
		{ name: 'Nov', uv: 0 },
		{ name: 'Dec', uv: 0 }
	];

	const yearCounts = await Customer.aggregate(query);

	yearCounts.forEach((dataItem) => monthNames[new Date(dataItem.createdAt).getMonth()].uv++);
	const currMonth = new Date().getMonth();
	const yearlyCounts = [...monthNames.slice(currMonth + 1, 12), ...monthNames.slice(0, currMonth + 1)];

	query = [];
	if (user.role === 'user') {
		query.push({
			$match: {
				manager: { $eq: user._id }
			}
		});
	}

	let monthStartDate = new Date();
	monthStartDate.setMonth(monthStartDate.getMonth() - 1);
	monthStartDate.setHours(0);
	monthStartDate.setMinutes(0);
	monthStartDate.setSeconds(0);

	query.push({ $match: { createdAt: { $gt: monthStartDate } } });
	query.push({ $project: { createdAt: 1, _id: 0 } });
	query.push({ $sort: { createdAt: 1 } });

	const monthCounts = await Customer.aggregate(query);
	const currDate = `${new Date().getDate()}/${new Date().getMonth()}`;

	let nDate = `${monthStartDate.getDate()}/${monthStartDate.getMonth()}`;
	const dates = [];
	dates[nDate] = 0;
	do {
		monthStartDate = new Date(monthStartDate.getTime() + 86400000);
		nDate = `${monthStartDate.getDate()}/${monthStartDate.getMonth()}`;
		dates[nDate] = 0;
	} while (nDate !== currDate);

	monthCounts.forEach(
		(dataItem) => dates[`${new Date(dataItem.createdAt).getDate()}/${new Date(dataItem.createdAt).getMonth()}`]++
	);

	return {
		totalCounts: { ...mappedCounts, total },
		monthlyCounts: Object.keys(dates).map((key) => {
			return {
				name: key,
				uv: dates[key]
			};
		}),
		yearlyCounts
	};
};

const getUserData = async (user) => {
	let query = {
		meetingLink: { $nin: [null, ''] }
	};
	if (user.role === 'user') {
		query.manager = user._id;
	}
	const meetingData = await Customer.find(query, { meetingLink: 1, meetingStart: 1, _id: 0, name: 1 })
		.sort({ meetingStart: 1 })
		.lean();

	query = [];
	if (user.role === 'user') {
		query.push({
			$match: {
				manager: { $eq: user._id }
			}
		});
	}
	query.push({ $group: { _id: '$stage', count: { $sum: 1 } } });
	const counts = await Customer.aggregate(query);

	const slotData = {
		pending: 0,
		completed: 0,
		total: 0
	};
	counts.forEach((count) => {
		if (count._id === 'contacted' || count._id === 'unqualified') {
			slotData.completed += count.count;
		} else {
			slotData.pending += count.count;
		}
		slotData.total += count.count;
	});

	return {
		meetingData,
		slotData
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
