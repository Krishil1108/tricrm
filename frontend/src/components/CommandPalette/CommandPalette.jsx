import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import API_BASE_URL from '../../config/api';
import axios from 'axios';
import { 
  FaSearch, FaHome, FaUsers, FaHandshake, FaBriefcase, 
  FaCog, FaChartBar, FaPlus, FaReceipt, FaUserShield, FaTimes, FaKeyboard 
} from 'react-icons/fa';
import './CommandPalette.css';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState({ clients: [], projects: [], associates: [] });
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { hasModuleAccess, isAdmin, token } = useAuth();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Live search debounced
  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setSearchResults({ clients: [], projects: [], associates: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/search`, {
          params: { q: query },
          headers: { Authorization: `Bearer ${token}` }
        });
        setSearchResults({
          clients: response.data.data?.clients || [],
          projects: response.data.data?.projects || [],
          associates: response.data.data?.associates || []
        });
      } catch (err) {
        console.error('Command Palette Search Error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen, token]);

  // Command items
  const pages = [
    { name: 'Home Dashboard', path: '/home', icon: <FaHome />, module: 'home' },
    { name: 'Client Directory', path: '/clients', icon: <FaUsers />, module: 'clients' },
    { name: 'Associates Directory', path: '/associates', icon: <FaHandshake />, module: 'associates' },
    { name: 'Projects Master Table', path: '/projects', icon: <FaBriefcase />, module: 'finance' },
    { name: 'Finance Overview', path: '/finance', icon: <FaBriefcase />, module: 'finance_dashboard' },
    { name: 'Expenses Log', path: '/expenses', icon: <FaReceipt />, module: 'expenses' },
    { name: 'Analytics & Metrics', path: '/analytics', icon: <FaChartBar />, module: 'analytics' },
    { name: 'System Settings', path: '/settings', icon: <FaCog />, module: 'settings' },
    { name: 'User Management', path: '/user-management', icon: <FaUsers />, adminOnly: true },
    { name: 'Role Management', path: '/role-management', icon: <FaUserShield />, adminOnly: true }
  ].filter(p => p.adminOnly ? isAdmin() : hasModuleAccess(p.module || 'home'));

  // Quick action items
  const actions = [
    { name: 'Add New Client', action: () => navigate('/clients', { state: { openAddModal: true } }), icon: <FaPlus /> },
    { name: 'Add New Project', action: () => navigate('/projects', { state: { openAddModal: true } }), icon: <FaPlus /> },
    { name: 'Log Expense Entry', action: () => navigate('/expenses', { state: { openAddModal: true } }), icon: <FaReceipt /> }
  ];

  const filteredPages = pages.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  const filteredActions = actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));

  // Flattened items list for keyboard navigation
  const allNavItems = [
    ...filteredPages.map(p => ({ type: 'page', ...p })),
    ...filteredActions.map(a => ({ type: 'action', ...a })),
    ...searchResults.clients.map(c => ({ type: 'client', name: `Client: ${c.name}`, path: '/clients', id: c._id })),
    ...searchResults.projects.map(pr => ({ type: 'project', name: `Project: ${pr.projectName}`, path: '/projects', id: pr._id })),
    ...searchResults.associates.map(as => ({ type: 'associate', name: `Associate: ${as.name}`, path: '/associates', id: as._id }))
  ];

  const handleSelectItem = (item) => {
    setIsOpen(false);
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handleKeyDownModal = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(allNavItems.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allNavItems.length) % Math.max(allNavItems.length, 1));
    } else if (e.key === 'Enter' && allNavItems[selectedIndex]) {
      e.preventDefault();
      handleSelectItem(allNavItems[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={() => setIsOpen(false)}>
      <div 
        className="command-palette-modal" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDownModal}
      >
        <div className="command-palette-header">
          <FaSearch className="palette-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="command-palette-input"
            placeholder="Type a command or search clients, projects, actions... (Esc to exit)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          {isSearching ? (
            <div className="palette-spinner" />
          ) : (
            <span className="kbd-badge">ESC</span>
          )}
        </div>

        <div className="command-palette-body">
          {allNavItems.length === 0 ? (
            <div className="palette-empty">No matching commands or records found</div>
          ) : (
            allNavItems.map((item, index) => (
              <div
                key={`${item.type}-${item.name}-${index}`}
                className={`palette-item ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="palette-item-icon">
                  {item.icon || <FaSearch />}
                </div>
                <div className="palette-item-text">{item.name}</div>
                <div className="palette-item-type">{item.type}</div>
              </div>
            ))
          )}
        </div>

        <div className="command-palette-footer">
          <span><kbd className="kbd-mini">↑</kbd> <kbd className="kbd-mini">↓</kbd> Navigate</span>
          <span><kbd className="kbd-mini">↵</kbd> Select</span>
          <span><kbd className="kbd-mini">Ctrl + K</kbd> Toggle</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
