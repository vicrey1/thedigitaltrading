import React, { useState, useEffect } from 'react';
import AdminUserList from './AdminUserList';
import AdminMirrorUser from './AdminMirrorUser';
import ErrorBoundary from './ErrorBoundary';
import QuickFilters from './QuickFilters';

const AdminMirror = () => {
  const [selectedUserId, setSelectedUserId] = useState(() => {
    // Restore from session storage
    return sessionStorage.getItem('adminMirrorUserId') || null;
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState(null);

  // Persist selected user ID to session storage
  useEffect(() => {
    if (selectedUserId) {
      sessionStorage.setItem('adminMirrorUserId', selectedUserId);
    } else {
      sessionStorage.removeItem('adminMirrorUserId');
    }
  }, [selectedUserId]);

  const handleSelectUser = (userId) => {
    setError(null);
    setSelectedUserId(userId);
  };

  const handleBack = () => {
    setError(null);
    setSelectedUserId(null);
  };

  const handleFilter = (filterId) => {
    setActiveFilter(filterId);
    // The AdminUserList component will handle the actual filtering
  };

  if (error) {
    return (
      <div className="max-w-full sm:max-w-4xl mx-auto p-2 sm:p-4">
        <div className="p-4 bg-red-900/50 border border-red-500 rounded">
          <h3 className="text-lg font-semibold text-red-300 mb-2">Error</h3>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full sm:max-w-4xl mx-auto p-2 sm:p-4">
      <ErrorBoundary>
        {!selectedUserId ? (
          <>
            <h1 className="text-2xl font-bold mb-4">User Mirror</h1>
            <QuickFilters onFilter={handleFilter} activeFilter={activeFilter} />
            <div className="bg-gray-800 rounded-lg p-4">
              <AdminUserList
                onSelectUser={handleSelectUser}
                filter={activeFilter}
              />
            </div>
          </>
        ) : (
          <div>
            <div className="mb-4">
              <button
                className="w-full sm:w-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded font-bold"
                onClick={handleBack}
                aria-label="Back to user list"
              >
                Back to User List
              </button>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <AdminMirrorUser 
                userId={selectedUserId}
                onBack={handleBack}
                onError={setError}
              />
            </div>
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
};

export default AdminMirror;