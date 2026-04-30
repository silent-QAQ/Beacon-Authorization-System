const AuthorizationModel = require('../models/authorizationModel');
const PluginModel = require('../models/pluginModel');
const UserModel = require('../models/userModel');

const getMyAuthorizations = async (req, res) => {
    try {
        const auths = await AuthorizationModel.findByUserId(req.user.id);
        res.json({ success: true, data: auths });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const grantAuthorization = async (req, res) => {
    const { pluginId, username, ipLimit, portLimit, expiresIn } = req.body;
    if (!pluginId || !username) return res.status(400).json({ success: false, message: 'Missing pluginId or username' });

    try {
        const plugin = await PluginModel.findById(pluginId);
        if (!plugin) return res.status(404).json({ success: false, message: 'Plugin not found' });
        if (plugin.author_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to grant license for this plugin' });
        }

        const targetUser = await UserModel.findByUsername(username);
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

        let expires_at = null;
        if (expiresIn && parseInt(expiresIn) > 0) {
            expires_at = new Date(Date.now() + parseInt(expiresIn) * 86400000);
        }

        const result = await AuthorizationModel.create({
            user_id: targetUser.id, plugin_id: pluginId,
            ip_limit: ipLimit || 1, port_limit: portLimit || 1, expires_at
        });

        res.json({ success: true, message: '授权成功', auth_code: result.auth_code });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const revokeAuthorization = async (req, res) => {
    try {
        const db = require('../config/db');
        const [rows] = await db.query('SELECT * FROM plugin_authorizations WHERE id = ?', [req.params.id]);
        const auth = rows[0];
        if (!auth) return res.status(404).json({ success: false, message: 'Authorization not found' });

        const plugin = await PluginModel.findById(auth.plugin_id);
        if (plugin.author_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await AuthorizationModel.delete(req.params.id);
        res.json({ success: true, message: 'Authorization revoked' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const verifyLicense = async (req, res) => {
    const { account, auth_code, plugin_name, server_ip, server_port } = req.body;
    if (!account || !auth_code || !plugin_name || !server_ip || !server_port) {
        return res.status(400).json({ success: false, message: 'Missing required fields', valid: false });
    }

    try {
        const user = await UserModel.findByUsername(account);
        if (!user) return res.status(401).json({ success: false, message: 'Invalid account', valid: false });

        const db = require('../config/db');
        const [plugins] = await db.query('SELECT * FROM plugins WHERE name = ?', [plugin_name]);
        const plugin = plugins[0];
        if (!plugin) return res.status(404).json({ success: false, message: 'Plugin not found', valid: false });

        if (!plugin.is_paid) return res.json({ success: true, valid: true, message: 'Free plugin' });

        const auth = await AuthorizationModel.findByUserAndPlugin(user.id, plugin.id);
        if (!auth) return res.status(403).json({ success: false, valid: false, message: 'No license found for this plugin' });
        if (auth.auth_code !== auth_code) return res.status(403).json({ success: false, valid: false, message: 'Invalid authorization code' });
        if (auth.expires_at && new Date(auth.expires_at) < new Date()) {
            return res.status(403).json({ success: false, valid: false, message: 'License has expired' });
        }

        let usedIps = [];
        try { usedIps = JSON.parse(auth.used_ips || '[]'); } catch (e) {}
        if (!usedIps.includes(server_ip)) {
            if (usedIps.length >= auth.ip_limit) return res.status(403).json({ success: false, valid: false, message: 'IP limit exceeded' });
            usedIps.push(server_ip);
        }

        let usedPorts = [];
        try { usedPorts = JSON.parse(auth.used_ports || '[]'); } catch (e) {}
        if (!usedPorts.includes(String(server_port))) {
            if (usedPorts.length >= auth.port_limit) return res.status(403).json({ success: false, valid: false, message: 'Port limit exceeded' });
            usedPorts.push(String(server_port));
        }

        await AuthorizationModel.updateUsage(auth.id, usedIps, usedPorts);

        const response = { success: true, valid: true, message: 'Authorized' };
        if (auth.expires_at) response.expires_at = auth.expires_at;
        res.json(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error', valid: false });
    }
};

const unbindEndpoint = async (req, res) => {
    const { authorizationId, type, value } = req.body;
    if (!authorizationId || !type || !value) return res.status(400).json({ success: false, message: 'Missing required fields' });
    if (type !== 'ip' && type !== 'port') return res.status(400).json({ success: false, message: 'Type must be "ip" or "port"' });

    try {
        const auth = await AuthorizationModel.findById(authorizationId);
        if (!auth) return res.status(404).json({ success: false, message: 'Authorization not found' });

        const plugin = await PluginModel.findById(auth.plugin_id);
        const isOwner = auth.user_id === req.user.id;
        const isAuthor = plugin && plugin.author_id === req.user.id;
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAuthor && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized' });

        let usedIps = [];
        try { usedIps = JSON.parse(auth.used_ips || '[]'); } catch (e) { usedIps = []; }
        let usedPorts = [];
        try { usedPorts = JSON.parse(auth.used_ports || '[]'); } catch (e) { usedPorts = []; }

        if (type === 'ip') {
            const idx = usedIps.indexOf(value);
            if (idx === -1) return res.status(404).json({ success: false, message: 'IP not found' });
            usedIps.splice(idx, 1);
        } else {
            const idx = usedPorts.indexOf(value);
            if (idx === -1) return res.status(404).json({ success: false, message: 'Port not found' });
            usedPorts.splice(idx, 1);
        }

        await AuthorizationModel.updateUsage(auth.id, usedIps, usedPorts);
        res.json({ success: true, message: `${type === 'ip' ? 'IP' : 'Port'} ${value} has been unbound` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { getMyAuthorizations, grantAuthorization, revokeAuthorization, verifyLicense, unbindEndpoint };
