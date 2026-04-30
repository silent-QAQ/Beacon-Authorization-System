const express = require('express');
const router = express.Router();
const botAuth = require('../middleware/botAuth');
const {
    botGrant,
    botRevoke,
    botMyAuth,
    botMyAuthCodes,
    botGetPendingRelay,
    botRelayDelivered,
    botRelayMsg,
    botGetPendingNotifications,
    botMarkNotificationsSent
} = require('../controllers/botController');

router.post('/grant', botAuth, botGrant);
router.post('/revoke', botAuth, botRevoke);
router.post('/my-auth', botAuth, botMyAuth);
router.post('/my-auth-codes', botAuth, botMyAuthCodes);
router.get('/pending-relay', botAuth, botGetPendingRelay);
router.post('/relay-delivered', botAuth, botRelayDelivered);
router.post('/relay-msg', botAuth, botRelayMsg);
router.get('/pending-notifications', botAuth, botGetPendingNotifications);
router.post('/notifications-sent', botAuth, botMarkNotificationsSent);

module.exports = router;
