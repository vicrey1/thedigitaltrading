import { useState, useEffect, useContext, createContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import { getStoredToken } from '../utils/authToken';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  console.log('UserProvider rendered');
  const [user, setUser] = useState(null);
  const [kycStatus, setKycStatus] = useState('pending');
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const userPayload = decoded.user || decoded;
        setUser(userPayload);
        axios.get('/api/auth/kyc/status', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          setKycStatus(res.data.kyc.status || 'pending');
          setIsEmailVerified(res.data.isEmailVerified || false);
        }).catch(() => {
          setKycStatus('pending');
          setIsEmailVerified(false);
        });
      } catch (err) {
        console.warn('[UserContext] Failed to decode token', err);
        setUser(null);
        setKycStatus('pending');
        setIsEmailVerified(false);
      }
    } else {
      setUser(null);
      setKycStatus('pending');
      setIsEmailVerified(false);
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    try {
      const decoded = jwtDecode(token);
      setUser(decoded.user || decoded);
      axios.get('/api/auth/kyc/status', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setKycStatus(res.data.kyc.status || 'pending');
        setIsEmailVerified(res.data.isEmailVerified || false);
      }).catch(() => {
        setKycStatus('pending');
        setIsEmailVerified(false);
      });
    } catch (err) {
      console.warn('[UserContext] login: invalid token provided', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setKycStatus('pending');
    setIsEmailVerified(false);
  };

  // Add a method to force refresh user context from /api/user/dashboard
  const refreshUserContext = async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const res = await axios.get('/api/user/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.userInfo) {
        setIsEmailVerified(!!res.data.userInfo.isEmailVerified);
      }
    } catch (err) {
      setIsEmailVerified(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, kycStatus, isEmailVerified, refreshUserContext }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
