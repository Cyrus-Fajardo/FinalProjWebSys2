import React, { useState, useEffect } from 'react';
import '../css/ManageUsers.css';
import Sidebar from '../components/Sidebar';
import { userAPI } from '../js/api';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({
    fullname: '',
    email: '',
    password: '',
    role: 'Farmer'
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

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await userAPI.create(newUser);
      setUsers([...users, data.user]);
      setNewUser({ fullname: '', email: '', password: '', role: 'Farmer' });
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error:', err);
    }
  };

  const handleUpdateUser = async (userId) => {
    setError('');

    try {
      const data = await userAPI.update(userId, editingUser);
      setUsers(users.map(u => u._id === userId ? data.user : u));
      setEditingId(null);
      setEditingUser({});
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error('Error:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(userId);
        setUsers(users.filter(u => u._id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  const startEdit = (user) => {
    setEditingId(user._id);
    setEditingUser({ fullname: user.fullname, email: user.email, role: user.role });
  };

  return (
    <div className="manage-users-container">
      <Sidebar />
      <div className="manage-users-content">
        <div className="manage-users-header">
          <h1>Manage Users</h1>
          <button
            className="create-btn"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'Cancel' : 'Create User'}
          </button>
        </div>

        {showCreateForm && (
          <div className="create-form-container">
            <h2>Create New User</h2>
            {error && <div className="error-message">{error}</div>}

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
                  <option value="Kaluppa Foundation">Kaluppa Foundation</option>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
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
                        <select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        >
                          <option value="Farmer">Farmer</option>
                          <option value="Buyer">Buyer</option>
                          <option value="Kaluppa Foundation">Kaluppa Foundation</option>
                          <option value="DTI">DTI</option>
                          <option value="Group Manager">Group Manager</option>
                        </select>
                      ) : (
                        user.role
                      )}
                    </td>
                    <td>
                      {editingId === user._id ? (
                        <>
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
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="edit-btn"
                            onClick={() => startEdit(user)}
                          >
                            Edit
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManageUsers;
