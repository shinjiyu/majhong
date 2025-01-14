import { PatternCache } from '../src/PatternCache';
import { PatternSolver } from '../src/PatternSolver';
import { TilePattern } from '../src/TilePattern';
import { Color } from '../src/TilePattern';

describe('PatternSolver', () => {
    let solver: PatternSolver;
    let pattern: TilePattern;

    beforeEach(async () => {
        solver = new PatternSolver();
        pattern = new TilePattern();
        await PatternCache.getInstance().initialize();
    });

    test('空牌型应该返回0分', () => {
        const solution = solver.solve(pattern);
        expect(solution.score).toBe(0);
        expect(solution.combinations).toHaveLength(0);
    });

    test('单个顺子', () => {
        // 红色 1,2,3
        pattern.addTile(1, Color.RED);
        pattern.addTile(2, Color.RED);
        pattern.addTile(3, Color.RED);

        const solution = solver.solve(pattern);
        expect(solution.score).toBe(6); // 1+2+3
        expect(solution.combinations).toHaveLength(1);
        expect(solution.combinations[0].type).toBe('sequence');
    });

    test('单个刻子', () => {
        // 3条红黑蓝（不同颜色）
        pattern.addTile(3, Color.RED);
        pattern.addTile(3, Color.BLACK);
        pattern.addTile(3, Color.BLUE);

        const solution = solver.solve(pattern);
        expect(solution.score).toBe(9); // 3+3+3
        expect(solution.combinations).toHaveLength(1);
        expect(solution.combinations[0].type).toBe('triplet');
    });

    test('同数字不同颜色的四张牌', () => {
        // 3条红黑蓝黄（都是不同颜色）
        pattern.addTile(3, Color.RED);
        pattern.addTile(3, Color.BLACK);
        pattern.addTile(3, Color.BLUE);
        pattern.addTile(3, Color.YELLOW);

        const solution = solver.solve(pattern);
        expect(solution.score).toBe(12); // 3+3+3+3
        expect(solution.combinations).toHaveLength(1);
        expect(solution.combinations[0].type).toBe('triplet');
        expect(solution.combinations[0].tiles).toHaveLength(4);
    });

    test('刻子和顺子的选择', () => {
        // 3条红黑蓝（不同颜色），同时红色2,4
        // 可以组成 2,3,4 顺子，或者 3,3,3 刻子
        // 应该选择刻子，因为 9 > 6
        pattern.addTile(3, Color.RED);
        pattern.addTile(4, Color.BLACK);
        pattern.addTile(4, Color.BLUE);
        pattern.addTile(2, Color.RED);
        pattern.addTile(4, Color.RED);

        const solution = solver.solve(pattern);
        expect(solution.score).toBe(12); // (3+3+3)，选择刻子
        expect(solution.combinations).toHaveLength(1);
        expect(solution.combinations[0].type).toBe('triplet');
    });

    test('复杂组合 - 顺子优先', () => {
        // 红色1,2,3,4,5
        // 黑色3,4
        // 蓝色3,4
        pattern.addTile(1, Color.RED);
        pattern.addTile(2, Color.RED);
        pattern.addTile(3, Color.RED);
        pattern.addTile(4, Color.RED);
        pattern.addTile(5, Color.RED);
        pattern.addTile(3, Color.BLACK);
        pattern.addTile(4, Color.BLACK);
        pattern.addTile(3, Color.BLUE);
        pattern.addTile(4, Color.BLUE);

        const solution = solver.solve(pattern);
        // 应该选择 [1,2,3,4,5]顺子 + [3,3,3]刻子 + [4,4,4]刻子
        expect(solution.score).toBe(21); // (1+2+3+4+5) + (3+3+3) + (4+4+4)
        expect(solution.combinations).toHaveLength(2);
    });

    test('多个独立的组合', () => {
        // 红色1,2,3
        // 黑色4,4 + 蓝色4 + 黄色4（刻子）
        // 蓝色7,8,9
        pattern.addTile(1, Color.RED);
        pattern.addTile(2, Color.RED);
        pattern.addTile(3, Color.RED);
        pattern.addTile(4, Color.BLACK, 2);
        pattern.addTile(4, Color.BLUE);
        pattern.addTile(4, Color.YELLOW);
        pattern.addTile(7, Color.BLUE);
        pattern.addTile(8, Color.BLUE);
        pattern.addTile(9, Color.BLUE);

        const solution = solver.solve(pattern);
        expect(solution.score).toBe(42); // (1+2+3) + (4+4+4) + (7+8+9)
        expect(solution.combinations).toHaveLength(3);
    });

    test('复杂组合 - 需要预处理去除无用牌', () => {
        // 红色1,2,3 + 6（无用）
        // 黑色4,4 + 蓝色4 + 黄色4（刻子）
        // 蓝色7,8,9,10
        pattern.addTile(1, Color.RED);
        pattern.addTile(2, Color.RED);
        pattern.addTile(3, Color.RED);
        pattern.addTile(6, Color.RED);  // 无用牌
        pattern.addTile(4, Color.BLACK, 2);
        pattern.addTile(4, Color.BLUE);
        pattern.addTile(4, Color.YELLOW);
        pattern.addTile(7, Color.BLUE);
        pattern.addTile(8, Color.BLUE);
        pattern.addTile(9, Color.BLUE);
        pattern.addTile(10, Color.BLUE);

        const solution = solver.solve(pattern);
        expect(solution.score).toBe(52); // (1+2+3) + (4+4+4) + (7+8+9+10)
        expect(solution.combinations).toHaveLength(3);
    });

    test('复杂组合 - 需要按连通性分割', () => {
        // 第一组：红色1,2,3
        // 第二组：黑色5,5 + 蓝色5 + 黄色5（刻子）
        // 第三组：蓝色8,9,10
        pattern.addTile(1, Color.RED);
        pattern.addTile(2, Color.RED);
        pattern.addTile(3, Color.RED);
        pattern.addTile(5, Color.BLACK, 2);
        pattern.addTile(5, Color.BLUE);
        pattern.addTile(5, Color.YELLOW);
        pattern.addTile(8, Color.BLUE);
        pattern.addTile(9, Color.BLUE);
        pattern.addTile(10, Color.BLUE);

        const solution = solver.solve(pattern);
        expect(solution.score).toBe(48); // (1+2+3) + (5+5+5) + (8+9+10)
        expect(solution.combinations).toHaveLength(3);
    });

    test('边界情况 - 双张牌的顺子', () => {
        // 红色1,1,2,2,3,3
        pattern.addTile(1, Color.RED, 2);
        pattern.addTile(2, Color.RED, 2);
        pattern.addTile(3, Color.RED, 2);

        const solution = solver.solve(pattern);
        expect(solution.score).toBe(12); // (1+2+3) + (1+2+3)
        expect(solution.combinations).toHaveLength(2);
    });

    test('边界情况 - 重叠的顺子和刻子', () => {
        // 红色3,4,5
        // 黑色3,4 + 蓝色3,4
        pattern.addTile(3, Color.RED);
        pattern.addTile(4, Color.RED);
        pattern.addTile(5, Color.RED);
        pattern.addTile(3, Color.BLACK);
        pattern.addTile(4, Color.BLACK);
        pattern.addTile(3, Color.BLUE);
        pattern.addTile(4, Color.BLUE);

        const solution = solver.solve(pattern);
        expect(solution.score).toBe(21); // (3+4+5) + (3+3+3) + (4+4+4)
        expect(solution.combinations).toHaveLength(2);
    });
}); 