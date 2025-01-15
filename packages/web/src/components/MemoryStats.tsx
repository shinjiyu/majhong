import React, { useEffect, useState } from 'react';

interface MemoryMetrics {
    heapStatistics: {
        totalHeapSize: string;
        usedHeapSize: string;
        heapSizeLimit: string;
        totalAvailableSize: string;
    };
    processMemory: {
        rss: string;
        heapTotal: string;
        heapUsed: string;
        external: string;
    };
    cache: {
        size: number;
        memoryEstimate: string;
    };
}

export function MemoryStats() {
    const [metrics, setMetrics] = useState<MemoryMetrics | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/system/memory');
                if (!response.ok) {
                    throw new Error('Failed to fetch memory metrics');
                }
                const data = await response.json();
                setMetrics(data);
                setError(null);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="loading">Loading memory statistics...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    if (!metrics) {
        return <div className="error">No data available</div>;
    }

    return (
        <div className="memory-stats">
            <h2>Memory Usage Statistics</h2>
            
            <div className="stats-section">
                <h3>Heap Statistics</h3>
                <div className="stats-grid">
                    <div className="stat-item">
                        <label>Total Heap Size:</label>
                        <span>{metrics.heapStatistics.totalHeapSize}</span>
                    </div>
                    <div className="stat-item">
                        <label>Used Heap Size:</label>
                        <span>{metrics.heapStatistics.usedHeapSize}</span>
                    </div>
                    <div className="stat-item">
                        <label>Heap Size Limit:</label>
                        <span>{metrics.heapStatistics.heapSizeLimit}</span>
                    </div>
                    <div className="stat-item">
                        <label>Available Size:</label>
                        <span>{metrics.heapStatistics.totalAvailableSize}</span>
                    </div>
                </div>
            </div>

            <div className="stats-section">
                <h3>Process Memory</h3>
                <div className="stats-grid">
                    <div className="stat-item">
                        <label>RSS:</label>
                        <span>{metrics.processMemory.rss}</span>
                    </div>
                    <div className="stat-item">
                        <label>Heap Total:</label>
                        <span>{metrics.processMemory.heapTotal}</span>
                    </div>
                    <div className="stat-item">
                        <label>Heap Used:</label>
                        <span>{metrics.processMemory.heapUsed}</span>
                    </div>
                    <div className="stat-item">
                        <label>External:</label>
                        <span>{metrics.processMemory.external}</span>
                    </div>
                </div>
            </div>

            <div className="stats-section">
                <h3>Cache Statistics</h3>
                <div className="stats-grid">
                    <div className="stat-item">
                        <label>Cache Entries:</label>
                        <span>{metrics.cache.size}</span>
                    </div>
                    <div className="stat-item">
                        <label>Estimated Memory:</label>
                        <span>{metrics.cache.memoryEstimate}</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 