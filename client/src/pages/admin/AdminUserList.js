import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminUserList = ({ onSelectUser, filter = 'all' }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchDebounce, setSearchDebounce] = useState(null);
  const usersPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const { getStoredAdminToken } = require('../../utils/authToken');
        const token = getStoredAdminToken();
        const res = await axios.get('/api/admin/users', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: {
            page,
            limit: usersPerPage,
            search: search.trim(),
            filter
          }
        });
        setUsers(res.data.users || []);
        setTotalPages(Math.ceil(res.data.total / usersPerPage));
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error.response?.data?.message || 'Failed to fetch users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    if (searchDebounce) clearTimeout(searchDebounce);
    setSearchDebounce(setTimeout(() => {
      setPage(1); // Reset to first page on search
      fetchUsers();
    }, 300));

    return () => {
      if (searchDebounce) clearTimeout(searchDebounce);
    };
  }, [search, page, filter]);

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-full sm:max-w-4xl mx-auto overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">All Users</h1>
      
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <input
          className="p-2 rounded bg-gray-800 text-white w-full border border-gray-700 focus:border-gold outline-none"
          placeholder="Search by email, name, or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/50 border border-red-500 text-red-300 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
          <span className="ml-2">Loading users...</span>
        </div>
      ) : (
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
                {users.map(user => (
                  <tr key={user._id || user.id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4 break-all">{user.email}</td>
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4">
                      {user.role !== 'admin' ? (
                        <button className="w-full sm:w-auto bg-gold px-3 py-1 rounded text-black font-semibold hover:bg-yellow-400 transition" onClick={() => onSelectUser(user._id)}>Mirror</button>
                      ) : (
                        <span className="text-gray-500 italic">Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-3">
            {users.map(user => (
              <div key={user._id || user.id} className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{user.email}</div>
                    <div className="text-sm text-gray-400">{user.name}</div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {user.role !== 'admin' ? (
                      <button className="w-full sm:w-auto bg-gold px-3 py-1 rounded text-black font-semibold hover:bg-yellow-400 transition" onClick={() => onSelectUser(user._id)}>Mirror</button>
                    ) : (
                      <span className="text-gray-500 italic">Admin</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-700 text-gray-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-3 py-1 rounded ${page === totalPages ? 'bg-gray-700 text-gray-500' : 'bg-gray-800 hover:bg-gray-700'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminUserList;
