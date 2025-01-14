import { Combination } from './StandardForm';

// 牌型输入接口
export interface PatternInput {
    // 牌型数组，每个数字代表一张牌
    // 例如：[1,1,1,2,2,2] 表示三个1和三个2
    pattern: number[];
    
    // 百搭数量，范围：0-2
    // 0: 无百搭
    // 1: 一个百搭
    // 2: 两个百搭
    jokerCount?: 0 | 1 | 2;
}

// 带分数的组合
export interface ScoredCombination extends Combination {
    score: number;
}

// 解决方案接口
export interface Solution {
    // 总分
    score: number;
    // 所有组合（包括顺子和刻子）
    combinations: ScoredCombination[];
} 