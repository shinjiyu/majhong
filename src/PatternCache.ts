import { TilePattern } from './TilePattern';
import type { Solution } from './PatternSolver';
import * as fs from 'fs';
import * as path from 'path';

export interface CacheStats {
    hits: number;
    lastAccessed: number;
}

interface SerializedCache {
    patterns: { [key: string]: Solution };
    stats: { [key: string]: CacheStats };
    lastSaved: number;
}

export class PatternCache {
    private static instance: PatternCache | undefined;
    private cache: Map<string, Solution>;
    private stats: Map<string, CacheStats>;
    private maxSize: number;
    private cacheFile: string;
    private isDirty: boolean;
    private lastSaved: number;
    private isInitialized: boolean;

    private constructor(maxSize: number = 10000) {
        this.cache = new Map();
        this.stats = new Map();
        this.maxSize = maxSize;
        this.cacheFile = path.join(process.cwd(), 'pattern_cache.json');
        this.isDirty = false;
        this.lastSaved = Date.now();
        this.isInitialized = false;
    }

    static getInstance(): PatternCache {
        if (!PatternCache.instance) {
            PatternCache.instance = new PatternCache();
        }
        return PatternCache.instance;
    }

    /**
     * 初始化缓存，加载持久化数据
     * 这个方法应该在应用启动时显式调用
     */
    initialize(): void {
        if (this.isInitialized) return;
        this.loadCache();
        this.isInitialized = true;
    }

    private loadCache(): void {
        try {
            if (fs.existsSync(this.cacheFile)) {
                const data = fs.readFileSync(this.cacheFile, 'utf8');
                const serialized: SerializedCache = JSON.parse(data);
                
                // 恢复缓存数据
                this.cache = new Map(Object.entries(serialized.patterns));
                this.stats = new Map(Object.entries(serialized.stats));
                this.lastSaved = serialized.lastSaved;

                console.log(`Loaded ${this.cache.size} patterns from cache file`);
            }
        } catch (error) {
            console.error('Error loading cache:', error);
            // 如果加载失败，使用空缓存
            this.cache.clear();
            this.stats.clear();
        }
    }

    private saveCache(): void {
        if (!this.isDirty) return;

        try {
            const serialized: SerializedCache = {
                patterns: Object.fromEntries(this.cache),
                stats: Object.fromEntries(this.stats),
                lastSaved: Date.now()
            };

            const tempFile = `${this.cacheFile}.tmp`;
            // 先写入临时文件
            fs.writeFileSync(tempFile, JSON.stringify(serialized, null, 2));
            // 然后重命名，这样可以保证原子性写入
            fs.renameSync(tempFile, this.cacheFile);
            
            this.lastSaved = Date.now();
            this.isDirty = false;
            console.log(`Saved ${this.cache.size} patterns to cache file`);
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    }

    get(pattern: TilePattern): Solution | undefined {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }

        const id = pattern.getCanonicalId();
        const solution = this.cache.get(id);
        
        if (solution) {
            // 更新统计信息
            const stats = this.stats.get(id) || { hits: 0, lastAccessed: 0 };
            stats.hits++;
            stats.lastAccessed = Date.now();
            this.stats.set(id, stats);
            this.isDirty = true;
        }
        
        return solution;
    }

    set(pattern: TilePattern, solution: Solution): void {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }

        const id = pattern.getCanonicalId();
        
        // 如果缓存已满，移除最少使用的项
        if (this.cache.size >= this.maxSize) {
            this.evictLeastUsed();
        }
        
        this.cache.set(id, solution);
        this.stats.set(id, { hits: 1, lastAccessed: Date.now() });
        this.isDirty = true;
    }

    private evictLeastUsed(): void {
        let leastUsedId: string | null = null;
        let leastUsedScore = Infinity;
        
        for (const [id, stats] of this.stats.entries()) {
            // 计算使用分数：命中次数 / 距离上次访问的时间
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

    clear(): void {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }
        this.cache.clear();
        this.stats.clear();
        this.isDirty = true;
    }

    size(): number {
        return this.cache.size;
    }

    /**
     * 手动保存缓存到文件
     * 这个方法应该在合适的时机调用，比如：
     * 1. 程序正常退出前
     * 2. 处理完一批数据后
     * 3. 收到保存信号时
     */
    save(): void {
        if (!this.isInitialized) {
            throw new Error('Cache not initialized. Call initialize() first.');
        }
        this.saveCache();
    }

    /**
     * 获取缓存文件路径
     */
    getCacheFilePath(): string {
        return this.cacheFile;
    }

    /**
     * 销毁实例时的清理工作
     * 这个方法应该在程序退出前调用
     */
    destroy(): void {
        if (this.isInitialized) {
            this.saveCache();
        }
        PatternCache.instance = undefined;
    }
} 