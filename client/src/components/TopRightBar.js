import React from 'react';
import { FiSettings, FiLogOut } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const TopRightBar = () => {
  const { logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-4 bg-black bg-opacity-80 rounded-xl shadow-lg p-2">
      <Link to="/dashboard/settings" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-black font-bold hover:bg-yellow-500 transition">
        <FiSettings className="text-xl" />
        <span className="hidden sm:inline">Settings</span>
      </Link>
      <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition">
        <FiLogOut className="text-xl" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </div>
  );
};

export default TopRightBar;
