# Beacon 插件授权系统 - 分发版

## 目录结构

```
├── backend/            # 后端 API 服务 (Node.js + Express)
├── frontend/           # 前端页面 (React + Vite + Tailwind)
├── mc-plugin/          # Minecraft 服务器验证插件 (Java/Bukkit)
├── qq-bot/             # QQ 机器人 (Node.js + NapCat)
└── database/           # 数据库脚本 (在上方结构内)
```

---

## 一、环境要求

| 组件 | 要求 |
|------|------|
| Node.js | >= 18 |
| MySQL | >= 5.7 |
| Java | >= 17 (MC 插件用) |
| npm | >= 9 |

---

## 二、数据库部署

### 方式1：自动初始化（推荐）

```bash
cd backend
cp .env.example .env        # 修改数据库连接配置
npm install
npm run init-db              # 自动建库建表
```

### 方式2：手动执行 SQL

登录 MySQL 后按顺序执行：

```sql
source backend/db/schema.sql;
source backend/db/migrations/012_qq_bindings.sql;
source backend/db/migrations/014_friends.sql;
source backend/db/migrations/015_follows.sql;
source backend/db/migrations/016_qq_notification_settings.sql;
source backend/db/migrations/017_add_auth_code.sql;
source backend/db/migrations/018_add_qq_message_delivery.sql;
source backend/db/migrations/019_create_promotion_clicks.sql;
source backend/db/migrations/100_plugin_authorizations.sql;
```

---

## 三、后端部署

```bash
cd backend
cp .env.example .env
# 编辑 .env，修改数据库连接、JWT_SECRET、SMTP 配置
npm install
npm start                    # 启动在 :5000
```

### 环境变量说明

| 变量 | 说明 |
|------|------|
| `PORT` | API 服务端口 (默认 5000) |
| `DB_HOST` | 数据库地址 |
| `DB_USER` / `DB_PASSWORD` | 数据库账号密码 |
| `DB_NAME` | 数据库名 (默认 beacon_auth) |
| `JWT_SECRET` | JWT 签名密钥 (务必修改) |
| `SMTP_EMAIL` / `SMTP_PASSWORD` | 邮件发送配置 (QQ邮箱需使用授权码) |
| `BOT_API_KEY` | QQ 机器人 API 密钥 |

---

## 四、前端部署

```bash
cd frontend
npm install
npm run build                # 构建到 dist/ 目录
```

将 `dist/` 目录部署到任意静态文件服务器（Nginx / Apache 等），配置反向代理 `/api` 到后端端口 5000。

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/frontend/dist;
    index index.html;

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 五、MC 插件部署

1. 编译插件：`cd mc-plugin && mvn clean package`
2. 将生成的 `BeaconAuth.jar` 放入服务端 `plugins/` 目录
3. 启动服务器生成配置文件，编辑 `plugins/BeaconAuth/config.yml`：

```yaml
auth:
  account: "your_beacon_username"     # Beacon 平台账号（无需密码）
  api-url: "http://your-domain.com/api/authorizations/verify"

plugins:
  - name: "SuperSword"               # 插件名称
    auth_code: "BC-A1B2C3D4E5F6G7H8" # 授权中心获取的授权码
```

4. 重启服务器自动验证

---

## 六、QQ 机器人部署

```bash
cd qq-bot
cp .env.example .env
# 编辑 .env 配置
npm install
npm start
```

需要配合 **NapCat** 使用。NapCat 的 HTTP 上报地址配置为：

```
http://localhost:3002/
```

### QQ 机器人命令

| 命令 | 说明 |
|------|------|
| `#帮助` | 显示帮助 |
| `#测试` | 测试机器人 |
| `#授权 <插件> <用户> [IP数] [端口数] [天数]` | 授权插件（作者） |
| `#取消授权 <插件> <用户>` | 取消授权 |
| `#已获授权` | 查看自己的授权 |
| `#授权码` | 私聊发送授权码 |
| `#消息 <QQ号> <内容>` | 发送消息给好友 |

---

## 七、系统流程

```
1. 插件作者在授权中心为其他用户授权插件
       ↓
2. 系统生成授权码 (BC-XXXXXXXXXXXX)
       ↓
3. 被授权用户在「我的授权」页面查看授权码
       ↓
4. 用户在服务器的 config.yml 填写账号 + 授权码
       ↓
5. MC 插件启动时发送 account + auth_code 到后端验证
       ↓
6. 后端校验通过，启用插件
```

---

## 八、API 接口总览

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/register` | POST | 注册 |
| `/api/auth/login` | POST | 登录 |
| `/api/auth/send-code` | POST | 发送验证码 |
| `/api/users/me` | GET | 获取个人信息 |
| `/api/users/me/qq` | PUT/DELETE | 绑定/解绑 QQ |
| `/api/authorizations/my` | GET | 我的授权列表 |
| `/api/authorizations/grant` | POST | 授予授权 |
| `/api/authorizations/verify` | POST | MC 插件验证 |
| `/api/promotions/click` | POST | 记录推广点击 |
| `/api/promotions/stats` | GET | 推广统计数据 |
