const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			trim: true
		},
		contactNumber: {
			type: String
		},
		manager: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
			required: true
		},
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			unique: true
		},
		stage: {
			type: String,
			enum: ['interested', 'contacted', 'demo', 'qualified', 'unqualified'],
			default: 'demo',
			required: true
		},
		source: {
			type: String,
			enum: ['KNS Ojas', 'KNS Nester', 'KNS Ethos'],
			required: true
		},
		meetingLink: {
			type: String
		},
		meetingStart: {
			type: Date
		}
	},
	{
		timestamps: true
	}
);

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;
