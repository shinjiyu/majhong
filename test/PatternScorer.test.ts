import { Color, TilePattern } from '../src/TilePattern';
import { PatternScorer, CombinationType } from '../src/PatternScorer';

describe('PatternScorer', () => {
    let pattern: TilePattern;

    beforeEach(() => {
        pattern = new TilePattern();
    });

    describe('getMaxScore', () => {
        it('should return 0 for empty pattern', () => {
            const result = PatternScorer.getMaxScore(pattern);
            expect(result.score).toBe(0);
            expect(result.combinations).toHaveLength(0);
        });

        it('should identify single sequence', () => {
            // 添加一个顺子：红1,2,3
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);

            const result = PatternScorer.getMaxScore(pattern);
            expect(result.score).toBe(3);
            expect(result.combinations).toHaveLength(1);
            expect(result.combinations[0].type).toBe(CombinationType.SEQUENCE);
        });

        it('should identify single triplet', () => {
            // 添加一个刻子：红1,黑1,蓝1
            pattern.addTile(1, Color.RED);
            pattern.addTile(1, Color.BLACK);
            pattern.addTile(1, Color.BLUE);

            const result = PatternScorer.getMaxScore(pattern);
            expect(result.score).toBe(3);
            expect(result.combinations).toHaveLength(1);
            expect(result.combinations[0].type).toBe(CombinationType.TRIPLET);
        });

        it('should handle multiple combinations', () => {
            // 添加一个顺子和一个刻子
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);  // 顺子
            pattern.addTile(4, Color.RED);
            pattern.addTile(4, Color.BLACK);
            pattern.addTile(4, Color.BLUE);  // 刻子

            const result = PatternScorer.getMaxScore(pattern);
            expect(result.score).toBe(6);
            expect(result.combinations).toHaveLength(2);
        });
    });

    describe('validation methods', () => {
        it('should validate sequence correctly', () => {
            const validSequence = [
                { number: 1, color: Color.RED },
                { number: 2, color: Color.RED },
                { number: 3, color: Color.RED }
            ];
            expect(PatternScorer.isValidSequence(validSequence)).toBe(true);

            const invalidColor = [
                { number: 1, color: Color.RED },
                { number: 2, color: Color.BLACK },
                { number: 3, color: Color.RED }
            ];
            expect(PatternScorer.isValidSequence(invalidColor)).toBe(false);

            const invalidNumbers = [
                { number: 1, color: Color.RED },
                { number: 2, color: Color.RED },
                { number: 4, color: Color.RED }
            ];
            expect(PatternScorer.isValidSequence(invalidNumbers)).toBe(false);
        });

        it('should validate triplet correctly', () => {
            const validTriplet = [
                { number: 1, color: Color.RED },
                { number: 1, color: Color.BLACK },
                { number: 1, color: Color.BLUE }
            ];
            expect(PatternScorer.isValidTriplet(validTriplet)).toBe(true);

            const invalidNumber = [
                { number: 1, color: Color.RED },
                { number: 2, color: Color.BLACK },
                { number: 1, color: Color.BLUE }
            ];
            expect(PatternScorer.isValidTriplet(invalidNumber)).toBe(false);

            const invalidColors = [
                { number: 1, color: Color.RED },
                { number: 1, color: Color.RED },
                { number: 1, color: Color.BLUE }
            ];
            expect(PatternScorer.isValidTriplet(invalidColors)).toBe(false);
        });
    });

    describe('complex patterns', () => {
        it('should handle overlapping patterns', () => {
            // 添加重叠的牌型：红1,2,3,3,3,4
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);
            pattern.addTile(3, Color.BLACK);
            pattern.addTile(3, Color.BLUE);
            pattern.addTile(4, Color.RED);

            const result = PatternScorer.getMaxScore(pattern);
            expect(result.score).toBe(6);  // 应该找到两个组合
            expect(result.combinations).toHaveLength(2);
        });

        it('should handle multiple valid combinations', () => {
            // 添加多个可能的组合
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);  // 可能的顺子
            pattern.addTile(3, Color.BLACK);
            pattern.addTile(3, Color.BLUE);  // 可能的刻子
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);  // 可能的另一个顺子

            const result = PatternScorer.getMaxScore(pattern);
            expect(result.score).toBe(6);
            expect(result.combinations.length).toBeGreaterThanOrEqual(2);
        });
    });
}); 