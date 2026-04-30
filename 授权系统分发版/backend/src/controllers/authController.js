const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const VerificationCodeModel = require('../models/verificationCodeModel');
const QQBingModel = require('../models/qqBindingModel');
const sendEmail = require('../utils/sendEmail');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const sendVerificationCode = async (req, res) => {
    try {
        const { email, type = 'register' } = req.body;
        if (!email) return res.status(400).json({ message: 'Please provide an email address' });

        if (type === 'register') {
            const userExists = await UserModel.findByEmail(email);
            if (userExists) return res.status(400).json({ message: '该邮箱已被注册' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await VerificationCodeModel.create(email, code, type);

        const subject = 'Beacon 社区验证码';
        const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Beacon Community</h2>
            <p>您好，</p>
            <p>您的验证码是：<strong style="font-size: 24px; color: #059669;">${code}</strong></p>
            <p>该验证码将在 10 分钟后失效。如果是您本人操作，请尽快完成验证。</p>
            <p>如果这不是您本人的操作，请忽略此邮件。</p>
        </div>`;

        const { success, error: mailError } = await sendEmail(email, subject, html);

        if (success) {
            res.json({ success: true, message: '验证码已发送，请查收邮件' });
        } else {
            let message = '发送邮件失败，请检查邮箱地址或稍后重试';
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

const registerUser = async (req, res) => {
    try {
        const { username, email, password, code } = req.body;
        if (!username || !email || !password || !code) {
            return res.status(400).json({ message: '请填写所有必填项，包括验证码' });
        }

        const isValid = await VerificationCodeModel.verify(email, code, 'register');
        if (!isValid) return res.status(400).json({ message: '验证码无效或已过期' });

        const userExists = await UserModel.findByEmail(email);
        if (userExists) return res.status(400).json({ message: '该邮箱已被注册' });

        const usernameExists = await UserModel.findByUsername(username);
        if (usernameExists) return res.status(400).json({ message: '该用户名已被使用' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = await UserModel.create({ username, email, password_hash: hashedPassword });

        if (userId) {
            await VerificationCodeModel.deleteByEmail(email, 'register');

            let autoBoundQQ = null;
            const qqMatch = email.match(/^(\d{5,11})@qq\.com$/i);
            if (qqMatch) {
                try {
                    const qqNum = parseInt(qqMatch[1], 10);
                    await QQBingModel.create(qqNum, userId);
                    autoBoundQQ = qqNum;
                } catch (e) {
                    console.log('Auto-bind QQ failed (non-critical):', e.message);
                }
            }

            const createdUser = await UserModel.findById(userId);

            res.status(201).json({
                success: true,
                message: '注册成功',
                data: {
                    id: createdUser?.id ?? userId,
                    username: createdUser?.username ?? username,
                    email: createdUser?.email ?? email,
                    role: createdUser?.role ?? 'user',
                    qq_number: autoBoundQQ || createdUser?.qq_number || null,
                    created_at: createdUser?.created_at ?? null,
                    token: generateToken(userId)
                },
            });
        } else {
            res.status(400).json({ message: '注册失败，数据无效' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: '请填写邮箱和密码' });

        const user = await UserModel.findByEmail(email);
        if (!user) return res.status(400).json({ message: '邮箱或密码错误' });

        const passwordHash = user.password_hash || user.password;
        if (typeof passwordHash !== 'string' || passwordHash.length === 0) {
            return res.status(400).json({ message: '账号数据异常，请联系管理员' });
        }

        const isMatch = await bcrypt.compare(password, passwordHash);
        if (isMatch) {
            res.json({
                success: true,
                message: '登录成功',
                data: {
                    token: generateToken(user.id),
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        qq_number: user.qq_number ?? null,
                    },
                },
            });
        } else {
            res.status(400).json({ message: '邮箱或密码错误' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '服务器错误' });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id);
        if (!user) return res.status(404).json({ message: '用户不存在' });

        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { registerUser, loginUser, getMe, sendVerificationCode };
