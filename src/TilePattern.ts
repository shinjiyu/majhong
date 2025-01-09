/**
 * 颜色枚举
 * 使用0-3的值便于位运算和数组索引
 */
export enum Color {
    RED = 0,    // 红色
    BLACK = 1,  // 黑色
    BLUE = 2,   // 蓝色
    YELLOW = 3  // 黄色
}

/**
 * 牌型类
 * 使用4个32位整数表示牌型，每个整数对应一种颜色
 * 每个数字占用2位，表示该位置的牌数量(0-3)
 */
export class TilePattern {
    // 4个32位整数，每个表示一种颜色的牌
    private colors: number[];
    // 缓存的标准形
    private canonicalFormCache: TilePattern | null = null;
    // 缓存的标准形ID
    private canonicalIdCache: string | null = null;

    /**
     * 构造函数
     * 初始化空牌型
     */
    constructor() {
        this.colors = new Array(4).fill(0);
    }

    /**
     * 添加指定数量的牌
     * @param number - 牌的数字(1-13)
     * @param color - 牌的颜色(Color枚举值)
     * @param count - 添加的数量(1-2)，默认为1
     * @throws Error 如果参数无效
     */
    addTile(number: number, color: Color, count: number = 1): void {
        // 参数检查
        if (number < 1 || number > 13) {
            throw new Error("Number must be between 1 and 13");
        }
        if (count < 1 || count > 2) {
            throw new Error("Count must be between 1 and 2");
        }

        // 计算位置和当前数量
        const pos = (number - 1) * 2;  // 每个数字占2位
        const current = (this.colors[color] >> pos) & 0b11;
        
        // 计算新的位值：00->01->11
        let newBits;
        // 使用位运算计算新的位值
        // 如果current为0，则根据count设置为01或11
        // 如果current为1且count为1，则设置为11
        // 如果current为1且count为2，或current为11，则抛出错误
        if ((current === 0b11) || (current === 0b01 && count === 0b10)) {
            throw new Error("Cannot add more tiles");
        }
        newBits = current === 0 ? (count & 0b10 ? 0b11 : 0b01) : 0b11;

        // 清除原位置
        this.colors[color] &= ~(0b11 << pos);
        // 设置新数量
        this.colors[color] |= (newBits << pos);

        // 清除缓存
        this.clearCache();
    }

    /**
     * 获取指定牌的数量
     * @param number - 牌的数字(1-13)
     * @param color - 牌的颜色(Color枚举值)
     * @returns 牌的数量(0-2)
     */
    getTileCount(number: number, color: Color): number {
        const pos = (number - 1) * 2;
        const bits = (this.colors[color] >> pos) & 0b11;
        // 00->0, 01->1, 11->2
        return bits === 0 ? 0 : bits === 1 ? 1 : 2;
    }

    /**
     * 移除指定数量的牌
     * @param number - 牌的数字(1-13)
     * @param color - 牌的颜色(Color枚举值)
     * @param count - 移除的数量(1-2)，默认为1
     * @returns 是否成功移除
     */
    removeTile(number: number, color: Color, count: number = 1): boolean {
        const pos = (number - 1) * 2;
        const current = (this.colors[color] >> pos) & 0b11;
        
        // 检查是否可以移除
        if (current === 0) return false;  // 没有牌可移除
        if (current === 1 && count > 1) return false;  // 只有一张牌，不能移除两张
        if(count > 2) return false;  // 移除的数量大于当前数量
        
        // 计算新的位值：11->01->00
        let newBits;
        if (current === 0b11) {  // 两张牌
            newBits = count === 1 ? 0b01 : 0b00;
        } else {  // 一张牌
            newBits = 0b00;
        }

        // 清除原位置
        this.colors[color] &= ~(0b11 << pos);
        // 设置新数量
        this.colors[color] |= (newBits << pos);
        
        // 清除缓存
        this.clearCache();
        return true;
    }

    /**
     * 获取牌型的整数表示
     * @returns 4个32位整数的数组
     */
    getPattern(): number[] {
        return [...this.colors];
    }

    /**
     * 从整数数组恢复牌型
     * @param pattern - 4个32位整数的数组
     */
    setPattern(pattern: number[]): void {
        if (!Array.isArray(pattern) || pattern.length !== 4) {
            throw new Error("Invalid pattern array");
        }
        this.colors = [...pattern];
        // 清除缓存
        this.clearCache();
    }

    /**
     * 清空牌型
     */
    clear(): void {
        this.colors.fill(0);
        // 清除缓存
        this.clearCache();
    }

    /**
     * 清除缓存
     * @private
     */
    private clearCache(): void {
        this.canonicalFormCache = null;
        this.canonicalIdCache = null;
    }

    /**
     * 获取总牌数
     * @returns 总牌数
     */
    getTotalCount(): number {
        let total = 0;
        for (let color = 0; color < 4; color++) {
            for (let number = 1; number <= 13; number++) {
                total += this.getTileCount(number, color as Color);
            }
        }
        return total;
    }

    /**
     * 转换为可读字符串
     * @returns 可读的字符串表示
     */
    toString(): string {
        const colorNames = ['RED', 'BLACK', 'BLUE', 'YELLOW'];
        const result: string[] = [];
        
        for (let color = 0; color < 4; color++) {
            const tiles: string[] = [];
            for (let number = 1; number <= 13; number++) {
                const count = this.getTileCount(number, color as Color);
                if (count > 0) {
                    tiles.push(`${number}×${count}`);
                }
            }
            if (tiles.length > 0) {
                result.push(`${colorNames[color]}: ${tiles.join(', ')}`);
            }
        }
        
        return result.join('\n');
    }

    /**
     * 克隆当前牌型
     * @returns 新的牌型实例
     */
    clone(): TilePattern {
        const newPattern = new TilePattern();
        newPattern.setPattern(this.getPattern());
        return newPattern;
    }

    /**
     * 获取牌型的标准形式
     * 标准形式是所有同构牌型中字典序最小的形式
     * @returns 标准形式的TilePattern实例
     */
    getCanonicalForm(): TilePattern {
        // 如果有缓存，直接返回
        if (this.canonicalFormCache) {
            return this.canonicalFormCache.clone();
        }

        // 1. 找到最小的非零数字
        let minNumber = 14;
        for (let color = 0; color < 4; color++) {
            for (let number = 1; number <= 13; number++) {
                if (this.getTileCount(number, color as Color) > 0) {
                    minNumber = Math.min(minNumber, number);
                }
            }
        }

        // 如果没有牌，返回空牌型
        if (minNumber === 14) {
            this.canonicalFormCache = new TilePattern();
            return this.canonicalFormCache.clone();
        }

        // 2. 创建循环平移后的数组
        const shift = minNumber - 1;
        const shiftedColors = this.colors.map(colorPattern => {
            // 右移shift个数字（每个数字2位）
            const rightPart = colorPattern >>> (shift * 2);
            // 左移(13-shift)个数字
            const leftPart = colorPattern << ((13 - shift) * 2);
            // 组合，确保高位清零
            return (rightPart | leftPart) & ((1 << 26) - 1);  // 13个数字共26位
        });

        // 3. 生成所有可能的颜色排列，找出最小的
        const sortedColors = [...shiftedColors].sort();

        // 4. 创建新的TilePattern实例并设置标准形
        this.canonicalFormCache = new TilePattern();
        this.canonicalFormCache.setPattern(sortedColors);
        return this.canonicalFormCache.clone();
    }

    /**
     * 检查两个牌型是否同构
     * @param other - 要比较的牌型
     * @returns 是否同构
     */
    isIsomorphic(other: TilePattern): boolean {
        const thisCanonical = this.getCanonicalForm();
        const otherCanonical = other.getCanonicalForm();
        
        // 比较标准形式是否相同
        return thisCanonical.getPattern().every(
            (value, index) => value === otherCanonical.getPattern()[index]
        );
    }

    /**
     * 获取牌型的唯一标识符
     * 用于快速比较、存储等场景
     * @returns 标准形式的字符串表示
     */
    getCanonicalId(): string {
        // 如果有缓存，直接返回
        if (this.canonicalIdCache !== null) {
            return this.canonicalIdCache;
        }

        this.canonicalIdCache = this.getCanonicalForm().getPattern().join(',');
        return this.canonicalIdCache;
    }

    /**
     * 检查指定数字是否能组成刻子
     * @param number 要检查的数字
     * @returns 是否能组成刻子
     */
    canFormTriplet(number: number): boolean {
        // 直接从内部数组获取数据，避免多次调用getTileCount
        let colorCount = 0;
        for (let color = 0; color < 4; color++) {
            const pos = (number - 1) * 2;
            const count = (this.colors[color] >> pos) & 0b11;
            if (count > 0) {
                colorCount++;
            }
        }
        return colorCount >= 3;  // 需要至少3张牌才能组成刻子
    }

    /**
     * 检查指定颜色是否能组成顺子
     * @param color 要检查的颜色
     * @returns 能组成顺子的起始数字列表
     */
    findSequences(color: Color): number[] {
        const sequences: number[] = [];
        const pattern = this.colors[color];
        
        // 检查每个可能的顺子位置
        // 每个数字占2位，所以每次移动2位
        for (let start = 0; start < 11; start++) {
            // 检查连续的三个数字是否都有牌
            // 每个数字占2位，所以间隔是2
            const n1 = (pattern >> (start * 2)) & 0b11;
            const n2 = (pattern >> ((start + 1) * 2)) & 0b11;
            const n3 = (pattern >> ((start + 2) * 2)) & 0b11;
            
            if (n1 > 0 && n2 > 0 && n3 > 0) {
                sequences.push(start + 1);
            }
        }

        return sequences;
    }

    /**
     * 获取指定数字的所有有牌的颜色
     * @param number 要检查的数字
     * @returns 有牌的颜色列表
     */
    getColorsWithTiles(number: number): Color[] {
        const colors: Color[] = [];
        const pos = (number - 1) * 2;
        
        for (let color = 0; color < 4; color++) {
            if ((this.colors[color] >> pos) & 0b11) {
                colors.push(color as Color);
            }
        }
        
        return colors;
    }

    /**
     * 获取指定颜色的所有有牌的数字
     * @param color 要检查的颜色
     * @returns 有牌的数字列表
     */
    getNumbersWithTiles(color: Color): number[] {
        const numbers: number[] = [];
        
        for (let number = 1; number <= 13; number++) {
            const pos = (number - 1) * 2;
            if ((this.colors[color] >> pos) & 0b11) {
                numbers.push(number);
            }
        }
        
        return numbers;
    }

    /**
     * 查找指定颜色的所有连续区间（长度>=3）
     * @param color 要检查的颜色
     * @returns 连续区间列表，每个区间是一个[起始数字, 结束数字]的数组
     */
    findContinuousSequences(color: Color): [number, number][] {
        const pattern = this.colors[color];
        const sequences: [number, number][] = [];
        let start = -1;
        let current = -1;

        // 遍历所有位置
        for (let number = 1; number <= 13; number++) {
            const pos = (number - 1) * 2;
            const hasTile = (pattern >> pos) & 0b11;

            if (hasTile) {
                // 如果当前位置有牌
                if (start === -1) {
                    // 开始新的连续区间
                    start = number;
                }
                current = number;
            } else if (start !== -1) {
                // 当前位置没牌，且之前有连续区间
                if (current - start + 1 >= 3) {
                    // 如果区间长度>=3，记录这个区间
                    sequences.push([start, current]);
                }
                start = -1;
            }
        }

        // 处理最后一个区间
        if (start !== -1 && current - start + 1 >= 3) {
            sequences.push([start, current]);
        }

        return sequences;
    }

    /**
     * 查找指定颜色的所有可能连续区间（包括重叠区间）
     * 使用上升沿和下降沿来查找连续区间
     * 例如：
     * 1,2,3,4,5 返回 [1,5]
     * 1,2,3,3,4,5 返回 [1,3], [3,5], [1,5]
     * 1,2,3,3,4,4,5 返回 [1,4], [3,5], [1,5]
     * @param color 要检查的颜色
     * @returns 连续区间列表，每个区间是一个[起始数字, 结束数字]的数组
     */
    findAllContinuousSequences(color: Color): [number, number][] {
        const pattern = this.colors[color];
        const sequences: [number, number][] = [];
        
        // 1. 找出所有上升沿和下降沿
        const edges: Array<{pos: number, type: 'rise' | 'fall', count: number}> = [];
        let prevCount = 0;
        
        for (let number = 1; number <= 13; number++) {
            const pos = (number - 1) * 2;
            const count = (pattern >> pos) & 0b11;
            const actualCount = count === 0 ? 0 : count === 1 ? 1 : 2;
            
            if (actualCount > prevCount) {
                // 上升沿
                edges.push({pos: number, type: 'rise', count: actualCount - prevCount});
            } else if (actualCount < prevCount) {
                // 下降沿
                edges.push({pos: number, type: 'fall', count: prevCount - actualCount});
            }
            prevCount = actualCount;
        }
        
        let globalCount = 0;
        // 2. 处理所有上升沿和下降沿对
        for (let i = 0; i < edges.length; i++) {
            if(edges[i].type !== 'rise') {
                globalCount -= edges[i].count;
                continue;
            }
            
            // 从当前上升沿开始，尝试所有可能的下降沿
            const start = edges[i].pos;
            globalCount += edges[i].count;
            let currentCount = globalCount;

            for (let j = i + 1; j < edges.length; j++) {
                if (edges[j].type === 'rise') {
                    currentCount += edges[j].count;
                } else {
                    currentCount -= edges[j].count;
                }
                
                // 如果当前区间长度大于等于3，且是有效的区间（计数大于0）
                const end = edges[j].pos;
                if (end - start >= 2 && currentCount >= 0) {
                    sequences.push([start, end]);
                }
                
                // 如果计数变为0，结束当前搜索
                if (currentCount <= 0) break;
            }
        }
        
        // 3. 去除被其他区间完全包含的区间
        return sequences.filter((seq1, i) => 
            !sequences.some((seq2, j) => 
                i !== j && 
                seq2[0] <= seq1[0] && 
                seq2[1] >= seq1[1] &&
                (seq2[0] < seq1[0] || seq2[1] > seq1[1])  // 避免完全相同的区间被移除
            )
        );
    }


    
} 