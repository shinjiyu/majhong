import { Color } from "../src/TilePattern";
import { PatternSolver } from '../src/PatternSolver';
import { PatternParser } from "../src/PatternParser";

let solver: PatternSolver;

solver = new PatternSolver();

const pattern = PatternParser.fromJSON({
    name: "测试牌型",
    tiles: {
        red: [2, 3, 4, 5],
        black: [2,5],
        blue: [2,5],
        yellow: [2,3,4,5]
    }
});
const solution = solver.solve(pattern);
console.log('Solution:', JSON.stringify(solution, null, 2));
console.log('Combinations:', solution.combinations.map(comb => ({
    type: comb.type,
    tiles: comb.tiles.map(tile => ({
        number: tile.number,
        color: Color[tile.color]
    }))
})));