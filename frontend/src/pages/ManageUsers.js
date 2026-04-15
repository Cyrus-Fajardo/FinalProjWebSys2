import React, { useEffect, useMemo, useState } from 'react';
import '../css/ManageUsers.css';
import Sidebar from '../components/Sidebar';
import { userAPI } from '../js/api';

const ADMIN_ROLES = ['Kaluppa Foundation', 'DTI'];

const getRoleLabel = (role) => {
  if (role === 'Kaluppa Foundation') {
    return 'Kaluppâ Foundation';
  }

  return role;
};

function ManageUsers() {
  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    fullname: '',
    email: '',
    password: '',
    role: 'Farmer',
  });
  const [editingUser, setEditingUser] = useState({});

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await userAPI.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const roleCounts = useMemo(() => users.reduce((acc, user) => {
    const role = user.role;
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {}), [users]);

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const data = await userAPI.create(newUser);
      setUsers((prev) => [...prev, data.user]);
      setNewUser({ fullname: '', email: '', password: '', role: 'Farmer' });
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error:', err);
    }
  };

  const isCrossAdminPasswordEditBlocked = (targetUser) => {
    if (!currentUser || !targetUser) {
      return false;
    }

    return ADMIN_ROLES.includes(currentUser.role)
      && ADMIN_ROLES.includes(targetUser.role)
      && currentUser.role !== targetUser.role
      && currentUser.userId !== targetUser._id;
  };

  const handleUpdateUser = async (userId) => {
    setError('');
    const targetUser = users.find((user) => user._id === userId);

    if (isCrossAdminPasswordEditBlocked(targetUser) && editingUser.password) {
      setError('You cannot change the password of a co-admin account.');
      return;
    }

    try {
      const payload = {
        fullname: editingUser.fullname,
        email: editingUser.email,
        role: editingUser.role,
        isVerified: !!editingUser.isVerified,
      };

      if (editingUser.password && editingUser.password.trim()) {
        payload.password = editingUser.password;
      }

      const data = await userAPI.update(userId, payload);
      setUsers((prev) => prev.map((user) => (user._id === userId ? data.user : user)));
      setEditingId(null);
      setEditingUser({});
      setShowEditPassword(false);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    const targetUser = users.find((user) => user._id === userId);

    if (!targetUser) {
      return;
    }

    if (ADMIN_ROLES.includes(targetUser.role) && Number(roleCounts[targetUser.role] || 0) <= 1) {
      setError(`Cannot delete the last remaining ${getRoleLabel(targetUser.role)} account.`);
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(userId);
        setUsers((prev) => prev.filter((user) => user._id !== userId));
      } catch (err) {
        setError(err.message || 'Error deleting user');
      }
    }
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setShowEditPassword(false);
    setEditingUser({
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      isVerified: !!user.isVerified,
      password: '',
      showPassword: false,
    });
  };

  const filteredUsers = users.filter((user) => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return true;

    return (
      String(user.fullname || '').toLowerCase().includes(normalized)
      || String(user.email || '').toLowerCase().includes(normalized)
      || String(getRoleLabel(user.role) || '').toLowerCase().includes(normalized)
    );
  });

  return (
    <div className="manage-users-container">
      <Sidebar />
      <div className="manage-users-content">
        <div className="manage-users-header">
          <h1>Manage Users</h1>
          <div className="header-controls">
            <input
              type="text"
              placeholder="Search accounts"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="create-btn"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? 'Cancel' : 'Create User'}
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {showCreateForm && (
          <div className="create-form-container">
            <h2>Create New User</h2>

            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={newUser.fullname}
                  onChange={(e) => setNewUser({ ...newUser, fullname: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="Farmer">Farmer</option>
                  <option value="Buyer">Buyer</option>
                  <option value="Kaluppa Foundation">Kaluppâ Foundation</option>
                  <option value="DTI">DTI</option>
                  <option value="Group Manager">Group Manager</option>
                </select>
              </div>

              <button type="submit" className="submit-btn">Create User</button>
            </form>
          </div>
        )}

        <div className="users-table-container">
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Password</th>
                  <th>Verified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isAdminTarget = ADMIN_ROLES.includes(user.role);
                  const disableDelete = isAdminTarget && Number(roleCounts[user.role] || 0) <= 1;
                  const coAdminPasswordBlocked = isCrossAdminPasswordEditBlocked(user);

                  return (
                    <tr key={user._id} className={editingId === user._id ? 'editing' : ''}>
                      <td>
                        {editingId === user._id ? (
                          <input
                            type="text"
                            value={editingUser.fullname}
                            onChange={(e) => setEditingUser({ ...editingUser, fullname: e.target.value })}
                          />
                        ) : (
                          user.fullname
                        )}
                      </td>
                      <td>
                        {editingId === user._id ? (
                          <input
                            type="email"
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          />
                        ) : (
                          user.email
                        )}
                      </td>
                      <td>
                        {editingId === user._id ? (
                          isAdminTarget ? (
                            <div className="immutable-role">{getRoleLabel(user.role)}</div>
                          ) : (
                            <select
                              value={editingUser.role}
                              onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                            >
                              <option value="Farmer">Farmer</option>
                              <option value="Buyer">Buyer</option>
                              <option value="Kaluppa Foundation">Kaluppâ Foundation</option>
                              <option value="DTI">DTI</option>
                              <option value="Group Manager">Group Manager</option>
                            </select>
                          )
                        ) : (
                          getRoleLabel(user.role)
                        )}
                      </td>
                      <td>
                        {editingId === user._id ? (
                          <div className="password-editor">
                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowEditPassword((prev) => !prev)}
                              disabled={coAdminPasswordBlocked}
                            >
                              {showEditPassword ? 'Hide Password Editor' : 'Edit Password'}
                            </button>
                            {coAdminPasswordBlocked && (
                              <p className="inline-note">Cannot edit co-admin password</p>
                            )}
                            {showEditPassword && !coAdminPasswordBlocked && (
                              <input
                                type={editingUser.showPassword ? 'text' : 'password'}
                                value={editingUser.password || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                                placeholder="Set new password"
                              />
                            )}
                            {showEditPassword && !coAdminPasswordBlocked && (
                              <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setEditingUser((prev) => ({ ...prev, showPassword: !prev.showPassword }))}
                              >
                                {editingUser.showPassword ? 'Hide' : 'Show'}
                              </button>
                            )}
                          </div>
                        ) : (
                          '********'
                        )}
                      </td>
                      <td>
                        {editingId === user._id ? (
                          ['Buyer', 'Farmer'].includes(user.role) ? (
                            <select
                              value={editingUser.isVerified ? 'yes' : 'no'}
                              onChange={(e) => setEditingUser({ ...editingUser, isVerified: e.target.value === 'yes' })}
                            >
                              <option value="yes">Verified</option>
                              <option value="no">Unverified</option>
                            </select>
                          ) : (
                            '-'
                          )
                        ) : (
                          ['Buyer', 'Farmer'].includes(user.role)
                            ? (user.isVerified ? 'Verified' : 'Unverified')
                            : '-'
                        )}
                      </td>
                      <td>
                        {editingId === user._id ? (
                          <div className="action-buttons">
                            <button
                              className="save-btn"
                              onClick={() => handleUpdateUser(user._id)}
                            >
                              Save
                            </button>
                            <button
                              className="cancel-btn"
                              onClick={() => {
                                setEditingId(null);
                                setEditingUser({});
                                setShowEditPassword(false);
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="action-buttons">
                            <button
                              className="edit-btn"
                              onClick={() => startEdit(user)}
                            >
                              Edit
                            </button>
                            <button
                              className="delete-btn"
                              disabled={disableDelete}
                              title={disableDelete ? `Cannot delete last ${getRoleLabel(user.role)} account` : ''}
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageUsers;
