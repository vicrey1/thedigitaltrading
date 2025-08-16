import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function SupportUploads() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null); // { url, originalName }
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, name }
  const [actionLoading, setActionLoading] = useState(false);

  // Reassign modal state
  const [reassignModal, setReassignModal] = useState(null); // { id, name, currentUserId }
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    fetchUploads();
  }, []);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/support/uploads');
      setUploads(res.data);
    } catch (e) {
      console.error('Failed to fetch uploads', e);
    }
    setLoading(false);
  };

  const handleDelete = (id, name) => {
    setConfirmDelete({ id, name });
  };

  const confirmDeleteNow = async () => {
    if (!confirmDelete) return;
    setActionLoading(true);
    try {
      await axios.delete(`/api/admin/support/uploads/${confirmDelete.id}`);
      setConfirmDelete(null);
      await fetchUploads();
    } catch (e) {
      alert('Delete failed');
    }
    setActionLoading(false);
  };

  const openReassignModal = async (upload) => {
    setReassignModal({ id: upload._id, name: upload.originalName || upload.filename, currentUserId: upload.userId || null });
    // Lazy-load users list if not already loaded
    if (users.length === 0) {
      setUsersLoading(true);
      try {
        const res = await axios.get('/api/admin/users');
        setUsers(res.data || []);
      } catch (e) {
        console.error('Failed to fetch users for reassign', e);
        setUsers([]);
      }
      setUsersLoading(false);
    }
    setUserSearch('');
  };

  const performReassign = async (userId) => {
    if (!reassignModal) return;
    setActionLoading(true);
    try {
      await axios.patch(`/api/admin/support/uploads/${reassignModal.id}/reassign`, { userId: userId || null });
      setReassignModal(null);
      await fetchUploads();
    } catch (e) {
      alert('Reassign failed');
    }
    setActionLoading(false);
  };

  const openPreview = (u) => {
    setPreview({ url: u.url, name: u.originalName || u.filename });
  };

  const filtered = uploads.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.originalName && u.originalName.toLowerCase().includes(s)) || (u.filename && u.filename.toLowerCase().includes(s)) || String(u.userId || '').toLowerCase().includes(s);
  });

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const s = userSearch.toLowerCase();
    return (u.name && u.name.toLowerCase().includes(s)) || (u.email && u.email.toLowerCase().includes(s)) || (u.username && u.username.toLowerCase().includes(s));
  }).slice(0, 50);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Support Uploads</h2>
        <div className="flex items-center gap-3">
          <input
            className="border rounded-full px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Search by filename, original name, or userId"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={fetchUploads} disabled={loading}>Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-3 border rounded animate-pulse bg-gray-100 h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-500">No uploads found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(u => (
            <div key={u._id} className="p-3 border rounded shadow-sm bg-white flex flex-col">
              <div className="flex items-center gap-3">
                <button className="w-20 h-20 overflow-hidden rounded" onClick={() => openPreview(u)}>
                  <img src={u.thumbUrl} alt={u.originalName || u.filename} className="w-full h-full object-cover" onError={(e)=>{e.target.src='/favicon.ico'}} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{u.originalName || u.filename}</div>
                  <div className="text-xs text-gray-500 truncate">{u.userId || 'unassigned'}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(u.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <a href={u.url} target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-3 py-1 bg-blue-50 border rounded text-blue-700 hover:bg-blue-100">Open</a>
                <button className="px-3 py-1 bg-gray-200 rounded flex-1" onClick={()=>openReassignModal(u)} disabled={actionLoading}>Reassign</button>
                <button className="px-3 py-1 bg-red-500 text-white rounded flex-1" onClick={()=>handleDelete(u._id, u.originalName || u.filename)} disabled={actionLoading}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setPreview(null)}>
          <div className="bg-white rounded p-4 max-w-3xl w-full" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold">{preview.name}</h3>
              <button className="text-gray-600" onClick={()=>setPreview(null)}>Close</button>
            </div>
            <div className="mt-3">
              <img src={preview.url} alt={preview.name} className="max-h-[70vh] w-full object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2">Confirm delete</h3>
            <p className="text-sm text-gray-600">Are you sure you want to delete <strong>{confirmDelete.name}</strong>? This will remove the file and its database record.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={()=>setConfirmDelete(null)} disabled={actionLoading}>Cancel</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={confirmDeleteNow} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign modal with user lookup/autocomplete */}
      {reassignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setReassignModal(null)}>
          <div className="bg-white rounded p-6 w-full max-w-2xl" onClick={(e)=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold">Reassign upload</h3>
                <div className="text-sm text-gray-600">{reassignModal.name}</div>
              </div>
              <div>
                <button className="px-3 py-1 rounded border" onClick={() => performReassign(null)} disabled={actionLoading}>Unassign</button>
                <button className="ml-2 px-3 py-1 rounded border" onClick={() => setReassignModal(null)} disabled={actionLoading}>Cancel</button>
              </div>
            </div>

            <div className="mb-3">
              <input className="w-full border rounded px-3 py-2" placeholder="Search users by name, email or username" value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            </div>

            <div className="max-h-96 overflow-y-auto border rounded">
              {usersLoading ? (
                <div className="p-4">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-gray-500">No users found.</div>
              ) : (
                <div>
                  {filteredUsers.map(u => (
                    <div key={u._id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <div className="font-semibold">{u.name || u.username || u.email}</div>
                        <div className="text-xs text-gray-500">{u.email} • @{u.username}</div>
                      </div>
                      <div>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => performReassign(u._id)} disabled={actionLoading}>Assign</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
