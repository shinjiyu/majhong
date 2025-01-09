import { Color } from "../src/TilePattern";
import { PatternSolver } from '../src/PatternSolver';
import { TilePattern } from '../src/TilePattern';

let solver: PatternSolver;
let pattern: TilePattern;

solver = new PatternSolver();
pattern = new TilePattern();

pattern.addTile(1, Color.RED);
pattern.addTile(2, Color.RED);
pattern.addTile(3, Color.RED);
pattern.addTile(6, Color.RED);  // 无用牌
pattern.addTile(4, Color.BLACK, 2);
pattern.addTile(4, Color.BLUE);
pattern.addTile(4, Color.YELLOW);
pattern.addTile(7, Color.BLUE);
pattern.addTile(8, Color.BLUE);
pattern.addTile(9, Color.BLUE);
pattern.addTile(10, Color.BLUE);
const solution = solver.solve(pattern);
console.log('Solution:', JSON.stringify(solution, null, 2));
console.log('Combinations:', solution.combinations.map(comb => ({
    type: comb.type,
    tiles: comb.tiles.map(tile => ({
        number: tile.number,
        color: Color[tile.color]
    }))
})));