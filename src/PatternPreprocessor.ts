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

    /**
     * 按连通性分割牌型
     * 两张牌连通当且仅当：
     * 1. 颜色相同且数字相邻
     * 2. 数字相同且颜色不同
     * @param pattern 要分割的牌型
     * @returns 分割后的牌型列表
     */
    static splitByConnectivity(pattern: TilePattern): TilePattern[] {
        const visited = new Set<string>();
        const components: TilePattern[] = [];

        // 遍历所有牌
        for (let number = 1; number <= 13; number++) {
            for (let color = 0; color < 4; color++) {
                const key = `${number},${color}`;
                // 如果这张牌存在且未访问过
                if (pattern.getTileCount(number, color as Color) > 0 && !visited.has(key)) {
                    // 找出与这张牌连通的所有牌
                    const component = new TilePattern();
                    this.dfsCollectComponent(pattern, number, color as Color, visited, component);
                    components.push(component);
                }
            }
        }

        return components;
    }

    /**
     * 使用深度优先搜索收集连通分量
     * @param pattern 原始牌型
     * @param number 当前牌的数字
     * @param color 当前牌的颜色
     * @param visited 已访问的牌集合
     * @param component 当前收集的连通分量
     * @private
     */
    private static dfsCollectComponent(
        pattern: TilePattern,
        number: number,
        color: Color,
        visited: Set<string>,
        component: TilePattern
    ): void {
        const key = `${number},${color}`;
        if (visited.has(key)) return;

        // 标记当前牌为已访问
        visited.add(key);
        // 将当前牌添加到连通分量中
        const count = pattern.getTileCount(number, color);
        if (count > 0) {
            component.addTile(number, color, count);

            // 检查同数字不同颜色的牌
            for (let c = 0; c < 4; c++) {
                if (c !== color && pattern.getTileCount(number, c as Color) > 0) {
                    this.dfsCollectComponent(pattern, number, c as Color, visited, component);
                }
            }

            // 检查同色相邻数字的牌
            if (number > 1) {
                this.dfsCollectComponent(pattern, number - 1, color, visited, component);
            }
            if (number < 13) {
                this.dfsCollectComponent(pattern, number + 1, color, visited, component);
            }
        }
    }
} 