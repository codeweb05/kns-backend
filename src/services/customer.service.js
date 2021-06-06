'use strict';
const httpStatus = require('http-status');
const { Customer, User } = require('../models');
const ApiError = require('../utils/apiError');
const { uuid } = require('uuidv4');
const config = require('../config/config');

const { google } = require('googleapis');
// Require oAuth2 from our google instance.
const { OAuth2 } = google.auth;

const createCustomer = async (params, id) => {
	if (await Customer.exists({ email: params.email })) {
		throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
	}
	if (params.manager) {
		const manager = await User.findOne({ email: params.manager });
		if (!manager) {
			throw new ApiError(httpStatus.BAD_REQUEST, "manager doesn't exist");
		} else {
			params.manager = manager._id;
		}
	} else {
		params.manager = id;
	}
	return await Customer.create({ ...params });
};

const getCustomers = async (query, user) => {
	const searchText = query.searchText;
	const page = query.page;
	const limit = query.limit;
	const startingIndex = (page - 1) * limit;
	const endingIndex = page * limit;
	const queryDB = { email: { $regex: '.*' + searchText + '.*' } };
	if (query.isDashboard) {
		queryDB.createdAt = { $gt: Date.now() - 86400000 * 14 };
	}
	if (user.role === 'user') {
		queryDB.manager = user._id;
	}
	const customers = await Customer.find(queryDB).populate('manager').lean();
	const total = customers.length;
	const customerList = customers
		.slice(startingIndex, endingIndex)
		.map(({ __v, updatedAt, createdAt, manager, ...rest }) => {
			return { ...rest, manager: `${manager.firstName} ${manager.lastName}` };
		});
	return { customerList, total };
};

const updateCustomer = async ({ stage, email }) => {
	return await Customer.findOneAndUpdate({ email }, { stage });
};

const getManagerData = async () => {
	return await User.find({}, { email: 1, _id: 0 });
};

const bookMeeting = async ({ time, customerId }, user) => {
	const customer = await Customer.findOne({ _id: customerId }).lean();

	// Create a new instance of oAuth and set our Client ID & Client Secret.
	const oAuth2Client = new OAuth2(config.google.clientId, config.google.secret);

	oAuth2Client.setCredentials({
		refresh_token: user.refresh_token
	});

	// Create a new calender instance.
	const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

	// Create a new event start date instance for temp uses in our calendar.
	const eventStartTime = new Date(time);

	// Create a new event end date instance for temp uses in our calendar.
	const eventEndTime = new Date(time);
	eventEndTime.setMinutes(eventEndTime.getMinutes() + 30);

	const event = {
		summary: 'Meeting with David',
		location: '3595 California St, San Francisco, CA 94118',
		description:
			'Meet with David to talk about the new client project and how to integrate the calendar for booking.',
		colorId: 1,
		start: {
			dateTime: eventStartTime,
			timeZone: 'America/Denver'
		},
		end: {
			dateTime: eventEndTime,
			timeZone: 'America/Denver'
		},
		attendees: [{ email: customer.email }],
		conferenceData: {
			createRequest: {
				conferenceSolutionKey: {
					type: 'hangoutsMeet'
				},
				requestId: uuid()
			}
		}
	};

	// Check if we a busy and have an event on our calendar for the same time.
	const calnderRes = await calendar.freebusy.query({
		resource: {
			timeMin: eventStartTime,
			timeMax: eventEndTime,
			timeZone: 'America/Denver',
			items: [{ id: 'primary' }]
		}
	});

	// Create an array of all events on our calendar during that time.
	const eventArr = calnderRes.data.calendars.primary.busy;

	// Check if event array is empty which means we are not busy
	// If we are not busy create a new calendar event.
	if (eventArr.length === 0) {
		const calenderInsertRes = await calendar.events.insert({
			calendarId: 'primary',
			resource: event,
			sendUpdates: 'all',
			conferenceDataVersion: 1
		});

		return await Customer.findOneAndUpdate(
			{ _id: customerId },
			{
				meetingLink: calenderInsertRes.data.hangoutLink,
				meetingStart: calenderInsertRes.data.start.dateTime
			}
		);
	}

	// If event array is not empty log that we are busy.
	throw new ApiError(httpStatus.BAD_REQUEST, "Sorry I'm busy...");
};

module.exports = {
	createCustomer,
	getCustomers,
	updateCustomer,
	bookMeeting,
	getManagerData
};
