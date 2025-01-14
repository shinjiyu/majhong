import { TilePattern } from './TilePattern';
import { StandardForm, Combination, Tile } from './StandardForm';
import { PatternPreprocessor } from './PatternPreprocessor';
import { PatternCache } from './PatternCache';

export interface ScoredCombination extends Combination {
    score: number;
}

export interface Solution {
    score: number;
    combinations: ScoredCombination[];
}

export class PatternSolver {
    protected cache: PatternCache;

    constructor() {
        this.cache = PatternCache.getInstance();
    }
    /**
     * 寻找牌型的最高分解法
     */
    solve(pattern: TilePattern): Solution {
        // 1. 预处理，去掉不可能参与组合的牌
        const preprocessed = PatternPreprocessor.preprocess(pattern);
        if (preprocessed.getTotalCount() === 0) {
            return { score: 0, combinations: [] };
        }

        // 2. 按连通性分割成子块
        const components = PatternPreprocessor.splitByConnectivity(preprocessed);

        // 3. 对每个子块求解
        const componentSolutions = components.map((component: TilePattern) => {
            // 3.1 转换为标准型
            const standardForm = StandardForm.fromPattern(component);
            // 3.2 求解标准型
            const standardSolution = this.solveStandardForm(standardForm.pattern);
            // 3.3 还原为原始牌型的解
            return this.restoreSolution(standardSolution, standardForm);
        });

        // 4. 合并所有子块的解
        return this.mergeSolutions(componentSolutions);
    }

    /**
     * 求解标准型
     * @private
     */
    private solveStandardForm(pattern: TilePattern): Solution {
        // 尝试从缓存获取结果
        const cachedSolution = this.cache.get(pattern);
        if (cachedSolution) {
            return cachedSolution;
        }

        // 如果缓存未命中，计算解决方案
        const solution = this.calculateStandardFormSolution(pattern);

        // 将结果存入缓存
        this.cache.set(pattern, solution);

        return solution;
    }

    /**
     * 实际计算标准型解决方案的方法
     * @private
     */
    private calculateStandardFormSolution(pattern: TilePattern): Solution {
        // 1. 找出所有可能的顺子
        const sequences = this.findAllSequences(pattern);

        // 2. 找出所有可能的刻子（包括特殊情况）
        const triplets = this.findAllTriplets(pattern);

        // 3. 使用迭代方式找出最佳组合
        return this.findBestCombination(pattern, sequences, triplets);
    }

    /**
     * 找出所有可能的顺子
     */
    private findAllSequences(pattern: TilePattern): Combination[] {
        const sequences: Combination[] = [];
        for (let color = 0; color < 4; color++) {
            const ranges = pattern.findContinuousSequences(color);
            for (const [start, end] of ranges) {
                sequences.push({
                    type: 'sequence',
                    tiles: Array.from(
                        { length: end - start + 1 },
                        (_, i) => ({ number: start + i, color })
                    )
                });
            }
        }
        return sequences;
    }

    /**
     * 找出所有可能的刻子，包括特殊情况
     */
    private findAllTriplets(pattern: TilePattern): Combination[] {
        const triplets: Combination[] = [];
        for (let number = 1; number <= 13; number++) {
            if (pattern.canFormTriplet(number)) {
                const colors = pattern.getColorsWithTiles(number);
                // 基本刻子：使用所有可用的牌
                triplets.push({
                    type: 'triplet',
                    tiles: colors.map(color => ({ number, color }))
                });

                // 特殊情况：如果有4张牌，检查每张牌是否可以作为顺子的一部分
                if (colors.length === 4) {
                    for (let i = 0; i < colors.length; i++) {
                        const color = colors[i];
                        if (pattern.isInSequence(number, color) && pattern.getTileCount(number, color) < 2) {
                            // 如果这张牌可以作为顺子的一部分，用其他三张牌组成刻子
                            const otherColors = colors.filter((_, index) => index !== i);
                            triplets.push({
                                type: 'triplet',
                                tiles: otherColors.map(c => ({ number, color: c }))
                            });
                        }else{
                            // 如果其他三种颜色的牌数量之和大于4，也可以用其他三张牌组成刻子
                            const otherColors = colors.filter((_, index) => index !== i);
                            const otherTotalCount = otherColors.reduce((sum, c) => sum + pattern.getTileCount(number, c), 0);
                            if (otherTotalCount > 4) {
                                triplets.push({
                                    type: 'triplet',
                                    tiles: otherColors.map(c => ({ number, color: c }))
                                });
                            }
                        }
                    }


                }
            }
        }
        return triplets;
    }

    /**
     * 找出最佳组合
     */
    private findBestCombination(pattern: TilePattern, sequences: Combination[], triplets: Combination[]): Solution {
        let bestScore = 0;
        let bestCombinations: ScoredCombination[] = [];

        // 尝试每个可能的组合
        const allCombinations = [...sequences, ...triplets];
        for (const combination of allCombinations) {
            // 1. 移除当前组合使用的牌
            const remainingPattern = pattern.clone();
            for (const tile of combination.tiles) {
                remainingPattern.removeTile(tile.number, tile.color);
            }

            // 2. 对剩余的牌进行标准化
            const standardForm = StandardForm.fromPattern(remainingPattern);

            // 3. 递归求解剩余的牌
            const subSolution = remainingPattern.getTotalCount() > 0 ?
                this.solveStandardForm(standardForm.pattern) :
                { score: 0, combinations: [] };

            // 将子解的组合还原回原始牌型
            const restoredSubSolution = this.restoreSolution(subSolution, standardForm);

            // 4. 计算当前组合的总分（当前组合的点数和 + 子解的分数）
            const currentScore = this.calculateScore(combination) + restoredSubSolution.score;

            // 5. 更新最佳解
            if (currentScore > bestScore) {
                bestScore = currentScore;
                bestCombinations = [
                    { ...combination, score: this.calculateScore(combination) },
                    ...restoredSubSolution.combinations
                ];
            }
        }

        return {
            score: bestScore,
            combinations: bestCombinations
        };
    }

    /**
     * 计算组合的分数
     * @param combination 要计算分数的组合
     * @returns 组合的分数（牌点数之和）
     */
    private calculateScore(combination: Combination): number {
        // 计算组合中所有牌的点数和
        return combination.tiles.reduce((sum, tile) => sum + tile.number, 0);
    }

    /**
     * 还原标准型的解为原始牌型的解
     */
    protected restoreSolution(solution: Solution, standardForm: StandardForm): Solution {
        const restoredCombinations = solution.combinations.map(combination => {
            const restored = standardForm.restoreCombination(combination);
            return {
                ...restored,
                score: this.calculateScore(restored)
            };
        });
        return {
            score: restoredCombinations.reduce((sum, comb) => sum + comb.score, 0),
            combinations: restoredCombinations
        };
    }

    /**
     * 合并多个解
     */
    private mergeSolutions(solutions: Solution[]): Solution {
        return {
            score: solutions.reduce((sum, solution) => sum + solution.score, 0),
            combinations: solutions.flatMap(solution => solution.combinations)
        };
    }

    /**
     * 获取缓存统计信息
     */
    getCacheStats(): Map<string, { hits: number, lastAccessed: number }> {
        return this.cache.getStats();
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.cache.clear();
    }

    // ... 其他现有方法 ...
} 