import { PatternSolver, Solution } from "./PatternSolver";
import { TilePattern } from "./TilePattern";

export class PairPatterSolverWithJoker extends PatternSolver {
    constructor() {
        super();
    }

    solveWithJoker(pattern: TilePattern, jokerCount: 0 | 1 | 2): Solution {
        const solution: Solution = {
            score: 0,
            combinations: []
        };

        // 处理已有对子
        this.handleExistingPairs(pattern, solution);

        // 处理单张牌和百搭
        if (jokerCount > 0) {
            this.handleSingleTilesWithJoker(pattern, solution, jokerCount);
        }

        return solution;
    }

    private handleExistingPairs(pattern: TilePattern, solution: Solution): void {
        for (let number = 1; number <= 13; number++) {
            for (let color = 0; color < 4; color++) {
                if (pattern.getTileCount(number, color) === 2) {
                    const pairScore = number * 2;
                    solution.score += pairScore;
                    solution.combinations.push({
                        type: 'pair',
                        tiles: [
                            { number, color },
                            { number, color }
                        ],
                        score: pairScore
                    });
                }
            }
        }
    }

    private handleSingleTilesWithJoker(pattern: TilePattern, solution: Solution, jokerCount: number): void {
        const singleTiles = this.getSortedSingleTiles(pattern);

        for (let i = 0; i < Math.min(jokerCount, singleTiles.length); i++) {
            const tile = singleTiles[i];
            const pairScore = tile.number * 2;
            solution.score += pairScore;
            solution.combinations.push({
                type: 'pair',
                tiles: [
                    { number: tile.number, color: tile.color },
                    { number: tile.number, color: tile.color, isJoker: true }
                ],
                score: pairScore
            });
        }
    }

    private getSortedSingleTiles(pattern: TilePattern): { number: number, color: number }[] {
        const singleTiles: { number: number, color: number }[] = [];
        for (let number = 1; number <= 13; number++) {
            for (let color = 0; color < 4; color++) {
                if (pattern.getTileCount(number, color) === 1) {
                    singleTiles.push({ number, color });
                }
            }
        }
        return singleTiles.sort((a, b) => b.number - a.number);
    }
}