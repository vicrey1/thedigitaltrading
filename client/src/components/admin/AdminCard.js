import React from 'react';

const AdminCard = ({ title, value, icon, change }) => (
  <div
    role="group"
    aria-label={title}
    className="glassmorphic p-4 sm:p-6 rounded-xl flex flex-col items-start w-full h-full min-h-[96px]"
  >
    <div className="flex items-center w-full">
      <div className="text-2xl sm:text-3xl mb-0 mr-3 flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="text-lg font-semibold truncate">{title}</div>
        <div className="text-2xl font-bold mt-1 truncate">{value}</div>
        {change && <div className="text-sm mt-2 text-green-400 truncate">{change}</div>}
      </div>
    </div>
  </div>
);

export default AdminCard;
