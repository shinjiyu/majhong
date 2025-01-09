import { Color, TilePattern } from '../src/TilePattern';
import { PatternPreprocessor } from '../src/PatternPreprocessor';

describe('PatternPreprocessor', () => {
    let pattern: TilePattern;

    beforeEach(() => {
        pattern = new TilePattern();
    });

    test('should remove isolated tiles', () => {
        // 添加一个孤立的牌
        pattern.addTile(1, Color.RED);
        
        const processed = PatternPreprocessor.preprocess(pattern);
        expect(processed.getTileCount(1, Color.RED)).toBe(0);
    });

    test('should keep triplets', () => {
        // 添加一个刻子
        pattern.addTile(1, Color.RED);
        pattern.addTile(1, Color.BLACK);
        pattern.addTile(1, Color.BLUE);
        
        const processed = PatternPreprocessor.preprocess(pattern);
        expect(processed.getTileCount(1, Color.RED)).toBe(1);
        expect(processed.getTileCount(1, Color.BLACK)).toBe(1);
        expect(processed.getTileCount(1, Color.BLUE)).toBe(1);
    });

    test('should keep sequences', () => {
        // 添加一个顺子
        pattern.addTile(1, Color.RED);
        pattern.addTile(2, Color.RED);
        pattern.addTile(3, Color.RED);
        
        const processed = PatternPreprocessor.preprocess(pattern);
        expect(processed.getTileCount(1, Color.RED)).toBe(1);
        expect(processed.getTileCount(2, Color.RED)).toBe(1);
        expect(processed.getTileCount(3, Color.RED)).toBe(1);
    });

    test('should keep longer sequences', () => {
        // 添加一个长顺子
        pattern.addTile(1, Color.RED);
        pattern.addTile(2, Color.RED);
        pattern.addTile(3, Color.RED);
        pattern.addTile(4, Color.RED);
        pattern.addTile(5, Color.RED);
        
        const processed = PatternPreprocessor.preprocess(pattern);
        for (let i = 1; i <= 5; i++) {
            expect(processed.getTileCount(i, Color.RED)).toBe(1);
        }
    });

    test('should handle multiple combinations', () => {
        // 添加一个刻子和一个顺子
        pattern.addTile(1, Color.RED);
        pattern.addTile(1, Color.BLACK);
        pattern.addTile(1, Color.BLUE);
        pattern.addTile(2, Color.RED);
        pattern.addTile(3, Color.RED);
        pattern.addTile(4, Color.RED);
        
        const processed = PatternPreprocessor.preprocess(pattern);
        // 检查刻子
        expect(processed.getTileCount(1, Color.RED)).toBe(1);
        expect(processed.getTileCount(1, Color.BLACK)).toBe(1);
        expect(processed.getTileCount(1, Color.BLUE)).toBe(1);
        // 检查顺子
        expect(processed.getTileCount(2, Color.RED)).toBe(1);
        expect(processed.getTileCount(3, Color.RED)).toBe(1);
        expect(processed.getTileCount(4, Color.RED)).toBe(1);
    });

    test('should handle overlapping combinations', () => {
        // 添加重叠的组合：1,2,3,3,3,4,5 红色
        pattern.addTile(1, Color.RED);
        pattern.addTile(2, Color.RED);
        pattern.addTile(3, Color.RED);
        pattern.addTile(3, Color.BLACK);
        pattern.addTile(3, Color.BLUE);
        pattern.addTile(4, Color.RED);
        pattern.addTile(5, Color.RED);
        
        const processed = PatternPreprocessor.preprocess(pattern);
        // 检查所有牌都应该保留
        for (let i = 1; i <= 5; i++) {
            expect(processed.getTileCount(i, Color.RED)).toBe(1);
        }
        expect(processed.getTileCount(3, Color.BLACK)).toBe(1);
        expect(processed.getTileCount(3, Color.BLUE)).toBe(1);
    });

    test('should handle edge cases', () => {
        // 测试边界情况：11,12,13
        pattern.addTile(11, Color.RED);
        pattern.addTile(12, Color.RED);
        pattern.addTile(13, Color.RED);
        
        const processed = PatternPreprocessor.preprocess(pattern);
        expect(processed.getTileCount(11, Color.RED)).toBe(1);
        expect(processed.getTileCount(12, Color.RED)).toBe(1);
        expect(processed.getTileCount(13, Color.RED)).toBe(1);
    });

    test('should correctly report removed tiles', () => {
        // 添加一些牌，包括会被移除的和会被保留的
        pattern.addTile(1, Color.RED);  // 孤立牌，会被移除
        pattern.addTile(3, Color.RED);
        pattern.addTile(4, Color.RED);
        pattern.addTile(5, Color.RED);  // 3,4,5构成顺子，会被保留
        
        const processed = PatternPreprocessor.preprocess(pattern);
        const removed = PatternPreprocessor.getRemovedTiles(pattern, processed);
        
        // 检查移除的牌
        expect(removed.length).toBe(1);
        expect(removed[0]).toEqual({ number: 1, color: Color.RED });
    });
}); 