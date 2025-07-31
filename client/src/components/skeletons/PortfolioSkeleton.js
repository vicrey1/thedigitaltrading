// src/components/skeletons/PortfolioSkeleton.js
import React from 'react';

export const PortfolioSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 bg-gray-800 rounded-lg animate-pulse"></div>
        <div className="flex space-x-2">
          <div className="h-10 w-24 bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glassmorphic p-6 rounded-xl">
            <div className="h-24 bg-gray-800 rounded-lg animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glassmorphic p-6 rounded-xl">
            <div className="h-64 bg-gray-800 rounded-lg animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="glassmorphic p-6 rounded-xl">
        <div className="h-96 bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    </div>
  );
};

// Generic Card Skeleton
export const CardSkeleton = () => {
  return (
    <div className="glassmorphic p-6 rounded-xl">
      <div className="h-24 bg-gray-800 rounded-lg animate-pulse"></div>
    </div>
  );
};

// Table Row Skeleton
export const TableRowSkeleton = ({ columns = 5 }) => {
  return (
    <tr className="border-b border-gray-800">
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="py-4">
          <div className="h-6 bg-gray-800 rounded animate-pulse"></div>
        </td>
      ))}
    </tr>
  );
};