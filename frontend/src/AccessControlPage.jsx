import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaUsers, FaUserShield } from 'react-icons/fa';
import UserManagementPage from './UserManagementPage';
import RoleManagementPage from './RoleManagementPage';
import Watermark from './components/Watermark';
import './AccessControlPage.css';

/**
 * Unified Access Control hub merging User Management and Role & Permission Management
 * into a single tabbed workspace while preserving /user-management & /role-management routes.
 */
const AccessControlPage = ({ defaultTab = 'users' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const resolveInitialTab = () => {
    if (location.pathname.includes('role-management')) return 'roles';
    if (location.pathname.includes('user-management')) return 'users';
    return defaultTab;
  };

  const [activeTab, setActiveTab] = useState(resolveInitialTab);

  useEffect(() => {
    if (location.pathname.includes('role-management')) {
      setActiveTab('roles');
    } else if (location.pathname.includes('user-management')) {
      setActiveTab('users');
    }
  }, [location.pathname]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (tab === 'roles' && location.pathname !== '/role-management') {
      navigate('/role-management', { replace: true });
    } else if (tab === 'users' && location.pathname !== '/user-management') {
      navigate('/user-management', { replace: true });
    }
  };

  return (
    <div className="access-control-page">
      <Watermark />
      <div className="access-control-header">
        <div className="access-control-title-wrap">
          <div className="access-control-badge">
            <FaUserShield size={22} />
          </div>
          <div>
            <h1>Access Control & Permissions</h1>
            <p>Manage team accounts, assign roles, and configure module-level permissions in one place</p>
          </div>
        </div>

        <div className="access-control-tabs" role="tablist" aria-label="Access Control Sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'users'}
            className={`ac-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('users')}
          >
            <FaUsers size={15} />
            <span>Users</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'roles'}
            className={`ac-tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('roles')}
          >
            <FaUserShield size={15} />
            <span>Roles & Permissions</span>
          </button>
        </div>
      </div>

      <div className="access-control-body">
        {activeTab === 'users' ? (
          <UserManagementPage embedded />
        ) : (
          <RoleManagementPage embedded />
        )}
      </div>
    </div>
  );
};

AccessControlPage.propTypes = {
  defaultTab: PropTypes.oneOf(['users', 'roles'])
};

export default AccessControlPage;
