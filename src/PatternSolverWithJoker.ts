import { PatternSolver, Solution } from "./PatternSolver";
import { Combination, StandardForm } from "./StandardForm";
import { Color, TilePattern } from "./TilePattern";

export class PatternSolverWithJoker extends PatternSolver {
    constructor() {
        super();
    }

    /**
     * 生成带有癞子数量的缓存键
     * @private
     */
    private getCacheKey(pattern: TilePattern, jokerCount: number): string {
        return `${pattern.getCanonicalId()}_joker${jokerCount}`;
    }

    solveWithJoker(pattern: TilePattern, jokerCount: 0 | 1 | 2): Solution {
        if (jokerCount === 0) {
            return this.solve(pattern);
        }

        if (jokerCount === 1) {
            return this.dealSingleJoker(pattern);
        } else {
            return this.dealDoubleJoker(pattern);
        }
    }

    dealSingleJoker(pattern: TilePattern): Solution {
        let standardForm = StandardForm.fromPattern(pattern);

        // 尝试从缓存获取结果
        const cacheKey = this.getCacheKey(standardForm.pattern, 1);
        const cachedSolution = this.cache.get(standardForm.pattern, cacheKey, 1);
        if (cachedSolution) {
            return this.restoreSolution(cachedSolution, standardForm);
        }

        let sequenceCombinations = this.getJokerSequenceCombinations(standardForm.pattern, 1, 3);
        let tripletCombinations = this.getJokerTripletCombinations(standardForm.pattern, 1, 3);

        this.adjustJokerSequence(sequenceCombinations);

        let combinations = [...sequenceCombinations, ...tripletCombinations];

        const solution = this.findBestSolution(combinations, standardForm.pattern, this.solve.bind(this));
        
        // 将结果存入缓存（存储标准型的解）
        const standardSolution = {
            score: solution.score,
            combinations: solution.combinations.map(comb => ({
                ...comb,
                tiles: comb.tiles.map(tile => ({
                    ...tile,
                    number: ((tile.number - standardForm.numberOffset - 1 + 13) % 13) + 1,
                    color: standardForm.colorMapping[tile.color]
                }))
            }))
        };
        this.cache.set(standardForm.pattern, standardSolution, cacheKey, 1);
        
        return this.restoreSolution(solution, standardForm);
    }

    dealDoubleJoker(pattern: TilePattern): Solution {
        let standardForm = StandardForm.fromPattern(pattern);

        // 尝试从缓存获取结果
        const cacheKey = this.getCacheKey(standardForm.pattern, 2);
        const cachedSolution = this.cache.get(standardForm.pattern, cacheKey, 2);
        if (cachedSolution) {
            return this.restoreSolution(cachedSolution, standardForm);
        }

        let solution1 = this.findBestSolutionWithTwoJokersTogether(standardForm.pattern);
        let solution2 = this.findBestSolutionWithTwoJokersSeparately(standardForm.pattern);

        if (solution1.score === solution2.score) {
            const solution1TileCount = solution1.combinations.reduce((sum, comb) => sum + comb.tiles.length, 0);
            const solution2TileCount = solution2.combinations.reduce((sum, comb) => sum + comb.tiles.length, 0);
            solution1 = solution1TileCount >= solution2TileCount ? solution1 : solution2;
        } else {
            solution1 = solution1.score > solution2.score ? solution1 : solution2;
        }

        // 将结果存入缓存（存储标准型的解）
        const standardSolution = {
            score: solution1.score,
            combinations: solution1.combinations.map(comb => ({
                ...comb,
                tiles: comb.tiles.map(tile => ({
                    ...tile,
                    number: ((tile.number - standardForm.numberOffset - 1 + 13) % 13) + 1,
                    color: standardForm.colorMapping[tile.color]
                }))
            }))
        };
        this.cache.set(standardForm.pattern, standardSolution, cacheKey, 2);

        return this.restoreSolution(solution1, standardForm);
    }

    /**
     * 处理两个癞子牌一起使用的情况
     * 将两个癞子牌作为一个整体，用于组成顺子或刻子
     * @param pattern 当前牌型
     * @returns 最优解决方案
     */
    findBestSolutionWithTwoJokersTogether(pattern: TilePattern): Solution {
        // 获取所有可能的顺子组合
        let sequenceCombinations = this.getJokerSequenceCombinations(pattern, 2, 3);
        // 获取所有可能的刻子组合 
        let tripletCombinations = this.getJokerTripletCombinations(pattern, 2, 3);

        // 调整顺子组合中癞子牌的位置
        this.adjustJokerSequence(sequenceCombinations);

        // 合并所有组合并寻找最优解
        return this.findBestSolution([...sequenceCombinations, ...tripletCombinations], pattern, this.solve.bind(this));
    }

    findBestSolutionWithTwoJokersSeparately(pattern: TilePattern): Solution {
        let sequenceCombinations = this.getJokerSequenceCombinations(pattern, 1, 2);
        let tripletCombinations = this.getJokerTripletCombinations(pattern, 1, 2);

        this.adjustJokerSequence(sequenceCombinations);

        return this.findBestSolution([...sequenceCombinations, ...tripletCombinations], pattern, this.dealSingleJoker.bind(this));
    }

    private findBestSolution(combinations: Combination[], pattern: TilePattern, solver: (pattern: TilePattern) => Solution) {
        let bestSolution: Solution = {
            score: 0,
            combinations: []
        };

        combinations.forEach(combination => {
            let remainPattern = pattern.clone();
            // Remove non-joker tiles from pattern
            combination.tiles.forEach(tile => {
                if (!tile.isJoker) {
                    remainPattern.removeTile(tile.number, tile.color);
                }
            });

            // Get solution for remaining pattern
            let solution = solver(remainPattern);

            let score = combination.tiles.reduce((sum, tile) => sum + tile.number, 0);

            solution.combinations.push({
                type: combination.type,
                tiles: combination.tiles,
                score: score
            });

            solution.score += score;
            // Update best solution if current is better
            if (solution.score > bestSolution.score) {
                bestSolution = solution;
            } else if (solution.score === bestSolution.score) {
                // If scores are equal, prefer solution with more tiles
                const bestTileCount = bestSolution.combinations.reduce((sum, comb) => sum + comb.tiles.length, 0);
                const currentTileCount = solution.combinations.reduce((sum, comb) => sum + comb.tiles.length, 0);
                if (currentTileCount > bestTileCount) {
                    bestSolution = solution;
                }
            }
        });

        return bestSolution;
    }

    getJokerSequenceCombinations(pattern: TilePattern, jokerCount: 1 | 2, minConnectivity: number): Combination[] {
        //get series with joker
        const combinations: Combination[] = [];

        let start = 0;
        // 遍历所有颜色
        for (let color = 0; color < 4; color++) {
            //尝试以每一个数字为起点，看看能不能形成顺子
            for (let i = 1; i <= 13; i++) {
                if (pattern.getTileCount(i, color as Color) > 0) {
                    start = i;
                    let jokerRemain: number = jokerCount;
                    let combination: Combination = {
                        type: 'sequence',
                        tiles: [{
                            number: start,
                            color: color as Color
                        }]
                    }
                    let flagUseJoker = false;
                    //多计算一步14，方便补joker
                    for (let j = i + 1; j <= 14; j++) {
                        //如果当前检查窗口中的牌足够形成顺子
                        //由joker结尾的牌型都计算过了
                        if (j - i + jokerRemain >= 3 && j - i + jokerRemain <= 13 && !flagUseJoker) {
                            let remainPattern = pattern.clone();
                            //移除当前选中窗口
                            for (let k = start; k < j; k++) {
                                remainPattern.removeTile(k, color as Color);
                            }

                            let canPick = true;
                            if (start > 1) {
                                const connectivity = remainPattern.getTileConnectivity(start - 1, color as Color);
                                //如果前一格有牌且连通值小于最小连通值，则不能选
                                if (connectivity < minConnectivity && connectivity > 0) {
                                    canPick = false;
                                }
                            }

                            if (j <= 13) {
                                const connectivity = remainPattern.getTileConnectivity(j, color as Color);
                                //如果后一格有牌且连通值小于最小连通值，则不能选
                                if (connectivity < minConnectivity && connectivity > 0) {
                                    canPick = false;
                                }
                            }

                            if (canPick) {
                                let addPos = j;
                                let step = 1;

                                let newCombination: Combination = {
                                    type: 'sequence',
                                    tiles: combination.tiles.slice()
                                }

                                //默认右补joker，如果到13，则左补joker
                                let toAddJokerCount = jokerRemain;
                                while (toAddJokerCount > 0) {
                                    if (addPos > 13) {
                                        addPos = start - 1;
                                        step = -1;
                                    }

                                    newCombination.tiles.push({
                                        number: addPos,
                                        color: color as Color,
                                        isJoker: true
                                    });

                                    toAddJokerCount--;
                                    addPos += step;
                                }

                                combinations.push(newCombination);
                            }
                        }

                        //连续判断
                        if (pattern.getTileCount(j, color as Color) === 0) {
                            if (jokerRemain === 0) {
                                break;
                            }
                            jokerRemain--;
                            flagUseJoker = true;
                            combination.tiles.push({
                                number: j,
                                color: color as Color,
                                isJoker: true
                            });
                        }
                        else {
                            flagUseJoker = false;
                            combination.tiles.push({
                                number: j,
                                color: color as Color
                            });
                        }
                    }

                }
            }
            // TODO: 处理每个区间的逻辑
        }
        return combinations;
    }

    getJokerTripletCombinations(pattern: TilePattern, jokerCount: 1 | 2, minConnectivity: number): Combination[] {
        let combinations: Combination[] = [];
        if (jokerCount === 1) {
            for (let i = 1; i <= 13; i++) {
                let colors = pattern.getColorsWithTiles(i);

                if (colors.length < 2) {
                    continue;
                }

                let possibleCombinations = [];
                // 遍历所有可能的两张牌组合
                for (let j = 0; j < colors.length; j++) {
                    for (let k = j + 1; k < colors.length; k++) {
                        possibleCombinations.push([colors[j], colors[k]]);
                        for (let l = k + 1; l < colors.length; l++) {
                            possibleCombinations.push([colors[j], colors[k], colors[l]]);
                        }
                    }
                }

                possibleCombinations.forEach(comb => {
                    //打一个对子组成刻子
                    let remainPattern = pattern.clone();
                    remainPattern.removeTile(i, comb[0]);
                    remainPattern.removeTile(i, comb[1]);
                    comb.length > 2 && remainPattern.removeTile(i, comb[2]);

                    let canPick = colors.every(color => {
                        // Skip checking colors that are part of the combination
                        if (comb.includes(color)) {
                            return true;
                        }
                        // For remaining colors, check if they meet minimum connectivity
                        return remainPattern.getTileConnectivity(i, color as Color) >= minConnectivity;
                    });

                    if (canPick) {
                        // Get colors not used in current combination
                        const unusedColors = [0, 1, 2, 3].filter(c => !comb.includes(c));
                        // Pick first unused color for joker
                        const jokerColor = unusedColors[0];

                        combinations.push({
                            type: 'triplet',
                            tiles: [
                                ...comb.map(color => ({ number: i, color: color as Color })),
                                { number: i, color: jokerColor, isJoker: true }
                            ]
                        });
                    }
                });

            }
        }
        else if (jokerCount === 2) {
            //两张joker不与单牌组成刻子，原因在于只有跟13组成刻子时，才可能比顺子大。
            //所以我们只需要把在顺子中搜到的  JOKER JOKER 13 改成一个刻子即可。
            //因此，两个joker的时候，要搜与两张牌组成4个刻子的情况。
            for (let i = 1; i <= 13; i++) {
                let colors = pattern.getColorsWithTiles(i);
                if (colors.length < 2) {
                    continue;
                }

                let possibleCombinations = [];
                // 遍历所有可能的两张牌组合
                for (let j = 0; j < colors.length; j++) {
                    for (let k = j + 1; k < colors.length; k++) {
                        possibleCombinations.push([colors[j], colors[k]]);
                    }
                }

                possibleCombinations.forEach(comb => {
                    //打一个对子组成刻子
                    let remainPattern = pattern.clone();
                    remainPattern.removeTile(i, comb[0]);
                    remainPattern.removeTile(i, comb[1]);

                    let canPick = colors.every(color => {
                        // Skip checking colors that are part of the combination
                        if (comb.includes(color)) {
                            return true;
                        }
                        // For remaining colors, check if they meet minimum connectivity
                        return remainPattern.getTileConnectivity(i, color as Color) >= minConnectivity;
                    });

                    if (canPick) {
                        // Get colors not used in current combination
                        const unusedColors = [0, 1, 2, 3].filter(c => !comb.includes(c));

                        combinations.push({
                            type: 'triplet',
                            tiles: [
                                ...comb.map(color => ({ number: i, color: color as Color })),
                                ...unusedColors.map(color => ({ number: i, color: color as Color, isJoker: true }))
                            ]
                        });
                    }
                });
            }
        }
        return combinations;
    }

    adjustJokerSequence(combinations: Combination[]) {
        combinations.forEach(comb => {
            if (comb.type === 'sequence' && comb.tiles.length === 3) {
                let jokerCount = comb.tiles.filter(t => t.isJoker).length;
                let hasThirteen = comb.tiles.some(t => t.number === 13 && !t.isJoker);

                if (jokerCount === 2 && hasThirteen) {
                    // Convert to triplet with 13
                    comb.type = 'triplet';
                    // Find the non-joker tile with number 13
                    const thirteenTile = comb.tiles.find(t => t.number === 13 && !t.isJoker)!;
                    // Get colors not used by the existing 13
                    const unusedColors = [0, 1, 2, 3].filter(c => c !== thirteenTile.color);
                    // Replace jokers with 13s of different colors
                    comb.tiles = comb.tiles.map(t => {
                        if (t.isJoker) {
                            const color = unusedColors.pop()!;
                            return { number: 13, color: color as Color };
                        }
                        return t;
                    });
                }
            }
        });
    }
}