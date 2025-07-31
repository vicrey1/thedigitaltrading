import React, { useState } from 'react';
import AdminUserList from './AdminUserList';
import AdminMirrorUser from './AdminMirrorUser';

const AdminMirror = () => {
  const [selectedUserId, setSelectedUserId] = useState(null);

  return (
    <div>
      {!selectedUserId ? (
        <AdminUserList onSelectUser={setSelectedUserId} />
      ) : (
        <AdminMirrorUser userId={selectedUserId} onBack={() => setSelectedUserId(null)} />
      )}
    </div>
  );
};

export default AdminMirror;
