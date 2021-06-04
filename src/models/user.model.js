'use strict';
const mongoose = require('mongoose');
const { roles } = require('../config/roles');
const config = require('../config/config');
const bycrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const toJSON = require('../plugins/toJSON');
const moment = require('moment');

const UserSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
			trim: true
		},
		lastName: {
			type: String,
			required: true,
			trim: true
		},
		contactNumber: {
			type: String,
			required: true,
			trim: true
		},
		email: {
			type: String,
			unique: true,
			required: true,
			trim: true,
			lowercase: true
		},
		password: {
			type: String,
			required: true,
			trim: true,
			minLength: 8
		},
		role: {
			type: String,
			enum: roles,
			default: 'user'
		},
		city: {
			type: String,
			trim: true
		},
		address: {
			type: String,
			trim: true
		},
		state: {
			type: String,
			trim: true
		},
		country: {
			type: String,
			trim: true
		},
		userName: {
			type: String,
			trim: true,
			unique: true
		},
		refresh_token: {
			type: String
		},
		refresh_token_expire: {
			type: Date
		},
		profile_photo_url: {
			type: String
		},
		tokens: [
			{
				token: {
					type: String,
					required: true
				}
			}
		]
	},
	{
		timestamps: true
	}
);

UserSchema.statics.findByCredentials = async (email, password) => {
	let user = await User.findOne({ email });

	if (!user) {
		user = await User.findOne({ userName: email });
	}

	if (!user) {
		throw new Error('Invalid email or username');
	}

	const isMatch = await bycrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error('Invalid email or username');
	}

	return user;
};

UserSchema.methods.toJSON = function () {
	const user = this;
	const userObject = user.toObject();

	delete userObject.password;
	delete userObject.tokens;

	return userObject;
};

UserSchema.methods.generateToken = async function () {
	const user = this;
	const token = jwt.sign({ _id: user._id.toString() }, config.jwt.secret);

	user.tokens = user.tokens.concat({ token });
	await user.save();
	return token;
};

UserSchema.pre('save', async function (next) {
	const user = this;

	if (user.isModified('password')) {
		user.password = await bycrypt.hash(user.password, 8);
	}
	user.updated_at = moment();
	next();
});

// add plugin that converts mongoose to json
UserSchema.plugin(toJSON);

const User = mongoose.model('User', UserSchema);
module.exports = User;
