import { Color, TilePattern } from './TilePattern';

/**
 * 牌型JSON格式的接口定义
 */
interface TilePatternJSON {
    name: string;           // 牌型名称
    tiles: {               // 牌型数据
        red: number[];     // 红色牌列表
        black: number[];   // 黑色牌列表
        blue: number[];    // 蓝色牌列表
        yellow: number[];  // 黄色牌列表
    };
}

/**
 * 牌型解析器类
 * 用于在JSON格式和TilePattern实例之间转换
 */
export class PatternParser {
    // 颜色名称到枚举值的映射
    private static readonly COLOR_MAP: { [key: string]: Color } = {
        'red': Color.RED,
        'black': Color.BLACK,
        'blue': Color.BLUE,
        'yellow': Color.YELLOW
    };

    /**
     * 从JSON对象创建TilePattern实例
     * @param json - 牌型的JSON描述
     * @returns 创建的TilePattern实例
     * @throws Error 如果JSON格式无效
     */
    static fromJSON(json: TilePatternJSON): TilePattern {
        // 验证JSON结构
        if (!json.tiles) {
            throw new Error('Invalid pattern: missing tiles object');
        }

        const pattern = new TilePattern();

        // 处理每种颜色的牌
        for (const [colorName, numbers] of Object.entries(json.tiles)) {
            const color = this.COLOR_MAP[colorName];
            if (color === undefined) {
                throw new Error(`Invalid color: ${colorName}`);
            }

            // 统计每个数字的出现次数
            const counts = new Map<number, number>();
            for (const num of numbers) {
                if (!Number.isInteger(num) || num < 1 || num > 13) {
                    throw new Error(`Invalid number: ${num}`);
                }
                counts.set(num, (counts.get(num) || 0) + 1);
            }

            // 添加到pattern中
            for (const [num, count] of counts) {
                pattern.addTile(num, color, count);
            }
        }

        return pattern;
    }

    /**
     * 将TilePattern实例转换为JSON对象
     * @param pattern - TilePattern实例
     * @param name - 可选的牌型名称
     * @returns JSON对象
     */
    static toJSON(pattern: TilePattern, name: string = ""): TilePatternJSON {
        const result: TilePatternJSON = {
            name,
            tiles: {
                red: [],
                black: [],
                blue: [],
                yellow: []
            }
        };

        // 处理每种颜色
        for (const [colorName, color] of Object.entries(this.COLOR_MAP)) {
            const numbers: number[] = [];
            // 检查每个数字
            for (let num = 1; num <= 13; num++) {
                const count = pattern.getTileCount(num, color);
                // 重复添加对应次数
                for (let i = 0; i < count; i++) {
                    numbers.push(num);
                }
            }
            result.tiles[colorName as keyof typeof result.tiles] = numbers;
        }

        return result;
    }
}

// 测试代码
function test(): void {
    // 测试用例
    const testPattern: TilePatternJSON = {
        name: "测试牌型",
        tiles: {
            red: [3,3,4,5],  // 两张红3,红4,红5
            black: [4],      // 黑4
            blue: [],
            yellow: []
        }
    };

    // 从JSON创建TilePattern
    console.log("从JSON创建牌型：");
    const pattern = PatternParser.fromJSON(testPattern);
    console.log(pattern.toString());

    // 转换回JSON
    console.log("\n转换回JSON：");
    const json = PatternParser.toJSON(pattern, "测试牌型");
    console.log(JSON.stringify(json, null, 2));
}

// 如果直接运行此文件，执行测试
if (require.main === module) {
    test();
} 