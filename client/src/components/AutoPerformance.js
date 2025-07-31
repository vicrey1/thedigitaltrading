import React, { useEffect, useState } from 'react';

const AUTO_REFRESH_INTERVAL = 60000; // 60 seconds

export function PlanPerformance({ planId }) {
  const [metrics, setMetrics] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchData = () => {
      fetch(`/api/performance/plan/${planId}`)
        .then(res => res.json())
        .then(data => isMounted && setMetrics(data));
      fetch(`/api/performance/plan/${planId}/history?days=14`)
        .then(res => res.json())
        .then(data => isMounted && setHistory(data));
    };
    fetchData();
    const interval = setInterval(fetchData, AUTO_REFRESH_INTERVAL);
    return () => { isMounted = false; clearInterval(interval); };
  }, [planId]);

  return (
    <div>
      <h3>Plan Performance</h3>
      {metrics && (
        <div>
          <div>ROI: {Number(metrics.roi).toFixed(2)}%</div>
          <div>Sharpe: {Number(metrics.sharpe).toFixed(2)}</div>
          <div>Alpha: {Number(metrics.alpha).toFixed(2)}</div>
          <div>Volatility: {Number(metrics.volatility).toFixed(2)}%</div>
          <div>Max Drawdown: {Number(metrics.maxDrawdown).toFixed(2)}%</div>
        </div>
      )}
      {history.length > 1 && (
        <svg width="100" height="30">
          {history.map((h, i, arr) =>
            i > 0 ? (
              <line
                key={i}
                x1={((i - 1) / (arr.length - 1)) * 100}
                y1={30 - (arr[i - 1].roi / 30) * 30}
                x2={(i / (arr.length - 1)) * 100}
                y2={30 - (h.roi / 30) * 30}
                stroke="blue"
              />
            ) : null
          )}
        </svg>
      )}
    </div>
  );
}

export function UserGainLogs({ userId }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchLogs = () => {
      fetch(`/api/performance/user/${userId}/gain-logs`)
        .then(res => res.json())
        .then(data => isMounted && setLogs(data));
    };
    fetchLogs();
    const interval = setInterval(fetchLogs, AUTO_REFRESH_INTERVAL);
    return () => { isMounted = false; clearInterval(interval); };
  }, [userId]);

  return (
    <div>
      <h3>Earnings Activity</h3>
      <ul>
        {logs.map(log => (
          <li key={log._id}>
            <strong>{log.gain_type}:</strong> {log.value > 0 ? '+' : ''}{log.value}% — {log.message} <em>({new Date(log.logged_at).toLocaleString()})</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
