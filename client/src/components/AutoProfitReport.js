import React, { useEffect, useState } from 'react';

function randomROI() {
  return (Math.random() * 10 + 5).toFixed(2); // 5% - 15%
}
function randomYield() {
  return (Math.random() * 1000 + 200).toFixed(2);
}

export default function AutoProfitReport() {
  const [roi, setRoi] = useState(randomROI());
  const [yieldAmt, setYieldAmt] = useState(randomYield());

  useEffect(() => {
    const interval = setInterval(() => {
      setRoi(randomROI());
      setYieldAmt(randomYield());
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-4 mb-4 bg-gradient-to-r from-yellow-900 to-yellow-700 text-white">
      <div className="font-bold mb-2">Profit Report</div>
      <div>Estimated ROI: <span className="text-gold font-bold">{roi}%</span></div>
      <div>Yield this month: <span className="text-green-400 font-bold">${yieldAmt}</span></div>
    </div>
  );
}
