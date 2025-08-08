// src/pages/admin/UserInvestmentsAdmin.js
import React, { useState } from 'react';
import axios from 'axios';

const UserInvestmentsAdmin = () => {
  const [userId, setUserId] = useState('');
  const [investments, setInvestments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchInvestments = async () => {
    const res = await axios.get(`/api/admin/user-investments/${userId}`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
    setInvestments(res.data);
  };

  const handleEdit = (inv) => {
    setEditing(inv._id);
    setEditForm({ ...inv });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await axios.put(`/api/admin/user-investments/${editing}`, editForm, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
    setEditing(null);
    fetchInvestments();
  };

  const [gainLossAmount, setGainLossAmount] = useState('');
  const [gainLossType, setGainLossType] = useState('gain');

  const handleSetGainLoss = async (id) => {
    if (!gainLossAmount || isNaN(gainLossAmount)) return;
    await axios.post(`/api/admin/investment/${id}/set-gain-loss`, {
      amount: parseFloat(gainLossAmount),
      type: gainLossType
    }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
    setGainLossAmount('');
    fetchInvestments();
  };

  const handleComplete = async (id) => {
    await axios.post(`/api/admin/user-investments/${id}/complete`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
    fetchInvestments();
  };

  return (
      <div className="max-w-full sm:max-w-4xl w-full mx-auto p-2 sm:p-6 overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">User Investments Admin</h1>
      <div className="mb-4 flex gap-2">
        <input className="p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" placeholder="User ID" value={userId} onChange={e => setUserId(e.target.value)} />
        <button className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition" onClick={fetchInvestments}>Fetch Investments</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-700 mb-6">
        <table className="w-full text-sm overflow-auto">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-900 text-left">
              <th className="py-3 px-4 font-semibold">ID</th>
              <th className="py-3 px-4 font-semibold">Plan</th>
              <th className="py-3 px-4 font-semibold">Amount</th>
              <th className="py-3 px-4 font-semibold">Current Value</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {investments.map(inv => (
              <tr key={inv._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                <td className="py-3 px-4 break-all">{inv._id}</td>
                <td className="py-3 px-4">{inv.planName}</td>
                <td className="py-3 px-4">{inv.amount}</td>
                <td className="py-3 px-4">{inv.currentValue}</td>
                <td className="py-3 px-4 capitalize">{inv.status}</td>
                <td className="py-3 px-4 flex flex-wrap gap-2 items-center">
                  <button className="text-blue-600 font-semibold hover:underline" onClick={() => handleEdit(inv)}>Edit</button>
                  <button className="text-green-600 font-semibold hover:underline" onClick={() => handleComplete(inv._id)}>Complete</button>
                  <input className="p-1 border rounded w-20 bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" placeholder="Gain/Loss $" value={gainLossAmount} onChange={e => setGainLossAmount(e.target.value)} />
                  <select className="p-1 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" value={gainLossType} onChange={e => setGainLossType(e.target.value)}>
                    <option value="gain">Gain</option>
                    <option value="loss">Loss</option>
                  </select>
                  <button className="text-red-600 font-semibold hover:underline" onClick={() => handleSetGainLoss(inv._id)}>Set</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <form onSubmit={handleEditSubmit} className="mb-6 space-y-2 bg-gray-900 p-2 sm:p-4 rounded-lg border border-gray-700 overflow-x-auto">
          <h2 className="text-lg font-bold text-gold mb-2">Edit Investment</h2>
          <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" value={editForm.amount} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} />
          <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" value={editForm.currentValue} onChange={e => setEditForm({ ...editForm, currentValue: e.target.value })} />
          <select className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="flex gap-2 mt-2">
            <button className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition" type="submit">Save</button>
            <button className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default UserInvestmentsAdmin;
