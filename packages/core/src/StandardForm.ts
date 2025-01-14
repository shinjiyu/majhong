import { Color, TilePattern } from './TilePattern';

export interface Tile {
    number: number;
    color: Color;
    isJoker?: boolean | undefined;
}

export interface Combination {
    type: 'sequence' | 'triplet';
    tiles: Tile[];
}

export class StandardForm {
    constructor(
        public pattern: TilePattern,
        public numberOffset: number,
        public colorMapping: number[],
        public inverseColorMapping: number[]
    ) { }


    static fromPatternForJoker(pattern: TilePattern): StandardForm {
        // Check if there are tiles with numbers greater than 11
        let hasLargeNumbers = false;
        for (let number = 12; number <= 13; number++) {
            for (let color = 0; color < 4; color++) {
                if (pattern.getTileCount(number, color) > 0) {
                    hasLargeNumbers = true;
                    break;
                }
            }
            if (hasLargeNumbers) break;
        }

        // If has large numbers, use 0 offset
        const numberOffset = hasLargeNumbers ? 0 : (() => {
            // Otherwise find minimum number for offset
            let minNumber = 14;
            for (let number = 1; number <= 13; number++) {
                for (let color = 0; color < 4; color++) {
                    if (pattern.getTileCount(number, color) > 0) {
                        minNumber = Math.min(minNumber, number);
                    }
                }
            }
            return (minNumber - 1) % 13;
        })();

        // Count usage of each color
        const colorUsage = new Array(4).fill(0);
        for (let number = 1; number <= 13; number++) {
            for (let color = 0; color < 4; color++) {
                colorUsage[color] += pattern.getTileCount(number, color);
            }
        }

        // Sort colors by usage count, maintain original order for ties
        const colorIndices = [0, 1, 2, 3];
        colorIndices.sort((a, b) => {
            const diff = colorUsage[b] - colorUsage[a];
            return diff !== 0 ? diff : a - b;
        });

        // Create color mappings
        const colorMapping = new Array(4).fill(0);
        const inverseColorMapping = new Array(4).fill(0);
        for (let i = 0; i < 4; i++) {
            colorMapping[colorIndices[i]] = i;
            inverseColorMapping[i] = colorIndices[i];
        }

        // Create standardized pattern
        const standardPattern = new TilePattern();
        for (let number = 1; number <= 13; number++) {
            for (let color = 0; color < 4; color++) {
                const count = pattern.getTileCount(number, color);
                if (count > 0) {
                    const standardNumber = number - numberOffset;
                    const standardColor = colorMapping[color];
                    standardPattern.addTile(standardNumber, standardColor, count);
                }
            }
        }

        return new StandardForm(standardPattern, numberOffset, colorMapping, inverseColorMapping);
    }


    static fromPattern(pattern: TilePattern): StandardForm {
        // 找到最小的数字，计算偏移量
        let minNumber = 14;
        for (let number = 1; number <= 13; number++) {
            for (let color = 0; color < 4; color++) {
                if (pattern.getTileCount(number, color) > 0) {
                    minNumber = Math.min(minNumber, number);
                }
            }
        }
        const numberOffset = (minNumber - 1) % 13;

        // 统计每种颜色的使用次数
        const colorUsage = new Array(4).fill(0);
        for (let number = 1; number <= 13; number++) {
            for (let color = 0; color < 4; color++) {
                colorUsage[color] += pattern.getTileCount(number, color);
            }
        }

        // 根据使用次数对颜色进行排序，使用次数相同时保持原始顺序
        const colorIndices = [0, 1, 2, 3];
        colorIndices.sort((a, b) => {
            const diff = colorUsage[b] - colorUsage[a];
            return diff !== 0 ? diff : a - b;
        });

        // 创建颜色映射和反向映射
        const colorMapping = new Array(4).fill(0);
        const inverseColorMapping = new Array(4).fill(0);
        for (let i = 0; i < 4; i++) {
            colorMapping[colorIndices[i]] = i;
            inverseColorMapping[i] = colorIndices[i];
        }

        // 创建标准型牌型
        const standardPattern = new TilePattern();
        for (let number = 1; number <= 13; number++) {
            for (let color = 0; color < 4; color++) {
                const count = pattern.getTileCount(number, color);
                if (count > 0) {
                    const standardNumber = number - numberOffset;
                    const standardColor = colorMapping[color];
                    standardPattern.addTile(standardNumber, standardColor, count);
                }
            }
        }

        return new StandardForm(standardPattern, numberOffset, colorMapping, inverseColorMapping);
    }

    restoreCombination(combination: Combination): Combination {
        return {
            type: combination.type,
            tiles: combination.tiles.map(tile => ({
                number: tile.number + this.numberOffset,
                color: this.inverseColorMapping[tile.color]
            }))
        };
    }

    restoreTile(number: number, color: Color): [number, Color] {
        return [
            number + this.numberOffset,
            this.inverseColorMapping[color]
        ];
    }

    toString(): string {
        return `StandardForm(offset=${this.numberOffset}, pattern=${this.pattern.toString()})`;
    }
} 