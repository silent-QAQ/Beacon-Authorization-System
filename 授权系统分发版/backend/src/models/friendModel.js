const db = require('../config/db');

class FriendModel {
    static async isFriend(userId, friendId) {
        const [rows] = await db.query(
            'SELECT * FROM friends WHERE user_id = ? AND friend_id = ?',
            [userId, friendId]
        );
        return !!rows[0];
    }

    static async sendMessage(fromUserId, toUserId, content, source = 'web', relayStatus = 'none') {
        const [result] = await db.query(
            'INSERT INTO friend_messages (from_user_id, to_user_id, content, source, relay_status) VALUES (?, ?, ?, ?, ?)',
            [fromUserId, toUserId, content, source, relayStatus]
        );
        return result.insertId;
    }
}

module.exports = FriendModel;
