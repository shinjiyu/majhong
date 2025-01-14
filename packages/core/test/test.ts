import { Color } from "../src/TilePattern";
import { PatternSolver } from '../src/PatternSolver';
import { PatternParser } from "../src/PatternParser";
import { PatternCache } from "../src/PatternCache";
import { PatternSolverWithJoker } from "../src/PatternSolverWithJoker";

async function main() {
    try {
        const cache = PatternCache.getInstance();
        await cache.initialize();

        const solver = new PatternSolver();
        const jokerSolver = new PatternSolverWithJoker();

        const testCases = [
            {
                name: "测试用例1",
                tiles: {
                    red: [2, 3, 4, 5],
                    black: [2, 5],
                    blue: [2, 5],
                    yellow: [2, 3, 4, 5]
                },
                jokerCount: 2
            },
            {
                name: "测试用例2",
                tiles: {
                    red: [11,12,12,13,13],
                    black: [11,12,12,13,13],
                    blue: [11,12,12,13,13],
                    yellow: [12,12,13,13]
                },
                jokerCount: 2
            },
        ];

        for (const testCase of testCases) {
            console.log(`\n测试用例: ${testCase.name}`);
            const startTime = process.hrtime();
            
            const pattern = PatternParser.fromJSON(testCase);
            const solution = jokerSolver.solveWithJoker(pattern, testCase.jokerCount as 0 | 1 | 2);
            
            const endTime = process.hrtime(startTime);
            const executionTime = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);
            
            console.log(`计算时间: ${executionTime}ms`);
            console.log('Solution:', JSON.stringify(solution, null, 2));
            console.log('Combinations:', solution.combinations.map(comb => ({
                type: comb.type,
                tiles: comb.tiles.map(tile => ({
                    number: tile.number,
                    color: Color[tile.color],
                    isJoker: tile.isJoker
                }))
            })));
        }

        // 在所有测试完成后保存缓存并退出
        console.log("\nSaving cache...");
        await cache.save();
        console.log("Cache saved.");
        await cache.destroy();
        console.log("Cache destroyed.");
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
