import React from 'react';

const AdminCard = ({ title, value, icon, change }) => (
  <div className="glassmorphic p-6 rounded-xl flex flex-col items-start">
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-lg font-semibold">{title}</div>
    <div className="text-2xl font-bold mt-1">{value}</div>
    {change && <div className="text-sm mt-2 text-green-400">{change}</div>}
  </div>
);

export default AdminCard;
