const express = require('express');
const router = express.Router();
const { recordClick, getStats } = require('../controllers/promotionController');

router.post('/click', recordClick);
router.get('/stats', getStats);

module.exports = router;
