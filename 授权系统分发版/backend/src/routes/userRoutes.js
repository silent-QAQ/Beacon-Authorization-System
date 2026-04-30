const express = require('express');
const router = express.Router();
const {
  getMe,
  bindQQ,
  unbindQQ,
  updateQQNotificationSettings,
  getQQGroups,
  sendVerificationCode,
  updatePassword,
  updateProfile
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, getMe);
router.put('/me/profile', protect, updateProfile);
router.post('/me/password/code', protect, sendVerificationCode);
router.put('/me/password', protect, updatePassword);
router.put('/me/qq', protect, bindQQ);
router.delete('/me/qq', protect, unbindQQ);
router.put('/me/qq-notifications', protect, updateQQNotificationSettings);
router.get('/me/qq-groups', protect, getQQGroups);

module.exports = router;
