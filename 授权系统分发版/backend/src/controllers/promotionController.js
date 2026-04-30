const PromotionModel = require('../models/promotionModel');

const recordClick = async (req, res) => {
    const { link_name, link_url } = req.body;
    if (!link_name || !link_url) return res.status(400).json({ success: false, message: 'Missing link_name or link_url' });

    try {
        await PromotionModel.recordClick(link_name, link_url);
        res.json({ success: true });
    } catch (err) {
        console.error('Record click error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const getStats = async (req, res) => {
    try {
        const stats = await PromotionModel.getStats();
        const totalClicks = await PromotionModel.getTotalClicks();
        const todayClicks = await PromotionModel.getClicksToday();
        const weekClicks = await PromotionModel.getClicksThisWeek();

        res.json({ success: true, data: { total_clicks: totalClicks, today_clicks: todayClicks, week_clicks: weekClicks, links: stats } });
    } catch (err) {
        console.error('Get stats error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { recordClick, getStats };
