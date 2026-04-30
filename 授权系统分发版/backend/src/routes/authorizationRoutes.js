const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getMyAuthorizations,
    grantAuthorization,
    revokeAuthorization,
    verifyLicense,
    unbindEndpoint
} = require('../controllers/authorizationController');

router.get('/my', protect, getMyAuthorizations);
router.post('/grant', protect, grantAuthorization);
router.delete('/:id', protect, revokeAuthorization);
router.post('/verify', verifyLicense);
router.post('/unbind', protect, unbindEndpoint);

module.exports = router;
