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
     * @param count - 添加的数量(1-3)，默认为1
     * @throws Error 如果参数无效
     */
    addTile(number: number, color: Color, count: number = 1): void {
        // 参数检查
        if (number < 1 || number > 13) {
            throw new Error("Number must be between 1 and 13");
        }
        if (count < 0 || count > 3) {
            throw new Error("Count must be between 0 and 3");
        }

        // 计算位置和当前数量
        const pos = (number - 1) * 2;  // 每个数字占2位
        const current = (this.colors[color] >> pos) & 0b11;

        // 更新数量
        const newCount = Math.min(current + count, 3);
        // 清除原位置
        this.colors[color] &= ~(0b11 << pos);
        // 设置新数量
        this.colors[color] |= (newCount << pos);
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
     * @param count - 移除的数量(1-3)，默认为1
     * @returns 是否成功移除
     */
    removeTile(number: number, color: Color, count: number = 1): boolean {
        const current = this.getTileCount(number, color);
        if (current < count) {
            return false;
        }

        const pos = (number - 1) * 2;
        const newCount = current - count;
        // 清除原位置
        this.colors[color] &= ~(0b11 << pos);
        // 设置新数量
        this.colors[color] |= (newCount << pos);
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
    }

    /**
     * 清空牌型
     */
    clear(): void {
        this.colors.fill(0);
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
} 