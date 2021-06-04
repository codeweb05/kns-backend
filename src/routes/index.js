'use strict';
const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const customerRoute = require('./customer.route');
const router = express.Router();

router.use('/auth', authRoute);
router.use('/user', userRoute);
router.use('/customer', customerRoute);

module.exports = router;
