import React, { useEffect, useState } from "react";
import { Users, UserPlus, ShieldCheck, Trash2, RefreshCw } from "lucide-react";

import { adminAPI } from "../services/api";
import { ROLES } from "../constants/roles";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: ROLES.USER,
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminAPI.getUsers();

      setUsers(Array.isArray(response) ? response : response?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");

      await adminAPI.createUser(formData);

      setFormData({
        name: "",
        email: "",
        password: "",
        role: ROLES.USER,
      });

      setShowCreate(false);

      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create user.");
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await adminAPI.changeRole(id, role);

      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to change role.");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?",
    );

    if (!confirmed) return;

    try {
      await adminAPI.deleteUser(id);

      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete user.");
    }
  };

  const getRoleClass = (role) => {
    return String(role || "").toLowerCase();
  };

  return (
    <div className="admin-users-page">
      <div className="page-header">
        <div>
          <div className="title-icon">
            <Users size={26} />
          </div>

          <h1>User Management</h1>

          <p>Manage users and assign application roles.</p>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={loadUsers}>
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            className="primary-button"
            onClick={() => setShowCreate(!showCreate)}
          >
            <UserPlus size={17} />
            Create User
          </button>
        </div>
      </div>

      {error && <div className="error-box">{error}</div>}

      {showCreate && (
        <div className="create-user-card">
          <div className="card-title">
            <ShieldCheck size={20} />
            <h2>Create User</h2>
          </div>

          <form onSubmit={handleCreateUser} className="create-user-form">
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleFormChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleFormChange}
              required
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleFormChange}
              required
            />

            <select
              name="role"
              value={formData.role}
              onChange={handleFormChange}
            >
              <option value={ROLES.USER}>USER</option>

              <option value={ROLES.ORGANIZER}>ORGANIZER</option>

              <option value={ROLES.SCORER}>SCORER</option>

              <option value={ROLES.ADMIN}>ADMIN</option>
            </select>

            <button
              type="submit"
              disabled={creating}
              className="primary-button"
            >
              {creating ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>
      )}

      <div className="users-card">
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="empty">No users found.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>

                    <td>
                      <div className="user-name">{user.name}</div>
                    </td>

                    <td>{user.email}</td>

                    <td>
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user.id, e.target.value)
                        }
                        className={`role-select ${getRoleClass(user.role)}`}
                      >
                        <option value="USER">USER</option>

                        <option value="ORGANIZER">ORGANIZER</option>

                        <option value="SCORER">SCORER</option>

                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>

                    <td>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(user.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
