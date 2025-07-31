import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const ResetPassword = () => {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (password !== confirm) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    try {
      await axios.post(`/api/auth/reset-password/${token}`, { newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-dark">
      <div className="glassmorphic p-8 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
        {success ? (
          <div className="text-green-400 text-center">Password reset! Redirecting to login...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
              placeholder="Confirm new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-gold text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Submit'}
            </button>
            {error && <div className="text-red-400 text-center">{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
