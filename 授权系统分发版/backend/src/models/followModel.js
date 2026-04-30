const db = require('../config/db');

class FollowModel {
    static async getFollowers(targetType, targetId) {
        const [rows] = await db.query(
            `SELECT f.*, u.username, u.email, u.role, qb.qq_number
             FROM follows f
             JOIN users u ON u.id = f.user_id
             LEFT JOIN qq_bindings qb ON qb.user_id = u.id
             WHERE f.target_type = ? AND f.target_id = ?
             ORDER BY f.created_at DESC`,
            [targetType, targetId]
        );
        return rows;
    }
}

module.exports = FollowModel;
