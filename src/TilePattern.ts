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

        // 更新数量
        const newCount = current + count;

        if(newCount > 2){
            throw new Error("Count must be between 1 and 2");
        }
        // 清除原位置
        this.colors[color] &= ~(0b11 << pos);
        // 设置新数量
        this.colors[color] |= (newCount << pos);

        // 清除缓存
        this.clearCache();
    }

    /**
     * 获取指定牌的数量
     * @param number - 牌的数字(1-13)
     * @param color - 牌的颜色(Color枚举值)
     * @returns 牌的数量(0-3)
     */
    getTileCount(number: number, color: Color): number {
        const pos = (number - 1) * 2;
        return (this.colors[color] >> pos) & 0b11;
    }

    /**
     * 移除指定数量的牌
     * @param number - 牌的数字(1-13)
     * @param color - 牌的颜色(Color枚举值)
     * @param count - 移除的数量(0-2)，默认为1
     * @returns 是否成功移除
     */
    removeTile(number: number, color: Color, count: number = 1): boolean {
        const result = this.getTileCount(number, color) >= count;
        if (result) {
            const pos = (number - 1) * 2;
            const current = this.getTileCount(number, color);
            const newCount = current - count;
            // 清除原位置
            this.colors[color] &= ~(0b11 << pos);
            // 设置新数量
            this.colors[color] |= (newCount << pos);
            
            // 清除缓存
            this.clearCache();
        }
        return result;
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
} 