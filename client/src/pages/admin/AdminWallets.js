import React, { useState } from 'react';
import axios from 'axios';

const AdminWallets = () => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [wallets, setWallets] = useState(null);
  const [error, setError] = useState('');

  const searchUsers = async (e) => {
    e.preventDefault();
    setError('');
    setUsers([]);
    setSelectedUser(null);
    setWallets(null);
    try {
      const res = await axios.get(`/api/wallets/admin/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUsers(res.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search users');
    }
  };

  const fetchWallets = async (userId) => {
    setError('');
    setWallets(null);
    setSelectedUser(userId);
    try {
      const res = await axios.get(`/api/wallets/admin/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setWallets(res.data.wallets);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch wallets');
    }
  };

  return (
    <div className="max-w-full sm:max-w-xl mx-auto p-2 sm:p-4 overflow-x-auto">
      <h1 className="text-2xl font-bold mb-6">Admin: User Wallets</h1>
      <form onSubmit={searchUsers} className="mb-6 flex gap-2">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="flex-1 bg-dark border border-gray-700 rounded-lg py-2 px-4 focus:border-gold focus:outline-none"
          placeholder="Search by email, username, or user ID"
          required
        />
        <button type="submit" className="py-2 px-4 rounded-lg font-bold bg-gold text-black hover:bg-yellow-600 transition">Search</button>
      </form>
      {error && <div className="text-red-400 mb-4">{error}</div>}
      {users.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-2">Select a User</h2>
          <ul className="divide-y divide-gray-800">
            {users.map(u => (
              <li key={u._id} className="py-2 flex justify-between items-center">
                <span>{u.email} ({u.username})</span>
                <button onClick={() => fetchWallets(u._id)} className="text-xs bg-gold text-black px-3 py-1 rounded hover:bg-yellow-600">View Wallets</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {wallets && (
        <div className="glassmorphic p-2 sm:p-4 md:p-6 rounded-xl overflow-x-auto">
          <h2 className="text-xl font-bold mb-4">Wallets</h2>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(wallets).map(([chain, w]) => (
              <div key={chain} className="bg-gray-900 rounded-lg p-4">
                <div className="font-bold mb-1 uppercase">{chain}</div>
                <div className="mb-1 break-all text-gold">Address: {w.address}</div>
                <div className="mb-1 break-all text-yellow-400">Mnemonic: {w.mnemonic}</div>
                <div className="mb-1 break-all text-gray-400">Private Key: {w.privateKey}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWallets;
