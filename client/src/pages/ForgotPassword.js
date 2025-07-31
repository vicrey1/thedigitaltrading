import React, { useState } from 'react';
import { FiMail, FiSave } from 'react-icons/fi';
import axios from 'axios';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleRequest = async () => {
    setMsg(''); setError('');
    if (!email) { setError('Enter your email.'); return; }
    try {
      await axios.post('/api/auth/request-password-reset', { email });
      setStep(2);
      setMsg('Password reset code has been sent.');
    } catch (err) {
      // Improved error handling for network/backend issues
      if (err.response) {
        // Backend responded with error (should not happen for this endpoint)
        setStep(2);
        setMsg('Password reset code has been sent.');
      } else if (err.request) {
        // Request made but no response (network/proxy/backend down)
        setError('Could not reach server. Please check your connection or try again later.');
        console.error('Network error:', err);
      } else {
        setError('An unexpected error occurred.');
        console.error('Error:', err);
      }
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setMsg(''); setError('');
    try {
      await axios.post('/api/auth/request-password-reset', { email });
      setMsg('Password reset code has been sent.');
    } catch (err) {
      if (err.response) {
        setMsg('Password reset code has been sent.');
      } else if (err.request) {
        setError('Could not reach server. Please check your connection or try again later.');
        console.error('Network error:', err);
      } else {
        setError('An unexpected error occurred.');
        console.error('Error:', err);
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleReset = async () => {
    setError(''); setMsg('');
    if (!otp || !newPass || !confirmPass) { setError('All fields are required.'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match.'); return; }
    try {
      await axios.post('/api/auth/verify-password-reset', { email, otp, newPassword: newPass });
      setMsg('Password reset successful! You can now log in.');
      setStep(1); setEmail(''); setOtp(''); setNewPass(''); setConfirmPass('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-opacity-80">
      <div className="glass-card p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gold flex items-center gap-2"><FiMail /> Forgot Password</h1>
        {step === 1 ? (
          <>
            <input type="email" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none mb-4" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} />
            <button className="w-full bg-gold text-black px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-400" onClick={handleRequest}><FiMail /> Send Recovery Email</button>
          </>
        ) : (
          <>
            <div className="flex gap-2 justify-center mb-4">
              {[0,1,2,3,4,5].map(idx => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[idx] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    let newOtp = otp.split('');
                    newOtp[idx] = val;
                    setOtp(newOtp.join(''));
                    if (val && idx < 5) {
                      const next = document.getElementById(`forgot-otp-input-${idx+1}`);
                      if (next) next.focus();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace') {
                      let newOtp = otp.split('');
                      newOtp[idx] = '';
                      setOtp(newOtp.join(''));
                      if (idx > 0) {
                        const prev = document.getElementById(`forgot-otp-input-${idx-1}`);
                        if (prev) prev.focus();
                      }
                    }
                  }}
                  id={`forgot-otp-input-${idx}`}
                  className="w-10 h-10 text-center text-2xl bg-dark border border-gray-700 rounded-lg focus:border-gold focus:outline-none"
                  autoFocus={idx === 0}
                />
              ))}
            </div>
            <button
              className="text-xs text-gold underline mb-2"
              style={{ width: 'fit-content' }}
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading ? 'Resending...' : 'Resend Code'}
            </button>
            <input type="password" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none mb-2" placeholder="New password" value={newPass} onChange={e => setNewPass(e.target.value)} />
            <input type="password" className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none mb-2" placeholder="Confirm new password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
            <button className="w-full bg-gold text-black px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-yellow-400" onClick={handleReset}><FiSave /> Reset Password</button>
          </>
        )}
        {error && <div className="text-red-400 mt-4 text-center">{error}</div>}
        {msg && <div className="text-green-400 mt-4 text-center">{msg}</div>}
      </div>
    </div>
  );
}
