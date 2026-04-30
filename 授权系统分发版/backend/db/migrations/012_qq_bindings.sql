CREATE TABLE IF NOT EXISTS qq_bindings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qq_number BIGINT NOT NULL UNIQUE,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_qq_number (qq_number),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
