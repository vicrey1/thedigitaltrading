// src/components/MobileInvestmentCard.js
import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const MobileInvestmentCard = ({ investment }) => {
  return (
    <div className="glassmorphic p-4 rounded-xl mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{investment.fundName}</h3>
          <p className="text-sm text-gray-400">{investment.planName}</p>
        </div>
        <div className={`flex items-center ${
          investment.roi >= 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          {investment.roi >= 0 ? <FiTrendingUp className="mr-1" /> : <FiTrendingDown className="mr-1" />}
          <span>{investment.roi >= 0 ? '+' : ''}{investment.roi}%</span>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-400">Invested</p>
          <p className="font-mono">${investment.initialAmount.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Current</p>
          <p className="font-mono">${investment.currentValue.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Start Date</p>
          <p className="text-sm">{new Date(investment.startDate).toLocaleDateString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">End Date</p>
          <p className="text-sm">{new Date(investment.endDate).toLocaleDateString()}</p>
        </div>
      </div>
      
      <button className="w-full mt-4 py-2 text-gold border border-gold rounded-lg hover:bg-gold hover:bg-opacity-10 transition">
        Details
      </button>
    </div>
  );
};

export default MobileInvestmentCard;