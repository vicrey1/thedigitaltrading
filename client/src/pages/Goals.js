import React from 'react';
import GoalsDashboard from '../components/GoalsDashboard';
import { ToastContainer } from 'react-toastify';

export default function Goals() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <ToastContainer />
      <GoalsDashboard />
    </div>
  );
}
