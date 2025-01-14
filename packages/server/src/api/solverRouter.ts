import { Router } from 'express';
import { TilePattern, PatternSolverWithJoker } from 'okey101-core';

const router = Router();
const solver = new PatternSolverWithJoker();

interface SolveRequest {
  pattern: number[];
  jokerCount?: number;
}

router.post('/solve', async (req, res) => {
  try {
    const { pattern, jokerCount = 0 } = req.body as SolveRequest;

    // 验证输入
    if (!Array.isArray(pattern) || pattern.some(n => typeof n !== 'number')) {
      return res.status(400).json({ 
        error: 'Invalid pattern format. Expected array of numbers.' 
      });
    }

    if (jokerCount < 0 || jokerCount > 2) {
      return res.status(400).json({ 
        error: 'Joker count must be between 0 and 2.' 
      });
    }

    // 创建牌型并求解
    const tilePattern = new TilePattern(pattern);
    const solution = solver.solveWithJoker(tilePattern, jokerCount);

    // 返回结果
    res.json({
      pattern: pattern,
      jokerCount: jokerCount,
      solution: solution,
      standardForm: tilePattern.getStandardForm()
    });

  } catch (error) {
    console.error('Error solving pattern:', error);
    res.status(500).json({ 
      error: 'Internal server error while solving pattern.' 
    });
  }
});

export default router; 