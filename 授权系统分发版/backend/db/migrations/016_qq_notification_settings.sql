ALTER TABLE qq_bindings 
ADD COLUMN qq_notification_enabled TINYINT(1) DEFAULT 0,
ADD COLUMN qq_notification_group_id VARCHAR(50) NULL,
ADD COLUMN qq_notify_message TINYINT(1) DEFAULT 1,
ADD COLUMN qq_notify_follow_update TINYINT(1) DEFAULT 1,
ADD COLUMN qq_notify_follow_new TINYINT(1) DEFAULT 1;

CREATE TABLE IF NOT EXISTS qq_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    qq_number BIGINT,
    group_id VARCHAR(50) NULL,
    notification_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'sending', 'sent', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
