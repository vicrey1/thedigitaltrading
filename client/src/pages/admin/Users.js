import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { FiUserPlus, FiEdit, FiEye, FiSearch, FiX } from "react-icons/fi";
import { 
  AdminButton, AdminInput, AdminTable,
  AdminModal, LoadingSpinner 
} from "../../components/admin/AdminComponents";
import UserDetail from "../../components/admin/UserDetail";
import { API } from "../../services/adminAPI";

const Users = () => {
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetail, setShowUserDetail] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await API.get("/users", {
        params: {
          search: searchQuery,
          page: 1,
          limit: 10
        }
      });
      
      if (response.data && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      if (err.response?.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const { getStoredAdminToken } = require('../../utils/authToken');
    if (!getStoredAdminToken()) {
      window.location.href = "/admin/login";
      return;
    }
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`p-6 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <AdminButton
          variant="primary"
          icon={<FiUserPlus />}
          onClick={() => {/* Handle add user */}}
        >
          Add User
        </AdminButton>
      </div>

      {error ? (
        <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? "bg-red-900/20" : "bg-red-100"} border-l-4 border-red-500`}>
          <div className="flex items-center">
            <FiX className="w-5 h-5 mr-2 text-red-500" />
            <span className={isDarkMode ? "text-red-200" : "text-red-700"}>{error}</span>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <AdminInput
              placeholder="Search by email, name, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<FiSearch />}
            />
          </div>

          <AdminTable
            columns={[
              { field: "email", label: "Email" },
              { field: "name", label: "Name" },
              { 
                field: "actions", 
                label: "Actions",
                render: (row) => (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(row);
                        setShowUserDetail(true);
                      }}
                      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800`}
                      title="View Details"
                    >
                      <FiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(row);
                        setShowUserDetail(true);
                      }}
                      className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800`}
                      title="Edit User"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button>
                  </div>
                )
              }
            ]}
            data={users}
          />

          {/* User Detail Modal */}
          {showUserDetail && selectedUser && (
            <AdminModal
              isOpen={showUserDetail}
              onClose={() => {
                setShowUserDetail(false);
                setSelectedUser(null);
              }}
              title="User Details"
              size="xl"
            >
              <div className="mt-2">
                <UserDetail
                  user={selectedUser}
                  onClose={() => {
                    setShowUserDetail(false);
                    setSelectedUser(null);
                  }}
                  onUpdate={(updatedUser) => {
                    setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
                    fetchUsers(); // Refresh the list to get the latest data
                  }}
                />
              </div>
            </AdminModal>
          )}
        </>
      )}
    </div>
  );
};

export default Users;
