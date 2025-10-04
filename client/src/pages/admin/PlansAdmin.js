// src/pages/admin/PlansAdmin.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PlansAdmin = () => {
  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', percentReturn: 150, durationDays: 4, minInvestment: 10, maxInvestment: 10000, isActive: true });
  const [loading, setLoading] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    const { getStoredAdminToken } = require('../../utils/authToken');
    const token = getStoredAdminToken();
    const res = await axios.get('/api/plans', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    setPlans(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
    // We only want to fetch plans once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = (plan) => {
    setEditing(plan._id);
    setForm({ ...plan });
  };

  const handleDelete = async (id) => {
  const { getStoredAdminToken } = require('../../utils/authToken');
  const token = getStoredAdminToken();
  await axios.delete(`/api/plans/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    fetchPlans();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`/api/plans/${editing}`, form, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
    } else {
      await axios.post('/api/plans', form, { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
    }
    setEditing(null);
    setForm({ name: '', percentReturn: 150, durationDays: 4, minInvestment: 10, maxInvestment: 10000, isActive: true });
    fetchPlans();
  };

  return (
    <div className="max-w-full sm:max-w-2xl mx-auto p-2 sm:p-4 md:p-6 overflow-x-auto">
      <h1 className="text-2xl font-bold mb-4">Investment Plans Admin</h1>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4 bg-gray-900 p-4 rounded-lg border border-gray-700">
        <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" placeholder="% Return" value={form.percentReturn} onChange={e => setForm({ ...form, percentReturn: e.target.value })} required />
          <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" placeholder="Duration (days)" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })} required />
          <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" placeholder="Min Investment" value={form.minInvestment} onChange={e => setForm({ ...form, minInvestment: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input className="w-full p-2 border rounded bg-gray-800 text-white border-gray-700 focus:border-gold outline-none" type="number" placeholder="Max Investment" value={form.maxInvestment} onChange={e => setForm({ ...form, maxInvestment: e.target.value })} />
          <label className="flex items-center gap-2 text-white"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-2">
          <button className="bg-gold text-black px-4 py-2 rounded font-semibold hover:bg-yellow-400 transition w-full sm:w-auto" type="submit">{editing ? 'Update' : 'Create'} Plan</button>
          {editing && <button className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition w-full sm:w-auto" onClick={() => setEditing(null)}>Cancel</button>}
        </div>
      </form>
      {loading ? <div>Loading...</div> : (
        <>
          {/* Table for md+ */}
          <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900 text-left">
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">% Return</th>
                  <th className="py-3 px-4 font-semibold">Days</th>
                  <th className="py-3 px-4 font-semibold">Min</th>
                  <th className="py-3 px-4 font-semibold">Max</th>
                  <th className="py-3 px-4 font-semibold">Active</th>
                  <th className="py-3 px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map(plan => (
                  <tr key={plan._id} className="border-b border-gray-800 hover:bg-gray-800 transition">
                    <td className="py-3 px-4">{plan.name}</td>
                    <td className="py-3 px-4">{plan.percentReturn}</td>
                    <td className="py-3 px-4">{plan.durationDays}</td>
                    <td className="py-3 px-4">{plan.minInvestment}</td>
                    <td className="py-3 px-4">{plan.maxInvestment}</td>
                    <td className="py-3 px-4">{plan.isActive ? 'Yes' : 'No'}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <button className="w-full sm:w-auto px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleEdit(plan)}>Edit</button>
                      <button className="w-full sm:w-auto px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700" onClick={() => handleDelete(plan._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Stacked card view for small screens */}
          <div className="md:hidden space-y-3">
            {plans.map(plan => (
              <div key={plan._id} className="p-4 rounded-lg border bg-gray-900 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-lg">{plan.name}</div>
                    <div className="text-sm opacity-75">{plan.percentReturn}% • {plan.durationDays} days</div>
                    <div className="text-sm opacity-75">Min: {plan.minInvestment} • Max: {plan.maxInvestment}</div>
                  </div>
                  <div className="text-sm font-semibold">
                    {plan.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="w-full sm:w-auto bg-gold text-black px-3 py-2 rounded" onClick={() => handleEdit(plan)}>Edit</button>
                  <button className="w-full sm:w-auto bg-red-600 text-white px-3 py-2 rounded" onClick={() => handleDelete(plan._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PlansAdmin;
