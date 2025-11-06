import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import ClientService from './services/ClientService';
import ExcelExportService from './services/ExcelExportService';
import ExcelImport from './components/ExcelImport';
import { dataEventManager, DATA_TYPES } from './services/dataEventManager';
import './PageContent.css';

const ClientsPage = () => {
  const { canCreate, canEdit, canDelete, canExport, canImport, canDuplicate } = useAuth();
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  
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

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');
      const clientsData = await ClientService.getAllClients();
      setClients(clientsData);
    } catch (error) {
      setError('Failed to load clients. Please try again.');
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client?')) {
      try {
        await ClientService.deleteClient(clientId);
        setClients(clients.filter(client => client._id !== clientId));
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
      notes: client.notes || ''
    });
    setShowEditPopup(true);
    setError('');
  };

  const handleStatusChange = async (clientId, newStatus) => {
    try {
      const updatedClient = await ClientService.updateClient(clientId, { status: newStatus });
      setClients(clients.map(client =>
        client._id === clientId ? updatedClient : client
      ));
    } catch (error) {
      setError('Failed to update client status. Please try again.');
      console.error('Error updating client status:', error);
    }
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
      
      // Create full address from components
      const fullAddress = `${clientData.address}, ${clientData.city}, ${clientData.state} ${clientData.zipCode}`.replace(/^,\s*|,\s*$/g, '');
      
      const updatedClientData = {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        company: clientData.company,
        address: fullAddress,
        notes: clientData.notes
      };
      
      const updatedClient = await ClientService.updateClient(editingClient._id, updatedClientData);
      setClients(clients.map(client => 
        client._id === editingClient._id ? updatedClient : client
      ));
      
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
    setEditingClient(null);
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
  };

  // Filter and sort clients
  const filteredClients = clients
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
    <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <h1>Clients</h1>
          <p>Manage and view all your clients</p>
        </div>
        <div className="header-actions">
          {canExport('clients') && (
            <button 
              className="export-btn enhanced-export-btn"
              onClick={handleExportToExcel}
              title="Export client data to Excel spreadsheet"
            >
              <div className="btn-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  <path d="M9,14H7V16H9V14M11,14H13V16H11V14M15,14H17V16H15V14M9,10H7V12H9V10M11,10H13V12H11V10M15,10H17V12H15V10" opacity="0.7"/>
                </svg>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  <path d="M12,11L8,15H10.5V19H13.5V15H16L12,11Z" opacity="0.7"/>
                </svg>
              </div>
              <span className="btn-text">Import from Excel</span>
            </button>
          )}
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

        {/* Controls */}
        <div className="client-controls">
          <div className="search-section">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search clients by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-section">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="company">Sort by Company</option>
              <option value="date">Sort by Date Added</option>
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Client Statistics */}
        <div className="client-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.002 3.002 0 0 0 17.06 7H16.94c-.4 0-.82.08-1.19.22L13.9 8.5A2.001 2.001 0 0 0 15.69 11L17 10.35V22h3z"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{clients.length}</div>
              <div className="stat-label">Total Clients</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon active">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{clients.filter(c => c.status === 'Active').length}</div>
              <div className="stat-label">Active Clients</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="stat-info">
              <div className="stat-number">{clients.filter(c => c.status === 'Pending').length}</div>
              <div className="stat-label">Pending</div>
            </div>
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
                  <th>Actions</th>
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
                    <td>
                      <div className="action-buttons">
                        {canEdit('clients') && (
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(client)}
                            title="Edit Client"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                          </button>
                        )}
                        {canDelete('clients') && (
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(client._id)}
                            title="Delete Client"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                            </svg>
                          </button>
                        )}
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
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-email">Email *</label>
                    <input
                      type="email"
                      id="edit-email"
                      value={clientData.email}
                      onChange={(e) => setClientData({...clientData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-phone">Phone</label>
                    <input
                      type="tel"
                      id="edit-phone"
                      value={clientData.phone}
                      onChange={(e) => setClientData({...clientData, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-company">Company</label>
                    <input
                      type="text"
                      id="edit-company"
                      value={clientData.company}
                      onChange={(e) => setClientData({...clientData, company: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Address Information</h3>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="edit-address">Street Address</label>
                    <input
                      type="text"
                      id="edit-address"
                      value={clientData.address}
                      onChange={(e) => setClientData({...clientData, address: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-city">City</label>
                    <input
                      type="text"
                      id="edit-city"
                      value={clientData.city}
                      onChange={(e) => setClientData({...clientData, city: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-state">State</label>
                    <input
                      type="text"
                      id="edit-state"
                      value={clientData.state}
                      onChange={(e) => setClientData({...clientData, state: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-zipCode">ZIP Code</label>
                    <input
                      type="text"
                      id="edit-zipCode"
                      value={clientData.zipCode}
                      onChange={(e) => setClientData({...clientData, zipCode: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="edit-notes">Notes</label>
                    <textarea
                      id="edit-notes"
                      rows="3"
                      value={clientData.notes}
                      onChange={(e) => setClientData({...clientData, notes: e.target.value})}
                    ></textarea>
                  </div>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleClosePopup}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Client'}
                </button>
              </div>
            </form>
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
    </div>
  );
};

export default ClientsPage;