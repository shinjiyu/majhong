import express from 'express';
import { PatternCache } from 'okey101-core';

const router = express.Router();

router.get('/memory', (req, res) => {
    const v8 = require('v8');
    const heapStats = v8.getHeapStatistics();
    const memoryUsage = process.memoryUsage();
    
    // Get cache size
    const cache = PatternCache.getInstance();
    const cacheSize = cache.size();

    const metrics = {
        heapStatistics: {
            totalHeapSize: formatBytes(heapStats.total_heap_size),
            usedHeapSize: formatBytes(heapStats.used_heap_size),
            heapSizeLimit: formatBytes(heapStats.heap_size_limit),
            totalAvailableSize: formatBytes(heapStats.total_available_size)
        },
        processMemory: {
            rss: formatBytes(memoryUsage.rss),
            heapTotal: formatBytes(memoryUsage.heapTotal),
            heapUsed: formatBytes(memoryUsage.heapUsed),
            external: formatBytes(memoryUsage.external)
        },
        cache: {
            size: cacheSize,
            memoryEstimate: formatBytes(cacheSize * 200) // Rough estimate of memory per cache entry
        }
    };

    res.json(metrics);
});

// Helper function to format bytes into human readable format
function formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export default router; 