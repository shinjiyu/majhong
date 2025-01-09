import { Color, TilePattern } from '../src/TilePattern';
import { StandardForm, Combination } from '../src/StandardForm';

describe('StandardForm', () => {
    let pattern: TilePattern;

    beforeEach(() => {
        pattern = new TilePattern();
    });

    describe('fromPattern', () => {
        test('should handle empty pattern', () => {
            const standardForm = StandardForm.fromPattern(pattern);
            expect(standardForm.numberOffset).toBe(0);
            expect(standardForm.pattern.getTotalCount()).toBe(0);
        });

        test('should normalize simple sequence', () => {
            // 创建红3,4,5
            pattern.addTile(3, Color.RED);
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);

            const standardForm = StandardForm.fromPattern(pattern);
            
            // 检查数字偏移
            expect(standardForm.numberOffset).toBe(2);  // 3-1=2
            
            // 检查标准型
            expect(standardForm.pattern.getTileCount(1, Color.RED)).toBe(1);
            expect(standardForm.pattern.getTileCount(2, Color.RED)).toBe(1);
            expect(standardForm.pattern.getTileCount(3, Color.RED)).toBe(1);
        });

        test('should normalize pattern with multiple colors', () => {
            // 创建红3,黑3,蓝3
            pattern.addTile(3, Color.RED);
            pattern.addTile(3, Color.BLACK);
            pattern.addTile(3, Color.BLUE);

            const standardForm = StandardForm.fromPattern(pattern);
            
            // 检查数字偏移
            expect(standardForm.numberOffset).toBe(2);  // 3-1=2
            
            // 检查颜色映射（使用次数相同时应保持原始顺序）
            const standardPattern = standardForm.pattern;
            expect(standardPattern.getTileCount(1, Color.RED)).toBe(1);
            expect(standardPattern.getTileCount(1, Color.BLACK)).toBe(1);
            expect(standardPattern.getTileCount(1, Color.BLUE)).toBe(1);
        });

        test('should normalize pattern with color usage priority', () => {
            // 红色使用3次，黑色使用2次，蓝色使用1次
            pattern.addTile(3, Color.RED);
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);
            pattern.addTile(3, Color.BLACK);
            pattern.addTile(4, Color.BLACK);
            pattern.addTile(3, Color.BLUE);

            const standardForm = StandardForm.fromPattern(pattern);
            
            // 红色（使用最多）应该映射到第一个颜色
            expect(standardForm.colorMapping[Color.RED]).toBe(0);
            // 黑色应该映射到第二个颜色
            expect(standardForm.colorMapping[Color.BLACK]).toBe(1);
            // 蓝色应该映射到第三个颜色
            expect(standardForm.colorMapping[Color.BLUE]).toBe(2);
        });
    });

    describe('restoreCombination', () => {
        test('should restore sequence combination', () => {
            // 创建红3,4,5
            pattern.addTile(3, Color.RED);
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);

            const standardForm = StandardForm.fromPattern(pattern);
            
            const standardCombination: Combination = {
                type: 'sequence',
                tiles: [
                    { number: 1, color: Color.RED },
                    { number: 2, color: Color.RED },
                    { number: 3, color: Color.RED }
                ]
            };

            const restored = standardForm.restoreCombination(standardCombination);
            
            expect(restored.tiles[0].number).toBe(3);
            expect(restored.tiles[1].number).toBe(4);
            expect(restored.tiles[2].number).toBe(5);
            expect(restored.tiles[0].color).toBe(Color.RED);
        });

        test('should restore triplet combination', () => {
            // 创建红3,黑3,蓝3
            pattern.addTile(3, Color.RED);
            pattern.addTile(3, Color.BLACK);
            pattern.addTile(3, Color.BLUE);

            const standardForm = StandardForm.fromPattern(pattern);
            
            const standardCombination: Combination = {
                type: 'triplet',
                tiles: [
                    { number: 1, color: Color.RED },
                    { number: 1, color: Color.BLACK },
                    { number: 1, color: Color.BLUE }
                ]
            };

            const restored = standardForm.restoreCombination(standardCombination);
            
            expect(restored.tiles[0].number).toBe(3);
            expect(restored.tiles[1].number).toBe(3);
            expect(restored.tiles[2].number).toBe(3);
            // 颜色应该被正确还原
            expect(restored.tiles.map(t => t.color).sort()).toEqual([Color.RED, Color.BLACK, Color.BLUE]);
        });
    });

    describe('restoreTile', () => {
        test('should restore single tile', () => {
            // 创建红3,4,5
            pattern.addTile(3, Color.RED);
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);

            const standardForm = StandardForm.fromPattern(pattern);
            
            const [number, color] = standardForm.restoreTile(1, Color.RED);
            expect(number).toBe(3);
            expect(color).toBe(Color.RED);
        });
    });
}); 