import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus, FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import './TopBar.css';

const ROUTE_LABELS = {
  '/home': 'Home',
  '/clients': 'Clients',
  '/associates': 'Associates',
  '/projects': 'Projects',
  '/finance': 'Finance Overview',
  '/expenses': 'Expenses',
  '/analytics': 'Analytics',
  '/notes': 'Notes',
  '/settings': 'Settings',
  '/access-control': 'Users & Roles',
  '/user-management': 'Users',
  '/role-management': 'Roles & Permissions'
};

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, hasModuleAccess } = useAuth();
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowNewMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (ROUTE_LABELS[path]) {
      return [{ label: 'Home', path: '/home' }, ...(path !== '/home' ? [{ label: ROUTE_LABELS[path] }] : [])];
    }
    if (/^\/clients\/[^/]+\/projects/.test(path)) {
      return [{ label: 'Home', path: '/home' }, { label: 'Clients', path: '/clients' }, { label: 'Client Projects' }];
    }
    if (/^\/associates\/[^/]+\/projects/.test(path)) {
      return [{ label: 'Home', path: '/home' }, { label: 'Associates', path: '/associates' }, { label: 'Associate Projects' }];
    }
    if (/^\/projects\/[^/]+$/.test(path)) {
      return [{ label: 'Home', path: '/home' }, { label: 'Projects', path: '/projects' }, { label: 'Project Details' }];
    }
    return [{ label: 'Home', path: '/home' }];
  };

  const breadcrumbs = getBreadcrumbs();

  const createOptions = [
    hasModuleAccess('clients') && { label: 'New Client', action: () => navigate('/clients', { state: { openAddModal: true } }) },
    hasModuleAccess('finance') && { label: 'New Project', action: () => navigate('/projects', { state: { openAddModal: true } }) },
    hasModuleAccess('expenses') && { label: 'Log Expense', action: () => navigate('/expenses', { state: { openAddModal: true } }) },
    { label: 'Quick Note', action: () => navigate('/notes', { state: { openAddModal: true } }) }
  ].filter(Boolean);

  return (
    <header className="app-topbar">
      <nav className="topbar-breadcrumbs" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="topbar-crumb-sep">/</span>}
            {crumb.path && idx < breadcrumbs.length - 1 ? (
              <Link to={crumb.path} className="topbar-crumb-link">{crumb.label}</Link>
            ) : (
              <span className="topbar-crumb-current">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      <div className="topbar-actions">
        <button
          type="button"
          className="topbar-search-pill"
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          aria-label="Open global search"
        >
          <FaSearch size={13} />
          <span>Search anything…</span>
          <kbd>Ctrl+K</kbd>
        </button>

        <div className="topbar-new-wrap" ref={menuRef}>
          <button
            type="button"
            className="topbar-new-btn"
            onClick={() => setShowNewMenu(prev => !prev)}
            aria-expanded={showNewMenu}
            aria-label="Create new record"
          >
            <FaPlus size={12} />
            <span>New</span>
          </button>
          {showNewMenu && (
            <div className="topbar-new-dropdown" role="menu">
              {createOptions.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  role="menuitem"
                  className="topbar-dropdown-item"
                  onClick={() => {
                    setShowNewMenu(false);
                    opt.action();
                  }}
                >
                  + {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          className="topbar-icon-btn"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <FaSun size={15} /> : <FaMoon size={15} />}
        </button>

        {user && (
          <button
            type="button"
            className="topbar-user-pill"
            onClick={() => navigate('/settings')}
            title="Account & Settings"
          >
            <span className="topbar-avatar">{(user.fullName || user.username || 'U').charAt(0).toUpperCase()}</span>
            <span className="topbar-username">{user.fullName || user.username}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default TopBar;
