const express = require('express');
const router = express.Router();
const { protect, superadmin } = require('../middleware/authMiddleware');
const botAuth = require('../middleware/botAuth');
const {
    getConfig,
    updateConfig,
    getBotConfig,
} = require('../controllers/botManagementController');

router.get('/bot-config', botAuth, getBotConfig);
router.get('/config', protect, superadmin, getConfig);
router.put('/config', protect, superadmin, updateConfig);

module.exports = router;
