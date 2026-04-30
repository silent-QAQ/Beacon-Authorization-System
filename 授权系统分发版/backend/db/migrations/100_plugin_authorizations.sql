CREATE TABLE IF NOT EXISTS plugin_authorizations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plugin_id INT NOT NULL,
    ip_limit INT DEFAULT 1,
    port_limit INT DEFAULT 1,
    used_ips TEXT,
    used_ports TEXT,
    auth_code VARCHAR(64) DEFAULT NULL COMMENT '授权码',
    expires_at TIMESTAMP NULL DEFAULT NULL COMMENT '授权过期时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_plugin (user_id, plugin_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plugin_id) REFERENCES plugins(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
