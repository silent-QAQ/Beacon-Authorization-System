const UserModel = require('../models/userModel');
const PluginModel = require('../models/pluginModel');
const AuthorizationModel = require('../models/authorizationModel');
const QQBingModel = require('../models/qqBindingModel');
const FriendModel = require('../models/friendModel');
const db = require('../config/db');

const botGrant = async (req, res) => {
    const { qq_number, plugin_name, target_username, ip_limit, port_limit, expires_in_days } = req.body;
    if (!qq_number || !plugin_name || !target_username) {
        return res.json({ success: false, message: '格式错误！' });
    }

    try {
        const binding = await QQBingModel.findByQQ(qq_number);
        if (!binding) return res.json({ success: false, message: '您尚未绑定 Beacon 账号！' });

        const [plugins] = await db.query('SELECT * FROM plugins WHERE name = ?', [plugin_name]);
        const plugin = plugins[0];
        if (!plugin) return res.json({ success: false, message: `插件不存在` });
        if (plugin.author_id !== binding.user_id && binding.role !== 'admin' && binding.role !== 'superadmin') {
            return res.json({ success: false, message: '您不是该插件的作者' });
        }

        const targetUser = await UserModel.findByUsername(target_username);
        if (!targetUser) return res.json({ success: false, message: `用户不存在` });

        let expires_at = null;
        if (expires_in_days && parseInt(expires_in_days) > 0) {
            expires_at = new Date(Date.now() + parseInt(expires_in_days) * 86400000);
        }

        const result = await AuthorizationModel.create({
            user_id: targetUser.id, plugin_id: plugin.id,
            ip_limit: ip_limit || 1, port_limit: port_limit || 1, expires_at
        });

        let msg = `✅ 授权成功！\n插件: ${plugin.name}\n用户: ${target_username}\nIP 限制: ${ip_limit || 1}\n端口限制: ${port_limit || 1}`;
        if (expires_at) msg += `\n有效期: ${expires_in_days} 天（${expires_at.toLocaleDateString()} 到期）`;
        else msg += '\n有效期: 永久';
        if (result.auth_code) msg += `\n🔑 授权码: ${result.auth_code}`;

        res.json({ success: true, message: msg });
    } catch (err) {
        console.error('Bot grant error:', err);
        res.json({ success: false, message: '授权失败，服务器错误' });
    }
};

const botRevoke = async (req, res) => {
    const { qq_number, plugin_name, target_username } = req.body;
    if (!qq_number || !plugin_name || !target_username) {
        return res.json({ success: false, message: '格式错误！' });
    }

    try {
        const binding = await QQBingModel.findByQQ(qq_number);
        if (!binding) return res.json({ success: false, message: '您尚未绑定 Beacon 账号！' });

        const [plugins] = await db.query('SELECT * FROM plugins WHERE name = ?', [plugin_name]);
        const plugin = plugins[0];
        if (!plugin) return res.json({ success: false, message: `插件不存在` });

        const targetUser = await UserModel.findByUsername(target_username);
        if (!targetUser) return res.json({ success: false, message: `用户不存在` });

        const auth = await AuthorizationModel.findByUserAndPlugin(targetUser.id, plugin.id);
        if (!auth) return res.json({ success: false, message: `没有授权记录` });

        await AuthorizationModel.delete(auth.id);
        res.json({ success: true, message: `✅ 已取消 ${target_username} 对 ${plugin.name} 的授权` });
    } catch (err) {
        console.error('Bot revoke error:', err);
        res.json({ success: false, message: '取消授权失败，服务器错误' });
    }
};

const botMyAuth = async (req, res) => {
    const { qq_number } = req.body;
    if (!qq_number) return res.json({ success: false, message: '缺少 QQ 号' });

    try {
        const binding = await QQBingModel.findByQQ(qq_number);
        if (!binding) return res.json({ success: false, message: '您尚未绑定 Beacon 账号！' });

        const auths = await AuthorizationModel.findByUserId(binding.user_id);
        if (!auths || auths.length === 0) return res.json({ success: true, message: '您目前还没有任何授权记录' });

        const lines = auths.map((a, i) => {
            const usedIps = JSON.parse(a.used_ips || '[]');
            const usedPorts = JSON.parse(a.used_ports || '[]');
            let expiry = '永久';
            if (a.expires_at) {
                const d = new Date(a.expires_at);
                expiry = d.toLocaleDateString() + (d < new Date() ? '（已过期）' : '');
            }
            return `${i + 1}. ${a.plugin_name}\n   作者: ${a.author_name}\n   IP: ${usedIps.length}/${a.ip_limit}  端口: ${usedPorts.length}/${a.port_limit}\n   有效期: ${expiry}`;
        });

        res.json({ success: true, message: `📋 您已获得的授权（共 ${auths.length} 条）：\n\n${lines.join('\n\n')}` });
    } catch (err) {
        console.error('Bot my auth error:', err);
        res.json({ success: false, message: '查询失败，服务器错误' });
    }
};

const botMyAuthCodes = async (req, res) => {
    const { qq_number } = req.body;
    if (!qq_number) return res.json({ success: false, message: '缺少 QQ 号' });

    try {
        const binding = await QQBingModel.findByQQ(qq_number);
        if (!binding) return res.json({ success: false, message: '您尚未绑定 Beacon 账号！' });

        const auths = await AuthorizationModel.findByUserId(binding.user_id);
        if (!auths || auths.length === 0) return res.json({ success: true, data: [] });

        const items = auths.map(a => ({
            plugin_name: a.plugin_name, author_name: a.author_name, auth_code: a.auth_code,
            ip_limit: a.ip_limit, port_limit: a.port_limit, expires_at: a.expires_at,
            used_ips: JSON.parse(a.used_ips || '[]'), used_ports: JSON.parse(a.used_ports || '[]'),
        }));

        res.json({ success: true, data: items });
    } catch (err) {
        console.error('Bot my auth codes error:', err);
        res.json({ success: false, message: '查询失败，服务器错误' });
    }
};

const botGetPendingRelay = async (req, res) => {
    try {
        const [messages] = await db.query(
            `SELECT fm.id, fm.from_user_id, fm.to_user_id, fm.content, fm.created_at,
                    fu.username as from_username, qbf.qq_number as from_qq,
                    tu.username as to_username, qbt.qq_number as to_qq
             FROM friend_messages fm
             JOIN users fu ON fu.id = fm.from_user_id
             JOIN users tu ON tu.id = fm.to_user_id
             LEFT JOIN qq_bindings qbf ON qbf.user_id = fm.from_user_id
             LEFT JOIN qq_bindings qbt ON qbt.user_id = fm.to_user_id
             WHERE fm.source = 'web' AND fm.relay_status = 'pending'
             ORDER BY fm.created_at ASC LIMIT 10`
        );
        if (!messages.length) return res.json({ success: true, data: [] });

        const ids = messages.map(m => m.id);
        await db.query(`UPDATE friend_messages SET relay_status = 'sending' WHERE id IN (${ids.map(() => '?').join(',')})`, ids);

        const relays = messages.map(m => ({ msg_id: m.id, to_qq: m.to_qq, from_username: m.from_username, content: m.content }));
        res.json({ success: true, data: relays });
    } catch (err) {
        console.error('Get pending relay error:', err);
        res.json({ success: false, message: '服务器错误' });
    }
};

const botRelayDelivered = async (req, res) => {
    const { msg_ids } = req.body;
    if (!msg_ids || !msg_ids.length) return res.json({ success: false, message: '缺少消息ID' });
    try {
        const placeholders = msg_ids.map(() => '?').join(',');
        await db.query(`UPDATE friend_messages SET relay_status = 'delivered' WHERE id IN (${placeholders})`, msg_ids);
        res.json({ success: true, message: '已标记' });
    } catch (err) {
        console.error('Relay delivered error:', err);
        res.json({ success: false, message: '服务器错误' });
    }
};

const botRelayMsg = async (req, res) => {
    const { qq_number, to_qq, content } = req.body;
    if (!qq_number || !to_qq || !content) return res.json({ success: false, message: '格式错误！' });

    try {
        const binding = await QQBingModel.findByQQ(qq_number);
        if (!binding) return res.json({ success: false, message: '您尚未绑定 Beacon 账号！' });

        const toBinding = await QQBingModel.findByQQ(to_qq);
        if (!toBinding) return res.json({ success: false, message: `QQ ${to_qq} 未绑定 Beacon 账号` });

        const isFriend = await FriendModel.isFriend(binding.user_id, toBinding.user_id);
        if (!isFriend) return res.json({ success: false, message: '你们还不是好友，请先在网站添加好友' });

        await FriendModel.sendMessage(binding.user_id, toBinding.user_id, content.trim(), 'qq', 'pending');
        res.json({ success: true, message: `消息已发送给 QQ ${to_qq}` });
    } catch (err) {
        console.error('Bot relay msg error:', err);
        res.json({ success: false, message: '发送失败，服务器错误' });
    }
};

const botGetPendingNotifications = async (req, res) => {
    try {
        const notifications = await UserModel.getPendingQQNotifications(50);
        res.json({ success: true, data: notifications || [] });
    } catch (err) {
        console.error('Get pending notifications error:', err);
        res.json({ success: false, message: '服务器错误' });
    }
};

const botMarkNotificationsSent = async (req, res) => {
    const { notification_ids } = req.body;
    if (!notification_ids || !notification_ids.length) return res.json({ success: false, message: '缺少通知ID' });
    try {
        await UserModel.markQQNotificationsSent(notification_ids);
        res.json({ success: true, message: '已标记' });
    } catch (err) {
        console.error('Mark notifications sent error:', err);
        res.json({ success: false, message: '服务器错误' });
    }
};

module.exports = { botGrant, botRevoke, botMyAuth, botMyAuthCodes, botGetPendingRelay, botRelayDelivered, botRelayMsg, botGetPendingNotifications, botMarkNotificationsSent };
