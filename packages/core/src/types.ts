import { Combination } from './StandardForm';

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