// src/auth/AdminProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from './AdminAuthProvider';

const AdminProtectedRoute = () => {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
    </div>;
  }

  return admin ? <Outlet /> : <Navigate to="/admin/login" />;
};

export default AdminProtectedRoute;