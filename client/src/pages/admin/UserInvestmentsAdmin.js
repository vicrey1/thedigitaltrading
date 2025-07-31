// src/pages/admin/UserInvestmentsAdmin.js
import React, { useState } from 'react';
import axios from 'axios';

const UserInvestmentsAdmin = () => {
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [investments, setInvestments] = useState([]);
  // Helper to sort investments: active first, then by newest startDate
  const getSortedInvestments = (list) => {
    return [...list].sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      const aDate = new Date(a.startDate || 0);
      const bDate = new Date(b.startDate || 0);
      return bDate - aDate;
    });
  };
  const [userMap, setUserMap] = useState({});
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchInvestments = async (searchUserId, searchUsername, searchName) => {
    let query = '';
    if (searchUserId) query = `userId=${encodeURIComponent(searchUserId)}`;
    else if (searchUsername) query = `username=${encodeURIComponent(searchUsername)}`;
    else if (searchName) query = `name=${encodeURIComponent(searchName)}`;
    if (!query) return;
    const res = await axios.get(`/api/admin/user-investments/search?${query}`, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
    // If result is a list of users (autocomplete), show suggestions
    if (Array.isArray(res.data) && res.data.length && res.data[0].username !== undefined) {
      setUserSuggestions(res.data);
      setShowSuggestions(true);
      setInvestments([]);
    } else {
      setInvestments(getSortedInvestments(res.data));
      setShowSuggestions(false);
      // Fetch user info for each investment (if not already present)
      if (res.data.length && res.data[0].user) {
        const userIds = [...new Set(res.data.map(inv => inv.user))];
        const userInfoRes = await axios.post('/api/admin/user-investments/user-info', { userIds }, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
        setUserMap(userInfoRes.data);
      }
    }
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">User Investments Admin</h1>
      <div className="mb-4 flex flex-col md:flex-row gap-2">
        <input className="p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" placeholder="User ID" value={userId} onChange={e => { setUserId(e.target.value); setUsername(''); setName(''); setUserSuggestions([]); setShowSuggestions(false); }} />
        <div className="relative">
          <input className="p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" placeholder="Username" value={username} onChange={async e => { setUsername(e.target.value); setUserId(''); setName(''); if (e.target.value) await fetchInvestments('', e.target.value, ''); else { setUserSuggestions([]); setShowSuggestions(false); } }} autoComplete="off" />
          {showSuggestions && userSuggestions.length > 0 && (
            <div className="absolute z-10 bg-white text-black border border-gray-300 rounded w-full max-h-40 overflow-y-auto">
              {userSuggestions.map(u => (
                <div key={u._id} className="px-3 py-2 hover:bg-gold cursor-pointer" onClick={() => { setUserId(u._id); setUsername(u.username); setName(u.name || ''); setShowSuggestions(false); fetchInvestments(u._id, '', ''); }}>
                  <span className="font-semibold">{u.username}</span> <span className="text-gray-500">({u.name})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <input className="p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" placeholder="Name" value={name} onChange={async e => { setName(e.target.value); setUserId(''); setUsername(''); if (e.target.value) await fetchInvestments('', '', e.target.value); else { setUserSuggestions([]); setShowSuggestions(false); } }} autoComplete="off" />
          {showSuggestions && userSuggestions.length > 0 && (
            <div className="absolute z-10 bg-white text-black border border-gray-300 rounded w-full max-h-40 overflow-y-auto">
              {userSuggestions.map(u => (
                <div key={u._id} className="px-3 py-2 hover:bg-gold cursor-pointer" onClick={() => { setUserId(u._id); setUsername(u.username); setName(u.name || ''); setShowSuggestions(false); fetchInvestments(u._id, '', ''); }}>
                  <span className="font-semibold">{u.name}</span> <span className="text-gray-500">({u.username})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition" onClick={() => fetchInvestments(userId, username, name)}>Fetch Investments</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-700 mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700 bg-gray-900 text-left">
              <th className="py-3 px-4 font-semibold">ID</th>
              <th className="py-3 px-4 font-semibold">Name</th>
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
                <td className="py-3 px-4">{userMap[inv.user]?.name || ''}</td>
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
        <form onSubmit={handleEditSubmit} className="mb-6 space-y-2 bg-gray-900 p-4 rounded-lg border border-gray-700">
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
