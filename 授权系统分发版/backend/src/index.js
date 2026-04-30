const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const authorizationRoutes = require('./routes/authorizationRoutes');
const botRoutes = require('./routes/botRoutes');
const botManagementRoutes = require('./routes/botManagementRoutes');
const promotionRoutes = require('./routes/promotionRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/authorizations', authorizationRoutes);
app.use('/api/bot', botRoutes);
app.use('/api/bot-management', botManagementRoutes);
app.use('/api/promotions', promotionRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Beacon Auth API' });
});

const server = app.listen(PORT, () => {
    console.log(`[Beacon Auth] Server running on port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
