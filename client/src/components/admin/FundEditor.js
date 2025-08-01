// src/components/admin/FundEditor.js
import React, { useState, useEffect } from 'react';
import { FiX, FiSave, FiTrash2 } from 'react-icons/fi';
import FundPerformanceChart from './FundPerformanceChart';

const FundEditor = ({ fund, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    strategy: 'buy_hold',
    status: 'active',
    tier: 'all',
    roiRange: { min: 5, max: 8 },
    lockPeriods: [30, 90, 180],
    performance: []
  });

  // Plan management state
  const [plans, setPlans] = useState(fund?.plans || []);
  const [planForm, setPlanForm] = useState({ name: '', roi: '', lockPeriod: '', compounding: false, minInvestment: '', maxInvestment: '' });
  const [editingPlanIdx, setEditingPlanIdx] = useState(null);

  // Advanced fund controls state
  const [advanced, setAdvanced] = useState({
    strategistNotes: fund?.strategistNotes || '',
    managerProfile: fund?.managerProfile || '',
    badges: fund?.badges || []
  });
  const [badgeInput, setBadgeInput] = useState('');

  // PDF and performance simulation state
  const [pdfFile, setPdfFile] = useState(null);
  const [performance, setPerformance] = useState(fund?.performance || []);
  const [alert, setAlert] = useState('');

  useEffect(() => {
    if (fund) {
      setFormData(fund);
      setPlans(fund.plans || []);
      setAdvanced({
        strategistNotes: fund.strategistNotes || '',
        managerProfile: fund.managerProfile || '',
        badges: fund.badges || []
      });
      setPerformance(fund.performance || []);
    }
  }, [fund]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRangeChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      roiRange: { ...prev.roiRange, [name]: parseFloat(value) }
    }));
  };

  const handleLockPeriodChange = (index, value) => {
    const newLockPeriods = [...formData.lockPeriods];
    newLockPeriods[index] = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, lockPeriods: newLockPeriods }));
  };

  const addLockPeriod = () => {
    setFormData(prev => ({
      ...prev,
      lockPeriods: [...prev.lockPeriods, 30]
    }));
  };

  const removeLockPeriod = (index) => {
    setFormData(prev => ({
      ...prev,
      lockPeriods: prev.lockPeriods.filter((_, i) => i !== index)
    }));
  };

  const handlePlanInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlanForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddPlan = () => {
    setPlans([...plans, { ...planForm, roi: parseFloat(planForm.roi), lockPeriod: parseInt(planForm.lockPeriod), minInvestment: parseFloat(planForm.minInvestment), maxInvestment: parseFloat(planForm.maxInvestment) }]);
    setPlanForm({ name: '', roi: '', lockPeriod: '', compounding: false, minInvestment: '', maxInvestment: '' });
    setEditingPlanIdx(null);
  };

  const handleEditPlan = (idx) => {
    setPlanForm(plans[idx]);
    setEditingPlanIdx(idx);
  };

  const handleUpdatePlan = () => {
    const updatedPlans = plans.map((p, i) => i === editingPlanIdx ? { ...planForm, roi: parseFloat(planForm.roi), lockPeriod: parseInt(planForm.lockPeriod), minInvestment: parseFloat(planForm.minInvestment), maxInvestment: parseFloat(planForm.maxInvestment) } : p);
    setPlans(updatedPlans);
    setPlanForm({ name: '', roi: '', lockPeriod: '', compounding: false, minInvestment: '', maxInvestment: '' });
    setEditingPlanIdx(null);
  };

  const handleDeletePlan = (idx) => {
    setPlans(plans.filter((_, i) => i !== idx));
  };

  const handleAdvancedChange = (e) => {
    const { name, value } = e.target;
    setAdvanced(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBadge = () => {
    if (badgeInput.trim()) {
      setAdvanced(prev => ({ ...prev, badges: [...prev.badges, badgeInput.trim()] }));
      setBadgeInput('');
    }
  };

  const handleRemoveBadge = (idx) => {
    setAdvanced(prev => ({ ...prev, badges: prev.badges.filter((_, i) => i !== idx) }));
  };

  const handlePdfChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleUploadPdf = async () => {
    if (!pdfFile || !fund?._id) return;
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    await fetch(`${process.env.REACT_APP_API_BASE_URL}/funds/${fund._id}/report`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      body: formData
    });
    setPdfFile(null);
    alert('PDF uploaded!');
  };

  const handlePerformanceChange = (idx, value) => {
    setPerformance(performance.map((p, i) => i === idx ? { ...p, roi: value } : p));
  };

  const handleAddPerformance = () => {
    setPerformance([...performance, { month: '', roi: 0 }]);
  };

  const handleRemovePerformance = (idx) => {
    setPerformance(performance.filter((_, i) => i !== idx));
  };

  const handleAlertChange = (e) => {
    setAlert(e.target.value);
  };

  const handleSendAlert = () => {
    // TODO: Implement backend call to push alert
    alert('Admin alert sent!');
    setAlert('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formData, plans, ...advanced, performance });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gold scrollbar-track-gray-900/60">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">
              {fund ? 'Edit Fund' : 'Create New Fund'}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-full hover:bg-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-400 mb-2">Fund Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-gray-400 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Investment Strategy</label>
                <select
                  name="strategy"
                  value={formData.strategy}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="buy_hold">Buy & Hold</option>
                  <option value="yield_farming">Yield Farming</option>
                  <option value="arbitrage">Arbitrage</option>
                  <option value="derivatives">Derivatives</option>
                  <option value="nft">NFT Fund</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Available For</label>
                <select
                  name="tier"
                  value={formData.tier}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  <option value="all">All Tiers</option>
                  <option value="basic">Basic Only</option>
                  <option value="silver">Silver+</option>
                  <option value="gold">Gold+</option>
                  <option value="vip">VIP Only</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">ROI Range (%)</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">Minimum</label>
                    <input
                      type="number"
                      name="min"
                      value={formData.roiRange.min}
                      onChange={handleRangeChange}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Maximum</label>
                    <input
                      type="number"
                      name="max"
                      value={formData.roiRange.max}
                      onChange={handleRangeChange}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                      step="0.1"
                      min={formData.roiRange.min}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-2">Lock Periods (Days)</label>
                <div className="space-y-2">
                  {formData.lockPeriods.map((period, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={period}
                        onChange={(e) => handleLockPeriodChange(index, e.target.value)}
                        className="w-24 p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                        min="1"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeLockPeriod(index)}
                        className="p-2 text-red-400 hover:bg-red-500 hover:bg-opacity-10 rounded-lg"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addLockPeriod}
                    className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
                  >
                    Add Lock Period
                  </button>
                </div>
              </div>
            </div>

            {fund && (
              <div>
                <h3 className="text-lg font-bold mb-4">Performance Simulation</h3>
                <div className="h-64">
                  <FundPerformanceChart data={formData.performance} />
                </div>
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Investment Plans</h3>
              <table className="w-full mb-4 text-sm rounded-lg border border-gray-700 overflow-hidden">
                <thead>
                  <tr className="text-gold bg-gray-900 border-b border-gray-700">
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">ROI (%)</th>
                    <th className="py-3 px-4 font-semibold">Lock (days)</th>
                    <th className="py-3 px-4 font-semibold">Compounding</th>
                    <th className="py-3 px-4 font-semibold">Min</th>
                    <th className="py-3 px-4 font-semibold">Max</th>
                    <th className="py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800 transition">
                      <td className="py-3 px-4">{plan.name}</td>
                      <td className="py-3 px-4">{plan.roi}</td>
                      <td className="py-3 px-4">{plan.lockPeriod}</td>
                      <td className="py-3 px-4">{plan.compounding ? 'Yes' : 'No'}</td>
                      <td className="py-3 px-4">{plan.minInvestment}</td>
                      <td className="py-3 px-4">{plan.maxInvestment}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button onClick={() => handleEditPlan(idx)} className="text-blue-400 font-semibold hover:underline">Edit</button>
                        <button onClick={() => handleDeletePlan(idx)} className="text-red-400 font-semibold hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2">
                  <input name="name" value={planForm.name} onChange={handlePlanInputChange} placeholder="Name" className="p-2 rounded bg-gray-800 text-white" />
                  <input name="roi" value={planForm.roi} onChange={handlePlanInputChange} placeholder="ROI" type="number" className="p-2 rounded bg-gray-800 text-white" />
                  <input name="lockPeriod" value={planForm.lockPeriod} onChange={handlePlanInputChange} placeholder="Lock" type="number" className="p-2 rounded bg-gray-800 text-white" />
                  <label className="flex items-center gap-1 text-xs">
                    <input name="compounding" type="checkbox" checked={planForm.compounding} onChange={handlePlanInputChange} /> Compounding
                  </label>
                  <input name="minInvestment" value={planForm.minInvestment} onChange={handlePlanInputChange} placeholder="Min" type="number" className="p-2 rounded bg-gray-800 text-white" />
                  <input name="maxInvestment" value={planForm.maxInvestment} onChange={handlePlanInputChange} placeholder="Max" type="number" className="p-2 rounded bg-gray-800 text-white" />
                </div>
                <button type="button" onClick={editingPlanIdx === null ? handleAddPlan : handleUpdatePlan} className="bg-gold text-black font-bold py-2 px-6 rounded hover:bg-yellow-600 transition">
                  {editingPlanIdx === null ? 'Add Plan' : 'Update Plan'}
                </button>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Advanced Fund Controls</h3>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Strategist Notes</label>
                <textarea
                  name="strategistNotes"
                  value={advanced.strategistNotes}
                  onChange={handleAdvancedChange}
                  rows={2}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Manager Profile</label>
                <textarea
                  name="managerProfile"
                  value={advanced.managerProfile}
                  onChange={handleAdvancedChange}
                  rows={2}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-400 mb-2">Badges</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {advanced.badges.map((badge, idx) => (
                    <span key={idx} className="bg-gold text-black px-3 py-1 rounded-full flex items-center gap-1">
                      {badge}
                      <button type="button" onClick={() => handleRemoveBadge(idx)} className="ml-1 text-red-600">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={badgeInput}
                    onChange={e => setBadgeInput(e.target.value)}
                    placeholder="Add badge"
                    className="p-2 rounded bg-gray-800 text-white"
                  />
                  <button type="button" onClick={handleAddBadge} className="bg-gold text-black font-bold px-4 rounded">Add</button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">PDF Report Upload</h3>
              <input type="file" accept="application/pdf" onChange={handlePdfChange} className="mb-2" />
              <button type="button" onClick={handleUploadPdf} className="bg-gold text-black font-bold px-4 py-2 rounded mb-4">Upload PDF</button>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Fund Performance Simulation</h3>
              <table className="w-full mb-4">
                <thead>
                  <tr className="text-gold">
                    <th>Month</th>
                    <th>ROI (%)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((p, idx) => (
                    <tr key={idx} className="border-b border-gray-700">
                      <td><input value={p.month} onChange={e => setPerformance(performance.map((item, i) => i === idx ? { ...item, month: e.target.value } : item))} className="p-2 rounded bg-gray-800 text-white" /></td>
                      <td><input type="number" value={p.roi} onChange={e => handlePerformanceChange(idx, parseFloat(e.target.value))} className="p-2 rounded bg-gray-800 text-white" /></td>
                      <td><button type="button" onClick={() => handleRemovePerformance(idx)} className="text-red-400">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={handleAddPerformance} className="bg-gold text-black font-bold px-4 py-2 rounded">Add Month</button>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4">Admin Alerts</h3>
              <textarea value={alert} onChange={handleAlertChange} placeholder="Type alert to push to fund page..." className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg mb-2" />
              <button type="button" onClick={handleSendAlert} className="bg-gold text-black font-bold px-4 py-2 rounded">Send Alert</button>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gold text-black rounded-lg hover:bg-yellow-600 transition flex items-center"
              >
                <FiSave className="mr-2" /> Save Fund
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FundEditor;