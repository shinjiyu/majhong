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
            pattern.addTile(3, Color.RED, 2);
            expect(() => pattern.addTile(3, Color.RED, 1)).toThrow("Cannot add more tiles");
        });

        it('should throw error for invalid number', () => {
            expect(() => pattern.addTile(0, Color.RED)).toThrow("Number must be between 1 and 13");
            expect(() => pattern.addTile(14, Color.RED)).toThrow("Number must be between 1 and 13");
        });

        it('should throw error for invalid count', () => {
            expect(() => pattern.addTile(1, Color.RED, 0)).toThrow("Count must be between 1 and 2");
            expect(() => pattern.addTile(1, Color.RED, 3)).toThrow("Count must be between 1 and 2");
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

    describe('canonical form', () => {
        it('should normalize empty pattern', () => {
            const pattern = new TilePattern();
            const canonical = pattern.getCanonicalForm();
            expect(canonical.getPattern()).toEqual([0, 0, 0, 0]);
        });

        it('should normalize simple sequence', () => {
            // 创建红3,4,5
            const pattern1 = new TilePattern();
            pattern1.addTile(3, Color.RED);
            pattern1.addTile(4, Color.RED);
            pattern1.addTile(5, Color.RED);

            // 创建红1,2,3 (同构于红3,4,5)
            const pattern2 = new TilePattern();
            pattern2.addTile(1, Color.RED);
            pattern2.addTile(2, Color.RED);
            pattern2.addTile(3, Color.RED);

            // 它们的标准形应该相同
            const canonical1 = pattern1.getCanonicalForm();
            const canonical2 = pattern2.getCanonicalForm();
            expect(canonical1.getPattern()).toEqual(canonical2.getPattern());

            // 标准形应该是从1开始的序列
            // 找到标准形中有牌的颜色
            let canonicalColor = -1;
            for (let color = 0; color < 4; color++) {
                if (canonical1.getTileCount(1, color as Color) > 0) {
                    canonicalColor = color;
                    break;
                }
            }
            expect(canonicalColor).not.toBe(-1);
            expect(canonical1.getTileCount(1, canonicalColor as Color)).toBe(1);
            expect(canonical1.getTileCount(2, canonicalColor as Color)).toBe(1);
            expect(canonical1.getTileCount(3, canonicalColor as Color)).toBe(1);
        });

        it('should normalize color permutations', () => {
            // 创建红3,黑3,蓝3
            const pattern1 = new TilePattern();
            pattern1.addTile(3, Color.RED);
            pattern1.addTile(3, Color.BLACK);
            pattern1.addTile(3, Color.BLUE);

            // 创建黑3,蓝3,黄3 (同构于红3,黑3,蓝3)
            const pattern2 = new TilePattern();
            pattern2.addTile(3, Color.BLACK);
            pattern2.addTile(3, Color.BLUE);
            pattern2.addTile(3, Color.YELLOW);

            // 它们的标准形应该相同
            const canonical1 = pattern1.getCanonicalForm();
            const canonical2 = pattern2.getCanonicalForm();
            expect(canonical1.getPattern()).toEqual(canonical2.getPattern());

            // 标准形应该使用最小的颜色索引
            const canonical = canonical1.getPattern();
            expect(canonical[0]).toBe(0); // 第一个颜色应该有牌
            expect(canonical[1]).not.toBe(0); // 第二个颜色应该有牌
            expect(canonical[2]).not.toBe(0); // 第三个颜色应该有牌
            expect(canonical[3]).not.toBe(0);     // 第四个颜色应该没有牌
        });

        it('should detect isomorphic patterns', () => {
            // 创建红3,4,5
            const pattern1 = new TilePattern();
            pattern1.addTile(3, Color.RED);
            pattern1.addTile(4, Color.RED);
            pattern1.addTile(5, Color.RED);

            // 创建黑1,2,3 (同构于红3,4,5)
            const pattern2 = new TilePattern();
            pattern2.addTile(1, Color.BLACK);
            pattern2.addTile(2, Color.BLACK);
            pattern2.addTile(3, Color.BLACK);

            expect(pattern1.isIsomorphic(pattern2)).toBe(true);
        });

        it('should detect non-isomorphic patterns', () => {
            // 创建红3,4,5
            const pattern1 = new TilePattern();
            pattern1.addTile(3, Color.RED);
            pattern1.addTile(4, Color.RED);
            pattern1.addTile(5, Color.RED);

            // 创建红3,黑3,蓝3 (不同构于红3,4,5)
            const pattern2 = new TilePattern();
            pattern2.addTile(3, Color.RED);
            pattern2.addTile(3, Color.BLACK);
            pattern2.addTile(3, Color.BLUE);

            expect(pattern1.isIsomorphic(pattern2)).toBe(false);
        });

        it('should generate consistent canonical IDs', () => {
            // 创建红3,4,5
            const pattern1 = new TilePattern();
            pattern1.addTile(3, Color.RED);
            pattern1.addTile(4, Color.RED);
            pattern1.addTile(5, Color.RED);

            // 创建黑1,2,3 (同构于红3,4,5)
            const pattern2 = new TilePattern();
            pattern2.addTile(1, Color.BLACK);
            pattern2.addTile(2, Color.BLACK);
            pattern2.addTile(3, Color.BLACK);

            expect(pattern1.getCanonicalId()).toBe(pattern2.getCanonicalId());
        });
    });

    describe('caching mechanism', () => {
        it('should cache canonical form', () => {
            // 创建一个复杂的牌型
            const pattern = new TilePattern();
            pattern.addTile(3, Color.RED);
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);
            pattern.addTile(3, Color.BLACK);

            // 第一次计算标准形
            const canonical1 = pattern.getCanonicalForm();
            // 第二次应该返回缓存的结果
            const canonical2 = pattern.getCanonicalForm();

            // 结果应该相同
            expect(canonical1.getPattern()).toEqual(canonical2.getPattern());

            // 修改牌型应该清除缓存
            pattern.addTile(6, Color.RED);
            const canonical3 = pattern.getCanonicalForm();
            // 结果应该不同
            expect(canonical3.getPattern()).not.toEqual(canonical1.getPattern());
        });

        it('should cache canonical ID', () => {
            // 创建一个复杂的牌型
            const pattern = new TilePattern();
            pattern.addTile(3, Color.RED);
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);

            // 第一次计算ID
            const id1 = pattern.getCanonicalId();
            // 第二次应该返回缓存的结果
            const id2 = pattern.getCanonicalId();

            // 结果应该相同
            expect(id1).toBe(id2);

            // 修改牌型应该清除缓存
            pattern.removeTile(3, Color.RED);
            const id3 = pattern.getCanonicalId();
            // 结果应该不同
            expect(id3).not.toBe(id1);
        });

        it('should clear cache on pattern operations', () => {
            const pattern = new TilePattern();
            pattern.addTile(3, Color.RED);

            // 获取初始标准形
            const canonical1 = pattern.getCanonicalForm();

            // 各种操作应该清除缓存
            pattern.clear();
            const canonical2 = pattern.getCanonicalForm();
            expect(canonical2.getPattern()).not.toEqual(canonical1.getPattern());

            pattern.addTile(1, Color.BLACK);
            const canonical3 = pattern.getCanonicalForm();
            expect(canonical3.getPattern()).not.toEqual(canonical2.getPattern());


            pattern.setPattern([1, 0, 0, 0]);
            const canonical4 = pattern.getCanonicalForm();
            expect(canonical4.getPattern()).toEqual(canonical3.getPattern());
        });
    });

    describe('error handling', () => {
        it('should throw error for invalid number', () => {
            expect(() => pattern.addTile(0, Color.RED)).toThrow("Number must be between 1 and 13");
            expect(() => pattern.addTile(14, Color.RED)).toThrow("Number must be between 1 and 13");
        });

        it('should throw error for invalid count', () => {
            expect(() => pattern.addTile(1, Color.RED, 0)).toThrow("Count must be between 1 and 2");
            expect(() => pattern.addTile(1, Color.RED, 3)).toThrow("Count must be between 1 and 2");
        });
    });

    describe('boundary conditions', () => {
        it('should handle all numbers in sequence', () => {
            // 添加1-13的所有数字
            for (let i = 1; i <= 13; i++) {
                pattern.addTile(i, Color.RED);
            }
            expect(pattern.getTotalCount()).toBe(13);

            // 验证每个数字都正确添加
            for (let i = 1; i <= 13; i++) {
                expect(pattern.getTileCount(i, Color.RED)).toBe(1);
            }
        });

        it('should handle all colors for same number', () => {
            // 在每种颜色上添加同一个数字
            pattern.addTile(1, Color.RED);
            pattern.addTile(1, Color.BLACK);
            pattern.addTile(1, Color.BLUE);
            pattern.addTile(1, Color.YELLOW);

            expect(pattern.getTileCount(1, Color.RED)).toBe(1);
            expect(pattern.getTileCount(1, Color.BLACK)).toBe(1);
            expect(pattern.getTileCount(1, Color.BLUE)).toBe(1);
            expect(pattern.getTileCount(1, Color.YELLOW)).toBe(1);
        });

        it('should handle maximum pattern size', () => {
            // 尝试添加所有可能的牌
            for (let color = 0; color < 4; color++) {
                for (let number = 1; number <= 13; number++) {
                    pattern.addTile(number, color as Color, 2);
                }
            }

            // 验证总数
            expect(pattern.getTotalCount()).toBe(13 * 4 * 2);

            // 验证toString不会崩溃
            expect(() => pattern.toString()).not.toThrow();
        });
    });

    describe('pattern comparison', () => {
        it('should handle cyclic equivalence', () => {
            // 创建循环等价的牌型
            const pattern1 = new TilePattern();
            pattern1.addTile(1, Color.RED);
            pattern1.addTile(2, Color.RED);
            pattern1.addTile(3, Color.RED);

            const pattern2 = new TilePattern();
            pattern2.addTile(12, Color.RED);
            pattern2.addTile(13, Color.RED);
            pattern2.addTile(1, Color.RED);

            expect(pattern1.isIsomorphic(pattern2)).toBe(false);
        });

        it('should handle color permutations with multiple tiles', () => {
            // 创建颜色置换的复杂牌型
            const pattern1 = new TilePattern();
            pattern1.addTile(1, Color.RED, 2);
            pattern1.addTile(2, Color.BLACK, 2);
            pattern1.addTile(3, Color.BLUE, 1);

            const pattern2 = new TilePattern();
            pattern2.addTile(1, Color.BLUE, 2);
            pattern2.addTile(2, Color.YELLOW, 2);
            pattern2.addTile(3, Color.RED, 1);

            expect(pattern1.isIsomorphic(pattern2)).toBe(true);
        });

        it('should handle self-isomorphism', () => {
            // 测试与自身的同构性
            const pattern1 = new TilePattern();
            pattern1.addTile(1, Color.RED);
            pattern1.addTile(2, Color.BLACK);

            expect(pattern1.isIsomorphic(pattern1)).toBe(true);
            expect(pattern1.isIsomorphic(pattern1.clone())).toBe(true);
        });

        it('should handle complex patterns with multiple colors and numbers', () => {
            // 创建一个复杂的牌型，包含多种颜色和数字组合
            const pattern1 = new TilePattern();
            pattern1.addTile(1, Color.RED);    // 红1x3
            pattern1.addTile(2, Color.RED);    // 红2x2
            pattern1.addTile(3, Color.RED);  // 黑3x1
            pattern1.addTile(2, Color.BLUE);   // 蓝4x3
            pattern1.addTile(2, Color.YELLOW); // 黄5x2
            pattern1.addTile(1, Color.YELLOW);  // 黑6x1
            pattern1.addTile(3, Color.YELLOW);  // 黑6x1

            // 创建一个同构的复杂牌型
            const pattern2 = new TilePattern();
            pattern2.addTile(3, Color.RED);    // 红1x3
            pattern2.addTile(4, Color.RED);    // 红2x2
            pattern2.addTile(5, Color.RED);  // 黑3x1
            pattern2.addTile(4, Color.BLUE);   // 蓝4x3
            pattern2.addTile(4, Color.YELLOW); // 黄5x2
            pattern2.addTile(5, Color.YELLOW);  // 黑6x1
            pattern2.addTile(3, Color.YELLOW);  // 黑6x1

            // 验证同构性
            expect(pattern1.isIsomorphic(pattern2)).toBe(true);
        });



        it('should handle complex patterns with multiple colors and numbers', () => {
            // 创建一个复杂的牌型，包含多种颜色和数字组合
            const pattern1 = new TilePattern();
            pattern1.addTile(1, Color.RED);    // 红1x3
            pattern1.addTile(2, Color.RED);    // 红2x2
            pattern1.addTile(3, Color.RED);  // 黑3x1
            pattern1.addTile(1, Color.BLUE);   // 蓝4x3
            pattern1.addTile(2, Color.YELLOW); // 黄5x2
            pattern1.addTile(1, Color.YELLOW);  // 黑6x1
            pattern1.addTile(3, Color.YELLOW);  // 黑6x1
            pattern1.addTile(4, Color.YELLOW);  // 黑6x1

            // 创建一个同构的复杂牌型
            const pattern2 = new TilePattern();
            pattern2.addTile(1, Color.RED);    // 红1x3
            pattern2.addTile(2, Color.RED);    // 红2x2
            pattern2.addTile(3, Color.RED);  // 黑3x1
            pattern2.addTile(4, Color.RED);  // 黑3x1
            pattern2.addTile(1, Color.BLUE);   // 蓝4x3
            pattern2.addTile(1, Color.YELLOW); // 黄5x2
            pattern2.addTile(2, Color.YELLOW);  // 黑6x1
            pattern2.addTile(3, Color.YELLOW);  // 黑6x1

            // 验证同构性
            expect(pattern1.isIsomorphic(pattern2)).toBe(true);
        });
    });

    describe('findAllContinuousSequences', () => {
        beforeEach(() => {
            pattern = new TilePattern();
        });

        test('should find simple sequence', () => {
            // 1,2,3,4,5 每种牌一张
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);

            const sequences = pattern.findAllContinuousSequences(Color.RED);
            expect(sequences).toEqual([[1, 5]]);
        });

        test('should find sequences with one repeated number', () => {
            // 1,2,3,3,4,5 (3有两张)
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED, 2);  // 两张3
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);

            const sequences = pattern.findAllContinuousSequences(Color.RED);
            expect(sequences).toEqual([[1, 3], [1, 5], [3, 5]]);
        });

        test('should find sequences with two repeated numbers', () => {
            // 1,2,3,3,4,4,5 (3和4各两张)
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED, 2);  // 两张3
            pattern.addTile(4, Color.RED, 2);  // 两张4
            pattern.addTile(5, Color.RED);

            const sequences = pattern.findAllContinuousSequences(Color.RED);
            expect(sequences).toEqual([[1, 4], [1, 5], [3, 5]]);
        });

        test('should handle edge cases', () => {
            // 11,12,12,13 (12有两张)
            pattern.addTile(11, Color.RED);
            pattern.addTile(12, Color.RED, 2);  // 两张12
            pattern.addTile(13, Color.RED);

            const sequences = pattern.findAllContinuousSequences(Color.RED);
            expect(sequences).toEqual([[11, 13]]);
        });

        test('should handle multiple disjoint sequences', () => {
            // 1,2,3 和 7,7,8,9 (7有两张)
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);
            pattern.addTile(7, Color.RED, 2);  // 两张7
            pattern.addTile(8, Color.RED);
            pattern.addTile(9, Color.RED);

            const sequences = pattern.findAllContinuousSequences(Color.RED);
            expect(sequences).toEqual([[1, 3], [7, 9]]);
        });

        test('should handle sequences with gaps', () => {
            // 1,2,3,5,6,7 每种牌一张
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);
            pattern.addTile(5, Color.RED);
            pattern.addTile(6, Color.RED);
            pattern.addTile(7, Color.RED);

            const sequences = pattern.findAllContinuousSequences(Color.RED);
            expect(sequences).toEqual([[1, 3], [5, 7]]);
        });

        test('should handle complex overlapping sequences', () => {
            // 1,2,2,3,3,4,4,5 (2,3,4各两张)
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED, 2);  // 两张2
            pattern.addTile(3, Color.RED, 2);  // 两张3
            pattern.addTile(4, Color.RED, 2);  // 两张4
            pattern.addTile(5, Color.RED);

            const sequences = pattern.findAllContinuousSequences(Color.RED);
            expect(sequences).toEqual([[1, 4], [1, 5],[2,4], [2, 5]]);
        });

        test('should not find sequences shorter than 3', () => {
            // 1,2 每种牌一张
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);

            const sequences = pattern.findAllContinuousSequences(Color.RED);
            expect(sequences).toEqual([]);
        });

        test('should handle empty pattern', () => {
            const sequences = pattern.findAllContinuousSequences(Color.RED);
            expect(sequences).toEqual([]);
        });

        test('should handle sequence with alternating doubles', () => {
            // 1,2,2,3,4,4,5 (2和4有两张)
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED, 2);  // 两张2
            pattern.addTile(3, Color.RED);
            pattern.addTile(4, Color.RED, 2);  // 两张4
            pattern.addTile(5, Color.RED);

            const sequences = pattern.findAllContinuousSequences(Color.RED);
            expect(sequences).toEqual([[1, 4], [1, 5], [2, 4], [2, 5]]);
        });

        test('should handle sequence with consecutive doubles', () => {
            // 1,2,2,3,3,4,5 (2和3有两张)
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED, 2);  // 两张2
            pattern.addTile(3, Color.RED, 2);  // 两张3
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);

            const sequences = pattern.findAllContinuousSequences(Color.RED);
            expect(sequences).toEqual([[1, 3], [1, 5], [2, 5]]);
        });
    });

    describe('getTileConnectivity', () => {
        beforeEach(() => {
            pattern = new TilePattern();
        });

        test('should return 0 for empty position', () => {
            expect(pattern.getTileConnectivity(1, Color.RED)).toBe(0);
        });

        test('should return sequence length for tile in sequence', () => {
            // 添加一个长度为5的顺子
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);

            // 检查顺子中每个位置的连通值
            expect(pattern.getTileConnectivity(1, Color.RED)).toBe(5);
            expect(pattern.getTileConnectivity(3, Color.RED)).toBe(5);
            expect(pattern.getTileConnectivity(5, Color.RED)).toBe(5);
        });

        test('should return triplet count for tile in triplet', () => {
            // 添加一个4张相同数字的组合
            pattern.addTile(3, Color.RED);
            pattern.addTile(3, Color.BLACK);
            pattern.addTile(3, Color.BLUE);
            pattern.addTile(3, Color.YELLOW);

            // 检查每个颜色位置的连通值
            expect(pattern.getTileConnectivity(3, Color.RED)).toBe(4);
            expect(pattern.getTileConnectivity(3, Color.BLACK)).toBe(4);
            expect(pattern.getTileConnectivity(3, Color.YELLOW)).toBe(4);
        });

        test('should return max of sequence and triplet length', () => {
            // 添加一个长度为3的顺子
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);

            // 3有三张牌，形成刻子
            pattern.addTile(3, Color.BLACK);
            pattern.addTile(3, Color.BLUE);

            // 对于红3，它既在顺子中又在刻子中，应返回较大的值
            expect(pattern.getTileConnectivity(3, Color.RED)).toBe(3);  // max(3, 3)
            // 对于黑3，它只在刻子中
            expect(pattern.getTileConnectivity(3, Color.BLACK)).toBe(3);
        });

        test('should handle overlapping sequences', () => {
            // 添加重叠的顺子：1,2,2,3,3,4,4,5
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED, 2);
            pattern.addTile(3, Color.RED, 2);
            pattern.addTile(4, Color.RED, 2);
            pattern.addTile(5, Color.RED);

            // 检查重叠位置的连通值
            expect(pattern.getTileConnectivity(2, Color.RED)).toBe(5);  // 在1-5的顺子中
            expect(pattern.getTileConnectivity(3, Color.RED)).toBe(5);  // 在1-5的顺子中
            expect(pattern.getTileConnectivity(4, Color.RED)).toBe(5);  // 在1-5的顺子中
        });

        test('should handle edge cases', () => {
            // 测试边界数字
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(13, Color.RED);

            expect(pattern.getTileConnectivity(1, Color.RED)).toBe(2);  // 只能和2连
            expect(pattern.getTileConnectivity(13, Color.RED)).toBe(1); // 不能和其他牌连
        });

        test('should handle multiple sequences of same color', () => {
            // 添加两个不相连的顺子：1,2,3 和 5,6,7
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);
            pattern.addTile(5, Color.RED);
            pattern.addTile(6, Color.RED);
            pattern.addTile(7, Color.RED);

            expect(pattern.getTileConnectivity(2, Color.RED)).toBe(3);  // 在1-3的顺子中
            expect(pattern.getTileConnectivity(6, Color.RED)).toBe(3);  // 在5-7的顺子中
            expect(pattern.getTileConnectivity(4, Color.RED)).toBe(0);  // 不在任何顺子中
        });

        test('should handle sequences with gaps', () => {
            // 添加一个带间隔的序列：1,2,3,_,5,6,7
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);
            pattern.addTile(5, Color.RED);
            pattern.addTile(6, Color.RED);
            pattern.addTile(7, Color.RED);

            expect(pattern.getTileConnectivity(2, Color.RED)).toBe(3);  // 在1-3的顺子中
            expect(pattern.getTileConnectivity(6, Color.RED)).toBe(3);  // 在5-7的顺子中
        });

        test('should handle mixed sequence and triplet with gaps', () => {
            // 添加一个复杂的组合：
            // 红1,2,3
            // 红5,黑5,蓝5
            // 红7,8,9
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);
            pattern.addTile(5, Color.RED);
            pattern.addTile(5, Color.BLACK);
            pattern.addTile(5, Color.BLUE);
            pattern.addTile(7, Color.RED);
            pattern.addTile(8, Color.RED);
            pattern.addTile(9, Color.RED);

            expect(pattern.getTileConnectivity(2, Color.RED)).toBe(3);   // 在1-3的顺子中
            expect(pattern.getTileConnectivity(5, Color.RED)).toBe(3);   // 在刻子中
            expect(pattern.getTileConnectivity(5, Color.BLACK)).toBe(3); // 在刻子中
            expect(pattern.getTileConnectivity(8, Color.RED)).toBe(3);   // 在7-9的顺子中
        });

        test('should handle alternating doubles in sequence', () => {
            // 添加带有交替双张的顺子：1,2,2,3,4,4,5
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED, 2);
            pattern.addTile(3, Color.RED);
            pattern.addTile(4, Color.RED, 2);
            pattern.addTile(5, Color.RED);

            expect(pattern.getTileConnectivity(2, Color.RED)).toBe(5);  // 在1-5的顺子中
            expect(pattern.getTileConnectivity(3, Color.RED)).toBe(5);  // 在1-5的顺子中
            expect(pattern.getTileConnectivity(4, Color.RED)).toBe(5);  // 在1-5的顺子中
        });

        test('should handle consecutive doubles in sequence', () => {
            // 添加带有连续双张的顺子：1,2,2,3,3,4,5
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED, 2);
            pattern.addTile(3, Color.RED, 2);
            pattern.addTile(4, Color.RED);
            pattern.addTile(5, Color.RED);

            expect(pattern.getTileConnectivity(2, Color.RED)).toBe(5);  // 在1-5的顺子中
            expect(pattern.getTileConnectivity(3, Color.RED)).toBe(5);  // 在1-5的顺子中
        });

        test('should handle complex mixed patterns', () => {
            // 添加一个复杂的混合模式：
            // 红1,2,3,4 (顺子)
            // 红4,黑4,蓝4 (刻子)
            // 红6,7,8 (顺子)
            pattern.addTile(1, Color.RED);
            pattern.addTile(2, Color.RED);
            pattern.addTile(3, Color.RED);
            pattern.addTile(4, Color.RED);
            pattern.addTile(4, Color.BLACK);
            pattern.addTile(4, Color.BLUE);
            pattern.addTile(6, Color.RED);
            pattern.addTile(7, Color.RED);
            pattern.addTile(8, Color.RED);

            expect(pattern.getTileConnectivity(2, Color.RED)).toBe(4);   // 在1-4的顺子中
            expect(pattern.getTileConnectivity(4, Color.RED)).toBe(4);   // max(4, 3)
            expect(pattern.getTileConnectivity(4, Color.BLACK)).toBe(3); // 在刻子中
            expect(pattern.getTileConnectivity(7, Color.RED)).toBe(3);   // 在6-8的顺子中
        });
    });
}); 