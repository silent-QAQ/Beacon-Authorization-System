const db = require('../config/db');

class QQBingModel {
    static async findByQQ(qqNumber) {
        const [rows] = await db.query('SELECT * FROM qq_bindings WHERE qq_number = ?', [qqNumber]);
        return rows[0];
    }

    static async findByUserId(userId) {
        const [rows] = await db.query('SELECT * FROM qq_bindings WHERE user_id = ?', [userId]);
        return rows[0];
    }

    static async create(qqNumber, userId) {
        await db.query('DELETE FROM qq_bindings WHERE qq_number = ? OR user_id = ?', [qqNumber, userId]);
        const [result] = await db.query('INSERT INTO qq_bindings (qq_number, user_id) VALUES (?, ?)', [qqNumber, userId]);
        return result.insertId;
    }

    static async delete(qqNumber) {
        await db.query('DELETE FROM qq_bindings WHERE qq_number = ?', [qqNumber]);
    }

    static async deleteByUserId(userId) {
        await db.query('DELETE FROM qq_bindings WHERE user_id = ?', [userId]);
    }
}

module.exports = QQBingModel;
