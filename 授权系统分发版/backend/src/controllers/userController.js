const db = require('../config/db');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const VerificationCodeModel = require('../models/verificationCodeModel');
const QQBingModel = require('../models/qqBindingModel');
const sendEmail = require('../utils/sendEmail');

const formatLocalDate = (value) => {
    if (!value) return null;
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const getMe = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                qq_number: user.qq_number ?? null,
                qq_notification_enabled: user.qq_notification_enabled ?? 0,
                qq_notification_group_id: user.qq_notification_group_id ?? null,
                qq_notify_message: user.qq_notify_message ?? 1,
                qq_notify_follow_update: user.qq_notify_follow_update ?? 1,
                qq_notify_follow_new: user.qq_notify_follow_new ?? 1,
                qq_message_delivery: user.qq_message_delivery ?? 'group',
                created_at: user.created_at,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const sendVerificationCode = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
        if (!rows.length) return res.status(404).json({ message: '用户不存在' });
        const email = rows[0].email;
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await VerificationCodeModel.create(email, code, 'password_change', 10);
        const subject = 'Beacon 密码修改验证码';
        const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #059669;">Beacon 社区</h2>
            <p>您正在申请修改密码，验证码如下：</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; margin: 20px 0;">${code}</div>
            <p>验证码 10 分钟内有效，请勿泄露给他人。</p>
        </div>`;
        const { success, error: mailError } = await sendEmail(email, subject, html);
        if (success) {
            res.json({ success: true, message: '验证码已发送至您的邮箱' });
        } else {
            let message = '邮件发送失败，请稍后重试';
            if (mailError && mailError.responseCode === 535) {
                message = '邮件服务配置错误：授权码无效或服务未开启，请联系管理员';
            }
            res.status(500).json({ message });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { code, newPassword } = req.body;
        if (!code || !newPassword) return res.status(400).json({ message: '请提供验证码和新密码' });
        if (newPassword.length < 6) return res.status(400).json({ message: '密码长度至少为 6 位' });

        const [rows] = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
        if (!rows.length) return res.status(404).json({ message: '用户不存在' });
        const email = rows[0].email;

        const isValid = await VerificationCodeModel.verify(email, code, 'password_change');
        if (!isValid) return res.status(400).json({ message: '验证码无效或已过期' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);
        await VerificationCodeModel.deleteByEmail(email, 'password_change');

        res.json({ success: true, message: '密码修改成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const username = String(req.body.username || '').trim();
        if (!username) return res.status(400).json({ message: '用户名不能为空' });

        const [existing] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]);
        if (existing.length > 0) return res.status(400).json({ message: '用户名已存在' });

        await db.query('UPDATE users SET username = ? WHERE id = ?', [username, userId]);
        res.json({ success: true, message: '用户名更新成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const bindQQ = async (req, res) => {
    try {
        const userId = req.user.id;
        const qq_number = req.body.qq_number;
        if (!qq_number) return res.status(400).json({ success: false, message: '请输入 QQ 号' });
        const qqStr = String(qq_number).trim();
        if (!/^\d{5,11}$/.test(qqStr)) return res.status(400).json({ success: false, message: 'QQ 号格式不正确' });
        const qqNum = parseInt(qqStr, 10);

        const existing = await QQBingModel.findByQQ(qqNum);
        if (existing && existing.id !== userId) return res.status(400).json({ success: false, message: '该 QQ 号已被其他账号绑定' });

        await QQBingModel.create(qqNum, userId);
        res.json({ success: true, message: 'QQ 绑定成功', data: { qq_number: qqStr } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
};

const unbindQQ = async (req, res) => {
    try {
        const userId = req.user.id;
        await QQBingModel.deleteByUserId(userId);
        res.json({ success: true, message: 'QQ 解绑成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
};

const updateQQNotificationSettings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { qq_notification_enabled, qq_notification_group_id, qq_notify_message, qq_notify_follow_update, qq_notify_follow_new, qq_message_delivery } = req.body;
        await UserModel.updateQQNotificationSettings(userId, {
            qq_notification_enabled: qq_notification_enabled !== undefined ? qq_notification_enabled : undefined,
            qq_notification_group_id: qq_notification_group_id !== undefined ? qq_notification_group_id : undefined,
            qq_notify_message: qq_notify_message !== undefined ? qq_notify_message : undefined,
            qq_notify_follow_update: qq_notify_follow_update !== undefined ? qq_notify_follow_update : undefined,
            qq_notify_follow_new: qq_notify_follow_new !== undefined ? qq_notify_follow_new : undefined,
            qq_message_delivery: qq_message_delivery !== undefined ? qq_message_delivery : undefined,
        });
        res.json({ success: true, message: 'QQ 通知设置更新成功' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
};

const getQQGroups = async (req, res) => {
    try {
        const readConfig = require('./botManagementController').readConfig;
        const botConfig = readConfig();
        const allowedGroups = (botConfig.allowed_groups || []).map(id => String(id));
        let groups = [];

        if (botConfig.napcat_http_url) {
            try {
                const axios = require('axios');
                const resp = await axios.get(`${botConfig.napcat_http_url}/get_group_list`, { timeout: 5000 });
                const allGroups = resp.data?.data || [];
                const groupSet = new Set(allowedGroups);
                groups = allGroups
                    .filter(g => groupSet.has(String(g.group_id)) || allowedGroups.length === 0)
                    .map(g => ({ group_id: String(g.group_id), group_name: g.group_name, member_count: g.member_count }));
            } catch (e) {
                console.warn('NapCat unreachable for QQ groups:', e.message);
            }
        }

        const fetchedIds = new Set(groups.map(g => g.group_id));
        for (const id of allowedGroups) {
            if (!fetchedIds.has(id)) {
                groups.push({ group_id: id, group_name: `群 ${id}`, member_count: 0 });
            }
        }

        res.json({ success: true, data: groups });
    } catch (error) {
        console.error('Error fetching QQ groups:', error);
        res.json({ success: true, data: [] });
    }
};

module.exports = { getMe, sendVerificationCode, updatePassword, updateProfile, bindQQ, unbindQQ, updateQQNotificationSettings, getQQGroups };
