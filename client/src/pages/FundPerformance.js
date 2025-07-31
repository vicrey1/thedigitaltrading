import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { FiTrendingUp, FiPieChart, FiBarChart2 } from 'react-icons/fi';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#D4AF37'];


// Simulate very positive, strong growth and returns
const mockPerformanceData = [
  { month: 'Jan', value: 10000, roi: 4.2 },
  { month: 'Feb', value: 10420, roi: 4.5 },
  { month: 'Mar', value: 10887, roi: 4.7 },
  { month: 'Apr', value: 11399, roi: 4.8 },
  { month: 'May', value: 11946, roi: 4.9 },
  { month: 'Jun', value: 12534, roi: 5.0 },
  { month: 'Jul', value: 13161, roi: 5.1 },
];

const mockAllocation = [
  { name: 'Spot Market', value: 30 },
  { name: 'Derivatives', value: 25 },
  { name: 'Yield Farming', value: 20 },
  { name: 'NFT Fund', value: 15 },
  { name: 'Arbitrage', value: 10 },
];

const mockReturns = [
  { name: '2021', value: 18.5 },
  { name: '2022', value: 24.2 },
  { name: '2023', value: 29.7 },
  { name: '2024', value: 34.4 },
  { name: '2025', value: 41.2 },
];

const FundPerformance = () => {
  const [performanceData, setPerformanceData] = useState([]);
  const [allocation, setAllocation] = useState([]);
  const [returns, setReturns] = useState([]);

  useEffect(() => {
    // In a real app, fetch from API
    setPerformanceData(mockPerformanceData);
    setAllocation(mockAllocation);
    setReturns(mockReturns);
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-gold mb-6 flex items-center"><FiTrendingUp className="mr-2" /> Fund Performance Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Line Chart: Fund Value Over Time */}
        <div className="glassmorphic p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 flex items-center"><FiBarChart2 className="mr-2" /> Fund Value Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Pie Chart: Allocation */}
        <div className="glassmorphic p-6 rounded-xl">
          <h3 className="text-xl font-bold mb-4 flex items-center"><FiPieChart className="mr-2" /> Fund Allocation</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={allocation} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {allocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Bar Chart: Annual Returns */}
      <div className="glassmorphic p-6 rounded-xl mb-8">
        <h3 className="text-xl font-bold mb-4 flex items-center"><FiBarChart2 className="mr-2" /> Annual Returns (%)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={returns}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#D4AF37" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="glassmorphic p-6 rounded-xl text-gray-300">
        <h4 className="text-lg font-bold mb-2">Performance Insights</h4>
        <ul className="list-disc pl-6">
          <li>Exceptional and consistent growth in fund value every month, with no drawdowns.</li>
          <li>Highly diversified allocation across all strategies, maximizing returns and minimizing risk.</li>
          <li>Annual returns have increased sharply, with 2025 projected to be a record-breaking year.</li>
          <li>All fund metrics are at all-time highs, reflecting outstanding simulated performance.</li>
        </ul>
      </div>
    </div>
  );
};

export default FundPerformance;
