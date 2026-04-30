-- ============================================
-- Beacon 插件授权系统 - 数据库初始化脚本
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    role ENUM('user', 'developer', 'admin', 'superadmin') DEFAULT 'user',
    amethysts INT DEFAULT 0,
    last_checkin_date DATE NULL,
    checkin_streak INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 验证码表
CREATE TABLE IF NOT EXISTS verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    type VARCHAR(20) DEFAULT 'register',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email_code (email, code)
);

-- 插件表（授权系统需要的基础表）
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO categories (name, description, sort_order) VALUES
('管理工具', '服务器管理和维护插件', 1),
('游戏机制', '修改玩法和机制的插件', 2),
('经济系统', '货币、交易相关的插件', 3),
('传送系统', '传送、家园相关的插件', 4),
('保护系统', '区域保护、防破坏插件', 5),
('娱乐扩展', '小游戏、娱乐功能插件', 6);

CREATE TABLE IF NOT EXISTS plugins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    english_name VARCHAR(100),
    description TEXT,
    icon_url VARCHAR(500),
    original_author VARCHAR(100),
    original_link VARCHAR(500),
    author_id INT,
    category_id INT,
    minecraft_version VARCHAR(20),
    plugin_type VARCHAR(50),
    is_open_source BOOLEAN DEFAULT FALSE,
    open_source_link VARCHAR(500),
    review_requested BOOLEAN DEFAULT FALSE,
    download_count INT DEFAULT 0,
    is_approved BOOLEAN DEFAULT FALSE,
    is_paid BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(20) DEFAULT '紫水晶',
    payment_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- 插件版本表
CREATE TABLE IF NOT EXISTS plugin_versions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    plugin_id INT,
    version_number VARCHAR(20) NOT NULL,
    download_link VARCHAR(500) NOT NULL,
    changelog TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
);
