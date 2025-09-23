import React, { useState } from 'react';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';

const UserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        // Fetch KYC status after login
        const kycRes = await axios.get('/api/auth/kyc/status', {
          headers: { Authorization: `Bearer ${res.data.token}` }
        });
        if (kycRes.data.kyc.status !== 'verified') {
          navigate('/dashboard/kyc');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(res.data.message || 'Login failed');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError('Could not reach server. Please check your connection or try again later.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark p-4 sm:p-6">
      <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-400 mb-2">CRYPTO TRADING</h1>
          <h2 className="text-xl sm:text-2xl text-white mb-4 sm:mb-6">User Login</h2>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-20 text-red-400 rounded-lg">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="w-full mb-4 sm:mb-6">
            <label htmlFor="login-email" className="block text-gray-400 mb-2 text-sm sm:text-base">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-base min-h-[44px]"
              placeholder="user@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="w-full mb-4 sm:mb-6">
            <label htmlFor="login-password" className="block text-gray-400 mb-2 text-sm sm:text-base">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 text-base min-h-[44px]"
              placeholder="Password"
              required
              autoComplete="current-password"
            />
            <div className="mt-2 text-right">
              <a href="/forgot-password" className="text-orange-400 hover:underline text-sm">Forgot password?</a>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded hover:bg-orange-600 transition text-base sm:text-lg min-h-[44px] mb-4"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div className="mt-4 sm:mt-6 text-center text-sm sm:text-base">
          Don't have an account?{' '}
          <a href="https://www.thedigitaltrading.com/register" className="text-orange-400 hover:underline font-medium">Register here</a>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
