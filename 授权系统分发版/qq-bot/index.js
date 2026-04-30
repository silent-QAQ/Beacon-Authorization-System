const express = require('express');
const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const BEACON_API_URL = process.env.BEACON_API_URL || 'http://localhost:5000';
const BOT_API_KEY = process.env.BOT_API_KEY || 'beacon_bot_sk_7f8a2b3c4d5e6f7890ab';

// 将从后端获取的动态配置保存在内存中
let botConfig = {
  bot_webhook_port: parseInt(process.env.BOT_PORT) || 3002,
  napcat_http_url: process.env.NAPCAT_HTTP_URL || 'http://localhost:3000',
  command_prefix: '!',
  allowed_groups: [],
  command_keywords: {
    grant: '授权',
    revoke: '取消授权',
    unbind: '解绑',
    help: '帮助',
    test: '测试',
    my_auth: '已获授权',
    granted_auth: '已发授权',
    relay_msg: '消息',
    auth_code: '授权码',
  },
  enabled: false,
};

// 从后端获取 Bot 配置
async function fetchBotConfig() {
  try {
    const { data } = await axios.get(`${BEACON_API_URL}/api/bot-management/bot-config`, {
      headers: { 'X-Bot-API-Key': BOT_API_KEY, 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    if (data.success && data.data) {
      const c = data.data;
      botConfig.napcat_http_url = c.napcat_http_url || botConfig.napcat_http_url;
      botConfig.bot_webhook_port = c.bot_webhook_port || botConfig.bot_webhook_port;
      botConfig.command_prefix = c.command_prefix || '!';
      botConfig.allowed_groups = c.allowed_groups || [];
      botConfig.command_keywords = c.command_keywords || botConfig.command_keywords;
      botConfig.enabled = !!c.enabled;
      console.log('[BeaconBot] 已从后端加载动态配置');
      console.log(`[BeaconBot] NapCat: ${botConfig.napcat_http_url}`);
      console.log(`[BeaconBot] Webhook 端口: ${botConfig.bot_webhook_port}`);
      console.log(`[BeaconBot] 允许群聊: ${botConfig.allowed_groups.length} 个`);
      console.log(`[BeaconBot] 启用状态: ${botConfig.enabled ? '已启用' : '已停用'}`);
      return true;
    }
  } catch (err) {
    console.error('[BeaconBot] 获取后端配置失败，使用环境变量/默认配置:', err.message);
    return false;
  }
}

// 构建动态命令正则
function buildCommandPatterns() {
  const kw = botConfig.command_keywords;
  const p = botConfig.command_prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = {};
  for (const [key, val] of Object.entries(kw)) {
    patterns[key] = new RegExp(`^${p}${esc(val)}(?:\\s+(.+))?$`);
  }
  return patterns;
}

function sendGroupMessage(groupId, message) {
  return axios.post(`${botConfig.napcat_http_url}/send_group_msg`, {
    group_id: groupId,
    message,
  }).catch(err => {
    console.error('Failed to send group message:', err.message);
  });
}

function sendPrivateMessage(userId, message) {
  return axios.post(`${botConfig.napcat_http_url}/send_private_msg`, {
    user_id: userId,
    message,
  }).catch(err => {
    console.error('Failed to send private message:', err.message);
  });
}

async function callBeaconAPI(endpoint, payload) {
  const { data } = await axios.post(`${BEACON_API_URL}/api/bot/${endpoint}`, payload, {
    headers: { 'X-Bot-API-Key': BOT_API_KEY, 'Content-Type': 'application/json' },
    timeout: 10000,
  });
  return data;
}

async function handleCommand(qqNumber, groupId, text) {
  console.log(`[CMD] QQ:${qqNumber} Group:${groupId} Cmd:${text}`);

  // 检查群是否在允许列表中
  if (botConfig.allowed_groups.length > 0 && !botConfig.allowed_groups.includes(groupId)) {
    console.log(`[CMD] 群 ${groupId} 不在允许列表中，忽略`);
    return;
  }

  const patterns = buildCommandPatterns();
  const kw = botConfig.command_keywords;
  const p = botConfig.command_prefix;

  // !帮助
  const helpMatch = text.match(patterns.help);
  if (helpMatch) {
    const helpText = [
      `📖 Beacon 授权机器人 - 可用命令：`,
      '',
      `${p}${kw.test}`,
      `  测试机器人是否在线`,
      '',
      `${p}${kw.grant} <插件名> <目标用户> [IP数] [端口数] [天数]`,
      `  为其他用户授权你的付费插件（插件作者专用）`,
      '',
      `${p}${kw.revoke} <插件名> <目标用户>`,
      `  取消用户的插件授权（插件作者专用）`,
      '',
      `${p}${kw.unbind} <插件名> <IP|端口>`,
      `  解绑已使用的 IP 或端口（授权用户专用）`,
      '',
      `${p}${kw.my_auth}`,
      `  查看自己已获得的授权列表`,
      '',
      `${p}${kw.granted_auth}`,
      `  查看自己已发出的授权列表（插件作者专用）`,
      '',
      `${p}${kw.auth_code}`,
      `  查看自己所有插件的授权码（通过私聊发送，保护信息安全）`,
      '',
      `${p}${kw.relay_msg} <QQ号> <内容>`,
      `  通过机器人向指定QQ号发送消息（需先添加好友并开启QQ同步）`,
      '',
      `${p}${kw.help}`,
      `  显示此帮助信息`,
      '',
      '📌 QQ 绑定请在 Beacon 网站「账号设置」中操作',
      '   使用 @qq.com 邮箱注册时将自动绑定',
    ].join('\n');
    return sendGroupMessage(groupId, helpText);
  }

  // !测试
  const testMatch = text.match(patterns.test);
  if (testMatch) {
    return sendGroupMessage(groupId, '在的，请问有什么可以帮到您的吗');
  }

  // !已获授权
  const myAuthMatch = text.match(patterns.my_auth);
  if (myAuthMatch) {
    const result = await callBeaconAPI('my-auth', {
      qq_number: qqNumber,
    });
    return sendGroupMessage(groupId, result.message);
  }

  // !已发授权
  const grantedAuthMatch = text.match(patterns.granted_auth);
  if (grantedAuthMatch) {
    const result = await callBeaconAPI('granted-auth', {
      qq_number: qqNumber,
    });
    return sendGroupMessage(groupId, result.message);
  }

  // !授权码 - 私聊发送授权码信息
  const authCodeMatch = text.match(patterns.auth_code);
  if (authCodeMatch) {
    const result = await callBeaconAPI('my-auth-codes', {
      qq_number: qqNumber,
    });

    if (!result.success) {
      return sendGroupMessage(groupId, result.message);
    }

    if (!result.data || result.data.length === 0) {
      return sendGroupMessage(groupId, '您目前还没有任何授权记录，暂无授权码');
    }

    const lines = result.data.map((a, i) => {
      let expiry = '永久';
      if (a.expires_at) {
        const d = new Date(a.expires_at);
        expiry = d.toLocaleDateString() + (d < new Date() ? '（已过期）' : '');
      }
      const codeDisplay = a.auth_code || '（暂无，请重新授权生成）';
      return `${i + 1}. ${a.plugin_name}\n   作者: ${a.author_name}\n   授权码: ${codeDisplay}\n   有效期: ${expiry}`;
    });

    const pmMessage = `🔑 您的 Beacon 插件授权码如下：\n\n${lines.join('\n\n')}\n\n📌 使用方法：在服务器 BeaconAuth/config.yml 的 plugins 中填写对应插件的 auth_code`;

    await sendPrivateMessage(qqNumber, pmMessage);
    return sendGroupMessage(groupId, '✅ 授权码已通过私聊发送，请查收！\n💡 若未收到私聊消息，请检查是否已将机器人加为好友或临时会话是否开启。');
  }

  // !消息 <QQ号> <内容>
  const relayMsgMatch = text.match(patterns.relay_msg);
  if (relayMsgMatch) {
    const parts = relayMsgMatch[1] ? relayMsgMatch[1].trim().split(/\s+/) : [];
    if (parts.length < 2) {
      return sendGroupMessage(groupId, `格式错误！使用: ${p}${kw.relay_msg} <QQ号> <内容>`);
    }
    const toQQ = parts[0];
    const msgContent = parts.slice(1).join(' ');
    const result = await callBeaconAPI('relay-msg', {
      qq_number: qqNumber,
      to_qq: toQQ,
      content: msgContent,
    });
    return sendGroupMessage(groupId, result.message);
  }

  // !授权 <pluginName> <targetUser> [ipLimit] [portLimit] [expiresInDays]
  const grantMatch = text.match(patterns.grant);
  if (grantMatch) {
    const parts = grantMatch[1] ? grantMatch[1].trim().split(/\s+/) : [];
    if (parts.length < 2) {
      return sendGroupMessage(groupId, `格式错误！使用: ${p}${kw.grant} <插件名> <目标用户> [IP数] [端口数] [天数]`);
    }
    const pluginName = parts[0];
    const targetUser = parts[1];
    const ipLimit = parts[2] ? parseInt(parts[2]) : 1;
    const portLimit = parts[3] ? parseInt(parts[3]) : 1;
    const expiresInDays = parts[4] ? parseInt(parts[4]) : null;
    const result = await callBeaconAPI('grant', {
      qq_number: qqNumber,
      plugin_name: pluginName,
      target_username: targetUser,
      ip_limit: ipLimit,
      port_limit: portLimit,
      expires_in_days: expiresInDays,
    });
    return sendGroupMessage(groupId, result.message);
  }

  // !取消授权 <pluginName> <targetUser>
  const revokeMatch = text.match(patterns.revoke);
  if (revokeMatch) {
    const parts = revokeMatch[1] ? revokeMatch[1].trim().split(/\s+/) : [];
    if (parts.length < 2) {
      return sendGroupMessage(groupId, `格式错误！使用: ${p}${kw.revoke} <插件名> <目标用户>`);
    }
    const result = await callBeaconAPI('revoke', {
      qq_number: qqNumber,
      plugin_name: parts[0],
      target_username: parts[1],
    });
    return sendGroupMessage(groupId, result.message);
  }

  // !解绑 <pluginName> <ip|port>
  const unbindMatch = text.match(patterns.unbind);
  if (unbindMatch) {
    const parts = unbindMatch[1] ? unbindMatch[1].trim().split(/\s+/) : [];
    if (parts.length < 2) {
      return sendGroupMessage(groupId, `格式错误！使用: ${p}${kw.unbind} <插件名> <IP|端口>`);
    }
    const pluginName = parts[0];
    const value = parts[1];
    const type = value.includes('.') ? 'ip' : 'port';
    const result = await callBeaconAPI('unbind-endpoint', {
      qq_number: qqNumber,
      plugin_name: pluginName,
      type,
      value,
    });
    return sendGroupMessage(groupId, result.message);
  }
}

const app = express();
app.use(express.json());

// NapCat HTTP 事件回调
app.post('/', async (req, res) => {
  const event = req.body;
  res.json({ status: 'ok' });

  if (!botConfig.enabled) return;
  if (event.message_type !== 'group') return;
  if (event.post_type !== 'message') return;

  const rawMessage = typeof event.raw_message === 'string' ? event.raw_message.trim() : '';
  if (!rawMessage.startsWith(botConfig.command_prefix)) return;

  const groupId = event.group_id;
  const qqNumber = event.user_id;

  await handleCommand(qqNumber, groupId, rawMessage);
});

// 健康检查
app.get('/health', (req, res) => res.json({ status: 'ok', config: { enabled: botConfig.enabled, port: botConfig.bot_webhook_port, groups: botConfig.allowed_groups.length } }));

// 轮询待转发消息和待发送通知
async function pollPendingRelay() {
  try {
    const { data } = await axios.get(`${BEACON_API_URL}/api/bot/pending-relay`, {
      headers: { 'X-Bot-API-Key': BOT_API_KEY, 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    if (data.success && data.data && data.data.length > 0) {
      for (const relay of data.data) {
        if (relay.to_qq) {
          try {
            await axios.post(`${botConfig.napcat_http_url}/send_private_msg`, {
              user_id: relay.to_qq,
              message: `${relay.from_username} 给您发了一条消息：\n\n${relay.content}`,
            });
            console.log(`[Relay] 已转发消息到 QQ ${relay.to_qq}`);
          } catch (sendErr) {
            console.error(`[Relay] 发送到 QQ ${relay.to_qq} 失败:`, sendErr.message);
          }
        }
      }
      // 标记已投递
      await axios.post(`${BEACON_API_URL}/api/bot/relay-delivered`, {
        msg_ids: data.data.map(r => r.msg_id),
      }, {
        headers: { 'X-Bot-API-Key': BOT_API_KEY, 'Content-Type': 'application/json' },
        timeout: 5000,
      });
    }
  } catch (err) {
    // 静默失败，不影响其他功能
  }
}

// 轮询待发送的 QQ 通知
async function pollPendingNotifications() {
  try {
    const { data } = await axios.get(`${BEACON_API_URL}/api/bot/pending-notifications`, {
      headers: { 'X-Bot-API-Key': BOT_API_KEY, 'Content-Type': 'application/json' },
      timeout: 5000,
    });
    if (data.success && data.data && data.data.length > 0) {
      for (const notif of data.data) {
        try {
          if (notif.group_id) {
            // 发送到指定群
            await sendGroupMessage(notif.group_id, notif.message);
          } else if (notif.qq_number) {
            // 发送私聊消息
            await axios.post(`${botConfig.napcat_http_url}/send_private_msg`, {
              user_id: notif.qq_number,
              message: notif.message,
            });
          }
          console.log(`[通知] 已发送通知 ${notif.id} 到 QQ ${notif.qq_number}`);
        } catch (sendErr) {
          console.error(`[通知] 发送通知 ${notif.id} 失败:`, sendErr.message);
        }
      }
      // 标记已发送
      await axios.post(`${BEACON_API_URL}/api/bot/notifications-sent`, {
        notification_ids: data.data.map(n => n.id),
      }, {
        headers: { 'X-Bot-API-Key': BOT_API_KEY, 'Content-Type': 'application/json' },
        timeout: 5000,
      });
    }
  } catch (err) {
    // 静默失败
  }
}

// 启动服务器
async function start() {
  await fetchBotConfig();

  const port = botConfig.bot_webhook_port;
  app.listen(port, () => {
    console.log(`[BeaconBot] QQ 机器人已启动，端口 ${port}`);
    console.log(`[BeaconBot] Beacon API: ${BEACON_API_URL}`);
    console.log(`[BeaconBot] 命令前缀: "${botConfig.command_prefix}"`);
    if (!botConfig.enabled) {
      console.log('[BeaconBot] ⚠  Bot 当前为停用状态，可通过管理后台启用');
    }
  });

  // 每5秒轮询待转发消息
  setInterval(pollPendingRelay, 5000);
  // 每5秒轮询待发送通知
  setInterval(pollPendingNotifications, 5000);
}

start();
