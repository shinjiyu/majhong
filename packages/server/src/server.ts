import express from 'express';
import cors from 'cors';
import { PatternCache } from 'okey101-core';
import solverRouter from './api/solverRouter';

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api', solverRouter);

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

    // 启动服务器
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
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