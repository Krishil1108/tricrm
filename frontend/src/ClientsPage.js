import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ClientService from './services/ClientService';
import ExcelExportService from './services/ExcelExportService';
import ExcelImport from './components/ExcelImport';
import { dataEventManager, DATA_TYPES } from './services/dataEventManager';
import Watermark from './components/Watermark';
import LoadingSkeleton from './components/LoadingSkeleton';
import { FaEye, FaEdit, FaTrash, FaFolder, FaEllipsisV } from 'react-icons/fa';
import { FiChevronDown, FiChevronUp, FiChevronsUpDown } from 'react-icons/fi';
import useSortableData from './utils/useSortableData';
import './PageContent.css';
import './styles/ClientsPageEnhanced.css';
import './styles/ActionButtons.css';

const ClientsPage = () => {
  const { 
    canAddNewClient,
    canEditClient, 
    canDeleteClient, 
    canExportClients, 
    canImportClients, 
    canViewClientDetails,
    canViewClientProjects,
    canViewClientSummaryCards
  } = useAuth();
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
  const [itemsPerPage] = useState(30);
  
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
  const [formErrors, setFormErrors] = useState({});

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
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateClientForm = () => {
    const nextErrors = {};
    if (!clientData.name.trim()) {
      nextErrors.name = 'Full name is required.';
    }
    if (clientData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientData.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    return nextErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nextErrors = validateClientForm();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const newClientData = {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        company: clientData.company,
        address: clientData.address,
        city: clientData.city,
        state: clientData.state,
        zipCode: clientData.zipCode,
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

    const nextErrors = validateClientForm();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }
    
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
    setFormErrors({});
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

  // Filter clients - ensure clients is always an array
  const filteredClients = (Array.isArray(clients) ? clients : [])
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

  const {
    items: sortedClients,
    requestSort: requestClientSort,
    sortConfig: clientSortConfig
  } = useSortableData(filteredClients, { key: 'name', direction: 'asc' });

  // Pagination calculations
  const totalItems = filteredClients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentClients = sortedClients.slice(startIndex, endIndex);

  const handleSortChange = (value) => {
    setSortBy(value);
    if (value === 'date') {
      requestClientSort('createdAt', (client) => new Date(client.createdAt).getTime());
      return;
    }
    requestClientSort(value);
  };

  const renderSortIcon = (key) => {
    if (!clientSortConfig || clientSortConfig.key !== key) {
      return <FiChevronsUpDown className="sort-icon" />;
    }
    return clientSortConfig.direction === 'asc'
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
    <div className="clients-page-enhanced">
      <div className="modern-page-header">
        <div className="header-content-enhanced">
          <div className="header-title-section">
            <div className="title-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="header-icon">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <h1 className="page-title-enhanced">Client Management</h1>
            </div>
          </div>
          <div className="header-actions-enhanced">
            {canAddNewClient() && (
              <button 
                className="btn-primary-modern add-client-enhanced"
                onClick={() => setShowAddPopup(true)}
              >
                <div className="btn-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
                <span className="btn-text">Add Client</span>
              </button>
            )}
            {canExportClients() && (
              <button 
                className="btn-secondary-modern export-enhanced"
                onClick={handleExportToExcel}
                title="Export client data to Excel spreadsheet"
              >
                <div className="btn-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <div className="btn-content">
                  <span className="btn-text">Export</span>
                  <span className="btn-count">({filteredClients.length})</span>
                </div>
              </button>
            )}
            {canImportClients() && (
              <button 
                className="btn-tertiary-modern import-enhanced"
                onClick={() => setShowImportModal(true)}
                title="Import clients from Excel file"
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
            Client added successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-state" role="alert">
            <div className="state-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 13h-2v-2h2v2zm0-4h-2V7h2v4z"/>
              </svg>
            </div>
            <h3>Unable to load clients</h3>
            <p>{error}</p>
            <button type="button" className="btn-secondary-modern" onClick={loadClients}>
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <LoadingSkeleton rows={7} variant="table" />
        )}

        {/* Client Statistics - Enhanced Modern Cards */}
        {canViewClientSummaryCards() && (
          <div className="stats-grid-enhanced">
            <div className="stat-card-modern total">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-6h3v6h2v-6h2l-2.65-7.13A2 2 0 0 0 6.47 4H3.53c-.97 0-1.8.64-2.08 1.55L0 12v6h4z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{Array.isArray(clients) ? clients.length : 0}</div>
                <div className="stat-label">Total Clients</div>
              </div>
            </div>
            <div className="stat-card-modern active">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{Array.isArray(clients) ? clients.filter(c => c.status === 'Active').length : 0}</div>
                <div className="stat-label">Active Clients</div>
              </div>
            </div>
            <div className="stat-card-modern pending">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17A1.5,1.5 0 0,1 10.5,15.5A1.5,1.5 0 0,1 12,14A1.5,1.5 0 0,1 13.5,15.5A1.5,1.5 0 0,1 12,17M12,13A1,1 0 0,1 11,12V8A1,1 0 0,1 12,7A1,1 0 0,1 13,8V12A1,1 0 0,1 12,13Z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{Array.isArray(clients) ? clients.filter(c => c.status === 'Pending').length : 0}</div>
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
                <div className="stat-value">{Array.isArray(clients) ? clients.filter(c => c.status === 'Inactive').length : 0}</div>
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
                placeholder="Search clients by name, email, or company..."
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
                Showing {filteredClients.length} of {Array.isArray(clients) ? clients.length : 0} clients
              </span>
            </div>
            <button 
              className="btn-refresh-modern"
              onClick={loadClients}
              title="Refresh client data"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Enhanced Clients Table */}
        <div className="table-container-enhanced">
          <div className="table-wrapper-modern table-scroll">
            {filteredClients.length === 0 ? (
              <div className={`empty-state ${searchTerm || filterStatus !== 'all' || sortBy !== 'name' ? 'no-search-results' : 'no-clients'}`}>
                <div className="empty-state-icon" aria-hidden="true">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d={searchTerm || filterStatus !== 'all' || sortBy !== 'name' ? 
                      "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" :
                      "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"} />
                  </svg>
                </div>
                <h3>{searchTerm || filterStatus !== 'all' || sortBy !== 'name' ? 'No matching clients found' : 'No clients found'}</h3>
                <p>{searchTerm || filterStatus !== 'all' || sortBy !== 'name' ? 
                  'Try adjusting your search criteria or filters to find clients.' : 
                  'Start by adding your first client using the "Add Client" button above.'}</p>
              </div>
            ) : (
              <div className="filtered-results-container">
                <div className="table-content-wrapper">
              <table className="clients-table-enhanced table-sticky">
                <thead className="table-header-modern">
                  <tr>
                    <th className="th-name" style={{ textAlign: 'center' }} aria-sort={clientSortConfig?.key === 'name' ? clientSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${clientSortConfig?.key === 'name' ? 'active' : ''}`}
                        onClick={() => {
                          requestClientSort('name');
                          setSortBy('name');
                        }}
                      >
                        <span className="th-content" style={{ justifyContent: 'center' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="th-icon">
                            <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                          </svg>
                          <span>Name</span>
                        </span>
                        {renderSortIcon('name')}
                      </button>
                    </th>
                    <th className="th-email" style={{ textAlign: 'center' }} aria-sort={clientSortConfig?.key === 'email' ? clientSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${clientSortConfig?.key === 'email' ? 'active' : ''}`}
                        onClick={() => {
                          requestClientSort('email');
                          setSortBy('email');
                        }}
                      >
                        <span className="th-content" style={{ justifyContent: 'center' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="th-icon">
                            <path d="M20,8L12,13L4,8V6L12,11L20,6M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"/>
                          </svg>
                          <span>Email</span>
                        </span>
                        {renderSortIcon('email')}
                      </button>
                    </th>
                    <th className="th-company" style={{ textAlign: 'center' }} aria-sort={clientSortConfig?.key === 'company' ? clientSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${clientSortConfig?.key === 'company' ? 'active' : ''}`}
                        onClick={() => {
                          requestClientSort('company');
                          setSortBy('company');
                        }}
                      >
                        <span className="th-content" style={{ justifyContent: 'center' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="th-icon">
                            <path d="M12,7V3H2V21H22V7H12M6,19H4V17H6V19M6,15H4V13H6V15M6,11H4V9H6V11M6,7H4V5H6V7M10,19H8V17H10V19M10,15H8V13H10V15M10,11H8V9H10V11M10,7H8V5H10V7M20,19H12V17H20V19M20,15H12V13H20V15M20,11H12V9H20V11Z"/>
                          </svg>
                          <span>Company</span>
                        </span>
                        {renderSortIcon('company')}
                      </button>
                    </th>
                    <th className="th-phone" style={{ textAlign: 'center' }}>
                      <div className="th-content" style={{ justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="th-icon">
                          <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                        </svg>
                        <span>Phone</span>
                      </div>
                    </th>
                    <th className="th-projects" style={{ textAlign: 'center' }}>
                      <div className="th-content" style={{ justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="th-icon">
                          <path d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M13,9H18V7H13V9M13,16H18V10H13V16M6,10H11V7H6V10M7,8H10V9H7V8M6,16H11V11H6V16M7,12H10V15H7V12Z"/>
                        </svg>
                        <span>Projects</span>
                      </div>
                    </th>
                    <th className="th-status" style={{ textAlign: 'center' }}>
                      <div className="th-content" style={{ justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="th-icon">
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z"/>
                        </svg>
                        <span>Status</span>
                      </div>
                    </th>
                    <th className="th-date" style={{ textAlign: 'center' }} aria-sort={clientSortConfig?.key === 'createdAt' ? clientSortConfig.direction : 'none'}>
                      <button
                        type="button"
                        className={`sortable-header ${clientSortConfig?.key === 'createdAt' ? 'active' : ''}`}
                        onClick={() => {
                          requestClientSort('createdAt', (client) => new Date(client.createdAt).getTime());
                          setSortBy('date');
                        }}
                      >
                        <span className="th-content" style={{ justifyContent: 'center' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="th-icon">
                            <path d="M19,19H5V8H19M16,1V3H8V1H6V3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3H18V1M17,12H12V17H17V12Z"/>
                          </svg>
                          <span>Added Date</span>
                        </span>
                        {renderSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="th-actions" style={{ textAlign: 'center' }}>
                      <div className="th-content" style={{ justifyContent: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="th-icon">
                          <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
                        </svg>
                        <span>Actions</span>
                      </div>
                    </th>
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
                    <td style={{ textAlign: 'center' }}>
                      <span className="project-count-badge" title={`${client.projectCount || 0} project(s)`}>
                        {client.projectCount || 0}
                      </span>
                    </td>
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
                      <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                        {/* View Details */}
                        {canViewClientDetails() && (
                          <button
                            onClick={() => handleView(client)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            style={{ padding: '8px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            title="View Details"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <FaEye className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                          </button>
                        )}
                        
                        {/* Edit Client */}
                        {canEditClient() && (
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            style={{ padding: '8px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            title="Edit Client"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <FaEdit className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                          </button>
                        )}

                        {/* View Projects */}
                        {canViewClientProjects() && (
                          <button
                            onClick={() => handleViewProjects(client)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            style={{ padding: '8px', color: '#9333ea', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            title="View Projects"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#faf5ff'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <FaFolder className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                          </button>
                        )}
                        
                        {/* Delete Client */}
                        {canDeleteClient() && (
                          <button
                            onClick={() => handleDelete(client._id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            style={{ padding: '8px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                            title="Delete Client"
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
                  {filteredClients.length < 5 && (
                    <div className="table-spacer"></div>
                  )}
                </div>
              </div>
            )}
          </div>

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
                      aria-invalid={Boolean(formErrors.name)}
                      aria-describedby={formErrors.name ? 'client-name-error' : undefined}
                      required
                    />
                    {formErrors.name && (
                      <div className="error-text" id="client-name-error">{formErrors.name}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={clientData.email}
                      onChange={handleInputChange}
                      placeholder="client@example.com"
                      aria-invalid={Boolean(formErrors.email)}
                      aria-describedby={formErrors.email ? 'client-email-error' : undefined}
                    />
                    {formErrors.email && (
                      <div className="error-text" id="client-email-error">{formErrors.email}</div>
                    )}
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

              {error && <div className="error-message form-error">{error}</div>}

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
                      name="name"
                      value={clientData.name}
                      onChange={handleInputChange}
                      placeholder="Enter client's full name"
                      aria-invalid={Boolean(formErrors.name)}
                      aria-describedby={formErrors.name ? 'client-edit-name-error' : undefined}
                      required
                    />
                    {formErrors.name && (
                      <div className="error-text" id="client-edit-name-error">{formErrors.name}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-email">Email Address</label>
                    <input
                      type="email"
                      id="edit-email"
                      name="email"
                      value={clientData.email}
                      onChange={handleInputChange}
                      placeholder="client@example.com"
                      aria-invalid={Boolean(formErrors.email)}
                      aria-describedby={formErrors.email ? 'client-edit-email-error' : undefined}
                    />
                    {formErrors.email && (
                      <div className="error-text" id="client-edit-email-error">{formErrors.email}</div>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-phone">Phone Number</label>
                    <input
                      type="tel"
                      id="edit-phone"
                      name="phone"
                      value={clientData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-company">Company</label>
                    <input
                      type="text"
                      id="edit-company"
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
                  <label htmlFor="edit-address">Street Address</label>
                  <input
                    type="text"
                    id="edit-address"
                    name="address"
                    value={clientData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-city">City</label>
                    <input
                      type="text"
                      id="edit-city"
                      name="city"
                      value={clientData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-state">State</label>
                    <input
                      type="text"
                      id="edit-state"
                      name="state"
                      value={clientData.state}
                      onChange={handleInputChange}
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
                      name="zipCode"
                      value={clientData.zipCode}
                      onChange={handleInputChange}
                      placeholder="10001"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-country">Country</label>
                    <input
                      type="text"
                      id="edit-country"
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
                  <label htmlFor="edit-notes">Notes</label>
                  <textarea
                    id="edit-notes"
                    name="notes"
                    value={clientData.notes}
                    onChange={handleInputChange}
                    placeholder="Any additional notes about the client..."
                    rows="3"
                  />
                </div>
              </div>

              {error && <div className="error-message form-error">{error}</div>}

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