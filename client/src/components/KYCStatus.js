import React, { useEffect, useState } from 'react';
import axios from 'axios';

const KYCStatus = () => {
  const [status, setStatus] = useState('pending');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKYC = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/kyc/status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStatus(res.data.kyc.status || 'pending');
        setReason(res.data.kyc.rejectionReason || '');
      } catch (err) {
        setStatus('pending');
        setReason('');
      }
      setLoading(false);
    };
    fetchKYC();
  }, []);

  return (
    <div className="glassmorphic p-8 rounded-xl text-center">
      <h2 className="text-2xl font-bold text-gold mb-4">KYC Status</h2>
      {loading ? (
        <div className="text-yellow-400">Loading...</div>
      ) : (
        <React.Fragment>
          <div className={`text-xl font-bold mb-2 ${status === 'verified' ? 'text-green-400' : status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</div>
          <p className="text-white mb-4">
            {status === 'verified' && 'Your KYC is verified. Enjoy full access!'}
            {status === 'pending' && 'Your KYC is under review. You will be notified once verified.'}
            {status === 'rejected' && (
              <span>
                Your KYC was rejected. Please contact support.<br />
                {reason && <span className="text-red-300">Reason: {reason}</span>}
              </span>
            )}
          </p>
        </React.Fragment>
      )}
    </div>
  );
};

export default KYCStatus;
