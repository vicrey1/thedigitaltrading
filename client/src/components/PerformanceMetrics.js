import React, { useEffect, useState } from 'react';

const PerformanceMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/performance');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      const data = await res.json();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading performance metrics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!metrics) return null;

  return (
    <div className="performance-metrics bg-white rounded-lg shadow p-6 flex flex-col gap-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Performance Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-gray-500">ROI</div>
          <div className="text-lg font-semibold text-green-600">{metrics.roi}%</div>
        </div>
        <div>
          <div className="text-gray-500">Sharpe Ratio</div>
          <div className="text-lg font-semibold">{metrics.sharpe}</div>
        </div>
        <div>
          <div className="text-gray-500">Alpha</div>
          <div className="text-lg font-semibold">{metrics.alpha}</div>
        </div>
        <div>
          <div className="text-gray-500">Volatility</div>
          <div className="text-lg font-semibold">{metrics.volatility}%</div>
        </div>
        <div>
          <div className="text-gray-500">Max Drawdown</div>
          <div className="text-lg font-semibold text-red-600">{metrics.maxDrawdown}%</div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
