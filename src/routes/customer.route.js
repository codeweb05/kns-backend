'use strict';
const express = require('express');
const { catchAsync } = require('../utils');
const passport = require('passport');
const { validate, auth } = require('../middlewares');
const { customerValidation } = require('../validations');
const { customerController } = require('../controllers');

const router = express.Router();

router.post('/', auth(), validate(customerValidation.createCustomer), catchAsync(customerController.createCustomer));

router.post('/update', auth(), catchAsync(customerController.updateCustomer));

router.get(
	'/google/callback',
	passport.authenticate('google', {
		session: false
	}),
	catchAsync(customerController.bookFirstMeeting)
);
router.post('/google', catchAsync(customerController.generateUrl));

router.post('/book', auth(), catchAsync(customerController.bookMeeting));

router.get('/manager', auth(), catchAsync(customerController.getManagerData));
router.get('/', auth(), catchAsync(customerController.getCustomers));

module.exports = router;
