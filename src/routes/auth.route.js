'use strict';
const express = require('express');

const { catchAsync } = require('../utils');
const { validate, auth } = require('../middlewares');
const { authValidation } = require('../validations');
const { authController } = require('../controllers');

const router = express.Router();

router.post('/register', validate(authValidation.register), catchAsync(authController.register));
router.post('/login', validate(authValidation.login), catchAsync(authController.login));
router.post('/logout', auth(), catchAsync(authController.logout));

module.exports = router;
