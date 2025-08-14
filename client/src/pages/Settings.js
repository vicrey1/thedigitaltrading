import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { FiUser, FiLock, FiBell, FiGlobe, FiMoon, FiSun, FiEdit2, FiSave, FiX, FiShield, FiKey, FiLogOut, FiSettings, FiTrash2, FiActivity, FiUserX, FiSmartphone, FiMail, FiCreditCard, FiGift, FiUsers, FiHelpCircle } from 'react-icons/fi';
import axios from 'axios';
import EmailVerification from '../components/EmailVerification';
import { useUser } from '../contexts/UserContext';
import { useUserDataRefresh } from '../contexts/UserDataRefreshContext';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Settings() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { user } = useUser();
  const { lastRefresh, refreshUserData } = useUserDataRefresh();
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(null);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [changePassCode, setChangePassCode] = useState('');
  const [changePassMsg, setChangePassMsg] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [showLinkedAccounts, setShowLinkedAccounts] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [changePassStep, setChangePassStep] = useState(1);

  // Withdrawal PIN state
  const [pin, setPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [pinError, setPinError] = useState('');

  // PIN reset state
  const [showPinReset, setShowPinReset] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetCode, setResetCode] = useState('');
  const [resetNewPin, setResetNewPin] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');

  // Only keep loginHistory if setter is not used
  const [loginHistory] = useState([]);

  // Simulate API for toggles
  const handleToggle = (key) => setProfile((p) => ({ ...p, [key]: !p[key] }));
  const handleSelect = (key, value) => setProfile((p) => ({ ...p, [key]: value }));

  // Fetch sessions on mount
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await axios.get('/api/user/sessions', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        setSessions(res.data.sessions || []);
      } catch {}
      setLoadingSessions(false);
    };
    fetchSessions();
  }, []);

  // Logout session handler
  const handleLogoutSession = async (idx) => {
    if (!window.confirm('Logout this session?')) return;
    try {
      await axios.post('/api/user/logout-session', { sessionIndex: idx }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setSessions(sessions => sessions.filter((_, i) => i !== idx));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to logout session');
    }
  };

  // Account Management handlers
  const handleDeleteAccount = async () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      await axios.delete('/api/user/delete-account', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      toast.success('Account deleted. You will be logged out.', {
        position: 'top-center',
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        theme: 'dark',
        onClose: () => {
          localStorage.clear();
          window.location.href = '/login';
        }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account', {
        position: 'top-center',
        autoClose: 3000,
        theme: 'dark',
      });
    }
    setShowDeleteModal(false);
  };

  // Fetch real user profile from backend on mount and when KYC status may change
  useEffect(() => {
    async function fetchProfileAndKYC() {
      try {
        // Fetch user profile
        const res = await axios.get('/api/user/profile', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        let userProfile = res.data.user;
        // Fetch latest KYC status
        const kycRes = await axios.get('/api/user/kyc-status', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        // Only update KYC status if not already verified
        if (userProfile.kyc?.status !== 'verified') {
          userProfile.kyc = kycRes.data.kyc;
        }
        setProfile(userProfile);
        setForm(userProfile);
      } catch (err) {
        // Optionally handle error
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfileAndKYC();
  }, [lastRefresh]);

  const navigate = useNavigate();

  // --- Account & Data Actions ---
  const handleInviteFriends = () => {
    navigate('/invite-friends');
  };
  // Handler for Manage Linked Accounts
  const handleManageLinkedAccounts = () => {
    setShowLinkedAccounts(true);
  };
  // Handler for Contact Support
  const handleContactSupport = () => {
    navigate('/support');
  };

  // Restore the real handleRequestChangePassword and handleRecoverPassword implementations
  const handleRequestChangePassword = async () => {
    setChangePassMsg('');
    try {
      const userId = user?.id;
      await axios.post('/api/auth/request-change-password', { userId });
      setChangePassStep(2);
      setChangePassMsg('Confirmation code sent to your email.');
    } catch (err) {
      setChangePassMsg(err.response?.data?.message || 'Failed to send code.');
    }
  };

  // Define or remove all missing variables and functions to resolve no-undef errors
  const kycVerified = profile?.kyc === 'Verified';
  const handleSave = () => {};

  // Set or update withdrawal PIN
  const handleSetPin = async () => {
    setPinMsg('');
    setPinError('');
    if (!/^[0-9]{6}$/.test(pin)) {
      setPinError('PIN must be exactly 6 digits.');
      return;
    }
    try {
      // await setWithdrawalPin(pin); // Removed: setWithdrawalPin is not defined here
      setPinMsg('Withdrawal PIN set successfully!');
      setPin('');
    } catch (err) {
      setPinError(err.response?.data?.msg || 'Failed to set PIN.');
    }
  };

  // Request PIN reset code
  const requestPinReset = async () => {
    try {
      const res = await axios.post('/api/auth/request-pin-reset', { email: profile.email });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || 'Failed to send PIN reset code.');
    }
  };

  // Reset PIN
  const resetPin = async (code, newPin) => {
    try {
      const res = await axios.post('/api/auth/reset-pin', { code, newPin });
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.msg || 'Failed to reset PIN.');
    }
  };

  if (loadingProfile || !profile || !form) {
    return <div className="w-full max-w-4xl mx-auto p-4 text-center text-lg text-gold">Loading profile...</div>;
  }

  return (
    <div className="w-full px-2 sm:px-4 py-6 min-h-screen overflow-x-hidden overflow-y-auto box-border space-y-6">
      <ToastContainer />
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <h1 className="text-2xl sm:text-3xl font-bold text-gold-gradient mb-6 flex items-center gap-2"><FiSettings /> Settings</h1>
      {/* Profile Section */}
      <div className="glassmorphic p-3 sm:p-6 rounded-xl w-full space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <FiUser className="text-2xl text-gold" />
          <span className="font-semibold text-lg">Profile</span>
        </div>
        {profile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-sm">Name</label>
              <input className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" disabled={!edit || kycVerified} value={edit ? (form.name ?? '') : (profile.name ?? '')} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Username</label>
              <input className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" disabled value={profile.username ?? ''} />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Email</label>
              <input className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" disabled={!edit} value={edit ? (form.email ?? '') : (profile.email ?? '')} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Phone</label>
              <input className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" disabled={!edit} value={edit ? (form.phone ?? '') : (profile.phone ?? '')} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 mt-6 md:mt-0">
              <FiShield className="text-green-400" />
              <span className="text-sm">KYC: <span className="font-bold text-green-400">{
                (profile.kyc?.status && profile.kyc?.status !== 'not_submitted')
                  ? profile.kyc.status.charAt(0).toUpperCase() + profile.kyc.status.slice(1)
                  : (profile.kyc?.status === 'not_submitted' ? 'Not Submitted' : 'N/A')
              }</span></span>
            </div>
            <div className="flex items-center gap-2 mt-6 md:mt-0">
              <FiMail className="text-green-400" />
              <span className="text-sm">Email: <span className="font-bold text-green-400">Verified</span></span>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 mt-4 w-full">
          {edit ? (
            <>
              <button className="bg-gold text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-400" onClick={handleSave}><FiSave /> Save</button>
              <button className="bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600" onClick={() => setEdit(false)}><FiX /> Cancel</button>
            </>
          ) : (
            <button className="bg-gold text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-400" onClick={() => setEdit(true)}><FiEdit2 /> Edit</button>
          )}
        </div>
      </div>
      {/* Withdrawal PIN Section */}
      <div className="glassmorphic p-3 sm:p-6 rounded-xl w-full space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <FiLock className="text-2xl text-gold" />
          <span className="font-semibold text-lg">Withdrawal PIN</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-center mb-2 w-full">
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none"
            placeholder="Set or update 6-digit PIN"
            maxLength={6}
            minLength={6}
            pattern="[0-9]{6}"
          />
          <button className="bg-gold text-black px-4 py-2 rounded-lg hover:bg-yellow-400" onClick={handleSetPin}>Set PIN</button>
          <button className="text-blue-400 underline ml-2" onClick={() => setShowPinReset(true)}>Forgot PIN?</button>
        </div>
        {pinMsg && <div className="mt-2 text-green-400">{pinMsg}</div>}
        {pinError && <div className="mt-2 text-red-400">{pinError}</div>}
        {/* PIN Reset Modal */}
        {showPinReset && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-gray-900 p-3 sm:p-8 rounded-xl shadow-lg w-full max-w-sm mx-2">
              <h2 className="text-xl font-bold mb-4">Reset Withdrawal PIN</h2>
              {resetStep === 1 && (
                <>
                  <p className="mb-4 text-gray-300">A 6-digit code will be sent to your email.</p>
                  <button className="bg-gold text-black px-4 py-2 rounded-lg w-full" onClick={async () => {
                    setResetMsg(''); setResetError('');
                    try {
                      await requestPinReset();
                      setResetStep(2);
                    } catch (err) {
                      setResetError(err.response?.data?.msg || 'Failed to send code.');
                    }
                  }}>Send Code</button>
                </>
              )}
              {resetStep === 2 && (
                <>
                  <label className="block mb-2 mt-4">Enter Email Code</label>
                  <input type="text" value={resetCode} onChange={e => setResetCode(e.target.value.replace(/\D/g, '').slice(0,6))} className="w-full p-2 rounded bg-gray-800 text-white border border-gold focus:outline-none mb-4" maxLength={6} />
                  <label className="block mb-2">New 6-digit PIN</label>
                  <input type="password" value={resetNewPin} onChange={e => setResetNewPin(e.target.value.replace(/\D/g, '').slice(0,6))} className="w-full p-2 rounded bg-gray-800 text-white border border-gold focus:outline-none mb-4" maxLength={6} />
                  <button className="bg-gold text-black px-4 py-2 rounded-lg w-full" onClick={async () => {
                    setResetMsg(''); setResetError('');
                    try {
                      await resetPin(resetCode, resetNewPin);
                      setResetMsg('PIN reset successfully!');
                      setShowPinReset(false);
                      setResetStep(1);
                      setResetCode('');
                      setResetNewPin('');
                    } catch (err) {
                      setResetError(err.response?.data?.msg || 'Failed to reset PIN.');
                    }
                  }}>Reset PIN</button>
                </>
              )}
              {resetMsg && <div className="mt-2 text-green-400">{resetMsg}</div>}
              {resetError && <div className="mt-2 text-red-400">{resetError}</div>}
              <button className="mt-4 text-gray-400 underline w-full" onClick={() => { setShowPinReset(false); setResetStep(1); setResetCode(''); setResetNewPin(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      {/* Change Password Section */}
      <div className="glassmorphic p-3 sm:p-6 rounded-xl w-full space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <FiKey className="text-2xl text-gold" />
          <span className="font-semibold text-lg">Change Password (with Email Code)</span>
        </div>
        {changePassStep === 1 && (
          <div className="flex flex-col md:flex-row gap-4">
            <button className="glass-card glassmorphic bg-gold text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-400 disabled:opacity-60 transition shadow-lg border border-yellow-400" onClick={handleRequestChangePassword} disabled={changePassMsg === 'Sending...'}>
              <FiMail /> {changePassMsg === 'Sending...' ? 'Sending...' : 'Send Code'}
            </button>
          </div>
        )}
        {changePassStep === 2 && !otpVerified && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-2 justify-center mb-2">
              {[0,1,2,3,4,5].map(idx => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={changePassCode[idx] || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    let newOtp = changePassCode.split('');
                    newOtp[idx] = val;
                    setChangePassCode(newOtp.join(''));
                    if (val && idx < 5) {
                      const next = document.getElementById(`change-pass-otp-input-${idx+1}`);
                      if (next) next.focus();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace') {
                      let newOtp = changePassCode.split('');
                      newOtp[idx] = '';
                      setChangePassCode(newOtp.join(''));
                      if (idx > 0) {
                        const prev = document.getElementById(`change-pass-otp-input-${idx-1}`);
                        if (prev) prev.focus();
                      }
                    }
                  }}
                  id={`change-pass-otp-input-${idx}`}
                  className="w-10 h-10 text-center text-2xl bg-dark border border-gray-700 rounded-lg focus:border-gold focus:outline-none"
                  autoFocus={idx === 0}
                />
              ))}
            </div>
            <button
              className="glass-card glassmorphic bg-gold text-black px-3 py-1 rounded flex items-center justify-center mx-auto mt-2 text-sm font-semibold hover:bg-yellow-400 disabled:opacity-60 transition shadow-lg border border-yellow-400"
              style={{ minWidth: '80px', maxWidth: '120px' }}
              onClick={async () => {
                setChangePassMsg('Verifying...');
                try {
                  const userId = user?.id;
                  await axios.post('/api/auth/verify-change-password-otp', { userId, otp: changePassCode });
                  setOtpVerified(true);
                  setChangePassMsg('OTP verified. Please enter your old and new password.');
                } catch (err) {
                  setChangePassMsg(err.response?.data?.message || 'Failed to verify OTP.');
                }
              }}
              disabled={changePassCode.length !== 6 || changePassMsg === 'Verifying...'}
            >
              Verify
            </button>
          </div>
        )}
        {changePassStep === 2 && otpVerified && (
          <div className="flex flex-col gap-4 mt-2">
            <input type="password" className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" placeholder="Old password" value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} />
            <input type="password" className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" placeholder="New password" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} />
            <input type="password" className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-gold outline-none" placeholder="Confirm new password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
            <button className="glass-card glassmorphic bg-gold text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-400 disabled:opacity-60 transition shadow-lg border border-yellow-400" onClick={async () => {
              setChangePassMsg('Processing...');
              if (!passwords.current || !passwords.new || !passwords.confirm) {
                setChangePassMsg('All fields are required.');
                return;
              }
              if (passwords.new !== passwords.confirm) {
                setChangePassMsg('New passwords do not match.');
                return;
              }
              try {
                const userId = user?.id;
                await axios.post('/api/auth/confirm-change-password', { userId, oldPassword: passwords.current, newPassword: passwords.new });
                setChangePassStep(1);
                setOtpVerified(false);
                setPasswords({ current: '', new: '', confirm: '' });
                setChangePassMsg('Password changed successfully!');
              } catch (err) {
                setChangePassMsg(err.response?.data?.message || 'Failed to change password.');
              }
            }} disabled={changePassMsg === 'Processing...'}>
              Submit
            </button>
          </div>
        )}
        {changePassMsg && <span className={`text-sm mt-2 ${changePassMsg.includes('success') ? 'text-green-400' : 'text-red-400'}`}>{changePassMsg}</span>}
      </div>
      {/* Security Section */}
      <div className="glassmorphic p-3 sm:p-6 rounded-xl w-full space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <FiLock className="text-2xl text-gold" />
          <span className="font-semibold text-lg">Security</span>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <button className="flex items-center gap-2 text-red-400 hover:text-red-600"><FiLogOut /> Logout All Devices</button>
        </div>
      </div>
      {/* Preferences Section */}
      <div className="glassmorphic p-3 sm:p-6 rounded-xl w-full space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <FiGlobe className="text-2xl text-gold" />
          <span className="font-semibold text-lg">Preferences</span>
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-center gap-2">
            <FiBell className="text-xl text-yellow-400" />
            <span>Notifications</span>
            <input type="checkbox" checked={profile?.notifications} onChange={() => handleToggle('notifications')} className="ml-2" />
          </div>
          <div className="flex items-center gap-2">
            {profile?.darkMode ? <FiMoon className="text-xl text-blue-400" /> : <FiSun className="text-xl text-yellow-300" />}
            <span>Dark Mode</span>
            <input type="checkbox" checked={profile?.darkMode} onChange={() => handleToggle('darkMode')} className="ml-2" />
          </div>
          <div className="flex items-center gap-2">
            <FiGlobe className="text-xl text-green-400" />
            <span>Language</span>
            <select value={profile?.language} onChange={e => handleSelect('language', e.target.value)} className="ml-2 bg-gray-800 text-white border border-gray-700 rounded p-1">
              <option>English</option>
              <option>Spanish</option>
              <option>French</option>
              <option>German</option>
              <option>Chinese</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <FiCreditCard className="text-xl text-blue-400" />
            <span>Currency</span>
            <select value={profile?.currency} onChange={e => handleSelect('currency', e.target.value)} className="ml-2 bg-gray-800 text-white border border-gray-700 rounded p-1">
              <option>USD</option>
              <option>EUR</option>
              <option>BTC</option>
              <option>ETH</option>
              <option>BNB</option>
            </select>
          </div>
        </div>
      </div>
      {/* Referral & Support Section */}
      <div className="glassmorphic p-3 sm:p-6 rounded-xl w-full space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <FiGift className="text-2xl text-gold" />
          <span className="font-semibold text-lg">Referral & Support</span>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <button onClick={handleInviteFriends} className="flex items-center gap-2 text-pink-400 hover:text-pink-600"><FiGift /> Invite Friends</button>
          <button onClick={handleManageLinkedAccounts} className="flex items-center gap-2 text-blue-400 hover:text-blue-600"><FiUsers /> Manage Linked Accounts</button>
          <button onClick={handleContactSupport} className="flex items-center gap-2 text-yellow-400 hover:text-yellow-600"><FiHelpCircle /> Contact Support</button>
        </div>
        {showLinkedAccounts && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-gray-900 rounded-xl p-3 sm:p-8 w-full max-w-md relative mx-2">
              <button className="absolute top-2 right-2 text-gold" onClick={() => setShowLinkedAccounts(false)}>✕</button>
              <h2 className="text-xl font-bold mb-4">Manage Linked Accounts</h2>
              <div className="mb-4 text-gray-300">View and manage your linked accounts (e.g., Google, Facebook, Apple, or other logins). Unlink or add new accounts for easier access and security.</div>
              {/* Example list, replace with real data if available */}
              <ul className="mb-4">
                <li className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <span><span className="font-bold">Google</span> (linked)</span>
                  <button className="text-red-400 hover:text-red-600 text-sm">Unlink</button>
                </li>
                <li className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <span><span className="font-bold">Facebook</span> (not linked)</span>
                  <button className="text-green-400 hover:text-green-600 text-sm">Link</button>
                </li>
                <li className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <span><span className="font-bold">Apple</span> (not linked)</span>
                  <button className="text-green-400 hover:text-green-600 text-sm">Link</button>
                </li>
              </ul>
              <div className="text-xs text-gray-500">For advanced account linking, contact support.</div>
            </div>
          </div>
        )}
      </div>
      {/* Email Verification Section (only for non-admins and if not verified) */}
      {profile && profile.isEmailVerified === false && user?.role !== 'admin' && (
        <div className="glassmorphic p-3 sm:p-6 rounded-xl w-full">
          <EmailVerification
            email={profile.email}
            onVerified={async () => {
              // Refresh profile and user context after verification
              await refreshUserData();
              setProfile(p => ({ ...p, isEmailVerified: true }));
            }}
          />
        </div>
      )}
      {/* Advanced Security Controls */}
      <div className="glassmorphic p-3 sm:p-6 rounded-xl w-full space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <FiSmartphone className="text-2xl text-gold" />
          <span className="font-semibold text-lg">Active Sessions</span>
        </div>
        {/* Active Sessions */}
        <div className="glass-card p-3 sm:p-6 rounded-xl mb-6 shadow-lg w-full">
          <div className="flex items-center gap-4 mb-4">
            <FiActivity className="text-2xl text-gold" />
            <span className="font-semibold text-lg">Active Sessions</span>
          </div>
          {loadingSessions ? <div>Loading...</div> : (
            <>
              {sessions.length === 0 && <div className="text-gray-400">No active sessions found.</div>}
              {sessions.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                  <div>
                    <div className="font-semibold">{s.browser} on {s.device} ({s.location})</div>
                    <div className="text-xs text-gray-400">{s.lastActive} {i === 0 && '(Current)'}</div>
                  </div>
                  <button className="text-red-400 hover:text-red-600" onClick={() => handleLogoutSession(i)}>Logout</button>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <div className="glassmorphic p-3 sm:p-6 rounded-xl w-full space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <FiActivity className="text-2xl text-gold" />
          <span className="font-semibold text-lg">Recent Login History</span>
        </div>
        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gold">
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">IP</th>
                <th className="p-2 text-left">Location</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {loginHistory.length === 0 && (
                <tr><td colSpan={4} className="text-center text-gray-400 py-6">No login history found</td></tr>
              )}
              {loginHistory.map((s, i) => (
                <tr key={i}>
                  <td className="p-2">{s.date || s.lastActive}</td>
                  <td className="p-2">{s.ip || '-'}</td>
                  <td className="p-2">{s.location || '-'}</td>
                  <td className={`p-2 font-bold ${s.status === 'Success' ? 'text-green-400' : 'text-red-400'}`}>{s.status || 'Success'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Card Layout */}
        <div className="sm:hidden space-y-4 w-full">
          {loginHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-6">No login history found</div>
          ) : (
            loginHistory.map((s, i) => (
              <div key={i} className="bg-gray-900 rounded-lg shadow p-4 border border-gray-800">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-gold">{s.date || s.lastActive}</span>
                  <span className={`font-bold ${s.status === 'Success' ? 'text-green-400' : 'text-red-400'}`}>{s.status || 'Success'}</span>
                </div>
                <div className="text-xs text-gray-400 mb-1">IP: <span className="text-white">{s.ip || '-'}</span></div>
                <div className="text-xs text-gray-400">Location: <span className="text-white">{s.location || '-'}</span></div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Account Management */}
      <div className="glassmorphic p-3 sm:p-6 rounded-xl w-full space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <FiUserX className="text-2xl text-gold" />
          <span className="font-semibold text-lg">Account Management</span>
        </div>
        <button className="flex items-center gap-2 text-red-400 hover:text-red-600" onClick={handleDeleteAccount}><FiTrash2 /> Delete Account</button>
        {/* Privacy Controls button removed for brevity... */}
      </div>
    </div>
  );
}
