// src/pages/admin/index.js
import React from 'react';
import { Link } from 'react-router-dom';

const AdminIndex = () => (
  <div className="max-w-xl mx-auto p-8">
    <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
    <ul className="space-y-4">
      <li><Link className="text-gold underline" to="/admin/plans">Manage Investment Plans</Link></li>
      <li><Link className="text-gold underline" to="/admin/user-investments">Manage User Investments</Link></li>
      <li><Link className="text-gold underline" to="/admin/cold-wallet">Admin Cold Wallet</Link></li>
    </ul>
  </div>
);

export default AdminIndex;
