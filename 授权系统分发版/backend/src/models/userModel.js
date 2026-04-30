const db = require('../config/db');

class UserModel {
    static async findByEmail(email) {
        const [rows] = await db.query(
            `SELECT u.*, qb.qq_number, qb.qq_notification_enabled, qb.qq_notification_group_id, 
                    qb.qq_notify_message, qb.qq_notify_follow_update, qb.qq_notify_follow_new, qb.qq_message_delivery
             FROM users u
             LEFT JOIN qq_bindings qb ON qb.user_id = u.id
             WHERE u.email = ?`, [email]);
        return rows[0];
    }

    static async findByUsername(username) {
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT u.*, qb.qq_number, qb.qq_notification_enabled, qb.qq_notification_group_id, 
                    qb.qq_notify_message, qb.qq_notify_follow_update, qb.qq_notify_follow_new, qb.qq_message_delivery
             FROM users u
             LEFT JOIN qq_bindings qb ON qb.user_id = u.id
             WHERE u.id = ?`, [id]);
        return rows[0];
    }

    static async findByQQ(qqNumber) {
        const [rows] = await db.query(
            `SELECT u.id, u.username, u.email, u.role, qb.qq_number, qb.qq_notification_enabled, 
                    qb.qq_notification_group_id, qb.qq_notify_message, qb.qq_notify_follow_update, qb.qq_notify_follow_new, qb.qq_message_delivery
             FROM qq_bindings qb
             JOIN users u ON u.id = qb.user_id
             WHERE qb.qq_number = ?`, [qqNumber]);
        return rows[0];
    }

    static async create(user) {
        const { username, email, password_hash, role = 'user' } = user;
        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, password_hash, role]
        );
        return result.insertId;
    }

    static async updateQQNotificationSettings(userId, settings) {
        const { qq_notification_enabled, qq_notification_group_id, qq_notify_message, qq_notify_follow_update, qq_notify_follow_new, qq_message_delivery } = settings;
        const [existing] = await db.query('SELECT id FROM qq_bindings WHERE user_id = ?', [userId]);
        if (existing.length > 0) {
            await db.query(
                `UPDATE qq_bindings SET 
                    qq_notification_enabled = COALESCE(?, qq_notification_enabled),
                    qq_notification_group_id = ?,
                    qq_notify_message = COALESCE(?, qq_notify_message),
                    qq_notify_follow_update = COALESCE(?, qq_notify_follow_update),
                    qq_notify_follow_new = COALESCE(?, qq_notify_follow_new),
                    qq_message_delivery = COALESCE(?, qq_message_delivery)
                 WHERE user_id = ?`,
                [qq_notification_enabled, qq_notification_group_id, qq_notify_message, qq_notify_follow_update, qq_notify_follow_new, qq_message_delivery, userId]
            );
        }
    }

    static async createQQNotification(userId, qqNumber, groupId, notificationType, message) {
        const [result] = await db.query(
            'INSERT INTO qq_notifications (user_id, qq_number, group_id, notification_type, message) VALUES (?, ?, ?, ?, ?)',
            [userId, qqNumber, groupId, notificationType, message]
        );
        return result.insertId;
    }

    static async getPendingQQNotifications(limit = 50) {
        const [rows] = await db.query(
            'SELECT * FROM qq_notifications WHERE status = ? ORDER BY created_at ASC LIMIT ?', ['pending', limit]
        );
        return rows;
    }

    static async markQQNotificationsSent(notificationIds) {
        if (!notificationIds || notificationIds.length === 0) return;
        await db.query(
            'UPDATE qq_notifications SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE id IN (?)',
            ['sent', notificationIds]
        );
    }
}

module.exports = UserModel;
