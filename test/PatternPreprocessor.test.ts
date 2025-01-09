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

    describe('splitByConnectivity', () => {
        test('should split isolated components', () => {
            // 添加两个不相连的组合
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);  // 1,2红色相连
            
            pattern.addTile(5, Color.BLUE);
            pattern.addTile(6, Color.BLUE);  // 5,6蓝色相连
            
            const components = PatternPreprocessor.splitByConnectivity(pattern);
            expect(components.length).toBe(2);
            
            // 验证第一个组合
            const comp1HasRed12 = components.some(comp => 
                comp.getTileCount(1, Color.RED) === 1 && 
                comp.getTileCount(2, Color.RED) === 1
            );
            expect(comp1HasRed12).toBe(true);
            
            // 验证第二个组合
            const comp2HasBlue56 = components.some(comp => 
                comp.getTileCount(5, Color.BLUE) === 1 && 
                comp.getTileCount(6, Color.BLUE) === 1
            );
            expect(comp2HasBlue56).toBe(true);
        });

        test('should connect by same number different colors', () => {
            // 添加同数字不同颜色的牌
            pattern.addTile(1, Color.RED);
            pattern.addTile(1, Color.BLACK);
            pattern.addTile(1, Color.BLUE);
            
            const components = PatternPreprocessor.splitByConnectivity(pattern);
            expect(components.length).toBe(1);
            
            // 验证所有牌都在同一个组件中
            const component = components[0];
            expect(component.getTileCount(1, Color.RED)).toBe(1);
            expect(component.getTileCount(1, Color.BLACK)).toBe(1);
            expect(component.getTileCount(1, Color.BLUE)).toBe(1);
        });

        test('should connect by adjacent numbers same color', () => {
            // 添加同色连续数字的牌
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);
            
            const components = PatternPreprocessor.splitByConnectivity(pattern);
            expect(components.length).toBe(1);
            
            // 验证所有牌都在同一个组件中
            const component = components[0];
            expect(component.getTileCount(1, Color.RED)).toBe(1);
            expect(component.getTileCount(2, Color.RED)).toBe(1);
            expect(component.getTileCount(3, Color.RED)).toBe(1);
        });

        test('should handle complex connections', () => {
            // 添加复杂的连接关系：
            // 红1-红2-红3
            //      |
            //    黑2-蓝2
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);
            pattern.addTile(2, Color.BLACK);
            pattern.addTile(2, Color.BLUE);
            
            const components = PatternPreprocessor.splitByConnectivity(pattern);
            expect(components.length).toBe(1);
            
            // 验证所有牌都在同一个组件中
            const component = components[0];
            expect(component.getTileCount(1, Color.RED)).toBe(1);
            expect(component.getTileCount(2, Color.RED)).toBe(1);
            expect(component.getTileCount(3, Color.RED)).toBe(1);
            expect(component.getTileCount(2, Color.BLACK)).toBe(1);
            expect(component.getTileCount(2, Color.BLUE)).toBe(1);
        });

        test('should handle multiple tiles of same type', () => {
            // 添加多张同类型的牌
            pattern.addTile(1, Color.RED, 2);  // 两张红1
            pattern.addTile(2, Color.RED);     // 一张红2
            
            const components = PatternPreprocessor.splitByConnectivity(pattern);
            expect(components.length).toBe(1);
            
            // 验证牌的数量正确
            const component = components[0];
            expect(component.getTileCount(1, Color.RED)).toBe(2);
            expect(component.getTileCount(2, Color.RED)).toBe(1);
        });

        test('should handle edge cases', () => {
            // 测试边界数字
            pattern.addTile(1, Color.RED);   // 最小数字
            pattern.addTile(13, Color.BLUE); // 最大数字
            
            const components = PatternPreprocessor.splitByConnectivity(pattern);
            expect(components.length).toBe(2);
            
            // 验证每个组件只包含一张牌
            expect(components.every(comp => comp.getTotalCount() === 1)).toBe(true);
        });
    });
}); 