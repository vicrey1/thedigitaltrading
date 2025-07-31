// AdminPlans.js
// Admin page for managing investment plans (add, edit, list)
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = '/api/admin/plans';

export default function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: '', roi: '', duration: '', min: '', max: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    const token = localStorage.getItem('adminToken');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const res = await axios.get(API_BASE, config);
    setPlans(res.data);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const payload = {
      name: form.name,
      roi: form.roi,
      duration: form.duration,
      min: form.min,
      max: form.max,
      percentReturn: form.roi,
      durationDays: form.duration,
      minInvestment: form.min,
      maxInvestment: form.max
    };
    if (editingId) {
      await axios.put(`${API_BASE}/${editingId}`, payload, config);
    } else {
      await axios.post(API_BASE, payload, config);
    }
    setForm({ name: '', roi: '', duration: '', min: '', max: '' });
    setEditingId(null);
    fetchPlans();
  }

  function handleEdit(plan) {
    setForm({ name: plan.name, roi: plan.roi, duration: plan.duration, min: plan.min, max: plan.max });
    setEditingId(plan._id);
  }

  async function handleDelete(id) {
    const token = localStorage.getItem('adminToken');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    await axios.delete(`${API_BASE}/${id}`, config);
    fetchPlans();
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-2 md:px-6 py-6 font-sans text-base text-gray-900">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold whitespace-nowrap">Plan Management</h1>
        <span className="text-sm text-gray-400">Total Plans: {plans.length}</span>
      </div>
      <div className="bg-gray-800 rounded-xl p-2 md:p-6 mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Plan Name" className="border p-2 rounded text-base bg-gray-900 text-white" required />
          <input name="roi" value={form.roi} onChange={handleChange} placeholder="ROI (%)" className="border p-2 rounded text-base bg-gray-900 text-white" required />
          <input name="duration" value={form.duration} onChange={handleChange} placeholder="Duration (days)" className="border p-2 rounded text-base bg-gray-900 text-white" required />
          <input name="min" value={form.min} onChange={handleChange} placeholder="Min ($)" className="border p-2 rounded text-base bg-gray-900 text-white" required />
          <input name="max" value={form.max} onChange={handleChange} placeholder="Max ($)" className="border p-2 rounded text-base bg-gray-900 text-white" required />
          <div className="flex items-center space-x-2 mt-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold">{editingId ? 'Update' : 'Add'} Plan</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ name: '', roi: '', duration: '', min: '', max: '' }); }} className="px-4 py-2 border rounded text-white">Cancel</button>}
          </div>
        </form>
      </div>
      <div className="bg-gray-800 rounded-xl p-2 md:p-6">
        <table className="w-full text-base text-white">
          <thead>
            <tr className="bg-gray-900">
              <th className="p-3 font-bold">Name</th>
              <th className="p-3 font-bold">ROI (%)</th>
              <th className="p-3 font-bold">Duration</th>
              <th className="p-3 font-bold">Min</th>
              <th className="p-3 font-bold">Max</th>
              <th className="p-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan, idx) => (
              <tr key={plan._id} className={idx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-700'}>
                <td className="p-3 font-semibold">{plan.name}</td>
                <td className="p-3">{plan.roi}</td>
                <td className="p-3">{plan.duration}</td>
                <td className="p-3">{plan.min}</td>
                <td className="p-3">{plan.max}</td>
                <td className="p-3">
                  <button onClick={() => handleEdit(plan)} className="text-blue-400 font-bold mr-4">Edit</button>
                  <button onClick={() => handleDelete(plan._id)} className="text-red-400 font-bold">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
