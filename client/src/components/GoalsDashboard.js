import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiTarget, FiTrash2, FiPlusCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function GoalsDashboard() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/goals', { headers: { Authorization: `Bearer ${token}` } });
      setGoals(res.data);
    } catch {
      toast.error('Failed to load goals');
    }
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    if (!title || !targetAmount) return toast.error('Title and target required');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/goals', { title, targetAmount }, { headers: { Authorization: `Bearer ${token}` } });
      setTitle(''); setTargetAmount(''); setShowAdd(false);
      toast.success('Goal added!');
      fetchGoals();
    } catch {
      toast.error('Failed to add goal');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/goals/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Goal deleted');
      fetchGoals();
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl shadow-lg mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2 text-gold"><FiTarget /> My Goals</h2>
        <button className="flex items-center gap-1 bg-gold text-black px-3 py-1 rounded hover:bg-yellow-500 font-bold" onClick={() => setShowAdd(v => !v)}><FiPlusCircle /> Add Goal</button>
      </div>
      {showAdd && (
        <form onSubmit={handleAddGoal} className="flex flex-col md:flex-row gap-2 mb-4">
          <input type="text" placeholder="Goal title" value={title} onChange={e => setTitle(e.target.value)} className="p-2 rounded bg-gray-800 text-white border border-gray-700 flex-1" />
          <input type="number" placeholder="Target amount" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="p-2 rounded bg-gray-800 text-white border border-gray-700 w-40" />
          <button type="submit" className="bg-gold text-black px-4 py-2 rounded font-bold hover:bg-yellow-500">Save</button>
        </form>
      )}
      {loading ? (
        <div className="text-center text-gray-400">Loading goals...</div>
      ) : goals.length === 0 ? (
        <div className="text-center text-gray-400">No goals yet. Add one!</div>
      ) : (
        <div className="space-y-4">
          {goals.map(goal => (
            <div key={goal._id} className="bg-gray-900 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-gray-800">
              <div>
                <div className="font-bold text-lg text-gold mb-1">{goal.title}</div>
                <div className="text-gray-400 text-sm mb-1">Target: <span className="text-white font-semibold">${goal.targetAmount}</span></div>
                <div className="text-gray-400 text-sm">Invested: <span className="text-white">${goal.invested}</span> | Made: <span className="text-green-400">${goal.made}</span></div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="w-full bg-gray-700 rounded-full h-3 mb-2 mt-2 md:mt-0">
                  <div className="bg-gold h-3 rounded-full" style={{ width: `${goal.progress}%` }}></div>
                </div>
                <div className="text-xs text-gray-400">{Math.round(goal.progress)}% to target</div>
              </div>
              <button className="ml-2 text-red-400 hover:text-red-600" onClick={() => handleDeleteGoal(goal._id)} title="Delete"><FiTrash2 size={20} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
