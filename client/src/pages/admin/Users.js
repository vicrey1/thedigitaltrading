// src/pages/admin/Users.js
import React, { useState, useEffect } from 'react';
import UserTable from '../../components/admin/UserTable';
import UserDetail from '../../components/admin/UserDetail';
import { getUsers, updateUser } from '../../services/adminAPI';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUpdateUser = async (updatedUser) => {
    try {
      const userId = updatedUser.id || updatedUser._id;
      if (!userId) {
        console.warn('User ID is undefined in handleUpdateUser:', updatedUser);
        return;
      }
      const user = await updateUser(userId, updatedUser);
      setUsers(users.map(u => u.id === user.id ? user : u));
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  if (loading) {
    return <div className="p-2 sm:p-4 md:p-6 max-w-full sm:max-w-6xl mx-auto overflow-x-auto">Loading users...</div>;
  }

  return (
      <div className="max-w-full sm:max-w-6xl w-full mx-auto p-2 sm:p-4 md:p-8 lg:p-16 xl:p-20 2xl:p-24 font-sans text-base text-gray-100 bg-black rounded-xl shadow-lg overflow-x-auto">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        
        <UserTable 
          users={users} 
          onSelectUser={setSelectedUser}
        />
        
        {selectedUser && (
          <UserDetail 
            user={selectedUser} 
            onClose={() => setSelectedUser(null)}
            onUpdate={handleUpdateUser}
          />
        )}
      </div>
    </div>
  );
};

export default AdminUsers;