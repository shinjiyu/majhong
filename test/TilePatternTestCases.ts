import { Color } from '../src/TilePattern';

export interface TilePatternJSON {
    tiles: {
        number: number;
        color: Color;
        count: number;
    }[];
    expectedScore: number;
    description: string;
}

export const TEST_CASES: TilePatternJSON[] = [
    {
        description: "空牌型",
        tiles: [],
        expectedScore: 0
    },
    {
        description: "单个顺子 [1,2,3]",
        tiles: [
            { number: 1, color: Color.RED, count: 1 },
            { number: 2, color: Color.RED, count: 1 },
            { number: 3, color: Color.RED, count: 1 }
        ],
        expectedScore: 6
    },
    {
        description: "单个刻子 [3,3,3]",
        tiles: [
            { number: 3, color: Color.RED, count: 1 },
            { number: 3, color: Color.BLACK, count: 1 },
            { number: 3, color: Color.BLUE, count: 1 }
        ],
        expectedScore: 9
    },
    {
        description: "四张同数字不同颜色 [3,3,3,3]",
        tiles: [
            { number: 3, color: Color.RED, count: 1 },
            { number: 3, color: Color.BLACK, count: 1 },
            { number: 3, color: Color.BLUE, count: 1 },
            { number: 3, color: Color.YELLOW, count: 1 }
        ],
        expectedScore: 12
    },
    {
        description: "长顺子 [1,2,3,4,5]",
        tiles: [
            { number: 1, color: Color.RED, count: 1 },
            { number: 2, color: Color.RED, count: 1 },
            { number: 3, color: Color.RED, count: 1 },
            { number: 4, color: Color.RED, count: 1 },
            { number: 5, color: Color.RED, count: 1 }
        ],
        expectedScore: 15
    },
    {
        description: "双顺子 [1,2,3] x 2",
        tiles: [
            { number: 1, color: Color.RED, count: 2 },
            { number: 2, color: Color.RED, count: 2 },
            { number: 3, color: Color.RED, count: 2 }
        ],
        expectedScore: 12
    },
    {
        description: "复杂组合：顺子[1,2,3,4,5] + 刻子[3,3,3] + 刻子[4,4,4]",
        tiles: [
            { number: 1, color: Color.RED, count: 1 },
            { number: 2, color: Color.RED, count: 1 },
            { number: 3, color: Color.RED, count: 1 },
            { number: 4, color: Color.RED, count: 1 },
            { number: 5, color: Color.RED, count: 1 },
            { number: 3, color: Color.BLACK, count: 3 },
            { number: 4, color: Color.BLUE, count: 3 }
        ],
        expectedScore: 33
    },
    {
        description: "多个独立组合：顺子[1,2,3] + 刻子[4,4,4] + 顺子[7,8,9]",
        tiles: [
            { number: 1, color: Color.RED, count: 1 },
            { number: 2, color: Color.RED, count: 1 },
            { number: 3, color: Color.RED, count: 1 },
            { number: 4, color: Color.BLACK, count: 2 },
            { number: 4, color: Color.BLUE, count: 1 },
            { number: 4, color: Color.YELLOW, count: 1 },
            { number: 7, color: Color.BLUE, count: 1 },
            { number: 8, color: Color.BLUE, count: 1 },
            { number: 9, color: Color.BLUE, count: 1 }
        ],
        expectedScore: 42
    },
    {
        description: "包含无用牌：顺子[1,2,3] + 刻子[4,4,4] + 顺子[7,8,9] + 无用牌[6]",
        tiles: [
            { number: 1, color: Color.RED, count: 1 },
            { number: 2, color: Color.RED, count: 1 },
            { number: 3, color: Color.RED, count: 1 },
            { number: 6, color: Color.RED, count: 1 }, // 无用牌
            { number: 4, color: Color.BLACK, count: 2 },
            { number: 4, color: Color.BLUE, count: 1 },
            { number: 4, color: Color.YELLOW, count: 1 },
            { number: 7, color: Color.BLUE, count: 1 },
            { number: 8, color: Color.BLUE, count: 1 },
            { number: 9, color: Color.BLUE, count: 1 }
        ],
        expectedScore: 42
    },
    {
        description: "需要按连通性分割：顺子[1,2,3] + 刻子[5,5,5] + 顺子[8,9,10]",
        tiles: [
            { number: 1, color: Color.RED, count: 1 },
            { number: 2, color: Color.RED, count: 1 },
            { number: 3, color: Color.RED, count: 1 },
            { number: 5, color: Color.BLACK, count: 2 },
            { number: 5, color: Color.BLUE, count: 1 },
            { number: 5, color: Color.YELLOW, count: 1 },
            { number: 8, color: Color.BLUE, count: 1 },
            { number: 9, color: Color.BLUE, count: 1 },
            { number: 10, color: Color.BLUE, count: 1 }
        ],
        expectedScore: 48
    }
]; 