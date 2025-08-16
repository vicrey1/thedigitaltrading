import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function SupportUploads() {
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id) => {
    if (!confirm('Delete this upload?')) return;
    try {
      await axios.delete(`/api/admin/support/uploads/${id}`);
      fetchUploads();
    } catch (e) {
      alert('Delete failed');
    }
  };

  const handleReassign = async (id) => {
    const userId = prompt('Enter new userId (objectId) or leave blank to unassign');
    if (userId === null) return;
    try {
      await axios.patch(`/api/admin/support/uploads/${id}/reassign`, { userId: userId || null });
      fetchUploads();
    } catch (e) {
      alert('Reassign failed');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!uploads.length) return <div>No uploads found.</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Support Uploads</h2>
      <div className="grid grid-cols-2 gap-4">
        {uploads.map(u => (
          <div key={u._id} className="p-3 border rounded">
            <div className="flex items-center gap-3">
              <img src={u.thumbUrl} alt={u.originalName || u.filename} className="w-20 h-20 object-cover rounded" onError={(e)=>{e.target.src='/favicon.ico'}} />
              <div className="flex-1">
                <div className="font-bold">{u.originalName || u.filename}</div>
                <div className="text-sm text-gray-600">{u.userId || 'unassigned'}</div>
                <div className="text-xs text-gray-500">{new Date(u.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={()=>handleDelete(u._id)}>Delete</button>
              <button className="px-3 py-1 bg-gray-200 rounded" onClick={()=>handleReassign(u._id)}>Reassign</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
