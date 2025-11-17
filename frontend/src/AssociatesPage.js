import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AssociateService from './services/AssociateService';
import ExcelExportService from './services/ExcelExportService';
import ExcelImport from './components/ExcelImport';
import { dataEventManager, DATA_TYPES } from './services/dataEventManager';
import Watermark from './components/Watermark';
import './PageContent.css';

const AssociatesPage = () => {
    const { 
    canAddNewAssociate,
    canEditAssociate, 
    canDeleteAssociate, 
    canExportAssociates, 
    canImportAssociates,
    canViewAssociateSummaryCards
  } = useAuth();
  const navigate = useNavigate();
  const [associates, setAssociates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingAssociate, setEditingAssociate] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  
  const [associateData, setAssociateData] = useState({
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
    loadAssociates();

    // Subscribe to associate data updates
    const unsubscribe = dataEventManager.subscribe(DATA_TYPES.ASSOCIATES, () => {
      loadAssociates(); // Refresh associate list when new associate is added
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const loadAssociates = async () => {
    try {
      setLoading(true);
      setError('');
      const associatesData = await AssociateService.getAllAssociates();
      // Ensure associatesData is always an array
      setAssociates(Array.isArray(associatesData) ? associatesData : []);
    } catch (error) {
      setError('Failed to load associates. Please try again.');
      console.error('Error loading associates:', error);
      // Set associates to empty array on error
      setAssociates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (associateId) => {
    if (window.confirm('Are you sure you want to delete this associate?')) {
      try {
        await AssociateService.deleteAssociate(associateId);
        setAssociates(Array.isArray(associates) ? associates.filter(associate => associate._id !== associateId) : []);
      } catch (error) {
        setError('Failed to delete associate. Please try again.');
        console.error('Error deleting associate:', error);
      }
    }
  };

  const handleEdit = (associate) => {
    setEditingAssociate(associate);
    
    setAssociateData({
      name: associate.name || '',
      email: associate.email || '',
      phone: associate.phone || '',
      company: associate.company || '',
      address: associate.address || '',
      city: associate.city || '',
      state: associate.state || '',
      zipCode: associate.zipCode || '',
      notes: associate.notes || ''
    });
    setShowEditPopup(true);
    setError('');
  };

  const handleStatusChange = async (associateId, newStatus) => {
    try {
      const updatedAssociate = await AssociateService.updateAssociate(associateId, { status: newStatus });
      setAssociates(Array.isArray(associates) ? associates.map(associate =>
        associate._id === associateId ? updatedAssociate : associate
      ) : []);
    } catch (error) {
      setError('Failed to update associate status. Please try again.');
      console.error('Error updating associate status:', error);
    }
  };

  const handleViewProjects = (associate) => {
    navigate(`/associates/${associate._id}/projects`, { 
      state: { associateName: associate.name, associateCompany: associate.company } 
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAssociateData(prev => ({
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
      const fullAddress = `${associateData.address}, ${associateData.city}, ${associateData.state} ${associateData.zipCode}`.replace(/^,\\s*|,\\s*$/g, '');
      
      const newAssociateData = {
        name: associateData.name,
        email: associateData.email,
        phone: associateData.phone,
        company: associateData.company,
        address: fullAddress,
        notes: associateData.notes,
        status: 'Active'
      };
      
      const newAssociate = await AssociateService.createAssociate(newAssociateData);
      setAssociates([...associates, newAssociate]);
      
      // Reset form and close popup
      setAssociateData({
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
      setError('Failed to add associate. Please try again.');
      console.error('Error creating associate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const updatedAssociateData = {
        name: associateData.name,
        email: associateData.email,
        phone: associateData.phone,
        company: associateData.company,
        address: associateData.address,
        city: associateData.city,
        state: associateData.state,
        zipCode: associateData.zipCode,
        notes: associateData.notes
      };
      
      const updatedAssociate = await AssociateService.updateAssociate(editingAssociate._id, updatedAssociateData);
      setAssociates(Array.isArray(associates) ? associates.map(associate => 
        associate._id === editingAssociate._id ? updatedAssociate : associate
      ) : []);
      
      // Reset form and close popup
      setAssociateData({
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
      setEditingAssociate(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setError('Failed to update associate. Please try again.');
      console.error('Error updating associate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowAddPopup(false);
    setShowEditPopup(false);
    setEditingAssociate(null);
    setAssociateData({
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

  // Filter and sort associates - ensure associates is always an array
  const filteredAssociates = (Array.isArray(associates) ? associates : [])
    .filter(associate => {
      const matchesSearch = associate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           associate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (associate.company && associate.company.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || associate.status === filterStatus;
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
  const totalItems = filteredAssociates.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssociates = filteredAssociates.slice(startIndex, endIndex);

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
    loadAssociates(); // Refresh the associate list
    
    // Trigger data event to refresh other components
    try {
      if (dataEventManager && typeof dataEventManager.emit === 'function') {
        dataEventManager.emit(DATA_TYPES.ASSOCIATES);
      }
    } catch (error) {
      console.warn('Data event manager emit failed, using fallback:', error);
      // Fallback: manual refresh without event system
      window.dispatchEvent(new CustomEvent('associateAdded'));
      window.dispatchEvent(new CustomEvent('activityUpdated'));
    }
    
    if (results.summary) {
      const { successful, failed, duplicates } = results.summary;
      let message = `Import completed!\\n`;
      message += `✓ ${successful} associates added successfully\\n`;
      if (duplicates > 0) message += `⚠ ${duplicates} duplicates skipped\\n`;
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

    const filename = ExcelExportService.generateFilename('associates', filters);
    const result = ExcelExportService.exportAssociatesToExcel(filteredAssociates, filters, filename);
    
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
          <h1>Associates</h1>
          <p>Manage and view all your associates</p>
        </div>
        <div className="header-actions">
          {canAddNewAssociate() && (
            <button 
              className="add-client-btn"
              onClick={() => setShowAddPopup(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              Add New Associate
            </button>
          )}
          {canExportAssociates() && (
            <button 
              className="export-btn enhanced-export-btn"
              onClick={handleExportToExcel}
              title="Export associate data to Excel spreadsheet"
            >
              <div className="btn-icon">
                <i className="bi bi-download"></i>
              </div>
              <div className="btn-content">
                <span className="btn-text">Export to Excel</span>
                <span className="btn-count">({filteredAssociates.length} associates)</span>
              </div>
            </button>
          )}
          {canImportAssociates() && (
            <button 
              className="import-btn"
              onClick={() => setShowImportModal(true)}
              title="Import associates from Excel file"
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
            Associate added successfully!
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
            Loading associates...
          </div>
        )}

        {/* Associate Statistics - Role-based visibility */}
        {canViewAssociateSummaryCards() && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Associates</div>
              <div className="stat-value">{Array.isArray(associates) ? associates.length : 0}</div>
            </div>
            <div className="stat-card success">
              <div className="stat-label">Active Associates</div>
              <div className="stat-value">{Array.isArray(associates) ? associates.filter(a => a.status === 'Active').length : 0}</div>
            </div>
            <div className="stat-card warning">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{Array.isArray(associates) ? associates.filter(a => a.status === 'Pending').length : 0}</div>
            </div>
            <div className="stat-card danger">
              <div className="stat-label">Inactive Associates</div>
              <div className="stat-value">{Array.isArray(associates) ? associates.filter(a => a.status === 'Inactive').length : 0}</div>
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
              placeholder="Search associates by name, email, or company..."
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

        {/* Associate Table */}
        <div className="client-table-container">
          {filteredAssociates.length === 0 ? (
            <div className="no-clients">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <h3>No associates found</h3>
              <p>Start by adding your first associate using the "Add New Associate" button.</p>
            </div>
          ) : (
            <table className="client-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Projects</th>
                  <th>Status</th>
                  <th>Added Date</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentAssociates.map(associate => (
                  <tr key={associate._id}>
                    <td>
                      <div className="client-name">
                        <div className="client-avatar">
                          {associate.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{associate.name}</span>
                      </div>
                    </td>
                    <td>{associate.email}</td>
                    <td>{associate.company || '-'}</td>
                    <td>{associate.phone || '-'}</td>
                    <td>
                      <span className="project-count-badge" title={`${associate.projectCount || 0} project(s)`}>
                        {associate.projectCount || 0}
                      </span>
                    </td>
                    <td>
                      <select
                        value={associate.status}
                        onChange={(e) => handleStatusChange(associate._id, e.target.value)}
                        className={`status-select ${associate.status.toLowerCase()}`}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </td>
                    <td>{formatDate(associate.createdAt)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="action-buttons">
                        <button
                          className="view-projects-btn action-btn"
                          onClick={() => handleViewProjects(associate)}
                          title="View Projects"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                          </svg>
                          Projects
                        </button>
                        {canEditAssociate() && (
                          <button
                            className="edit-btn action-btn"
                            onClick={() => handleEdit(associate)}
                            title="Edit Associate"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                            </svg>
                          </button>
                        )}
                        {canDeleteAssociate() && (
                          <button
                            className="delete-btn action-btn"
                            onClick={() => handleDelete(associate._id)}
                            title="Delete Associate"
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
          {filteredAssociates.length > 0 && totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} associates
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

      {/* Add Associate Popup */}
      {showAddPopup && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h2>Add New Associate</h2>
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
                      value={associateData.name}
                      onChange={handleInputChange}
                      placeholder="Enter associate's full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={associateData.email}
                      onChange={handleInputChange}
                      placeholder="associate@example.com"
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
                      value={associateData.phone}
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
                      value={associateData.company}
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
                    value={associateData.address}
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
                      value={associateData.city}
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
                      value={associateData.state}
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
                      value={associateData.zipCode}
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
                    value={associateData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes about the associate..."
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
                  Add Associate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Associate Popup */}
      {showEditPopup && (
        <div className="popup-overlay">
          <div className="popup-container">
            <div className="popup-header">
              <h2>Edit Associate</h2>
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
                      value={associateData.name}
                      onChange={(e) => setAssociateData({...associateData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-email">Email *</label>
                    <input
                      type="email"
                      id="edit-email"
                      value={associateData.email}
                      onChange={(e) => setAssociateData({...associateData, email: e.target.value})}
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
                      value={associateData.phone}
                      onChange={(e) => setAssociateData({...associateData, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-company">Company</label>
                    <input
                      type="text"
                      id="edit-company"
                      value={associateData.company}
                      onChange={(e) => setAssociateData({...associateData, company: e.target.value})}
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
                      value={associateData.address}
                      onChange={(e) => setAssociateData({...associateData, address: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-city">City</label>
                    <input
                      type="text"
                      id="edit-city"
                      value={associateData.city}
                      onChange={(e) => setAssociateData({...associateData, city: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-state">State</label>
                    <input
                      type="text"
                      id="edit-state"
                      value={associateData.state}
                      onChange={(e) => setAssociateData({...associateData, state: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-zipCode">ZIP Code</label>
                    <input
                      type="text"
                      id="edit-zipCode"
                      value={associateData.zipCode}
                      onChange={(e) => setAssociateData({...associateData, zipCode: e.target.value})}
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
                      value={associateData.notes}
                      onChange={(e) => setAssociateData({...associateData, notes: e.target.value})}
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
                  {loading ? 'Updating...' : 'Update Associate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImportModal && (
        <ExcelImport
          type="associates"
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}
      
      {/* Watermark */}
      <Watermark />
    </div>
  );
};

export default AssociatesPage;