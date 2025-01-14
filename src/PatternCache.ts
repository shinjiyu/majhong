import { TilePattern } from './TilePattern';
import type { Solution } from './PatternSolver';
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import { ConfigLoader } from './config/DatabaseConfig';

interface PatternCacheRow extends RowDataPacket {
    pattern_id: string;
    solution: string;
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
    private hitRateStats: HitRateStats = {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        hitRate: 0,
        periodStart: Date.now(),
        periodEnd: Date.now()
    };

    private constructor(maxSize: number = 10000) {
        this.cache = new Map();
        this.stats = new Map();
        this.maxSize = maxSize;
        this.isDirty = false;
        this.isInitialized = false;
        this.resetHitRateStats();
    }

    private async initDB() {
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

        } catch (error) {
            console.error('Failed to initialize database connection:', error);
            throw error;
        }
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

    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        await this.initDB();
        await this.loadCache();
        this.isInitialized = true;
    }

    private async loadCache(): Promise<void> {
        if (!this.connection) return;

        try {
            const [rows] = await this.connection.execute<PatternCacheRow[]>('SELECT * FROM okey101_pattern_cache');
            if (Array.isArray(rows)) {
                for (const row of rows) {
                    this.cache.set(row.pattern_id, JSON.parse(row.solution));
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

            console.log(`Loaded ${this.cache.size} patterns from database`);
            console.log(`Current hit rate: ${(this.hitRateStats.hitRate * 100).toFixed(2)}%`);
        } catch (error) {
            console.error('Error loading cache from database:', error);
            this.cache.clear();
            this.stats.clear();
            this.resetHitRateStats();
        }
    }

    get(pattern: TilePattern, customKey?: string, jokerCount: number = 0): Solution | undefined {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }

        const id = customKey || pattern.getCanonicalId();
        const solution = this.cache.get(id);
        
        this.updateHitRateStats(!!solution);
        
        if (solution) {
            const stats = this.stats.get(id) || { hits: 0, lastAccessed: 0, jokerCount };
            stats.hits++;
            stats.lastAccessed = Date.now();
            this.stats.set(id, stats);
            this.isDirty = true;
        }
        
        return solution;
    }

    set(pattern: TilePattern, solution: Solution, customKey?: string, jokerCount: number = 0): void {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }

        const id = customKey || pattern.getCanonicalId();
        
        if (this.cache.size >= this.maxSize) {
            this.evictLeastUsed();
        }
        
        this.cache.set(id, solution);
        this.stats.set(id, { hits: 1, lastAccessed: Date.now(), jokerCount });
        this.isDirty = true;
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
            console.error('Failed to save cache to database:', error);
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

    async destroy(): Promise<void> {
        if (this.isDirty) {
            await this.save();
        }
        if (this.connection) {
            await this.connection.end();
        }
        PatternCache.instance = undefined;
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
}