const db = require('../config/db');

class PromotionModel {
    static async recordClick(linkName, linkUrl) {
        const [result] = await db.query('INSERT INTO promotion_clicks (link_name, link_url) VALUES (?, ?)', [linkName, linkUrl]);
        return result.insertId;
    }

    static async getStats() {
        const [rows] = await db.query(
            `SELECT link_name, link_url, COUNT(*) as click_count, MAX(clicked_at) as last_clicked
             FROM promotion_clicks GROUP BY link_name, link_url ORDER BY click_count DESC, last_clicked DESC`
        );
        return rows;
    }

    static async getTotalClicks() {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM promotion_clicks');
        return rows[0].total;
    }

    static async getClicksToday() {
        const [rows] = await db.query("SELECT COUNT(*) as total FROM promotion_clicks WHERE DATE(clicked_at) = CURDATE()");
        return rows[0].total;
    }

    static async getClicksThisWeek() {
        const [rows] = await db.query("SELECT COUNT(*) as total FROM promotion_clicks WHERE YEARWEEK(clicked_at) = YEARWEEK(CURDATE())");
        return rows[0].total;
    }
}

module.exports = PromotionModel;
