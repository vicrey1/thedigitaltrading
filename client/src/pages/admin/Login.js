// src/pages/admin/Login.js
import React, { useState } from 'react';
import { useAdminAuth } from '../../auth/AdminAuthProvider';
// import { useNavigate } from 'react-router-dom';
import { FiLock, FiMail } from 'react-icons/fi';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAdminAuth();
  // const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-2 sm:p-4 overflow-x-hidden overflow-y-auto">
      <div className="w-full max-w-sm bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gold mb-2">LUXYIELD</h1>
          <h2 className="text-xl text-white">Admin Portal</h2>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 text-red-400 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="admin-email" className="block text-gray-400 mb-2">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="admin-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="admin@luxyield.com"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-gray-400 mb-2">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                id="admin-password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold ${
              loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gold text-black hover:bg-yellow-600'
            } transition`}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400">
          <p>For security reasons, this portal is restricted to authorized personnel only.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;