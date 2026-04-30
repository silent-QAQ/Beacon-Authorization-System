const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, sendVerificationCode } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/send-code', sendVerificationCode);
router.get('/profile', protect, getMe);

module.exports = router;
