-- 创建模式缓存表
CREATE TABLE IF NOT EXISTS okey101_pattern_cache (
    pattern_id VARCHAR(255) PRIMARY KEY,
    score INT NOT NULL,
    combinations TEXT NOT NULL,  -- 使用TEXT存储序列化的组合数据
    hits INT DEFAULT 1,
    last_accessed BIGINT,
    joker_count TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_last_accessed (last_accessed),
    INDEX idx_hits (hits),
    INDEX idx_joker (joker_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 创建命中率统计表
CREATE TABLE IF NOT EXISTS okey101_hit_rate_stats (
    id INT PRIMARY KEY AUTO_INCREMENT,
    total_requests INT NOT NULL,
    cache_hits INT NOT NULL,
    cache_misses INT NOT NULL,
    hit_rate FLOAT NOT NULL,
    period_start BIGINT NOT NULL,
    period_end BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 