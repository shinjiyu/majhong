import express from 'express';
import cors from 'cors';
import { PatternCache } from 'okey101-core';
import solverRouter from './api/solverRouter';
import systemRouter from './api/systemRouter';

const app = express();
const port = process.env.PORT || 3000;

// Pre-allocate memory array to increase heap size
const memoryBuffer: number[] = new Array(1024 * 1024 * 100).fill(0); // Allocate ~800MB

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', solverRouter);
app.use('/api/system', systemRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 初始化服务器
async function startServer() {
  try {
    // 初始化缓存
    const cache = PatternCache.getInstance();
    await cache.initialize();

    // Force V8 to allocate more memory
    global.gc && global.gc();
    memoryBuffer.length; // Access buffer to prevent optimization

    // 启动服务器
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log('Memory pre-allocated for optimal performance');
    });

    // 优雅关闭
    process.on('SIGTERM', async () => {
      console.log('SIGTERM signal received: closing HTTP server');
      await cache.destroy();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer(); 