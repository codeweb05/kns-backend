'use strict';
const httpStatus = require('http-status');
const querystring = require('querystring');
const { customerService } = require('../services');
const config = require('../config/config');
const { User } = require('../models');
const jwt = require('jsonwebtoken');

const createCustomer = async (req, res) => {
	await customerService.createCustomer(req.body, req.user._id);
	res.status(httpStatus.CREATED).json({ message: 'success' });
};

const getCustomers = async (req, res) => {
	const customers = await customerService.getCustomers(req.query, req.user);
	res.status(httpStatus.OK).json(customers);
};

const updateCustomer = async (req, res) => {
	await customerService.updateCustomer(req.body);
	res.status(httpStatus.OK).json({ message: 'success' });
};

const bookMeeting = async (req, res) => {
	await customerService.bookMeeting(req.body, req.user);
	res.status(httpStatus.OK).json({ message: 'success' });
};

const getManagerData = async (req, res) => {
	const managerData = await customerService.getManagerData(req.body, req.user);
	res.status(httpStatus.OK).json(managerData);
};

const bookFirstMeeting = async (req, res) => {
	const token = req.header('Authorization').replace('Bearer ', '');
	const decoded = jwt.verify(token, config.jwt.secret);
	const user = await User.findOne({
		_id: decoded._id,
		'tokens.token': token
	});
	user.refresh_token = req.user;
	user.save();
	await customerService.bookMeeting(JSON.parse(req.query.state), user);
	res.status(httpStatus.OK).json({ message: 'success' });
};

const generateUrl = async (req, res) => {
	const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
	const options = {
		redirect_uri: config.google.callbackUrl,
		client_id: config.google.clientId,
		access_type: 'offline',
		state: JSON.stringify(req.body),
		response_type: 'code',
		prompt: 'consent',
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email',
			'https://www.googleapis.com/auth/calendar',
			'https://www.googleapis.com/auth/calendar.events'
		].join(' ')
	};
	res.status(httpStatus.OK).json({ url: `${rootUrl}?${querystring.stringify(options)}` });
};

module.exports = {
	createCustomer,
	getCustomers,
	updateCustomer,
	bookMeeting,
	bookFirstMeeting,
	generateUrl,
	getManagerData
};
