import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { FaEdit, FaTrash, FaKey, FaUserPlus, FaCheckCircle, FaTimesCircle, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { FiChevronDown, FiChevronUp, FiMinus } from 'react-icons/fi';
import useSortableData from './utils/useSortableData';
import Watermark from './components/Watermark';
import './UserManagementPage.css';
import './styles/ActionButtons.css';
import API_BASE_URL from './config/api';

function UserManagementPage() {
  const { 
    token, 
    canAddNewUser,
    canEditUser,
    canDeleteUser
  } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formErrors, setFormErrors] = useState({});

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    role: '',
    isActive: true
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
    requirePasswordChange: false
  });

  const {
    items: sortedUsers,
    requestSort: requestUserSort,
    sortConfig: userSortConfig
  } = useSortableData(users, { key: 'fullName', direction: 'asc' });

  const renderSortIcon = (key) => {
    if (!userSortConfig || userSortConfig.key !== key) {
      return <FiMinus className="sort-icon" />;
    }
    return userSortConfig.direction === 'asc'
      ? <FiChevronUp className="sort-icon" />
      : <FiChevronDown className="sort-icon" />;
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      showMessage('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/roles`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        password: '',
        role: user.role._id,
        isActive: user.isActive
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        fullName: '',
        password: '',
        role: '',
        isActive: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});

    // Validate form data
    const nextErrors = {};
    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Full Name is required';
    }
    if (!formData.username.trim()) {
      nextErrors.username = 'Username is required';
    }
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() && !emailRegex.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }
    if (!formData.role) {
      nextErrors.role = 'Role is required';
    }
    // Validate role exists
    const selectedRole = roles.find(role => role._id === formData.role);
    if (formData.role && !selectedRole) {
      nextErrors.role = 'Please select a valid role';
    }
    if (!editingUser && !formData.password) {
      nextErrors.password = 'Password is required for new users';
    }
    if (!editingUser && formData.password && formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      showMessage('error', 'Please fix the highlighted fields');
      return;
    }

    const url = editingUser
      ? `${API_BASE_URL}/users/${editingUser._id}`
      : `${API_BASE_URL}/users`;

    const method = editingUser ? 'PUT' : 'POST';

    const payload = editingUser
      ? { username: formData.username, email: formData.email, fullName: formData.fullName, role: formData.role, isActive: formData.isActive }
      : formData;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', data.message || 'User saved successfully');
        fetchUsers();
        handleCloseModal();
      } else {
        console.error('API Error Details:');
        console.error('Status:', response.status);
        console.error('Data:', JSON.stringify(data, null, 2));
        
        let errorMessage = 'Failed to save user';
        if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map(err => err.msg || err.message || err).join(', ');
        } else if (data.details) {
          errorMessage = JSON.stringify(data.details);
        }
        
        showMessage('error', errorMessage);
      }
    } catch (error) {
      console.error('Request Error Details:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      showMessage('error', `Network error: ${error.message}`);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        fetchUsers();
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', 'An error occurred');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/toggle-status`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', data.message);
        fetchUsers();
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', 'An error occurred');
    }
  };

  const handleOpenPasswordModal = (user) => {
    setResetPasswordUser(user);
    setPasswordData({
      newPassword: '',
      confirmPassword: '',
      requirePasswordChange: false
    });
    setShowPasswordModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/users/${resetPasswordUser._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          newPassword: passwordData.newPassword,
          requirePasswordChange: passwordData.requirePasswordChange
        })
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'Password reset successfully');
        setShowPasswordModal(false);
        setResetPasswordUser(null);
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="user-management-page">
        <div className="loading-message">
          <div className="loading-spinner" aria-hidden="true"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '12px', color: '#3b82f6' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <h1>User Management</h1>
          </div>
        </div>
        {canAddNewUser() && (
          <button className="btn-add-modern" onClick={() => handleOpenModal()}>
            <FaUserPlus style={{ marginRight: '8px' }} />
            Add New User
          </button>
        )}
      </div>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table table-sticky">
          <thead>
            <tr>
              <th aria-sort={userSortConfig?.key === 'fullName' ? userSortConfig.direction : 'none'}>
                <button
                  type="button"
                  className={`sortable-header ${userSortConfig?.key === 'fullName' ? 'active' : ''}`}
                  onClick={() => requestUserSort('fullName')}
                >
                  Full Name
                  {renderSortIcon('fullName')}
                </button>
              </th>
              <th aria-sort={userSortConfig?.key === 'username' ? userSortConfig.direction : 'none'}>
                <button
                  type="button"
                  className={`sortable-header ${userSortConfig?.key === 'username' ? 'active' : ''}`}
                  onClick={() => requestUserSort('username')}
                >
                  Username
                  {renderSortIcon('username')}
                </button>
              </th>
              <th aria-sort={userSortConfig?.key === 'email' ? userSortConfig.direction : 'none'}>
                <button
                  type="button"
                  className={`sortable-header ${userSortConfig?.key === 'email' ? 'active' : ''}`}
                  onClick={() => requestUserSort('email')}
                >
                  Email
                  {renderSortIcon('email')}
                </button>
              </th>
              <th aria-sort={userSortConfig?.key === 'role' ? userSortConfig.direction : 'none'}>
                <button
                  type="button"
                  className={`sortable-header ${userSortConfig?.key === 'role' ? 'active' : ''}`}
                  onClick={() => requestUserSort('role', (user) => user.role?.name || '')}
                >
                  Role
                  {renderSortIcon('role')}
                </button>
              </th>
              <th aria-sort={userSortConfig?.key === 'status' ? userSortConfig.direction : 'none'}>
                <button
                  type="button"
                  className={`sortable-header ${userSortConfig?.key === 'status' ? 'active' : ''}`}
                  onClick={() => requestUserSort('status', (user) => (user.isActive ? 'Active' : 'Inactive'))}
                >
                  Status
                  {renderSortIcon('status')}
                </button>
              </th>
              <th aria-sort={userSortConfig?.key === 'lastLogin' ? userSortConfig.direction : 'none'}>
                <button
                  type="button"
                  className={`sortable-header ${userSortConfig?.key === 'lastLogin' ? 'active' : ''}`}
                  onClick={() => requestUserSort('lastLogin', (user) => new Date(user.lastLogin || 0).getTime())}
                >
                  Last Login
                  {renderSortIcon('lastLogin')}
                </button>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map(user => (
              <tr key={user._id}>
                <td>{user.fullName}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td><span className="role-badge">{user.role?.name}</span></td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? (
                      <>
                        <FaCheckCircle style={{ marginRight: '6px', fontSize: '12px' }} />
                        Active
                      </>
                    ) : (
                      <>
                        <FaTimesCircle style={{ marginRight: '6px', fontSize: '12px' }} />
                        Inactive
                      </>
                    )}
                  </span>
                </td>
                <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                <td>
                  <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    {canEditUser() && (
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        style={{ padding: '8px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                        title="Edit User"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <FaEdit className="w-5 h-5" style={{ width: '18px', height: '18px' }} />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenPasswordModal(user)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      style={{ padding: '8px', color: '#9333ea', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                      title="Reset Password"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf5ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <FaKey className="w-5 h-5" style={{ width: '18px', height: '18px' }} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user._id)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      style={{ padding: '8px', color: '#f59e0b', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                      title={user.isActive ? 'Deactivate User' : 'Activate User'}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fffbeb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {user.isActive ? <FaToggleOn className="w-5 h-5" style={{ width: '18px', height: '18px' }} /> : <FaToggleOff className="w-5 h-5" style={{ width: '18px', height: '18px' }} />}
                    </button>
                    {canDeleteUser() && (
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        style={{ padding: '8px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                        title="Delete User"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <FaTrash className="w-5 h-5" style={{ width: '18px', height: '18px' }} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    setFormData({ ...formData, fullName: e.target.value });
                    if (formErrors.fullName) {
                      setFormErrors(prev => ({ ...prev, fullName: '' }));
                    }
                  }}
                  required
                  aria-invalid={Boolean(formErrors.fullName)}
                />
                {formErrors.fullName && <div className="error-text">{formErrors.fullName}</div>}
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData({ ...formData, username: e.target.value });
                    if (formErrors.username) {
                      setFormErrors(prev => ({ ...prev, username: '' }));
                    }
                  }}
                  required
                  aria-invalid={Boolean(formErrors.username)}
                />
                {formErrors.username && <div className="error-text">{formErrors.username}</div>}
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) {
                      setFormErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  required
                  aria-invalid={Boolean(formErrors.email)}
                />
                {formErrors.email && <div className="error-text">{formErrors.email}</div>}
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (formErrors.password) {
                        setFormErrors(prev => ({ ...prev, password: '' }));
                      }
                    }}
                    required
                    minLength="6"
                    aria-invalid={Boolean(formErrors.password)}
                  />
                  {formErrors.password && <div className="error-text">{formErrors.password}</div>}
                </div>
              )}
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    setFormData({ ...formData, role: e.target.value });
                    if (formErrors.role) {
                      setFormErrors(prev => ({ ...prev, role: '' }));
                    }
                  }}
                  required
                  aria-invalid={Boolean(formErrors.role)}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role._id} value={role._id}>{role.name}</option>
                  ))}
                </select>
                {formErrors.role && <div className="error-text">{formErrors.role}</div>}
              </div>
              {editingUser && (
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    {' '}Active
                  </label>
                </div>
              )}
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reset Password for {resetPasswordUser?.fullName}</h2>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength="6"
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={passwordData.requirePasswordChange}
                    onChange={(e) => setPasswordData({ ...passwordData, requirePasswordChange: e.target.checked })}
                  />
                  {' '}Require password change on next login
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Watermark */}
      <Watermark />
    </div>
  );
}

export default UserManagementPage;
