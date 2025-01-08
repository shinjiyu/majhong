import { Color, TilePattern } from './TilePattern';

/**
 * 组合类型
 */
export enum CombinationType {
    SEQUENCE, // 顺子
    TRIPLET,  // 刻子
}

/**
 * 组合结构
 */
export interface Combination {
    type: CombinationType;
    tiles: {
        number: number;
        color: Color;
    }[];
    score: number;
}

/**
 * 牌型评分器类
 */
export class PatternScorer {
    /**
     * 计算牌型的最高分数
     * @param pattern 要计算的牌型
     * @returns 最高分数和对应的组合方式
     */
    static getMaxScore(pattern: TilePattern): { score: number; combinations: Combination[] } {
        const workingPattern = pattern.clone();
        const combinations: Combination[] = [];
        let totalScore = 0;

        // 1. 先找刻子
        const triplets = this.findTriplets(workingPattern);
        combinations.push(...triplets);
        totalScore += triplets.reduce((sum, t) => sum + t.score, 0);

        // 2. 再找顺子
        const sequences = this.findSequences(workingPattern);
        combinations.push(...sequences);
        totalScore += sequences.reduce((sum, s) => sum + s.score, 0);

        return {
            score: totalScore,
            combinations: combinations
        };
    }

    /**
     * 寻找所有可能的刻子
     * @param pattern 牌型
     * @returns 刻子组合列表
     * @private
     */
    private static findTriplets(pattern: TilePattern): Combination[] {
        const triplets: Combination[] = [];

        for (let number = 1; number <= 13; number++) {
            // 统计每个数字在不同颜色的数量
            const colorCounts = new Array(4).fill(0);
            for (let color = 0; color < 4; color++) {
                colorCounts[color] = pattern.getTileCount(number, color as Color);
            }

            // 如果有三种或更多颜色有牌，可以形成刻子
            while (colorCounts.filter(count => count > 0).length >= 3) {
                // 找出有牌的颜色
                const colors = colorCounts
                    .map((count, color) => ({ count, color }))
                    .filter(({ count }) => count > 0)
                    .slice(0, 3);  // 只取前三个

                // 创建刻子组合
                const triplet: Combination = {
                    type: CombinationType.TRIPLET,
                    tiles: colors.map(({ color }) => ({
                        number,
                        color: color as Color
                    })),
                    score: 3
                };

                // 移除这些牌
                for (const { color } of colors) {
                    colorCounts[color]--;
                    pattern.removeTile(number, color as Color);
                }

                triplets.push(triplet);
            }
        }

        return triplets;
    }

    /**
     * 寻找所有可能的顺子
     * @param pattern 牌型
     * @returns 顺子组合列表
     * @private
     */
    private static findSequences(pattern: TilePattern): Combination[] {
        const sequences: Combination[] = [];

        for (let color = 0; color < 4; color++) {
            for (let startNum = 1; startNum <= 11; startNum++) {
                while (
                    pattern.getTileCount(startNum, color as Color) > 0 &&
                    pattern.getTileCount(startNum + 1, color as Color) > 0 &&
                    pattern.getTileCount(startNum + 2, color as Color) > 0
                ) {
                    // 创建顺子组合
                    const sequence: Combination = {
                        type: CombinationType.SEQUENCE,
                        tiles: [
                            { number: startNum, color: color as Color },
                            { number: startNum + 1, color: color as Color },
                            { number: startNum + 2, color: color as Color }
                        ],
                        score: 3
                    };

                    // 移除这些牌
                    pattern.removeTile(startNum, color as Color);
                    pattern.removeTile(startNum + 1, color as Color);
                    pattern.removeTile(startNum + 2, color as Color);

                    sequences.push(sequence);
                }
            }
        }

        return sequences;
    }

    /**
     * 检查是否是有效的顺子
     * @param tiles 要检查的牌
     * @returns 是否是有效的顺子
     */
    static isValidSequence(tiles: { number: number; color: Color }[]): boolean {
        if (tiles.length !== 3) return false;

        // 检查是否同色
        const color = tiles[0].color;
        if (!tiles.every(tile => tile.color === color)) return false;

        // 排序并检查是否连续
        const numbers = tiles.map(t => t.number).sort((a, b) => a - b);
        return numbers[1] === numbers[0] + 1 && numbers[2] === numbers[1] + 1;
    }

    /**
     * 检查是否是有效的刻子
     * @param tiles 要检查的牌
     * @returns 是否是有效的刻子
     */
    static isValidTriplet(tiles: { number: number; color: Color }[]): boolean {
        if (tiles.length !== 3) return false;

        // 检查数字是否相同
        const number = tiles[0].number;
        if (!tiles.every(tile => tile.number === number)) return false;

        // 检查颜色是否不同
        const colors = new Set(tiles.map(t => t.color));
        return colors.size === 3;
    }
} 