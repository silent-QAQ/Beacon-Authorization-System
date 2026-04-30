const db = require('../config/db');
const crypto = require('crypto');

class AuthorizationModel {
    static generateAuthCode() {
        return 'BC-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    }

    static async create(auth) {
        const { user_id, plugin_id, ip_limit = 1, port_limit = 1, expires_at = null } = auth;
        const authCode = AuthorizationModel.generateAuthCode();
        const [existing] = await db.query('SELECT id FROM plugin_authorizations WHERE user_id = ? AND plugin_id = ?', [user_id, plugin_id]);
        if (existing.length > 0) {
            await db.query('UPDATE plugin_authorizations SET ip_limit = ?, port_limit = ?, expires_at = ?, auth_code = ? WHERE id = ?',
                [ip_limit, port_limit, expires_at, authCode, existing[0].id]);
            return { id: existing[0].id, auth_code: authCode };
        }
        const [result] = await db.query(
            'INSERT INTO plugin_authorizations (user_id, plugin_id, ip_limit, port_limit, expires_at, used_ips, used_ports, auth_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, plugin_id, ip_limit, port_limit, expires_at, '[]', '[]', authCode]
        );
        return { id: result.insertId, auth_code: authCode };
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM plugin_authorizations WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByUserAndPlugin(userId, pluginId) {
        const [rows] = await db.query('SELECT * FROM plugin_authorizations WHERE user_id = ? AND plugin_id = ?', [userId, pluginId]);
        return rows[0];
    }

    static async findByUserId(userId) {
        const [rows] = await db.query(
            `SELECT pa.*, p.name as plugin_name, 
             (SELECT version_number FROM plugin_versions WHERE plugin_id = p.id ORDER BY created_at DESC LIMIT 1) as plugin_version,
             u.username as author_name 
             FROM plugin_authorizations pa
             JOIN plugins p ON pa.plugin_id = p.id
             JOIN users u ON p.author_id = u.id
             WHERE pa.user_id = ?
             ORDER BY pa.created_at DESC`, [userId]);
        return rows;
    }

    static async updateUsage(id, usedIps, usedPorts) {
        await db.query('UPDATE plugin_authorizations SET used_ips = ?, used_ports = ? WHERE id = ?',
            [JSON.stringify(usedIps), JSON.stringify(usedPorts), id]);
    }

    static async delete(id) {
        await db.query('DELETE FROM plugin_authorizations WHERE id = ?', [id]);
    }
}

module.exports = AuthorizationModel;
