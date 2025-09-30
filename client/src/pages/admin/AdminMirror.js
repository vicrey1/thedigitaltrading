import React, { useState } from 'react';
import AdminUserList from './AdminUserList';
import AdminMirrorUser from './AdminMirrorUser';

const AdminMirror = () => {
  const [selectedUserId, setSelectedUserId] = useState(null);

  return (
    <div className="max-w-full sm:max-w-4xl mx-auto p-2 sm:p-4">
      {!selectedUserId ? (
        <AdminUserList onSelectUser={setSelectedUserId} />
      ) : (
        <div>
          <div className="mb-4">
            <button className="w-full sm:w-auto px-3 py-2 bg-gray-800 text-white rounded-lg" onClick={() => setSelectedUserId(null)} aria-label="Back to user list">Back</button>
          </div>
          <AdminMirrorUser userId={selectedUserId} onBack={() => setSelectedUserId(null)} />
        </div>
      )}
    </div>
  );
};

export default AdminMirror;
