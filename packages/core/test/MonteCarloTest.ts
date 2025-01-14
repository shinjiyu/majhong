import { Color } from "../src/TilePattern";
import { PatternSolver } from '../src/PatternSolver';
import { PatternParser, PatternInput } from "../src/PatternParser";
import { PatternCache } from "../src/PatternCache";

class MonteCarloGenerator {
    // 每个数字每种颜色最多出现的次数
    private static readonly MAX_TILES_PER_NUMBER = 2;
    // 每种颜色的数字范围
    private static readonly MIN_NUMBER = 1;
    private static readonly MAX_NUMBER = 13;
    // 固定生成21张牌
    private static readonly TOTAL_TILES = 21;

    /**
     * 生成随机牌型
     */
    static generateRandomPattern(): PatternInput {
        // 初始化牌型
        const tiles = {
            red: [] as number[],
            black: [] as number[],
            blue: [] as number[],
            yellow: [] as number[]
        };

        // 记录每个数字每种颜色的使用次数
        const tileCount = new Map<string, number>();
        // 记录已生成的牌数
        let generatedTiles = 0;
        // 记录连续失败次数
        let consecutiveFailures = 0;
        const maxConsecutiveFailures = 1000;

        while (generatedTiles < this.TOTAL_TILES && consecutiveFailures < maxConsecutiveFailures) {
            // 随机选择颜色和数字
            const color = Math.floor(Math.random() * 4);
            const number = Math.floor(Math.random() * (this.MAX_NUMBER - this.MIN_NUMBER + 1)) + this.MIN_NUMBER;
            const key = `${color}-${number}`;
            const colorName = Color[color].toLowerCase() as keyof typeof tiles;

            // 检查是否可以添加这张牌
            if (!tileCount.has(key)) {
                tileCount.set(key, 0);
            }

            if (tileCount.get(key)! < this.MAX_TILES_PER_NUMBER && 
                !tiles[colorName].includes(number)) {
                // 添加牌
                tiles[colorName].push(number);
                tileCount.set(key, tileCount.get(key)! + 1);
                generatedTiles++;
                consecutiveFailures = 0;
            } else {
                consecutiveFailures++;
            }
        }

        if (generatedTiles < this.TOTAL_TILES) {
            console.warn(`只能生成 ${generatedTiles} 张牌，无法达到目标的 ${this.TOTAL_TILES} 张`);
        }

        // 对每种颜色的牌进行排序
        for (const color in tiles) {
            tiles[color as keyof typeof tiles].sort((a, b) => a - b);
        }

        // 计算每种颜色的牌数
        const colorCounts = Object.entries(tiles).map(([color, numbers]) => 
            `${color}: ${numbers.length}张`
        ).join(', ');

        return {
            name: `随机牌型-${Date.now()} (${colorCounts})`,
            tiles
        };
    }

    /**
     * 生成一组随机牌型
     * @param count 生成的牌型数量
     */
    static generateTestCases(count: number): PatternInput[] {
        const testCases: PatternInput[] = [];
        for (let i = 0; i < count; i++) {
            testCases.push(this.generateRandomPattern());
        }
        return testCases;
    }

    /**
     * 验证牌型是否有效
     * @param pattern 要验证的牌型
     */
    static validatePattern(pattern: PatternInput): boolean {
        // 计算总牌数
        const totalTiles = Object.values(pattern.tiles)
            .reduce((sum, tiles) => sum + tiles.length, 0);

        if (totalTiles !== this.TOTAL_TILES) {
            console.error(`牌数不正确: ${totalTiles} != ${this.TOTAL_TILES}`);
            return false;
        }

        // 检查每种牌的数量
        const tileCount = new Map<string, number>();
        for (const [colorName, numbers] of Object.entries(pattern.tiles)) {
            const color = Color[colorName.toUpperCase() as keyof typeof Color];
            for (const number of numbers) {
                const key = `${color}-${number}`;
                if (!tileCount.has(key)) {
                    tileCount.set(key, 0);
                }
                tileCount.set(key, tileCount.get(key)! + 1);
                if (tileCount.get(key)! > this.MAX_TILES_PER_NUMBER) {
                    console.error(`${colorName} ${number} 超过最大数量: ${tileCount.get(key)}`);
                    return false;
                }
            }
        }

        return true;
    }
}

interface TestResult {
    pattern: PatternInput;
    solution: any;
    generateTime: number;
    solveTime: number;
}

interface TestStatistics {
    totalTests: number;
    totalGenerateTime: number;
    totalSolveTime: number;
    averageGenerateTime: number;
    averageSolveTime: number;
    minGenerateTime: number;
    maxGenerateTime: number;
    minSolveTime: number;
    maxSolveTime: number;
}

function runTests(count: number): TestStatistics {
    // 初始化缓存
    const cache = PatternCache.getInstance();
    cache.initialize();

    // 创建求解器
    const solver = new PatternSolver();

    console.log(`\n开始测试 ${count} 个随机牌型...\n`);

    const results: TestResult[] = [];
    const stats: TestStatistics = {
        totalTests: count,
        totalGenerateTime: 0,
        totalSolveTime: 0,
        averageGenerateTime: 0,
        averageSolveTime: 0,
        minGenerateTime: Infinity,
        maxGenerateTime: -Infinity,
        minSolveTime: Infinity,
        maxSolveTime: -Infinity
    };

    for (let i = 0; i < count; i++) {
        // 生成牌型并计时
        const generateStart = performance.now();
        const pattern = MonteCarloGenerator.generateRandomPattern();
        const generateTime = performance.now() - generateStart;

        // 验证牌型
        if (!MonteCarloGenerator.validatePattern(pattern)) {
            console.error('牌型验证失败，跳过此测试用例');
            continue;
        }

        // 求解并计时
        const solveStart = performance.now();
        const parsedPattern = PatternParser.fromJSON(pattern);
        const solution = solver.solve(parsedPattern);
        const solveTime = performance.now() - solveStart;

        // 记录结果
        results.push({
            pattern,
            solution,
            generateTime,
            solveTime
        });

        // 更新统计信息
        stats.totalGenerateTime += generateTime;
        stats.totalSolveTime += solveTime;
        stats.minGenerateTime = Math.min(stats.minGenerateTime, generateTime);
        stats.maxGenerateTime = Math.max(stats.maxGenerateTime, generateTime);
        stats.minSolveTime = Math.min(stats.minSolveTime, solveTime);
        stats.maxSolveTime = Math.max(stats.maxSolveTime, solveTime);

        // 输出每个测试用例的信息
        console.log(`\n测试用例 ${i + 1}/${count}: ${pattern.name}`);
        console.log(`生成用时: ${generateTime.toFixed(2)}ms`);
        console.log(`求解用时: ${solveTime.toFixed(2)}ms`);
        console.log('输入牌型:', JSON.stringify(pattern.tiles, null, 2));
        console.log('组合:', solution.combinations.map(comb => ({
            type: comb.type,
            tiles: comb.tiles.map(tile => ({
                number: tile.number,
                color: Color[tile.color]
            }))
        })));
    }

    // 计算平均值
    const validTests = results.length;
    stats.averageGenerateTime = stats.totalGenerateTime / validTests;
    stats.averageSolveTime = stats.totalSolveTime / validTests;

    // 输出统计信息
    console.log('\n性能统计:');
    console.log(`总测试数: ${validTests}/${count}`);
    console.log(`总生成用时: ${stats.totalGenerateTime.toFixed(2)}ms`);
    console.log(`总求解用时: ${stats.totalSolveTime.toFixed(2)}ms`);
    console.log(`平均生成用时: ${stats.averageGenerateTime.toFixed(2)}ms`);
    console.log(`平均求解用时: ${stats.averageSolveTime.toFixed(2)}ms`);
    console.log(`最短生成用时: ${stats.minGenerateTime.toFixed(2)}ms`);
    console.log(`最长生成用时: ${stats.maxGenerateTime.toFixed(2)}ms`);
    console.log(`最短求解用时: ${stats.minSolveTime.toFixed(2)}ms`);
    console.log(`最长求解用时: ${stats.maxSolveTime.toFixed(2)}ms`);

    // 输出缓存统计信息
    const cacheStats = cache.getDetailedStats();
    console.log('\n缓存统计:');
    console.log(`总请求数: ${cacheStats.hitRate.totalRequests}`);
    console.log(`命中次数: ${cacheStats.hitRate.cacheHits}`);
    console.log(`未命中次数: ${cacheStats.hitRate.cacheMisses}`);
    console.log(`命中率: ${(cacheStats.hitRate.hitRate * 100).toFixed(2)}%`);
    console.log(`缓存大小: ${cacheStats.cacheSize}/${cacheStats.maxSize}`);

    // 清理缓存
    process.on('beforeExit', () => {
        console.log("\nSaving cache...");
        cache.save();
        console.log("Cache saved.");
        cache.destroy();
        console.log("Cache destroyed.");
    });

    return stats;
}

// 运行测试
const TEST_COUNT = 100000;
const stats = runTests(TEST_COUNT); 