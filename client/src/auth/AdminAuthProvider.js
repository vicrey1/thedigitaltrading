// src/auth/AdminAuthProvider.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyAdminToken, adminLogin } from '../services/adminAuthAPI';

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  console.log('AdminAuthProvider rendered');
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          setLoading(false);
          return;
        }
        
        const adminData = await verifyAdminToken();
        setAdmin(adminData);
      } catch (error) {
        // Improved error logging
        console.error('Admin auth verification failed:', error);
        // Only remove token if error is specifically an auth error
        if (error === 'Session verification failed' || (typeof error === 'string' && error.toLowerCase().includes('token'))) {
          localStorage.removeItem('adminToken');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const { token, admin: adminData } = await adminLogin(email, password);
      localStorage.setItem('adminToken', token);
      setAdmin(adminData);
      navigate('/admin');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdmin(null);
    navigate('/admin/login');
  };

  return (
    <AdminAuthContext.Provider value={{ admin, setAdmin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};