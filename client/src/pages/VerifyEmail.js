import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      try {
        await axios.post(`${process.env.REACT_APP_API_BASE_URL}/auth/verify-email`, { token });
        setStatus('success');
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        setStatus('error');
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 relative">
      {/* X button to go back to registration */}
      <button
        className="fixed top-6 right-6 text-white text-3xl font-bold z-50 bg-black bg-opacity-40 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition"
        aria-label="Close"
        onClick={() => navigate(-1)}
        type="button"
      >
        ×
      </button>
      <div className="glassmorphic p-8 rounded-xl text-center mt-8">
        {status === 'verifying' && <p className="text-lg text-gold">Verifying your email...</p>}
        {status === 'success' && <>
          <h2 className="text-2xl font-bold text-green-400 mb-2">Email Verified!</h2>
          <p className="text-gray-300 mb-2">Your email has been successfully verified. Redirecting to login...</p>
        </>}
        {status === 'error' && <>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Verification Failed</h2>
          <p className="text-gray-300 mb-2">The verification link is invalid or expired.</p>
        </>}
      </div>
    </div>
  );
};

export default VerifyEmail;
