const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../../data/bot-config.json');

const DEFAULT_CONFIG = {
    napcat_http_url: 'http://localhost:3000',
    bot_webhook_port: 3002,
    bot_api_key: '',
    enabled: false,
    command_prefix: '#',
    allowed_groups: [],
    command_keywords: {
        grant: '授权', revoke: '取消授权', unbind: '解绑',
        help: '帮助', test: '测试', my_auth: '已获授权',
        granted_auth: '已发授权', relay_msg: '消息', auth_code: '授权码',
    },
};

function readConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) {
            const dir = path.dirname(CONFIG_PATH);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf8');
            return { ...DEFAULT_CONFIG };
        }
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
        const saved = JSON.parse(raw);
        if (saved.command_keywords && DEFAULT_CONFIG.command_keywords) {
            saved.command_keywords = { ...DEFAULT_CONFIG.command_keywords, ...saved.command_keywords };
        }
        return { ...DEFAULT_CONFIG, ...saved };
    } catch (err) {
        console.error('Read bot config error:', err);
        return { ...DEFAULT_CONFIG };
    }
}

function writeConfig(data) {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const current = readConfig();
    const merged = { ...current, ...data };
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2), 'utf8');
    return merged;
}

const getConfig = async (req, res) => {
    try {
        const config = readConfig();
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Get bot config error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
};

const updateConfig = async (req, res) => {
    try {
        const data = req.body;
        const config = writeConfig(data);
        res.json({ success: true, message: 'Bot 配置已更新', data: config });
    } catch (error) {
        console.error('Update bot config error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
};

const getBotConfig = async (req, res) => {
    try {
        const config = readConfig();
        res.json({ success: true, data: config });
    } catch (error) {
        console.error('Get bot config error:', error);
        res.status(500).json({ success: false, message: '服务器错误' });
    }
};

module.exports = { readConfig, writeConfig, getConfig, updateConfig, getBotConfig };
