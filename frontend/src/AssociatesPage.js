import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AssociateService from './services/AssociateService';
import ExcelExportService from './services/ExcelExportService';
import ExcelImport from './components/ExcelImport';
import { dataEventManager, DATA_TYPES } from './services/dataEventManager';
import Watermark from './components/Watermark';
import { FaEdit, FaTrash, FaFolder } from 'react-icons/fa';
import { FiChevronDown, FiChevronUp, FiMinus } from 'react-icons/fi';
import useSortableData from './utils/useSortableData';
import './PageContent.css';
import './styles/ActionButtons.css';
import './styles/ClientsPageEnhanced.css';

const AssociatesPage = () => {
    const { 
    canAddNewAssociate,
    canEditAssociate, 
    canDeleteAssociate, 
    canExportAssociates, 
    canImportAssociates,
    canViewAssociateSummaryCards,
    canViewAssociatedProjects
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
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30);
  
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

  // Filter associates - ensure associates is always an array
  const filteredAssociates = (Array.isArray(associates) ? associates : [])
    .filter(associate => {
      const matchesSearch = associate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           associate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (associate.company && associate.company.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || associate.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

  const {
    items: sortedAssociates,
    requestSort: requestAssociateSort,
    sortConfig: associateSortConfig
  } = useSortableData(filteredAssociates, { key: 'name', direction: 'asc' });

  // Pagination calculations
  const totalItems = filteredAssociates.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssociates = sortedAssociates.slice(startIndex, endIndex);

  const handleSortChange = (value) => {
    setSortBy(value);
    if (value === 'date') {
      requestAssociateSort('createdAt', (associate) => new Date(associate.createdAt).getTime());
      return;
    }
    requestAssociateSort(value);
  };

  const renderSortIcon = (key) => {
    if (!associateSortConfig || associateSortConfig.key !== key) {
      return <FiMinus className="sort-icon" />;
    }
    return associateSortConfig.direction === 'asc'
      ? <FiChevronUp className="sort-icon" />
      : <FiChevronDown className="sort-icon" />;
  };

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
      <div className="modern-page-header">
        <div className="header-content-enhanced">
          <div className="header-title-section">
            <div className="title-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="header-icon">
                <path d="M16 17v2H2v-2s0-4 7-4 7 4 7 4m-3.5-9.5A3.5 3.5 0 1 0 9 11a3.5 3.5 0 0 0 3.5-3.5m3.44 5.5A5.32 5.32 0 0 1 18 17v2h4v-2s0-3.63-6.06-4M15 4a3.39 3.39 0 0 0-1.93.59 5 5 0 0 1 0 5.82A3.39 3.39 0 0 0 15 11a3.5 3.5 0 0 0 0-7Z"/>
              </svg>
              <h1 className="page-title-enhanced">Associate Management</h1>
            </div>
          </div>
          <div className="header-actions-enhanced">
            {canAddNewAssociate() && (
              <button 
                className="btn-primary-modern add-client-enhanced"
                onClick={() => setShowAddPopup(true)}
              >
                <div className="btn-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
                <span className="btn-text">Add Associate</span>
              </button>
            )}
            {canExportAssociates() && (
              <button 
                className="btn-secondary-modern export-enhanced"
                onClick={handleExportToExcel}
                title="Export associate data to Excel spreadsheet"
              >
                <div className="btn-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <div className="btn-content">
                  <span className="btn-text">Export</span>
                  <span className="btn-count">({filteredAssociates.length})</span>
                </div>
              </button>
            )}
            {canImportAssociates() && (
              <button 
                className="btn-tertiary-modern import-enhanced"
                onClick={() => setShowImportModal(true)}
                title="Import associates from Excel file"
              >
                <div className="btn-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L8,15H10.5V12H13.5V15H16L12,19Z"/>
                  </svg>
                </div>
                <span className="btn-text">Import</span>
              </button>
            )}
          </div>
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
            Loading associates...
          </div>
        )}

        {/* Associate Statistics - Enhanced Modern Cards */}
        {canViewAssociateSummaryCards() && (
          <div className="stats-grid-enhanced">
            <div className="stat-card-modern total">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 17v2H2v-2s0-4 7-4 7 4 7 4m-3.5-9.5A3.5 3.5 0 1 0 9 11a3.5 3.5 0 0 0 3.5-3.5m3.44 5.5A5.32 5.32 0 0 1 18 17v2h4v-2s0-3.63-6.06-4M15 4a3.39 3.39 0 0 0-1.93.59 5 5 0 0 1 0 5.82A3.39 3.39 0 0 0 15 11a3.5 3.5 0 0 0 0-7Z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{Array.isArray(associates) ? associates.length : 0}</div>
                <div className="stat-label">Total Associates</div>
              </div>
            </div>
            <div className="stat-card-modern active">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{Array.isArray(associates) ? associates.filter(a => a.status === 'Active').length : 0}</div>
                <div className="stat-label">Active Associates</div>
              </div>
            </div>
            <div className="stat-card-modern pending">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,13A1,1 0 0,1 11,12V8A1,1 0 0,1 12,7A1,1 0 0,1 13,8V12A1,1 0 0,1 12,13Z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{Array.isArray(associates) ? associates.filter(a => a.status === 'Pending').length : 0}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>
            <div className="stat-card-modern inactive">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2C17.53,2 22,6.47 22,12C22,17.53 17.53,22 12,22C6.47,22 2,17.53 2,12C2,6.47 6.47,2 12,2M15.59,7L12,10.59L8.41,7L7,8.41L10.59,12L7,15.59L8.41,17L12,13.41L15.59,17L17,15.59L13.41,12L17,8.41L15.59,7Z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{Array.isArray(associates) ? associates.filter(a => a.status === 'Inactive').length : 0}</div>
                <div className="stat-label">Inactive</div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Search and Filters Section */}
        <div className="search-filter-section-enhanced">
          <div className="search-container-modern">
            <div className="search-input-wrapper-enhanced">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="search-icon-enhanced">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <input
                type="text"
                placeholder="Search associates by name, email, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-enhanced"
              />
              {searchTerm && (
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="filter-container-modern">
            <div className="select-wrapper-enhanced">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="filter-icon">
                <path d="M14,12V19.88C14.04,20.18 13.94,20.5 13.71,20.71C13.32,21.1 12.69,21.1 12.3,20.71L10.29,18.7C10.06,18.47 9.96,18.16 10,17.87V12H9.97L4.21,4.62C3.87,4.19 3.95,3.56 4.38,3.22C4.57,3.08 4.78,3 5,3V3H19V3C19.22,3 19.43,3.08 19.62,3.22C20.05,3.56 20.13,4.19 19.79,4.62L14.03,12H14Z"/>
              </svg>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="status-filter-enhanced"
              >
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
                <option value="company">Sort by Company</option>
                <option value="date">Sort by Date Added</option>
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="select-arrow">
                <path d="M7,10L12,15L17,10H7Z"/>
              </svg>
            </div>
          </div>

          <div className="filter-container-modern">
            <div className="select-wrapper-enhanced">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="filter-icon">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
              </svg>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="status-filter-enhanced"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="select-arrow">
                <path d="M7,10L12,15L17,10H7Z"/>
              </svg>
            </div>
          </div>

          <div className="filter-actions-modern">
            <div className="results-count">
              <span className="count-text">
                Showing {filteredAssociates.length} of {Array.isArray(associates) ? associates.length : 0} associates
              </span>
            </div>
            <button 
              className="btn-refresh-modern"
              onClick={loadAssociates}
              title="Refresh associate list"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>
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
            <table className="client-table table-sticky">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center' }} aria-sort={associateSortConfig?.key === 'name' ? associateSortConfig.direction : 'none'}>
                    <button
                      type="button"
                      className={`sortable-header ${associateSortConfig?.key === 'name' ? 'active' : ''}`}
                      onClick={() => {
                        requestAssociateSort('name');
                        setSortBy('name');
                      }}
                    >
                      Name
                      {renderSortIcon('name')}
                    </button>
                  </th>
                  <th style={{ textAlign: 'center' }} aria-sort={associateSortConfig?.key === 'email' ? associateSortConfig.direction : 'none'}>
                    <button
                      type="button"
                      className={`sortable-header ${associateSortConfig?.key === 'email' ? 'active' : ''}`}
                      onClick={() => {
                        requestAssociateSort('email');
                        setSortBy('email');
                      }}
                    >
                      Email
                      {renderSortIcon('email')}
                    </button>
                  </th>
                  <th style={{ textAlign: 'center' }} aria-sort={associateSortConfig?.key === 'company' ? associateSortConfig.direction : 'none'}>
                    <button
                      type="button"
                      className={`sortable-header ${associateSortConfig?.key === 'company' ? 'active' : ''}`}
                      onClick={() => {
                        requestAssociateSort('company');
                        setSortBy('company');
                      }}
                    >
                      Company
                      {renderSortIcon('company')}
                    </button>
                  </th>
                  <th style={{ textAlign: 'center' }}>Phone</th>
                  <th style={{ textAlign: 'center' }}>Projects</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }} aria-sort={associateSortConfig?.key === 'createdAt' ? associateSortConfig.direction : 'none'}>
                    <button
                      type="button"
                      className={`sortable-header ${associateSortConfig?.key === 'createdAt' ? 'active' : ''}`}
                      onClick={() => {
                        requestAssociateSort('createdAt', (associate) => new Date(associate.createdAt).getTime());
                        setSortBy('date');
                      }}
                    >
                      Added Date
                      {renderSortIcon('createdAt')}
                    </button>
                  </th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentAssociates.map(associate => (
                  <tr
                    key={associate._id}
                    onDoubleClick={() => canViewAssociatedProjects() && handleViewProjects(associate)}
                    style={{ cursor: canViewAssociatedProjects() ? 'pointer' : 'default' }}
                    title={canViewAssociatedProjects() ? 'Double-click to view projects' : ''}
                  >
                    <td>
                      <div className="client-name">
                        <span>{associate.name}</span>
                      </div>
                    </td>
                    <td>{associate.email}</td>
                    <td>{associate.company || '-'}</td>
                    <td>{associate.phone || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
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
                      <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        {/* Edit Associate */}
                        {canEditAssociate() && (
                          <button
                            onClick={() => handleEdit(associate)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            style={{ padding: '8px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            title="Edit Associate"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <FaEdit className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                          </button>
                        )}
                        
                        {/* Delete Associate */}
                        {canDeleteAssociate() && (
                          <button
                            onClick={() => handleDelete(associate._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            style={{ padding: '8px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            title="Delete Associate"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <FaTrash className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
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