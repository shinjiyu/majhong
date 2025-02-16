import { RowDataPacket } from 'mysql2';
import mysql from 'mysql2/promise';
import { ConfigLoader } from './config/DatabaseConfig';
import type { Solution } from './PatternSolver';
import { TilePattern } from './TilePattern';

interface PatternCacheRow extends RowDataPacket {
    pattern_id: string;
    score: number;
    combinations: string;
    hits: number;
    last_accessed: number;
    joker_count: number;
}

interface HitRateStatsRow extends RowDataPacket {
    total_requests: number;
    cache_hits: number;
    cache_misses: number;
    hit_rate: number;
    period_start: number;
    period_end: number;
}

export interface CacheStats {
    hits: number;
    lastAccessed: number;
    jokerCount: number;
}

export interface HitRateStats {
    totalRequests: number;
    cacheHits: number;
    cacheMisses: number;
    hitRate: number;
    periodStart: number;
    periodEnd: number;
}

export class PatternCache {
    private static instance: PatternCache | undefined;
    private cache: Map<string, Solution>;
    private stats: Map<string, CacheStats>;
    private maxSize: number;
    private isDirty: boolean;
    private isInitialized: boolean;
    private connection: mysql.Connection | null = null;
    private syncInterval: NodeJS.Timeout | null = null;
    private batchInserts: Map<string, { solution: Solution, stats: CacheStats }> = new Map();
    private hitRateStats: HitRateStats = {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0,
        periodStart: Date.now(),
        periodEnd: Date.now()
    };

    private constructor(maxSize: number = 1000) {
        this.cache = new Map();
        this.stats = new Map();
        this.maxSize = maxSize;
        this.isDirty = false;
        this.isInitialized = false;
        this.resetHitRateStats();
    }

    private async initDB(autoSync: boolean = false) {
        try {
            const config = ConfigLoader.getInstance().getDatabaseConfig();
            this.connection = await mysql.createConnection(config);

            // 读取并执行初始化SQL文件
            const fs = require('fs');
            const path = require('path');
            const initSQL = fs.readFileSync(path.join(__dirname, '../tools/dbinit.sql'), 'utf8');

            // 分割SQL语句并执行
            const statements = initSQL.split(';').filter((stmt: string) => stmt.trim());
            for (const statement of statements) {
                if (statement.trim()) {
                    await this.connection.execute(statement);
                }
            }

            // 启动定期同步
            if (autoSync) {
                this.startPeriodicSync();
            }

        } catch (error) {
            throw error;
        }
    }

    private startPeriodicSync() {
        // 每5分钟同步一次
        this.syncInterval = setInterval(async () => {
            if (this.isDirty) {
                await this.syncBatchInserts();
            }
        }, 5 * 60 * 1000);
    }

    private async ensureConnection() {
        if (!this.connection || !this.connection.ping) {
            try {
                const config = ConfigLoader.getInstance().getDatabaseConfig();
                this.connection = await mysql.createConnection(config);
            } catch (error) {
                throw error;
            }
        }
    }

    private async syncBatchInserts() {
        if (this.batchInserts.size === 0) return;

        try {
            await this.ensureConnection();

            await this.connection!.beginTransaction();

            // 批量插入或更新缓存数据
            const values = [];
            for (const [id, { solution, stats }] of this.batchInserts.entries()) {
                values.push([
                    id,
                    solution.score,
                    JSON.stringify(solution.combinations),
                    stats.hits,
                    stats.lastAccessed,
                    stats.jokerCount
                ]);
            }

            if (values.length > 0) {
                await this.connection!.query(
                    `INSERT INTO okey101_pattern_cache 
                    (pattern_id, score, combinations, hits, last_accessed, joker_count) 
                    VALUES ? 
                    ON DUPLICATE KEY UPDATE 
                    score = VALUES(score),
                    combinations = VALUES(combinations),
                    hits = VALUES(hits),
                    last_accessed = VALUES(last_accessed),
                    joker_count = VALUES(joker_count)`,
                    [values]
                );
            }

            // 更新命中率统计
            const stats = [
                this.hitRateStats.totalRequests,
                this.hitRateStats.cacheHits,
                this.hitRateStats.cacheMisses,
                this.hitRateStats.hitRate,
                this.hitRateStats.periodStart,
                this.hitRateStats.periodEnd
            ];

            await this.connection!.execute(
                `INSERT INTO okey101_hit_rate_stats 
                (total_requests, cache_hits, cache_misses, hit_rate, period_start, period_end) 
                VALUES (?, ?, ?, ?, ?, ?)`,
                stats
            );

            await this.connection!.commit();

            this.batchInserts.clear();
            this.isDirty = false;

        } catch (error) {
            try {
                if (this.connection) {
                    await this.connection.rollback();
                }
            } catch (rollbackError) {
                // Ignore rollback error
            }

            // 如果是连接错误，尝试重新连接
            if ((error as any).code === 'PROTOCOL_CONNECTION_LOST' ||
                (error instanceof Error && error.message.includes('closed state'))) {
                this.connection = null;
            }
            throw error;
        }
    }

    private async loadCache(): Promise<void> {
        if (!this.connection) return;

        try {
            const [rows] = await this.connection.execute<PatternCacheRow[]>('SELECT * FROM okey101_pattern_cache');
            if (Array.isArray(rows)) {
                for (const row of rows) {
                    const solution: Solution = {
                        score: row.score,
                        combinations: JSON.parse(row.combinations)
                    };
                    this.cache.set(row.pattern_id, solution);
                    this.stats.set(row.pattern_id, {
                        hits: row.hits,
                        lastAccessed: row.last_accessed,
                        jokerCount: row.joker_count
                    });
                }
            }

            const [statsRows] = await this.connection.execute<HitRateStatsRow[]>(
                'SELECT * FROM okey101_hit_rate_stats ORDER BY id DESC LIMIT 1'
            );
            if (Array.isArray(statsRows) && statsRows.length > 0) {
                const row = statsRows[0];
                this.hitRateStats = {
                    totalRequests: row.total_requests,
                    cacheHits: row.cache_hits,
                    cacheMisses: row.cache_misses,
                    hitRate: row.hit_rate,
                    periodStart: row.period_start,
                    periodEnd: row.period_end
                };
            }
        } catch (error) {
            this.cache.clear();
            this.stats.clear();
            this.resetHitRateStats();
            throw error;
        }
    }

    set(pattern: TilePattern, solution: Solution, customKey?: string, jokerCount: number = 0): void {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }

        const id = customKey || pattern.getId();

        if (this.cache.size >= this.maxSize) {
            this.evictLeastUsed();
        }

        this.cache.set(id, solution);
        const stats = { hits: 1, lastAccessed: Date.now(), jokerCount };
        this.stats.set(id, stats);
        this.batchInserts.set(id, { solution, stats });
        this.isDirty = true;
    }

    async destroy(): Promise<void> {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }

        if (this.isDirty) {
            await this.syncBatchInserts();
        }

        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }

        this.isInitialized = false;
    }

    get(pattern: TilePattern, customKey?: string, jokerCount: number = 0): Solution | undefined {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }

        const id = customKey || pattern.getId();
        const solution = this.cache.get(id);

        this.updateHitRateStats(!!solution);

        if (solution) {
            const stats = this.stats.get(id) || { hits: 0, lastAccessed: 0, jokerCount };
            stats.hits++;
            stats.lastAccessed = Date.now();
            this.stats.set(id, stats);
            this.batchInserts.set(id, { solution, stats });
            this.isDirty = true;
        }

        return solution;
    }

    private evictLeastUsed(): void {
        let leastUsedId: string | null = null;
        let leastUsedScore = Infinity;

        for (const [id, stats] of this.stats.entries()) {
            const timeDiff = Date.now() - stats.lastAccessed;
            const score = stats.hits / (timeDiff + 1);

            if (score < leastUsedScore) {
                leastUsedScore = score;
                leastUsedId = id;
            }
        }

        if (leastUsedId) {
            this.cache.delete(leastUsedId);
            this.stats.delete(leastUsedId);
            this.isDirty = true;
        }
    }

    getStats(): Map<string, CacheStats> {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }
        return new Map(this.stats);
    }

    async save(): Promise<void> {
        if (!this.isInitialized || !this.isDirty || !this.connection) {
            return;
        }

        try {
            // Begin transaction
            await this.connection.beginTransaction();

            // Clear existing data
            await this.connection.execute('TRUNCATE TABLE okey101_pattern_cache');
            await this.connection.execute('TRUNCATE TABLE okey101_hit_rate_stats');

            // Insert all patterns
            for (const [id, solution] of this.cache.entries()) {
                const stats = this.stats.get(id);
                if (stats) {
                    await this.connection.execute(
                        'INSERT INTO okey101_pattern_cache (pattern_id, solution, hits, last_accessed, joker_count) VALUES (?, ?, ?, ?, ?)',
                        [id, JSON.stringify(solution), stats.hits, stats.lastAccessed, stats.jokerCount]
                    );
                }
            }

            // Save hit rate stats
            await this.connection.execute(
                'INSERT INTO okey101_hit_rate_stats (total_requests, cache_hits, cache_misses, hit_rate, period_start, period_end) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    this.hitRateStats.totalRequests,
                    this.hitRateStats.cacheHits,
                    this.hitRateStats.cacheMisses,
                    this.hitRateStats.hitRate,
                    this.hitRateStats.periodStart,
                    this.hitRateStats.periodEnd
                ]
            );

            // Commit transaction
            await this.connection.commit();
            this.isDirty = false;

        } catch (error) {
            if (this.connection) {
                await this.connection.rollback();
            }
            throw error;
        }
    }

    async clear(): Promise<void> {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }

        this.cache.clear();
        this.stats.clear();
        this.resetHitRateStats();
        this.isDirty = true;
    }

    size(): number {
        return this.cache.size;
    }

    getHitRateStats(): HitRateStats {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }
        return { ...this.hitRateStats };
    }

    resetStats(): void {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }

        this.resetHitRateStats();
        this.isDirty = true;
    }

    getDetailedStats(): {
        hitRate: HitRateStats;
        cacheSize: number;
        maxSize: number;
        itemStats: Map<string, CacheStats>;
    } {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }
        return {
            hitRate: { ...this.hitRateStats },
            cacheSize: this.cache.size,
            maxSize: this.maxSize,
            itemStats: new Map(this.stats)
        };
    }

    private updateHitRateStats(isHit: boolean): void {
        this.hitRateStats.totalRequests++;
        if (isHit) {
            this.hitRateStats.cacheHits++;
        } else {
            this.hitRateStats.cacheMisses++;
        }
        this.hitRateStats.hitRate = this.hitRateStats.cacheHits / this.hitRateStats.totalRequests;
        this.hitRateStats.periodEnd = Date.now();
        this.isDirty = true;
    }

    static getInstance(): PatternCache {
        if (!PatternCache.instance) {
            PatternCache.instance = new PatternCache();
        }
        return PatternCache.instance;
    }

    async initialize(initDB: boolean = true, autoSync: boolean = false): Promise<void> {
        if (this.isInitialized) return;
        if (initDB) {
            console.log('Initializing database...');
            await this.initDB(autoSync);
            console.log('Loading cache...');
            await this.loadCache();
            console.log('Cache initialized.');
        }
        this.isInitialized = true;
    }

    private resetHitRateStats(): void {
        this.hitRateStats = {
            totalRequests: 0,
            cacheHits: 0,
            cacheMisses: 0,
            hitRate: 0,
            periodStart: Date.now(),
            periodEnd: Date.now()
        };
    }

    // 新增：手动同步方法，用于 API 处理完成后调用
    async syncToDatabase(): Promise<void> {
        if (this.isDirty) {
            await this.syncBatchInserts();
        }
    }
}