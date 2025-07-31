// src/components/InvestmentDetail.js
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiX, FiDollarSign, FiPieChart, FiTrendingUp, FiClock } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const InvestmentDetail = ({ investment, onClose }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [tab, setTab] = useState('gains');
  const [liveInvestment, setLiveInvestment] = useState(investment);

  // Generate performance data for this investment
  const performanceData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(investment.startDate);
    month.setMonth(month.getMonth() + i);
    
    if (month > new Date()) return null;
    
    const monthName = month.toLocaleString('default', { month: 'short' });
    const growthRate = 0.01 + (Math.random() * 0.02); // 1-3% monthly growth
    const value = investment.initialAmount * Math.pow(1 + growthRate, i + 1);
    
    return {
      name: monthName,
      value: parseFloat(value.toFixed(2)),
      roi: parseFloat(((value - investment.initialAmount) / investment.initialAmount * 100).toFixed(2))
    };
  }).filter(Boolean);

  // Helper to get plan config by name
  const PLAN_CONFIG = {
    Silver: { roi: 350, duration: 7 },
    Gold: { roi: 450, duration: 10 },
    Platinum: { roi: 550, duration: 15 },
    Diamond: { roi: 650, duration: 21 },
  };

  // Calculate correct current ROI and value for active investments
  function getCurrentRoiAndValue(investment) {
    if (!investment) return { roi: '0.00', value: '0.00' };
    // Always use backend values for active and completed investments
    if (typeof investment.currentValue === 'number' && !isNaN(investment.currentValue)) {
      const roi = ((investment.currentValue - investment.initialAmount) / investment.initialAmount) * 100;
      return {
        roi: roi.toFixed(2),
        value: investment.currentValue.toFixed(2),
      };
    }
    return {
      roi: Number(investment.roi).toFixed(2),
      value: Number(investment.currentValue).toFixed(2),
    };
  }

  // Calculate correct current value and ROI for active investments
  const { roi: displayRoi, value: displayCurrentValue } = getCurrentRoiAndValue(liveInvestment);

  useEffect(() => {
    function updateCountdown() {
      const end = new Date(investment.endDate);
      const now = new Date();
      if (isNaN(end.getTime())) {
        setTimeLeft('N/A');
        return;
      }
      let diff = end - now;
      if (diff <= 0) {
        setTimeLeft('0d 0h 0m 0s');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      diff -= days * 1000 * 60 * 60 * 24;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * 1000 * 60 * 60;
      const minutes = Math.floor(diff / (1000 * 60));
      diff -= minutes * 1000 * 60;
      const seconds = Math.floor(diff / 1000);
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [investment.endDate]);

  useEffect(() => {
    setLiveInvestment(investment); // Reset on open
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/portfolio/investment/${investment.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setLiveInvestment(data.investment || data);
        }
      } catch {}
    }, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [investment]);

  // Use liveInvestment for gains/losses, not stale investment prop
  const gainTxs = (liveInvestment.transactions || []).filter(t => (t.type === 'roi' || t.type === 'gain') && t.amount > 0);
  const lossTxs = (liveInvestment.transactions || []).filter(t => (t.type === 'roi' && t.amount < 0) || t.type === 'loss');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="glassmorphic rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">{liveInvestment.fundName}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-800 transition"
            >
              <FiX size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 bg-opacity-30 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <FiDollarSign className="mr-2 text-gold" /> Invested Amount
              </h3>
              <p className="text-2xl">${investment.initialAmount.toLocaleString()}</p>
            </div>
            
            <div className="bg-gray-800 bg-opacity-30 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <FiTrendingUp className="mr-2 text-gold" /> Current Value
              </h3>
              <p className="text-2xl">${Number(displayCurrentValue).toLocaleString(undefined, {maximumFractionDigits: 2})}</p>
            </div>
            
            <div className="bg-gray-800 bg-opacity-30 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <FiPieChart className="mr-2 text-gold" /> ROI
              </h3>
              <p className={`text-2xl ${
                displayRoi >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {displayRoi}% {PLAN_CONFIG[liveInvestment.planName]?.roi ? <span className="text-xs text-gray-400">(Expected {PLAN_CONFIG[liveInvestment.planName].roi}%)</span> : null}
              </p>
            </div>
            
            <div className="bg-gray-800 bg-opacity-30 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-2 flex items-center">
                <FiClock className="mr-2 text-gold" /> Time Remaining
              </h3>
              <p className="text-2xl">{timeLeft}</p>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <XAxis dataKey="name" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a1a', 
                      borderColor: '#333',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Value']}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#D4AF37"
                    strokeWidth={2}
                    dot={{ fill: '#D4AF37', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-3">Investment Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Plan</span>
                  <span>{liveInvestment.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Start Date</span>
                  <span>{new Date(liveInvestment.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">End Date</span>
                  <span>{new Date(liveInvestment.endDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`${
                    liveInvestment.status === 'active' ? 'text-green-500' : 'text-gray-400'
                  }`}>
                    {liveInvestment.status.charAt(0).toUpperCase() + liveInvestment.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Fund Strategy and prospectus button removed as requested */}
          </div>
          
          <div className="mb-8">
            <div className="flex space-x-4 mb-2">
              <button className={`px-4 py-2 rounded-lg font-bold ${tab === 'gains' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-300'}`} onClick={() => setTab('gains')}>Gains</button>
              <button className={`px-4 py-2 rounded-lg font-bold ${tab === 'losses' ? 'bg-red-700 text-white' : 'bg-gray-700 text-gray-300'}`} onClick={() => setTab('losses')}>Losses</button>
            </div>
            <div className="overflow-y-auto max-h-40">
              {tab === 'gains' && gainTxs.length === 0 && <div className="text-gray-400">No gains yet.</div>}
              {tab === 'losses' && lossTxs.length === 0 && <div className="text-gray-400">No losses yet.</div>}
              {tab === 'gains' && gainTxs.slice().reverse().map((tx, i) => (
                <div key={i} className="flex justify-between py-1 text-green-400">
                  <span>{new Date(tx.date).toLocaleDateString()}</span>
                  <span>+${tx.amount.toFixed(2)}</span>
                </div>
              ))}
              {tab === 'losses' && lossTxs.slice().reverse().map((tx, i) => (
                <div key={i} className="flex justify-between py-1 text-red-400">
                  <span>{new Date(tx.date).toLocaleDateString()}</span>
                  <span>-${Math.abs(tx.amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 bg-opacity-50 p-4 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition"
              onClick={() => window.open('/statements', '_blank')}
            >
              Statements
            </button>
            <button
              className="px-6 py-2 bg-gold text-black rounded-lg hover:bg-yellow-600 transition"
              onClick={async () => {
                // Allow withdrawal if investment is completed, regardless of due date
                if (investment.status !== 'completed') {
                  alert('You cannot withdraw before the investment is completed.');
                  return;
                }
                if (investment.roiWithdrawn) {
                  alert('ROI has already been withdrawn for this investment.');
                  return;
                }
                try {
                  const token = localStorage.getItem('token');
                  const res = await fetch(`/api/investment/withdraw-roi/${investment.id}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  const data = await res.json();
                  if (data.success) {
toast.success(`ROI of $${data.roi?.toLocaleString?.() || ''} withdrawn! Locked balance: $${data.user?.lockedBalance?.toLocaleString?.() || ''}`, {
  position: 'top-center',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  style: {
    background: 'linear-gradient(90deg, #FFD700 0%, #FFF8DC 100%)',
    color: '#222',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)'
  }
});
                  setTimeout(() => window.location.reload(), 5200);
                  } else {
                    alert(data.message || 'Withdrawal failed');
                  }
                } catch (err) {
                  alert('Error withdrawing ROI');
                }
              }}
              disabled={investment.roiWithdrawn}
            >
              {investment.roiWithdrawn ? 'ROI Withdrawn' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetail;