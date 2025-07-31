// src/pages/AdminMarketEvents.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminMarketEvents = () => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    eventType: 'neutral',
    impact: 'global',
    affectedFunds: [],
    intensity: 1.0,
    durationDays: 7
  });
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/admin/market-events', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setEvents(response.data);
    } catch (err) {
      console.error('Error fetching events:', err.message);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'impact' && value === 'fund_specific' && formData.affectedFunds.length === 0) {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        affectedFunds: ['Spot Market'] // Default selection
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleFundChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setFormData(prev => ({
        ...prev,
        affectedFunds: [...prev.affectedFunds, value]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        affectedFunds: prev.affectedFunds.filter(fund => fund !== value)
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/admin/market-events', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      fetchEvents();
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        eventType: 'neutral',
        impact: 'global',
        affectedFunds: [],
        intensity: 1.0,
        durationDays: 7
      });
    } catch (err) {
      console.error('Error creating event:', err.message);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Market Events Management</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-opacity-90 transition"
        >
          {showForm ? 'Cancel' : 'Create New Event'}
        </button>
      </div>
      
      {showForm && (
        <div className="glassmorphic p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">Create Market Event</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full bg-transparent border border-gray-600 rounded-lg p-2 text-white"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-400 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full bg-transparent border border-gray-600 rounded-lg p-2 text-white"
                required
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-2">Event Type</label>
                <select
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full bg-transparent border border-gray-600 rounded-lg p-2 text-white"
                >
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="neutral">Neutral</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Impact Type</label>
                <select
                  name="impact"
                  value={formData.impact}
                  onChange={handleChange}
                  className="w-full bg-transparent border border-gray-600 rounded-lg p-2 text-white"
                >
                  <option value="global">Global</option>
                  <option value="fund_specific">Fund Specific</option>
                </select>
              </div>
            </div>
            
            {formData.impact === 'fund_specific' && (
              <div>
                <label className="block text-gray-400 mb-2">Affected Funds</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {['Spot Market', 'Derivatives', 'Yield Farming', 'NFT Fund', 'Arbitrage'].map(fund => (
                    <label key={fund} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={fund}
                        checked={formData.affectedFunds.includes(fund)}
                        onChange={handleFundChange}
                        className="rounded bg-gray-800 border-gray-600 text-gold focus:ring-gold"
                      />
                      <span>{fund}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 mb-2">Intensity (1.0-2.0)</label>
                <input
                  type="number"
                  name="intensity"
                  value={formData.intensity}
                  onChange={handleChange}
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  className="w-full bg-transparent border border-gray-600 rounded-lg p-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 mb-2">Duration (Days)</label>
                <input
                  type="number"
                  name="durationDays"
                  value={formData.durationDays}
                  onChange={handleChange}
                  min="1"
                  max="30"
                  className="w-full bg-transparent border border-gray-600 rounded-lg p-2 text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-opacity-90 transition"
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Active Events List */}
      <div className="glassmorphic p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4">Active Market Events</h2>
        
        {events.length === 0 ? (
          <p className="text-gray-400">No active market events.</p>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event._id} className="border border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{event.title}</h3>
                    <p className="text-gray-400 mt-1">{event.description}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        event.eventType === 'positive' ? 'bg-green-900 bg-opacity-30 text-green-400' :
                        event.eventType === 'negative' ? 'bg-red-900 bg-opacity-30 text-red-400' :
                        'bg-blue-900 bg-opacity-30 text-blue-400'
                      }`}>
                        {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                      </span>
                      
                      <span className="px-2 py-1 text-xs rounded bg-gray-800">
                        {event.impact === 'global' ? 'Global Impact' : 'Fund Specific'}
                      </span>
                      
                      <span className="px-2 py-1 text-xs rounded bg-gray-800">
                        Intensity: x{event.intensity}
                      </span>
                      
                      <span className="px-2 py-1 text-xs rounded bg-gray-800">
                        Duration: {event.durationDays} days
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={async () => {
                      try {
                        await axios.delete(`/api/admin/market-events/${event._id}`, {
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem('adminToken')}`
                          }
                        });
                        fetchEvents();
                      } catch (err) {
                        console.error('Error deleting event:', err.message);
                      }
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMarketEvents;