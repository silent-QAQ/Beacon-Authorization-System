CREATE TABLE IF NOT EXISTS promotion_clicks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    link_name VARCHAR(255) NOT NULL COMMENT '链接名称',
    link_url VARCHAR(500) NOT NULL COMMENT '链接地址',
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点击时间',
    INDEX idx_clicked_at (clicked_at),
    INDEX idx_link_name (link_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='推广链接点击统计';
