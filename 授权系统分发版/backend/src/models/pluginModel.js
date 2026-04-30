const db = require('../config/db');

class PluginModel {
    static async findById(id) {
        const query = `
            SELECT p.*, u.username as author_name, c.name as category_name
            FROM plugins p
            LEFT JOIN users u ON p.author_id = u.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `;
        const [rows] = await db.query(query, [id]);
        return rows[0];
    }
}

module.exports = PluginModel;
