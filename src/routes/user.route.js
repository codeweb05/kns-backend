'use strict';

const express = require('express');
const { auth } = require('../middlewares');
const { userController } = require('../controllers');

const router = express.Router();

router.get('/', auth(), userController.getUser);
router.post('/', auth(), userController.saveUser);
router.get('/all', auth('manageUsers'), userController.getAllUsers);

module.exports = router;
