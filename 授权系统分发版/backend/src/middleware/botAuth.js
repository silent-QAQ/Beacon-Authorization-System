const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const botAuth = (req, res, next) => {
    const apiKey = req.headers['x-bot-api-key'];
    if (!apiKey || apiKey !== process.env.BOT_API_KEY) {
        return res.status(401).json({ success: false, message: 'Invalid bot API key' });
    }
    next();
};

module.exports = botAuth;
