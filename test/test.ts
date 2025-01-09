import { Color } from "../src/TilePattern";
import { PatternSolver } from '../src/PatternSolver';
import { PatternParser } from "../src/PatternParser";
import { PatternCache } from "../src/PatternCache";

const cache = PatternCache.getInstance();
cache.initialize();

process.on('beforeExit', () => {
    console.log("Saving cache...");
    cache.save();
    console.log("Cache saved.");
    cache.destroy();
    console.log("Cache destroyed.");
});


const solver = new PatternSolver();

const testCases = [
    {
        name: "测试用例1",
        tiles: {
            red: [2, 3, 4, 5],
            black: [2, 5],
            blue: [2, 5], 
            yellow: [2, 3, 4, 5]
        }
    },
    {
        name: "测试用例2", 
        tiles: {
            red: [1, 2, 3],
            black: [1, 2, 3],
            blue: [1, 2, 3],
            yellow: []
        }
    },
];

for (const testCase of testCases) {
    console.log(`\n测试用例: ${testCase.name}`);
    const pattern = PatternParser.fromJSON(testCase);
    const solution = solver.solve(pattern);
    console.log('Solution:', JSON.stringify(solution, null, 2));
    console.log('Combinations:', solution.combinations.map(comb => ({
        type: comb.type,
        tiles: comb.tiles.map(tile => ({
            number: tile.number,
            color: Color[tile.color]
        }))
    })));
}


