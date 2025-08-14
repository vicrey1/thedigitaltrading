// src/pages/InvestmentDetail.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { simulatePerformance, simulateTestimonials, simulateActivity } from '../utils/simulateData';
import WithdrawalModal from '../components/WithdrawalModal';

const InvestmentDetail = () => {
  const { id } = useParams();
  const [investment, setInvestment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWithdraw, setShowWithdraw] = useState(false);
  
  useEffect(() => {
    const fetchInvestment = async () => {
      try {
        const response = await axios.get(`/api/user/investment/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setInvestment(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch investment details');
      } finally {
        setLoading(false);
      }
    };
    fetchInvestment();
  }, [id]);
  
  // Generate performance data for detail page
  const generatePerformanceData = () => {
    if (!investment) return [];
    // If real performance data is missing, simulate
    if (!investment.performance || !investment.performance.length) {
      return simulatePerformance(30, 5, 8);
    }
    const days = [];
    const roiFactor = {
      'Spot Market': 0.0005,
      'Derivatives': 0.0015,
      'Yield Farming': 0.002,
      'NFT Fund': 0.001,
      'Arbitrage': 0.0008
    };
    const baseDate = new Date(investment.startDate);
    for (let i = 0; i <= investment.daysInvested; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);
      days.push({
        name: `${date.getMonth()+1}/${date.getDate()}`,
        value: investment.amount * (1 + roiFactor[investment.fundType] * i)
      });
    }
    return days;
  };
  
  // const generateStatement = (investment) => {
  //   const { jsPDF } = require('jspdf');
  //   const doc = new jsPDF();
    
  //   // Add logo
  //   doc.setFontSize(22);
  //   doc.setTextColor(45, 45, 45);
  //   doc.text('LUX', 20, 30);
  //   doc.setTextColor(212, 175, 55);
  //   doc.text('HEDGE', 45, 30);
    
  //   // Add title
  //   doc.setFontSize(16);
  //   doc.setTextColor(0, 0, 0);
  //   doc.text('INVESTMENT STATEMENT', 105, 30, null, null, 'center');
    
  //   // Add investment details
  //   doc.setFontSize(12);
  //   doc.text(`Investment ID: ${investment.id}`, 20, 50);
  //   doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
  //   doc.text(`Fund: ${investment.fundName}`, 20, 70);
  //   doc.text(`Plan: ${investment.planName}`, 20, 80);
  //   doc.text(`Amount: $${investment.initialAmount.toLocaleString()}`, 20, 90);
  //   doc.text(`Current Value: $${investment.currentValue.toLocaleString()}`, 20, 100);
  //   doc.text(`ROI: ${investment.roi >= 0 ? '+' : ''}${investment.roi}%`, 20, 110);
  //   doc.text(`Start Date: ${new Date(investment.startDate).toLocaleDateString()}`, 20, 120);
  //   doc.text(`End Date: ${new Date(investment.endDate).toLocaleDateString()}`, 20, 130);
    
  //   // Add performance chart (simplified)
  //   doc.setFontSize(10);
  //   doc.setTextColor(100, 100, 100);
  //   doc.text('Performance Chart', 20, 150);
  //   doc.rect(20, 155, 170, 60); // Placeholder for chart
    
  //   // Add footer note
  //   doc.setFontSize(10);
  //   doc.text('This is a simulated investment statement for demonstration purposes only.', 105, 220, null, null, 'center');
    
  //   // Save the PDF
  //   doc.save(`LuxYield_Statement_${investment.id}.pdf`);
  // };
  
  if (loading) return <div className="text-white p-8">Loading...</div>;
  if (error) return <div className="text-red-400 p-8">{error}</div>;
  if (!investment) return <div className="text-white p-8">Investment not found.</div>;
  
  const performanceData = generatePerformanceData();
  
  return (
    <div className="space-y-8 px-2 sm:px-4 md:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="glassmorphic p-4 sm:p-6 rounded-xl">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{investment.fundType}</h1>
            <p className="text-gray-400">{investment._id}</p>
          </div>
          <div className={`px-4 py-2 rounded-lg ${
            investment.status === 'Active' ? 'bg-green-900 bg-opacity-30 text-green-400' :
            investment.status === 'Completed' ? 'bg-blue-900 bg-opacity-30 text-blue-400' : 
            'bg-yellow-900 bg-opacity-30 text-yellow-400'
          }`}>
            {investment.status}
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="glassmorphic p-4 sm:p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400">Initial Investment</p>
              <h2 className="text-3xl font-bold">${investment.amount.toFixed(2)}</h2>
            </div>
            <div className="bg-gold bg-opacity-20 p-3 rounded-full text-gold">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="glassmorphic p-4 sm:p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400">Current Value</p>
              <h2 className="text-3xl font-bold">${investment.currentValue.toFixed(2)}</h2>
              <p className={`text-sm mt-2 ${
                investment.roi >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {investment.roi >= 0 ? '+' : ''}{investment.roi.toFixed(2)}% ROI
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              investment.roi >= 0 ? 'bg-green-500 bg-opacity-20 text-green-500' : 
              'bg-red-500 bg-opacity-20 text-red-500'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d={
                  investment.roi >= 0 ? 
                  "M5 15l7-7 7 7" : 
                  "M19 9l-7 7-7-7"
                } />
              </svg>
            </div>
          </div>
        </div>
        <div className="glassmorphic p-4 sm:p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400">Duration</p>
              <h2 className="text-3xl font-bold">{investment.daysInvested}/{investment.simulationDays} Days</h2>
              <p className="text-sm mt-2 text-gray-400">
                {new Date(investment.startDate).toLocaleDateString()} - {new Date(investment.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-blue-500 bg-opacity-20 p-3 rounded-full text-blue-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Chart */}
      <div className="glassmorphic p-4 sm:p-6 rounded-xl overflow-x-auto">
        <h3 className="text-xl font-bold mb-4">Performance History</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#aaa" />
              <YAxis stroke="#aaa" tickFormatter={(value) => `$${value.toFixed(0)}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', borderColor: '#333' }}
                labelStyle={{ color: '#fff' }}
                formatter={(value, name, props) => [`$${value.toFixed(2)}`, 'Portfolio Value']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#D4AF37"
                strokeWidth={2}
                dot={{ fill: '#D4AF37', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Portfolio Value"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
        <button 
          onClick={() => setShowWithdraw(true)}
          className="px-6 py-3 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition"
        >
          Request Withdrawal
        </button>
        <button className="px-6 py-3 bg-gold bg-opacity-20 text-gold rounded-lg hover:bg-opacity-30 transition">
          View Contract
        </button>
      </div>
      
      {/* Transaction History */}
      <div className="glassmorphic p-4 sm:p-6 rounded-xl">
        <h3 className="text-xl font-bold mb-4">Transaction History</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 border-b border-gray-800">
            <div>
              <p className="font-medium">Initial Deposit</p>
              <p className="text-sm text-gray-400">{new Date(investment.startDate).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400">+${investment.amount.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex justify-between items-center p-3 border-b border-gray-800">
            <div>
              <p className="font-medium">ROI Credit</p>
              <p className="text-sm text-gray-400">Daily Earnings</p>
            </div>
            <div className="text-right">
              <p className="text-green-400">+${(investment.currentValue - investment.amount).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Withdrawal Modal */}
      {showWithdraw && (
        <WithdrawalModal 
          isOpen={showWithdraw}
          onClose={() => setShowWithdraw(false)}
          investments={[investment]}
        />
      )}
      
      {/* Testimonials Section */}
      <div className="glassmorphic p-4 sm:p-6 rounded-xl">
        <h3 className="text-xl font-bold mb-4">What Investors Say</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
          {simulateTestimonials(3).map((t, idx) => (
            <div key={idx} className="bg-gray-800 bg-opacity-60 rounded-lg p-4 shadow">
              <div className="text-gold font-bold mb-2">{t.name}</div>
              <div className="text-white mb-2">"{t.comment}"</div>
              <div className="text-xs text-gray-400">{t.date}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Activity Feed Section */}
      <div className="glassmorphic p-4 sm:p-6 rounded-xl">
        <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
        <ul className="divide-y divide-gray-700">
          {simulateActivity(5).map((a, idx) => (
            <li key={idx} className="py-2 flex justify-between items-center">
              <span className="text-white">{a.type} in {a.fund}</span>
              <span className="text-gold">{a.amount}</span>
              <span className="text-xs text-gray-400">{a.date}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default InvestmentDetail;