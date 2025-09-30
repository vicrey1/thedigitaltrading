import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminUserList = ({ onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setUsers(res.data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-full sm:max-w-4xl mx-auto overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">All Users</h1>
      <input
        className="mb-4 p-2 rounded bg-gray-800 text-white w-full border border-gray-700 focus:border-gold outline-none"
        placeholder="Search by email..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? <div>Loading...</div> : (
        <div>
          {/* Desktop/tablet table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900 text-left">
                  <th className="py-3 px-4 font-semibold">Email</th>
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user._id || user.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4 break-all">{user.email}</td>
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4">
                      <button className="bg-gold px-3 py-1 rounded text-black font-semibold hover:bg-yellow-400 transition" onClick={() => onSelectUser(user._id)}>Mirror</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(user => (
              <div key={user._id || user.id} className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{user.email}</div>
                    <div className="text-sm text-gray-400">{user.name}</div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <button className="bg-gold px-3 py-1 rounded text-black font-semibold hover:bg-yellow-400 transition" onClick={() => onSelectUser(user._id)}>Mirror</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserList;
