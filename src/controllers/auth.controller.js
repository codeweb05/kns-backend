'use strict';
const httpStatus = require('http-status');
const { userService } = require('../services');

const register = async (req, res) => {
	// const { email } = req.body;
	await userService.createUser(req.body);
	// await emailService.sendMail({
	// 	to: email,
	// 	subject: 'credentials',
	// 	text: 'cred'
	// });
	res.status(httpStatus.CREATED).json({ message: 'Check your inbox' });
};

const login = async (req, res) => {
	const data = await userService.login(req.body);
	res.json(data);
};

const logout = async (req, res) => {
	const userToken = req.header('Authorization').replace('Bearer ', '');
	req.user.tokens = req.user.tokens.filter((token) => {
		return token.token !== userToken;
	});
	await req.user.save();
	res.send();
};

module.exports = {
	register,
	login,
	logout
};
