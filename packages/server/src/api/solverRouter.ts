import { Router } from 'express';
import { TilePattern, PatternSolverWithJoker, PatternInput, PatternParser } from 'okey101-core';

const router = Router();
const solver = new PatternSolverWithJoker();

router.post('/solve', async (req, res) => {
  try {
    const { pattern , jokerCount = 0 } = req.body;
    const patternInput: PatternInput = pattern;
    if (!patternInput || !patternInput.tiles || !patternInput.name) {
      return res.status(400).json({
        error: 'Invalid pattern format. Expected PatternInput object.'
      });
    }

    // 验证每种颜色的牌数组是否存在且为数组
    if (!Array.isArray(patternInput.tiles.red) || 
        !Array.isArray(patternInput.tiles.black) ||
        !Array.isArray(patternInput.tiles.blue) ||
        !Array.isArray(patternInput.tiles.yellow)) {
      return res.status(400).json({
        error: 'Invalid tiles format. Each color must be an array of numbers.'
      });
    }

    // 验证所有牌的数字是否在合法范围内(1-13)
    const allTiles = [
      ...patternInput.tiles.red,
      ...patternInput.tiles.black, 
      ...patternInput.tiles.blue,
      ...patternInput.tiles.yellow
    ];

    if (!allTiles.every(num => Number.isInteger(num) && num >= 1 && num <= 13)) {
      return res.status(400).json({
        error: 'Invalid tile numbers. All numbers must be integers between 1 and 13.'
      });
    }

    // 验证每种颜色的牌数量不超过2张
    const tileCount = new Map<string, Map<number, number>>();
    const colors = ['red', 'black', 'blue', 'yellow'] as const;
    colors.forEach(color => {
      tileCount.set(color, new Map());
      patternInput.tiles[color].forEach((num: number) => {
        const colorMap = tileCount.get(color);
        if (!colorMap) return;
        const count = colorMap.get(num) || 0;
        if (count >= 2) {
          return res.status(400).json({
            error: `Invalid tile count. Color ${color} has more than 2 tiles of number ${num}.`
          });
        }
        colorMap.set(num, count + 1);
      });
    });

    // 验证 jokerCount 是否为非负整数且不大于2
    if (!Number.isInteger(jokerCount) || jokerCount < 0 || jokerCount > 2) {
      return res.status(400).json({
        error: 'Invalid joker count. Must be a non-negative integer not greater than 2.'
      });
    }

    const tilePattern = PatternParser.fromJSON(patternInput);

    const solution = solver.solveWithJoker(tilePattern, jokerCount);

    // 返回结果
    res.json({
      pattern,
      jokerCount,
      solution
    });

  } catch (error) {
    console.error('Error solving pattern:', error);
    res.status(500).json({ 
      error: 'Internal server error while solving pattern.' 
    });
  }
});

export default router; 