import { Color } from '../src/TilePattern';
import { PatternParser } from '../src/PatternParser';

describe('PatternParser', () => {
    describe('fromJSON', () => {
        it('should parse valid JSON correctly', () => {
            const json = {
                name: "测试牌型",
                tiles: {
                    red: [3, 3, 4, 5],
                    black: [4],
                    blue: [],
                    yellow: []
                }
            };

            const pattern = PatternParser.fromJSON(json);
            expect(pattern.getTileCount(3, Color.RED)).toBe(2);
            expect(pattern.getTileCount(4, Color.RED)).toBe(1);
            expect(pattern.getTileCount(5, Color.RED)).toBe(1);
            expect(pattern.getTileCount(4, Color.BLACK)).toBe(1);
        });

        it('should throw error for missing tiles object', () => {
            const json = {
                name: "错误牌型"
            };

            expect(() => PatternParser.fromJSON(json as any)).toThrow();
        });

        it('should throw error for invalid color', () => {
            const json = {
                name: "错误牌型",
                tiles: {
                    red: [3],
                    invalid: [4]
                }
            };

            expect(() => PatternParser.fromJSON(json as any)).toThrow();
        });

        it('should throw error for invalid number', () => {
            const json = {
                name: "错误牌型",
                tiles: {
                    red: [0],
                    black: []
                }
            };

            expect(() => PatternParser.fromJSON(json as any)).toThrow();
        });
    });

    describe('toJSON', () => {
        it('should convert pattern to JSON correctly', () => {
            const json = {
                name: "测试牌型",
                tiles: {
                    red: [3, 3, 4, 5],
                    black: [4],
                    blue: [],
                    yellow: []
                }
            };

            const pattern = PatternParser.fromJSON(json);
            const converted = PatternParser.toJSON(pattern, "测试牌型");

            expect(converted).toEqual(json);
        });

        it('should handle empty pattern correctly', () => {
            const json = {
                name: "",
                tiles: {
                    red: [],
                    black: [],
                    blue: [],
                    yellow: []
                }
            };

            const pattern = PatternParser.fromJSON(json);
            const converted = PatternParser.toJSON(pattern);

            expect(converted).toEqual(json);
        });

        it('should preserve tile order in arrays', () => {
            const json = {
                name: "顺序测试",
                tiles: {
                    red: [5, 4, 3],  // 顺序不同
                    black: [],
                    blue: [],
                    yellow: []
                }
            };

            const pattern = PatternParser.fromJSON(json);
            const converted = PatternParser.toJSON(pattern, "顺序测试");

            // 注意：转换后的数组应该是有序的
            expect(converted.tiles.red).toEqual([3, 4, 5]);
        });
    });
}); 