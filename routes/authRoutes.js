const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

// These handlers must be functions
router.post('/signup', registerUser);
router.post('/login', loginUser);

module.exports = router;
