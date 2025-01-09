import { Color, TilePattern } from './TilePattern';

/**
 * 牌型预处理器类
 * 用于去除不能组成顺子或刻子的牌
 */
export class PatternPreprocessor {
    /**
     * 预处理牌型，移除不能组成顺子或刻子的牌
     * @param pattern 要处理的牌型
     * @returns 处理后的牌型
     */
    static preprocess(pattern: TilePattern): TilePattern {
        const result = pattern.clone();
        const usefulTiles = new Set<string>();

        // 1. 标记能组成刻子的牌
        for (let number = 1; number <= 13; number++) {
            if (result.canFormTriplet(number)) {
                const colors = result.getColorsWithTiles(number);
                for (const color of colors) {
                    usefulTiles.add(`${number},${color}`);
                }
            }
        }

        // 2. 标记能组成顺子的牌
        for (let color = 0; color < 4; color++) {
            const currentColor = color as Color;
            const sequences = result.findContinuousSequences(currentColor);
            
            // 处理每个连续区间
            for (const [start, end] of sequences) {
                // 标记区间内的所有牌
                for (let number = start; number <= end; number++) {
                    usefulTiles.add(`${number},${color}`);
                }
            }
        }

        // 3. 移除无用的牌
        for (let number = 1; number <= 13; number++) {
            for (let color = 0; color < 4; color++) {
                const tileKey = `${number},${color}`;
                if (!usefulTiles.has(tileKey)) {
                    result.removeTile(number, color as Color);
                }
            }
        }

        return result;
    }

    /**
     * 获取预处理后被移除的牌
     * @param original 原始牌型
     * @param processed 处理后的牌型
     * @returns 被移除的牌列表
     */
    static getRemovedTiles(original: TilePattern, processed: TilePattern): Array<{number: number, color: Color}> {
        const removed: Array<{number: number, color: Color}> = [];
        
        for (let number = 1; number <= 13; number++) {
            for (let color = 0; color < 4; color++) {
                const currentColor = color as Color;
                const originalCount = original.getTileCount(number, currentColor);
                const processedCount = processed.getTileCount(number, currentColor);
                
                if (originalCount > processedCount) {
                    for (let i = 0; i < originalCount - processedCount; i++) {
                        removed.push({ number, color: currentColor });
                    }
                }
            }
        }
        
        return removed;
    }
} 