import React, { useState } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const CODE_LENGTH = 6;

const EmailVerification = ({ email, onVerified }) => {
  const { isEmailVerified, refreshUserContext, user } = useUser();
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    refreshUserContext(); // Always get latest status on mount
  }, [refreshUserContext]); // Add missing dependency
  React.useEffect(() => {
    if (isEmailVerified) setSuccess(true);
  }, [isEmailVerified]);

  const sendCode = async () => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/auth/send-verification', {}, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code.');
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.post('/api/auth/verify-email', { code: code.join('') }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      console.log('[EMAIL-VERIFICATION] Backend response:', resp.data);
      // Add a short delay to ensure DB write is complete before refreshing context
      await new Promise(res => setTimeout(res, 500));
      await refreshUserContext();
      setSuccess(true);
      setCode(Array(CODE_LENGTH).fill(''));
      setSent(false);
      setError(null);
      if (onVerified) onVerified();
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Invalid or expired code.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Only render for non-admins
  if (user && user.role === 'admin') return null;

  return (
    <div className="glassmorphic p-8 rounded-xl w-full max-w-md mx-auto mt-12">
      <h2 className="text-2xl font-bold mb-6 text-center">Verify Your Email</h2>
      {success || isEmailVerified ? (
        <div className="text-green-400 text-center text-lg font-bold">Email verified!</div>
      ) : (
        <form onSubmit={verify}>
          <div className="mb-4">
            <label className="block mb-2 text-gray-400">Verification Code</label>
            <div className="flex gap-2 justify-center mb-2">
              {code.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={typeof digit === 'string' ? digit : ''}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    let newCode = [...code];
                    newCode[idx] = val;
                    setCode(newCode);
                    if (val && idx < code.length - 1) {
                      const next = document.getElementById(`email-otp-input-${idx+1}`);
                      if (next) next.focus();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace') {
                      let newCode = [...code];
                      newCode[idx] = '';
                      setCode(newCode);
                      if (idx > 0) {
                        const prev = document.getElementById(`email-otp-input-${idx-1}`);
                        if (prev) prev.focus();
                      }
                    }
                  }}
                  id={`email-otp-input-${idx}`}
                  className="w-12 h-12 text-center text-2xl bg-dark border border-gray-700 rounded-lg focus:border-gold focus:outline-none"
                  autoFocus={idx === 0}
                />
              ))}
            </div>
            {error && <div className="text-red-400 mb-2">{error}</div>}
            {sent ? (
              <div className="text-xs text-gray-400 mb-2">Code sent! <button type="button" className="underline text-gold" onClick={sendCode}>Resend</button></div>
            ) : (
              <button type="button" className="underline text-gold text-xs mb-2" onClick={sendCode} disabled={loading}>Send Code</button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-bold bg-gold text-black hover:bg-yellow-600 transition"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>
      )}
    </div>
  );
};

export default EmailVerification;
