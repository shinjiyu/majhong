import { Color, TilePattern } from '../src/TilePattern';

describe('TilePattern', () => {
    let pattern: TilePattern;

    beforeEach(() => {
        pattern = new TilePattern();
    });

    describe('addTile', () => {
        it('should add a single tile correctly', () => {
            pattern.addTile(3, Color.RED);
            expect(pattern.getTileCount(3, Color.RED)).toBe(1);
        });

        it('should add multiple tiles correctly', () => {
            pattern.addTile(3, Color.RED, 2);
            expect(pattern.getTileCount(3, Color.RED)).toBe(2);
        });

        it('should not exceed maximum tile count', () => {
            pattern.addTile(3, Color.RED, 3);
            pattern.addTile(3, Color.RED, 1);
            expect(pattern.getTileCount(3, Color.RED)).toBe(3);
        });

        it('should throw error for invalid number', () => {
            expect(() => pattern.addTile(0, Color.RED)).toThrow();
            expect(() => pattern.addTile(14, Color.RED)).toThrow();
        });

        it('should throw error for invalid count', () => {
            expect(() => pattern.addTile(3, Color.RED, -1)).toThrow();
            expect(() => pattern.addTile(3, Color.RED, 4)).toThrow();
        });
    });

    describe('removeTile', () => {
        beforeEach(() => {
            pattern.addTile(3, Color.RED, 2);
        });

        it('should remove a single tile correctly', () => {
            expect(pattern.removeTile(3, Color.RED)).toBe(true);
            expect(pattern.getTileCount(3, Color.RED)).toBe(1);
        });

        it('should return false when removing non-existent tile', () => {
            expect(pattern.removeTile(4, Color.RED)).toBe(false);
        });

        it('should return false when removing more tiles than available', () => {
            expect(pattern.removeTile(3, Color.RED, 3)).toBe(false);
        });
    });

    describe('pattern operations', () => {
        it('should get and set pattern correctly', () => {
            pattern.addTile(3, Color.RED, 2);
            pattern.addTile(4, Color.BLACK, 1);
            
            const patternData = pattern.getPattern();
            const newPattern = new TilePattern();
            newPattern.setPattern(patternData);
            
            expect(newPattern.getTileCount(3, Color.RED)).toBe(2);
            expect(newPattern.getTileCount(4, Color.BLACK)).toBe(1);
        });

        it('should throw error for invalid pattern data', () => {
            expect(() => pattern.setPattern([1, 2, 3])).toThrow();
        });
    });

    describe('utility methods', () => {
        it('should clear pattern correctly', () => {
            pattern.addTile(3, Color.RED, 2);
            pattern.addTile(4, Color.BLACK, 1);
            pattern.clear();
            
            expect(pattern.getTotalCount()).toBe(0);
        });

        it('should count total tiles correctly', () => {
            pattern.addTile(3, Color.RED, 2);
            pattern.addTile(4, Color.BLACK, 1);
            
            expect(pattern.getTotalCount()).toBe(3);
        });

        it('should clone pattern correctly', () => {
            pattern.addTile(3, Color.RED, 2);
            pattern.addTile(4, Color.BLACK, 1);
            
            const cloned = pattern.clone();
            expect(cloned.getTileCount(3, Color.RED)).toBe(2);
            expect(cloned.getTileCount(4, Color.BLACK)).toBe(1);
            
            // 确保是深拷贝
            pattern.removeTile(3, Color.RED);
            expect(cloned.getTileCount(3, Color.RED)).toBe(2);
        });

        it('should convert to string correctly', () => {
            pattern.addTile(3, Color.RED, 2);
            pattern.addTile(4, Color.RED, 1);
            
            const str = pattern.toString();
            expect(str).toContain('RED');
            expect(str).toContain('3×2');
            expect(str).toContain('4×1');
        });
    });
}); 