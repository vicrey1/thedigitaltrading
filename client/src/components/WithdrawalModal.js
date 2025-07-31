// src/components/WithdrawalModal.js
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const WithdrawalModal = ({ isOpen, onClose, investments }) => {
  const [formData, setFormData] = useState({
    investmentId: '',
    amount: '',
    method: 'bank_transfer'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/api/user/withdraw', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      toast.success(response.data.message);
      onClose();
      window.dispatchEvent(new Event('dashboardUpdate'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="glassmorphic p-6 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-gold">Simulated Withdrawal</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Investment</label>
            <select
              name="investmentId"
              value={formData.investmentId}
              onChange={handleChange}
              className="w-full bg-transparent border border-gray-600 rounded-lg p-2 text-white"
              required
            >
              <option value="">Select Investment</option>
              {investments.map((inv) => (
                <option key={inv._id} value={inv._id}>
                  {inv.fundType} - ${inv.currentValue.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-400 mb-2">Amount (USD)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="100"
              step="100"
              className="w-full bg-transparent border border-gray-600 rounded-lg p-2 text-white"
              required
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-400 mb-2">Method</label>
            <select
              name="method"
              value={formData.method}
              onChange={handleChange}
              className="w-full bg-transparent border border-gray-600 rounded-lg p-2 text-white"
              required
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="crypto">Crypto Transfer</option>
              <option value="wire">Wire Transfer</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-500 bg-opacity-20 text-red-400 rounded-lg hover:bg-opacity-30 transition flex items-center"
              disabled={loading}
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 mr-2 border-t-2 border-b-2 border-red-400"></div>}
              Request Withdrawal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WithdrawalModal;