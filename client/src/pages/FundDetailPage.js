import React from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const fundData = {
  'eth-btc-basket': {
    title: 'ETH & BTC Basket',
    description: 'Diversified exposure to top digital assets.',
    roi: '+6%–10%',
    details: 'This fund provides exposure to both Ethereum and Bitcoin, rebalanced monthly for optimal performance.'
  },
  'leverage-alpha-2x': {
    title: 'Leverage Alpha 2x',
    description: 'Managed leverage for enhanced returns.',
    roi: '+8%–14%',
    details: 'A professionally managed leveraged fund targeting alpha in crypto markets.'
  },
  'grid-bot-dynamic': {
    title: 'Grid Bot Dynamic',
    description: 'AI-driven grid trading for consistent alpha.',
    roi: '+9%–12%',
    details: 'Uses advanced AI grid trading strategies for steady returns.'
  },
  'dao-seed-accelerator': {
    title: 'DAO Seed Accelerator',
    description: 'Early-stage Web3 and DAO investments.',
    roi: '+12%–20%',
    details: 'Invests in early-stage Web3 and DAO projects for high growth.'
  },
};

export default function FundDetailPage() {
  const { slug } = useParams();
      const { isDarkMode } = useTheme();
  const fund = fundData[slug];
  
  if (!fund) return (
    <div className={`p-8 min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      Fund not found.
    </div>
  );
  
  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <div className="max-w-3xl mx-auto p-8">
        <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-crypto-orange' : 'text-crypto-orange-dark'}`}>
          {fund.title}
        </h1>
        <div className={`mb-2 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {fund.description}
        </div>
        <div className={`mb-4 font-mono ${isDarkMode ? 'text-crypto-orange' : 'text-crypto-orange-dark'}`}>
          Illustrative Range: {fund.roi}
        </div>
        <div className={`mb-8 text-base ${isDarkMode ? 'text-white/90' : 'text-gray-800'}`}>
          {fund.details}
        </div>
        <a 
          href="/" 
          className={`${isDarkMode ? 'text-crypto-orange hover:text-crypto-orange/80' : 'text-crypto-orange-dark hover:text-crypto-orange'} underline transition-colors`}
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
