import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const VerifySuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email');

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login?verified=1');
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="glassmorphic p-8 rounded-xl text-center">
        <h1 className="text-3xl font-bold text-gold mb-4">Email Verified</h1>
        <p className="mb-4">Your email {email ? `(${email}) ` : ''}has been successfully verified.</p>
        <p className="mb-4">Redirecting to login...</p>
        <a href="/login" className="mt-4 inline-block px-4 py-2 bg-gold text-black rounded">Go to Login</a>
      </div>
    </div>
  );
};

export default VerifySuccess;
