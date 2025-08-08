// src/pages/admin/Funds.js
import React, { useState, useEffect } from 'react';
import { FiPlus, FiFilter, FiDownload } from 'react-icons/fi';
import FundList from '../../components/admin/FundList';
import FundEditor from '../../components/admin/FundEditor';
import { getFunds, updateFund, deleteFund } from '../../services/fundAPI';

const AdminFunds = () => {
  const [funds, setFunds] = useState([]);
  const [selectedFund, setSelectedFund] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchFunds = async () => {
      setLoading(true);
      try {
        const data = await getFunds();
        setFunds(data);
      } catch (error) {
        console.error('Failed to fetch funds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, []);

  const handleUpdateFund = async (id, updates) => {
    try {
      const updated = await updateFund(id, updates);
      setFunds(funds.map(f => f._id === id ? updated : f));
    } catch (error) {
      console.error('Failed to update fund:', error);
    }
  };

  const handleDeleteFund = async (id) => {
    try {
      await deleteFund(id);
      setFunds(funds.filter(f => f._id !== id));
    } catch (error) {
      console.error('Failed to delete fund:', error);
    }
  };

  if (loading) {
    return <div className="p-2 sm:p-4 md:p-6">Loading funds...</div>;
  }

  return (
    <div className="max-w-full sm:max-w-6xl mx-auto p-2 sm:p-8 md:p-12 lg:p-16 xl:p-20 2xl:p-24 font-sans text-base text-gray-100 bg-black rounded-xl shadow-lg overflow-x-auto">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Fund Management</h1>
          <button
            onClick={() => {
              setSelectedFund(null);
              setIsEditing(true);
            }}
            className="flex items-center px-4 py-2 bg-gold text-black rounded-lg hover:bg-yellow-600 transition"
          >
            <FiPlus className="mr-2" /> New Fund
          </button>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Search funds..."
              className="w-full pl-4 pr-10 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FiFilter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-700 rounded-lg px-4 py-2 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
            <button className="flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
              <FiDownload className="mr-2" /> Export
            </button>
          </div>
        </div>

        <FundList 
          funds={funds} 
          onEdit={fund => { setSelectedFund(fund); setIsEditing(true); }}
          onDelete={handleDeleteFund}
        />
        {isEditing && selectedFund && (
          <FundEditor 
            fund={selectedFund}
            onSave={(updates) => { handleUpdateFund(selectedFund._id, updates); setIsEditing(false); }}
            onClose={() => setIsEditing(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AdminFunds;