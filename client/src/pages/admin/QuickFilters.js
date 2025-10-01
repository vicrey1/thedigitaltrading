import React from 'react';

const QuickFilters = ({ onFilter, activeFilter }) => {
  const filters = [
    { id: 'all', label: 'All Users' },
    { id: 'active', label: 'Active Users' },
    { id: 'kyc_pending', label: 'KYC Pending' },
    { id: 'recent', label: 'Recently Active' }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onFilter(filter.id)}
          className={`px-3 py-1 rounded text-sm ${
            activeFilter === filter.id
              ? 'bg-gold text-black'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default QuickFilters;