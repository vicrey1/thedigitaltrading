import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reason = searchParams.get('reason');
  const email = searchParams.get('email');

  const handleResend = async () => {
    if (!email) {
      navigate('/register');
      return;
    }
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL || ''}/api/auth/resend-otp`, { email });
      alert('A new verification email/OTP has been sent to your email.');
    } catch (err) {
      console.error('Resend error', err);
      alert('Failed to resend verification. Please contact support.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="glassmorphic p-8 rounded-xl text-center">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Verification Failed</h1>
        <p className="mb-4">{reason === 'expired' && 'Your verification link has expired.'}
           {reason === 'exists' && 'An account already exists for this email.'}
           {reason === 'server' && 'An error occurred while verifying your email.'}
           {!reason && 'Invalid verification link.'}
        </p>
        <p className="mb-4">{email ? `Email: ${email}` : 'If you recently registered, please try resending the verification email.'}</p>
        <div className="flex gap-4 justify-center">
          <button onClick={handleResend} className="px-4 py-2 bg-gold rounded text-black">Resend Verification</button>
          <a href="/support" className="px-4 py-2 border border-gray-600 rounded">Contact Support</a>
        </div>
      </div>
    </div>
  );
};

export default VerifyFailed;
