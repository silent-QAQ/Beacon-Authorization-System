const db = require('../config/db');

class VerificationCodeModel {
    static async create(email, code, type = 'register', expiresInMinutes = 10) {
        const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
        const [result] = await db.query(
            'INSERT INTO verification_codes (email, code, type, expires_at) VALUES (?, ?, ?, ?)',
            [email, code, type, expiresAt]
        );
        return result.insertId;
    }

    static async verify(email, code, type = 'register') {
        const [rows] = await db.query(
            'SELECT * FROM verification_codes WHERE email = ? AND code = ? AND type = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, code, type]
        );
        return rows.length > 0;
    }

    static async deleteByEmail(email, type = 'register') {
        await db.query('DELETE FROM verification_codes WHERE email = ? AND type = ?', [email, type]);
    }
}

module.exports = VerificationCodeModel;
