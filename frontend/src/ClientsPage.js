import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ClientService from './services/ClientService';
import ExcelExportService from './services/ExcelExportService';
import ExcelImport from './components/ExcelImport';
import { dataEventManager, DATA_TYPES } from './services/dataEventManager';
import Watermark from './components/Watermark';
import './PageContent.css';

const ClientsPage = () => {
  const { canCreate, canEdit, canDelete, canExport, canImport, canDuplicate, canViewStats } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    notes: ''
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClients();

    // Subscribe to client data updates
    const unsubscribe = dataEventManager.subscribe(DATA_TYPES.CLIENTS, () => {
      loadClients(); // Refresh client list when new client is added
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setDropdownOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      const clientsData = await ClientService.getAllClients();
      // Ensure clientsData is always an array
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      setError('Failed to load clients. Please try again.');
      console.error('Error loading clients:', error);
      // Set clients to empty array on error
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await ClientService.deleteClient(clientId);
        setClients(Array.isArray(clients) ? clients.filter(client => client._id !== clientId) : []);
      } catch (error) {
        setError('Failed to delete client. Please try again.');
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    
    setClientData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      company: client.company || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      zipCode: client.zipCode || '',
      country: client.country || 'India',
      notes: client.notes || ''
    });
    setShowEditPopup(true);
    setError('');
  };

  const handleView = (client) => {
    setViewingClient(client);
    setShowViewPopup(true);
  };

  const handleStatusChange = async (clientId, newStatus) => {
    try {
      const updatedClient = await ClientService.updateClient(clientId, { status: newStatus });
      setClients(Array.isArray(clients) ? clients.map(client =>
        client._id === clientId ? updatedClient : client
      ) : []);
    } catch (error) {
      setError('Failed to update client status. Please try again.');
      console.error('Error updating client status:', error);
    }
  };

  const handleViewProjects = (client) => {
    navigate(`/clients/${client._id}/projects`, { 
      state: { clientName: client.name, clientCompany: client.company } 
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Create full address from components
      const fullAddress = `${clientData.address}, ${clientData.city}, ${clientData.state} ${clientData.zipCode}`.replace(/^,\s*|,\s*$/g, '');
      
      const newClientData = {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        company: clientData.company,
        address: fullAddress,
        notes: clientData.notes,
        status: 'Active'
      };
      
      const newClient = await ClientService.createClient(newClientData);
      setClients([...clients, newClient]);
      
      // Reset form and close popup
      setClientData({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        notes: ''
      });
      
      setShowAddPopup(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setError('Failed to add client. Please try again.');
      console.error('Error creating client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const updatedClientData = {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        company: clientData.company,
        address: clientData.address,
        city: clientData.city,
        state: clientData.state,
        zipCode: clientData.zipCode,
        notes: clientData.notes
      };
      
      const updatedClient = await ClientService.updateClient(editingClient._id, updatedClientData);
      setClients(Array.isArray(clients) ? clients.map(client => 
        client._id === editingClient._id ? updatedClient : client
      ) : []);
      
      // Reset form and close popup
      setClientData({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        notes: ''
      });
      
      setShowEditPopup(false);
      setEditingClient(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setError('Failed to update client. Please try again.');
      console.error('Error updating client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowAddPopup(false);
    setShowEditPopup(false);
    setShowViewPopup(false);
    setEditingClient(null);
    setViewingClient(null);
    setClientData({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      notes: ''
    });
  };

  // Filter and sort clients - ensure clients is always an array
  const filteredClients = (Array.isArray(clients) ? clients : [])
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'email':
          return a.email.localeCompare(b.email);
        case 'company':
          return (a.company || '').localeCompare(b.company || '');
        case 'date':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

  // Pagination calculations
  const totalItems = filteredClients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = filteredClients.slice(startIndex, endIndex);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortBy]);

  // Import handlers
  const handleImportSuccess = (results) => {
    setShowImportModal(false);
    setCurrentPage(1); // Reset to first page to show new data
    loadClients(); // Refresh the client list
    
    // Trigger data event to refresh other components
    try {
      if (dataEventManager && typeof dataEventManager.emit === 'function') {
        dataEventManager.emit(DATA_TYPES.CLIENTS);
      }
    } catch (error) {
      console.warn('Data event manager emit failed, using fallback:', error);
      // Fallback: manual refresh without event system
      window.dispatchEvent(new CustomEvent('clientAdded'));
      window.dispatchEvent(new CustomEvent('activityUpdated'));
    }
    
    if (results.summary) {
      const { successful, failed, duplicates } = results.summary;
      let message = `Import completed!\n`;
      message += `✓ ${successful} clients added successfully\n`;
      if (duplicates > 0) message += `⚠ ${duplicates} duplicates skipped\n`;
      if (failed > 0) message += `✗ ${failed} failed to import`;
      
      alert(message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Excel export function
  const handleExportToExcel = () => {
    const filters = {
      searchTerm,
      filterStatus,
      sortBy
    };

    const filename = ExcelExportService.generateFilename('clients', filters);
    const result = ExcelExportService.exportClientsToExcel(filteredClients, filters, filename);
    
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="page-container project-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Clients</h1>
          <p>Manage and view all your clients</p>
        </div>
        <div className="header-actions">
          {canCreate('clients') && (
            <button 
              className="add-client-btn"
              onClick={() => setShowAddPopup(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add New Client
            </button>
          )}
          {canExport('clients') && (
            <button 
              className="export-btn enhanced-export-btn"
              onClick={handleExportToExcel}
              title="Export client data to Excel spreadsheet"
            >
              <div className="btn-icon">
                <i className="bi bi-download"></i>
              </div>
              <div className="btn-content">
                <span className="btn-text">Export to Excel</span>
                <span className="btn-count">({filteredClients.length} clients)</span>
              </div>
            </button>
          )}
          {canImport('clients') && (
            <button 
              className="import-btn"
              onClick={() => setShowImportModal(true)}
              title="Import clients from Excel file"
            >
              <div className="btn-icon">
                <i className="bi bi-upload"></i>
              </div>
              <span className="btn-text">Import from Excel</span>
            </button>
          )}
        </div>
      </div>
      
      <div className="page-content">
        {/* Success Message */}
        {saved && (
          <div className="success-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Client added successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-message">
            <div className="loading-spinner"></div>
            Loading clients...
          </div>
        )}

        {/* Client Statistics - Role-based visibility */}
        {canViewStats('clients') && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Clients</div>
              <div className="stat-value">{Array.isArray(clients) ? clients.length : 0}</div>
            </div>
            <div className="stat-card success">
              <div className="stat-label">Active Clients</div>
              <div className="stat-value">{Array.isArray(clients) ? clients.filter(c => c.status === 'Active').length : 0}</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{Array.isArray(clients) ? clients.filter(c => c.status === 'Pending').length : 0}</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-label">Inactive Clients</div>
              <div className="stat-value">{Array.isArray(clients) ? clients.filter(c => c.status === 'Inactive').length : 0}</div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="finance-filters" style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '15px',
          flexWrap: 'nowrap',
          alignItems: 'flex-start',
          padding: '20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
          marginBottom: '20px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{
            flex: '1',
            maxWidth: '400px'
          }}>
            <input
              type="text"
              className="filter-input"
              placeholder="Search clients by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px 16px', 
                border: '2px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ 
                padding: '12px 16px', 
                border: '2px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                minWidth: '140px',
                outline: 'none'
              }}
            >
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="company">Sort by Company</option>
              <option value="date">Sort by Date Added</option>
            </select>

            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ 
                padding: '12px 16px', 
                border: '2px solid #e5e7eb', 
                borderRadius: '8px',
                fontSize: '14px',
                background: 'white',
                minWidth: '140px',
                outline: 'none'
              }}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Client Table */}
        <div className="client-table-container">
          {filteredClients.length === 0 ? (
            <div className="no-clients">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <h3>No clients found</h3>
              <p>Start by adding your first client using the "Add New Client" button.</p>
            </div>
          ) : (
            <table className="client-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Added Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentClients.map(client => (
                  <tr key={client._id}>
                    <td>
                      <div className="client-name">
                        <div className="client-avatar">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{client.name}</span>
                      </div>
                    </td>
                    <td>{client.email}</td>
                    <td>{client.company || '-'}</td>
                    <td>{client.phone || '-'}</td>
                    <td>
                      <select
                        value={client.status}
                        onChange={(e) => handleStatusChange(client._id, e.target.value)}
                        className={`status-select ${client.status.toLowerCase()}`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>
                    <td>{formatDate(client.createdAt)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons">
                        {canEdit('clients') && (
                          <button
                            className="edit-btn action-btn"
                            onClick={() => handleEdit(client)}
                            title="Edit Client"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                            Edit
                          </button>
                        )}
                        {canDelete('clients') && (
                          <button
                            className="delete-btn action-btn"
                            onClick={() => handleDelete(client._id)}
                            title="Delete Client"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                            Delete
                          </button>
                        )}
                        <div className="dropdown-container" style={{ position: 'relative', display: 'inline-block' }}>
                          <button 
                            className="action-btn btn-more"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDropdownOpenId(dropdownOpenId === client._id ? null : client._id);
                            }}
                            style={{
                              background: 'transparent',
                              color: '#000',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '16px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ⋮
                          </button>
                          {dropdownOpenId === client._id && (
                            <div 
                              className="dropdown-menu"
                              style={{
                                position: 'fixed',
                                background: 'white',
                                border: '1px solid #dee2e6',
                                borderRadius: '6px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                zIndex: 9999,
                                minWidth: '160px'
                              }}
                              ref={(el) => {
                                if (el && dropdownOpenId === client._id) {
                                  setTimeout(() => {
                                    const button = el.previousElementSibling;
                                    if (button) {
                                      const rect = button.getBoundingClientRect();
                                      const dropdownRect = el.getBoundingClientRect();
                                      const viewportHeight = window.innerHeight;
                                      const viewportWidth = window.innerWidth;
                                      
                                      let top = rect.bottom;
                                      let left = rect.right - dropdownRect.width;
                                      
                                      // Calculate available space
                                      const spaceBelow = viewportHeight - rect.bottom - 20;
                                      const spaceAbove = rect.top - 20;
                                      
                                      // Position above if in bottom half and more space above
                                      if (rect.bottom > viewportHeight / 2) {
                                        if (spaceAbove >= dropdownRect.height || spaceAbove > spaceBelow) {
                                          top = rect.top - dropdownRect.height;
                                        }
                                      } else {
                                        if (spaceBelow < dropdownRect.height && spaceAbove >= dropdownRect.height) {
                                          top = rect.top - dropdownRect.height;
                                        }
                                      }
                                      
                                      // Ensure within viewport bounds
                                      if (top < 5) top = 5;
                                      else if (top + dropdownRect.height > viewportHeight - 5) {
                                        top = Math.max(5, viewportHeight - dropdownRect.height - 5);
                                      }
                                      
                                      if (left < 10) left = rect.left;
                                      else if (left + dropdownRect.width > viewportWidth - 10) {
                                        left = viewportWidth - dropdownRect.width - 10;
                                      }
                                      
                                      el.style.top = `${top}px`;
                                      el.style.left = `${left}px`;
                                    }
                                  }, 0);
                                }
                              }}
                            >
                              <button 
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleView(client);
                                  setDropdownOpenId(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 16px',
                                  border: 'none',
                                  background: 'transparent',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: '#495057',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                </svg>
                                View Details
                              </button>
                              <button 
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewProjects(client);
                                  setDropdownOpenId(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 16px',
                                  border: 'none',
                                  background: 'transparent',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: '#495057',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  borderTop: '1px solid #f8f9fa'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                                </svg>
                                View Projects
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination Controls */}
          {filteredClients.length > 0 && totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} clients
              </div>
              <div className="pagination-controls">
                <button 
                  className="pagination-btn"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                
                <div className="pagination-numbers">
                  {(() => {
                    const pages = [];
                    const maxVisiblePages = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                    
                    if (endPage - startPage < maxVisiblePages - 1) {
                      startPage = Math.max(1, endPage - maxVisiblePages + 1);
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          className={`pagination-number ${currentPage === i ? 'active' : ''}`}
                          onClick={() => handlePageChange(i)}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Popup */}
      {showAddPopup && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h2>Add New Client</h2>
              <button className="close-btn" onClick={handleClosePopup}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="popup-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={clientData.name}
                      onChange={handleInputChange}
                      placeholder="Enter client's full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={clientData.email}
                      onChange={handleInputChange}
                      placeholder="client@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={clientData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="company">Company</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={clientData.company}
                      onChange={handleInputChange}
                      placeholder="Company name"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Address Information</h3>
                <div className="form-group">
                  <label htmlFor="address">Street Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={clientData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={clientData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={clientData.state}
                      onChange={handleInputChange}
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={clientData.zipCode}
                      onChange={handleInputChange}
                      placeholder="10001"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="country">Country</label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={clientData.country}
                      onChange={handleInputChange}
                      placeholder="India"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={clientData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes about the client..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="popup-actions">
                <button type="button" onClick={handleClosePopup} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Popup */}
      {showEditPopup && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h2>Edit Client</h2>
              <button className="close-btn" onClick={handleClosePopup}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="popup-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-name">Full Name *</label>
                    <input
                      type="text"
                      id="edit-name"
                      value={clientData.name}
                      onChange={(e) => setClientData({...clientData, name: e.target.value})}
                      placeholder="Enter client's full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-email">Email Address *</label>
                    <input
                      type="email"
                      id="edit-email"
                      value={clientData.email}
                      onChange={(e) => setClientData({...clientData, email: e.target.value})}
                      placeholder="client@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-phone">Phone Number</label>
                    <input
                      type="tel"
                      id="edit-phone"
                      value={clientData.phone}
                      onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-company">Company</label>
                    <input
                      type="text"
                      id="edit-company"
                      value={clientData.company}
                      onChange={(e) => setClientData({...clientData, company: e.target.value})}
                      placeholder="Company name"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Address Information</h3>
                <div className="form-group">
                  <label htmlFor="edit-address">Street Address</label>
                  <input
                    type="text"
                    id="edit-address"
                    value={clientData.address}
                    onChange={(e) => setClientData({...clientData, address: e.target.value})}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-city">City</label>
                    <input
                      type="text"
                      id="edit-city"
                      value={clientData.city}
                      onChange={(e) => setClientData({...clientData, city: e.target.value})}
                      placeholder="New York"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-state">State</label>
                    <input
                      type="text"
                      id="edit-state"
                      value={clientData.state}
                      onChange={(e) => setClientData({...clientData, state: e.target.value})}
                      placeholder="NY"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-zipCode">ZIP Code</label>
                    <input
                      type="text"
                      id="edit-zipCode"
                      value={clientData.zipCode}
                      onChange={(e) => setClientData({...clientData, zipCode: e.target.value})}
                      placeholder="10001"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-country">Country</label>
                    <input
                      type="text"
                      id="edit-country"
                      value={clientData.country}
                      onChange={(e) => setClientData({...clientData, country: e.target.value})}
                      placeholder="India"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-group">
                  <label htmlFor="edit-notes">Notes</label>
                  <textarea
                    id="edit-notes"
                    value={clientData.notes}
                    onChange={(e) => setClientData({...clientData, notes: e.target.value})}
                    placeholder="Any additional notes about the client..."
                    rows="3"
                  />
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="popup-actions">
                <button type="button" onClick={handleClosePopup} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: '8px'}}>
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  {loading ? 'Updating...' : 'Update Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Client Popup */}
      {showViewPopup && viewingClient && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h2>Client Details</h2>
              <button className="close-btn" onClick={handleClosePopup}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>

            <div className="popup-form view-form">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name</label>
                    <div className="form-value">{viewingClient.name}</div>
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <div className="form-value">{viewingClient.email}</div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <div className="form-value">{viewingClient.phone || '-'}</div>
                  </div>
                  <div className="form-group">
                    <label>Company</label>
                    <div className="form-value">{viewingClient.company || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Address Information</h3>
                <div className="form-group">
                  <label>Street Address</label>
                  <div className="form-value">{viewingClient.address || '-'}</div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <div className="form-value">{viewingClient.city || '-'}</div>
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <div className="form-value">{viewingClient.state || '-'}</div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <div className="form-value">{viewingClient.zipCode || '-'}</div>
                  </div>
                  <div className="form-group">
                    <label>Country</label>
                    <div className="form-value">{viewingClient.country || '-'}</div>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-group">
                  <label>Status</label>
                  <div className="form-value">
                    <span className={`status-badge ${viewingClient.status?.toLowerCase()}`}>
                      {viewingClient.status}
                    </span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Added Date</label>
                  <div className="form-value">{formatDate(viewingClient.createdAt)}</div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <div className="form-value">{viewingClient.notes || 'No notes available'}</div>
                </div>
              </div>

              <div className="popup-actions">
                <button type="button" onClick={handleClosePopup} className="cancel-btn">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImportModal && (
        <ExcelImport
          type="clients"
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}
      
      {/* Watermark */}
      <Watermark />
    </div>
  );
};

export default ClientsPage;