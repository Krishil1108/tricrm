import React, { useState, useEffect } from 'react';
import './ProjectPage.css';
import FinanceService from './services/FinanceService';
import ClientService from './services/ClientService';
import { useLoading } from './contexts/LoadingContext';
import { useToast } from './context/ToastContext';
import YearlyDistributionTable from './components/YearlyDistributionTable';

const ProjectPage = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    year: new Date().getFullYear().toString()
  });
  const [formData, setFormData] = useState({});
  const [percentageConfig, setPercentageConfig] = useState({
    profitMarginPercent: 0,
    drawingPercent: 0,
    documentsPercent: 0,
    siteVisitPercent: 0,
    marketingAndMiscPercent: 0,
    officeManagementPercent: 0,
    includeAssociates: false,
    numberOfAssociates: 1,
    associates: [
      { name: '', company: '', percentage: 0 }
    ],
    customFields: [] // Array of custom fields: { name: 'Custom Field', fieldName: 'customFieldPercent', percentage: 0 }
  });
  const [showPercentageConfig, setShowPercentageConfig] = useState(false);
  const [selectedProjectForDistribution, setSelectedProjectForDistribution] = useState(null);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  
  // Client-related state
  const [clients, setClients] = useState([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientFormData, setClientFormData] = useState({
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
  
  const { showLoading, hideLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchData();
    fetchStats();
    loadPercentageConfig();
    loadClients();
  }, [activeTab, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadClients = async () => {
    try {
      const clientsData = await ClientService.getAllClients();
      setClients(Array.isArray(clientsData) ? clientsData : []);
    } catch (error) {
      console.error('Error loading clients:', error);
      showError('Failed to load clients');
      setClients([]);
    }
  };

  const loadPercentageConfig = () => {
    try {
      const savedConfig = localStorage.getItem('finance-percentage-config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        // Ensure backward compatibility and set defaults for new fields
        const configWithDefaults = {
          profitMarginPercent: 0,
          drawingPercent: 0,
          documentsPercent: 0,
          siteVisitPercent: 0,
          marketingAndMiscPercent: 0,
          officeManagementPercent: 0,
          includeAssociates: false,
          numberOfAssociates: 1,
          associates: [{ name: '', company: '', percentage: 0 }],
          customFields: [], // Ensure customFields are loaded
          ...parsedConfig
        };
        
        // Fix any existing custom fields with incorrect fieldNames
        if (configWithDefaults.customFields && configWithDefaults.customFields.length > 0) {
          configWithDefaults.customFields = configWithDefaults.customFields.map(field => {
            // If fieldName doesn't match the expected pattern based on name, fix it
            if (field.name && field.name.trim()) {
              const expectedFieldName = field.name.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + 'Percent';
              if (field.fieldName !== expectedFieldName && !field.fieldName.includes(field.name.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase())) {
                console.log(`Fixing fieldName for "${field.name}" from "${field.fieldName}" to "${expectedFieldName}"`);
                return {
                  ...field,
                  fieldName: expectedFieldName
                };
              }
            }
            return field;
          });
          
          // Save the corrected config back to localStorage
          localStorage.setItem('finance-percentage-config', JSON.stringify(configWithDefaults));
        }
        
        setPercentageConfig(configWithDefaults);
      }
    } catch (error) {
      console.error('Error loading percentage configuration:', error);
    }
  };

  const savePercentageConfig = (config) => {
    try {
      localStorage.setItem('finance-percentage-config', JSON.stringify(config));
      setPercentageConfig(config);
      showSuccess('Percentage configuration saved successfully');
    } catch (error) {
      showError('Error saving configuration');
      console.error('Error saving percentage configuration:', error);
    }
  };

  const fetchData = async () => {
    try {
      showLoading('Loading data...');
      if (activeTab === 'projects') {
        const response = await FinanceService.getAllProjects(filters);
        setProjects(response.data || []);
      } else {
        const response = await FinanceService.getAllExpenses(filters);
        setExpenses(response.data || []);
      }
    } catch (error) {
      showError('Error loading data');
      console.error(error);
    } finally {
      hideLoading();
    }
  };

  const fetchStats = async () => {
    try {
      const response = await FinanceService.getStats({ year: filters.year });
      setStats(response.data || {});
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showLoading('Importing data from Excel...');
      const response = await FinanceService.importProjects(file);
      showSuccess(response.message || 'Import successful');
      fetchData();
      fetchStats();
      e.target.value = ''; // Reset file input
    } catch (error) {
      showError('Import failed: ' + (error.response?.data?.message || error.message));
    } finally {
      hideLoading();
    }
  };

  const handleExport = async () => {
    try {
      showLoading('Exporting to Excel...');
      if (activeTab === 'projects') {
        await FinanceService.exportProjects();
      } else {
        await FinanceService.exportExpenses(filters);
      }
      showSuccess('Export successful');
    } catch (error) {
      showError('Export failed');
    } finally {
      hideLoading();
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    if (activeTab === 'projects') {
      // Create base form data
      const baseFormData = {
        srNo: projects.length + 1,
        projectNumber: '',
        projectName: '',
        clientId: '',
        finalizedFees: '',
        totalReceivedFees: 0,
        payments: [],
        yearlyDistribution: {},
        year2024_25: '',
        profitMarginPercent: percentageConfig.profitMarginPercent,
        drawingPercent: percentageConfig.drawingPercent,
        documentsPercent: percentageConfig.documentsPercent,
        siteVisitPercent: percentageConfig.siteVisitPercent,
        marketingAndMiscPercent: percentageConfig.marketingAndMiscPercent,
        officeManagementPercent: percentageConfig.officeManagementPercent,
        profitMargin: '',
        drawing: '',
        documents: '',
        siteVisit: '',
        marketingAndMisc: '',
        officeManagement: '',
        status: 'Active'
      };

      // Add custom fields from percentage config
      const customFieldsData = {};
      if (percentageConfig.customFields && percentageConfig.customFields.length > 0) {
        percentageConfig.customFields.forEach((field) => {
          // Add percentage field
          customFieldsData[field.fieldName] = field.percentage;
          // Add calculated amount field (initially empty)
          const amountFieldName = field.fieldName.replace('Percent', '');
          customFieldsData[amountFieldName] = '';
        });
      }

      setFormData({
        ...baseFormData,
        ...customFieldsData
      });
    } else {
      setFormData({
        bankName: 'Bank 1',
        month: 'April',
        year: new Date().getFullYear().toString(),
        amount: '',
        drawing: '',
        siteVisit: '',
        officeManagement: ''
      });
    }
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    
    // Ensure payments array exists and add frontend IDs for existing payments
    const paymentsWithIds = (item.payments || []).map((payment, index) => ({
      ...payment,
      id: payment._id || `existing_payment_${index}_${Date.now()}`
    }));
    
    let itemWithPayments = {
      ...item,
      payments: paymentsWithIds,
      yearlyDistribution: paymentsWithIds.length > 0 ? calculateYearlyDistribution(paymentsWithIds) : {}
    };
    
    // If the item has custom fields stored as an array, flatten them to form data format
    if (item.customFields && Array.isArray(item.customFields)) {
      const customFieldsFormData = {};
      item.customFields.forEach(field => {
        // Add percentage field
        customFieldsFormData[field.fieldName] = field.percentage || 0;
        // Add amount field
        const amountFieldName = field.fieldName.replace('Percent', '');
        customFieldsFormData[amountFieldName] = field.amount || 0;
      });
      
      itemWithPayments = {
        ...itemWithPayments,
        ...customFieldsFormData
      };
    }
    
    setFormData(itemWithPayments);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      showLoading('Deleting...');
      if (activeTab === 'projects') {
        await FinanceService.deleteProject(id);
      } else {
        await FinanceService.deleteExpense(id);
      }
      showSuccess('Deleted successfully');
      fetchData();
      fetchStats();
    } catch (error) {
      showError('Delete failed');
    } finally {
      hideLoading();
    }
  };

  const handleViewDistribution = (project) => {
    // Ensure payments array exists and add frontend IDs for existing payments
    const paymentsWithIds = (project.payments || []).map((payment, index) => ({
      ...payment,
      id: payment._id || `existing_payment_${index}_${Date.now()}`
    }));
    
    const projectWithPayments = {
      ...project,
      payments: paymentsWithIds,
      yearlyDistribution: paymentsWithIds.length > 0 ? calculateYearlyDistribution(paymentsWithIds) : {}
    };
    
    setSelectedProjectForDistribution(projectWithPayments);
    setShowDistributionModal(true);
  };

  const handleSave = async () => {
    try {
      showLoading('Saving...');
      
      // Validate required fields
      if (activeTab === 'projects') {
        if (!formData.projectNumber || !formData.projectName) {
          showError('Project Number and Project Name are required');
          hideLoading();
          return;
        }
      }
      
      // Clean the form data - convert empty strings to 0 for numeric fields
      const cleanFormData = { ...formData };
      const numericFields = [
        'srNo', 'finalizedFees', 'totalReceivedFees', 'year2024_25',
        'profitMarginPercent', 'drawingPercent', 'documentsPercent', 
        'siteVisitPercent', 'marketingAndMiscPercent', 'officeManagementPercent',
        'profitMargin', 'drawing', 'documents', 'siteVisit', 
        'marketingAndMisc', 'officeManagement', 'amount'
      ];
      
      // Convert empty strings to 0 for numeric fields
      numericFields.forEach(field => {
        if (cleanFormData[field] === '' || cleanFormData[field] === null || cleanFormData[field] === undefined) {
          cleanFormData[field] = 0;
        }
      });
      
      // Extract and structure custom fields data
      const customFieldsData = [];
      if (percentageConfig.customFields && percentageConfig.customFields.length > 0) {
        percentageConfig.customFields.forEach(field => {
          const fieldName = field.fieldName;
          const percentage = cleanFormData[fieldName] || field.percentage || 0;
          const amountFieldName = fieldName.replace('Percent', '');
          const amount = cleanFormData[amountFieldName] || 0;
          
          customFieldsData.push({
            name: field.name,
            fieldName: fieldName,
            percentage: percentage,
            amount: amount
          });
          
          // KEEP the fields at top level for backend compatibility
          // Don't delete them - the backend needs to store these values
          cleanFormData[fieldName] = percentage;
          cleanFormData[amountFieldName] = amount;
        });
      }
      
      // Add custom fields as a structured array (for reference)
      if (customFieldsData.length > 0) {
        cleanFormData.customFieldsMetadata = customFieldsData;
      }
      
      // Clean payments data - remove frontend-only id field and ensure proper types
      if (cleanFormData.payments) {
        cleanFormData.payments = cleanFormData.payments
          .filter(payment => payment.date && payment.amount) // Only include valid payments
          .map(payment => ({
            date: payment.date,
            chequeNeftNumber: payment.chequeNeftNumber || '',
            mode: payment.mode || 'Cheque',
            amount: parseInt(payment.amount) || 0  // Use parseInt to avoid decimal issues
          }));
      }
      
      // Remove frontend-only fields
      delete cleanFormData.yearlyDistribution;
      
      // Handle ObjectId fields - convert empty strings to null for MongoDB
      const objectIdFields = ['clientId'];
      objectIdFields.forEach(field => {
        if (cleanFormData[field] === '' || cleanFormData[field] === null || cleanFormData[field] === undefined) {
          delete cleanFormData[field]; // Remove the field entirely if empty
        }
      });
      
      console.log('Sending project data:', cleanFormData);
      
      if (activeTab === 'projects') {
        if (editingItem) {
          await FinanceService.updateProject(editingItem._id, cleanFormData);
        } else {
          await FinanceService.createProject(cleanFormData);
        }
      } else {
        await FinanceService.saveExpense(cleanFormData);
      }
      showSuccess('Saved successfully');
      setShowModal(false);
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      showError('Save failed: ' + (error.response?.data?.message || error.message));
    } finally {
      hideLoading();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      document.getElementById('excel-upload').click();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  // Client management functions
  const handleOpenClientModal = () => {
    setClientFormData({
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
    setShowClientModal(true);
  };

  const handleCloseClientModal = () => {
    setShowClientModal(false);
    setClientFormData({
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

  const handleClientInputChange = (e) => {
    const { name, value } = e.target;
    setClientFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientSubmit = async (e) => {
    e.preventDefault();
    try {
      showLoading();
      
      // Create the full address string
      const fullAddress = [
        clientFormData.address,
        clientFormData.city,
        clientFormData.state,
        clientFormData.zipCode
      ].filter(part => part.trim()).join(', ');

      const clientDataToSend = {
        name: clientFormData.name,
        email: clientFormData.email,
        phone: clientFormData.phone,
        company: clientFormData.company,
        address: fullAddress,
        notes: clientFormData.notes
      };

      const newClient = await ClientService.createClient(clientDataToSend);
      
      // Update the clients list
      setClients(prev => [...prev, newClient]);
      
      // Auto-select the newly created client in the project form
      setFormData(prev => ({
        ...prev,
        clientId: newClient._id
      }));
      
      showSuccess('Client added successfully');
      handleCloseClientModal();
    } catch (error) {
      console.error('Error creating client:', error);
      showError('Failed to create client: ' + (error.response?.data?.message || error.message));
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="project-page">
      <div className="page-header">
        <h1>� Project Management</h1>
        <div className="project-actions">
          <button className="project-btn project-btn-primary" onClick={handleAdd}>
            <i className="bi bi-plus-lg"></i> Add New
          </button>
          {activeTab === 'projects' && (
            <button className="project-btn project-btn-info" onClick={() => setShowPercentageConfig(true)}>
              <i className="bi bi-gear-fill"></i> Configure Percentages
            </button>
          )}
          {activeTab === 'projects' && (
            <>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="file-upload"
                id="excel-upload"
              />
              <label 
                htmlFor="excel-upload" 
                className="project-btn project-btn-success"
                tabIndex="0"
                role="button"
                aria-label="Import Excel file"
                onKeyDown={handleKeyDown}
              >
                <i className="bi bi-upload"></i> Import Excel
              </label>
            </>
          )}
          <button className="project-btn project-btn-secondary" onClick={handleExport}>
            <i className="bi bi-download"></i> Export Excel
          </button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Projects</div>
            <div className="stat-value">{stats.projects?.total || 0}</div>
          </div>
          <div className="stat-card success">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">{formatCurrency(stats.revenue?.totalReceivedFees)}</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value">{formatCurrency(stats.revenue?.totalExpenses)}</div>
          </div>
          <div className={`stat-card ${stats.revenue?.netProfit >= 0 ? 'success' : 'danger'}`}>
            <div className="stat-label">Net Profit</div>
            <div className="stat-value">{formatCurrency(stats.revenue?.netProfit)}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="finance-tabs">
        <button
          className={`finance-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          📊 Projects
        </button>
        <button
          className={`finance-tab ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          💳 Bank Expenses
        </button>
      </div>

      {/* Filters */}
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
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
          {activeTab === 'projects' && (
            <select
              className="filter-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          )}
          
          <select
            className="filter-select"
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            style={{ 
              padding: '12px 16px', 
              border: '2px solid #e5e7eb', 
              borderRadius: '8px',
              fontSize: '14px',
              background: 'white',
              minWidth: '100px',
              outline: 'none'
            }}
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {activeTab === 'projects' ? (
        <ProjectsTable
          projects={projects}
          onEdit={handleEdit}
          onViewDistribution={handleViewDistribution}
          onDelete={handleDelete}
          formatCurrency={formatCurrency}
        />
      ) : (
        <ExpensesTable
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={handleDelete}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          activeTab={activeTab}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          isEditing={!!editingItem}
          clients={clients}
          onAddClient={handleOpenClientModal}
          percentageConfig={percentageConfig}
        />
      )}

      {/* Percentage Configuration Modal */}
      {showPercentageConfig && (
        <PercentageConfigModal
          config={percentageConfig}
          onSave={savePercentageConfig}
          onClose={() => setShowPercentageConfig(false)}
        />
      )}

      {/* Distribution View Modal */}
      {showDistributionModal && selectedProjectForDistribution && (
        <div className="modal-overlay" onClick={() => setShowDistributionModal(false)}>
          <div className="modal-content distribution-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 Payment Distribution - {selectedProjectForDistribution.projectName}</h3>
              <button className="modal-close" onClick={() => setShowDistributionModal(false)}>×</button>
            </div>
            <div className="modal-body distribution-modal-body">
              <YearlyDistributionTable 
                projectData={selectedProjectForDistribution}
                showTitle={false}
                compact={false}
                associateConfig={percentageConfig}
                customFields={percentageConfig.customFields || []}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => {
                if (window.exportDistributionExcel) {
                  window.exportDistributionExcel();
                }
              }}>
                Export Excel
              </button>
              <button className="btn btn-secondary" onClick={() => {
                if (window.exportDistributionPDF) {
                  window.exportDistributionPDF();
                }
              }}>
                Export PDF
              </button>
              <button className="btn btn-secondary" onClick={() => setShowDistributionModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Modal */}
      {showClientModal && (
        <div className="modal-overlay" onClick={handleCloseClientModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Client</h2>
              <button className="modal-close" onClick={handleCloseClientModal}>×</button>
            </div>

            <form onSubmit={handleClientSubmit} className="modal-body">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-input"
                      value={clientFormData.name}
                      onChange={handleClientInputChange}
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
                      className="form-input"
                      value={clientFormData.email}
                      onChange={handleClientInputChange}
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
                      className="form-input"
                      value={clientFormData.phone}
                      onChange={handleClientInputChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="company">Company</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      className="form-input"
                      value={clientFormData.company}
                      onChange={handleClientInputChange}
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
                    className="form-input"
                    value={clientFormData.address}
                    onChange={handleClientInputChange}
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
                      className="form-input"
                      value={clientFormData.city}
                      onChange={handleClientInputChange}
                      placeholder="City"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State/Province</label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      className="form-input"
                      value={clientFormData.state}
                      onChange={handleClientInputChange}
                      placeholder="State"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP/Postal Code</label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      className="form-input"
                      value={clientFormData.zipCode}
                      onChange={handleClientInputChange}
                      placeholder="12345"
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
                    className="form-input"
                    rows="3"
                    value={clientFormData.notes}
                    onChange={handleClientInputChange}
                    placeholder="Any additional notes about the client..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="finance-btn finance-btn-secondary" onClick={handleCloseClientModal}>
                  Cancel
                </button>
                <button type="submit" className="finance-btn finance-btn-primary">
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Projects Table Component
const ProjectsTable = ({ projects, onEdit, onViewDistribution, onDelete, formatCurrency }) => {
  if (projects.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <h3>No projects found</h3>
        <p>Start by adding a new project or importing from Excel</p>
      </div>
    );
  }

  return (
    <div className="project-table-container">
      <table className="project-table">
        <thead>
          <tr>
            <th>Sr. No.</th>
            <th>Project Number</th>
            <th>Project Name</th>
            <th>Finalized Fees</th>
            <th>Received Fees</th>
            <th>Expenses</th>
            <th>Net Profit</th>
            <th>Status</th>
            <th style={{textAlign: 'center'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project._id}>
              <td>{project.srNo}</td>
              <td>{project.projectNumber}</td>
              <td>{project.projectName}</td>
              <td>{formatCurrency(project.finalizedFees)}</td>
              <td>{formatCurrency(project.totalReceivedFees)}</td>
              <td>{formatCurrency(project.totalExpenses)}</td>
              <td className={project.netProfit >= 0 ? 'amount-positive' : 'amount-negative'}>
                {formatCurrency(project.netProfit)}
              </td>
              <td>
                <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '')}`}>
                  {project.status}
                </span>
              </td>
              <td>
                <div className="table-actions">
                  <button className="action-btn btn-edit" onClick={() => onEdit(project)}>
                    <i className="bi bi-pencil-fill"></i> Edit
                  </button>
                  <button className="action-btn btn-distribution" onClick={() => onViewDistribution(project)}>
                    <i className="bi bi-box-arrow-up-right"></i> Distribution
                  </button>
                  <button className="action-btn btn-delete" onClick={() => onDelete(project._id)}>
                    <i className="bi bi-trash-fill"></i> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Expenses Table Component
const ExpensesTable = ({ expenses, onEdit, onDelete, formatCurrency }) => {
  if (expenses.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💳</div>
        <h3>No expenses found</h3>
        <p>Start by adding bank expenses</p>
      </div>
    );
  }

  return (
    <div className="project-table-container">
      <table className="project-table">
        <thead>
          <tr>
            <th>Bank Name</th>
            <th>Month</th>
            <th>Year</th>
            <th>Amount</th>
            <th>Drawing</th>
            <th>Site Visit</th>
            <th>Office Mgmt</th>
            <th>Total</th>
            <th style={{textAlign: 'center'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense._id}>
              <td>{expense.bankName}</td>
              <td>{expense.month}</td>
              <td>{expense.year}</td>
              <td>{formatCurrency(expense.amount)}</td>
              <td>{formatCurrency(expense.drawing)}</td>
              <td>{formatCurrency(expense.siteVisit)}</td>
              <td>{formatCurrency(expense.officeManagement)}</td>
              <td className="amount-negative">{formatCurrency(expense.total)}</td>
              <td>
                <div className="table-actions">
                  <button className="action-btn btn-edit" onClick={() => onEdit(expense)}>
                    <i className="bi bi-pencil-fill"></i> Edit
                  </button>
                  <button className="action-btn btn-delete" onClick={() => onDelete(expense._id)}>
                    <i className="bi bi-trash-fill"></i> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Payment Management Functions
const calculateTotalReceivedFees = (payments) => {
  return payments.reduce((total, payment) => total + (parseInt(payment.amount) || 0), 0);
};

const calculateYearlyDistribution = (payments) => {
  const distribution = {};
  
  payments.forEach(payment => {
    if (payment.date && payment.amount) {
      const paymentDate = new Date(payment.date);
      const year = paymentDate.getFullYear();
      
      // Create financial year (April to March)
      let financialYear;
      if (paymentDate.getMonth() >= 3) { // April = month 3 (0-indexed)
        financialYear = `${year}-${(year + 1).toString().slice(-2)}`;
      } else {
        financialYear = `${year - 1}-${year.toString().slice(-2)}`;
      }
      
      if (!distribution[financialYear]) {
        distribution[financialYear] = 0;
      }
      distribution[financialYear] += parseInt(payment.amount) || 0;  // Use parseInt to avoid decimal issues
    }
  });
  
  return distribution;
};

// Modal Component
const Modal = ({ activeTab, formData, setFormData, onSave, onClose, isEditing, clients, onAddClient, percentageConfig }) => {
  
  // Payment management functions
  const addPayment = () => {
    const newPayment = {
      id: `payment_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      date: '',
      chequeNeftNumber: '',
      mode: 'Cheque',
      amount: ''
    };
    
    const updatedPayments = [...(formData.payments || []), newPayment];
    updateFormDataWithPayments(updatedPayments);
  };
  
  const removePayment = (paymentId) => {
    const updatedPayments = (formData.payments || []).filter(payment => payment.id !== paymentId);
    updateFormDataWithPayments(updatedPayments);
  };
  
  const updatePayment = (paymentId, field, value) => {
    const updatedPayments = (formData.payments || []).map(payment => 
      payment.id === paymentId ? { ...payment, [field]: value } : payment
    );
    updateFormDataWithPayments(updatedPayments);
  };
  
  const updateFormDataWithPayments = (payments) => {
    const totalReceived = calculateTotalReceivedFees(payments);
    const yearlyDistribution = calculateYearlyDistribution(payments);
    
    const updatedFormData = {
      ...formData,
      payments,
      totalReceivedFees: totalReceived,
      yearlyDistribution
    };
    
    // Auto-calculate expense allocations using Math.floor for consistent results
    const receivedFees = totalReceived;
    updatedFormData.profitMargin = Math.floor((receivedFees * (updatedFormData.profitMarginPercent || 0)) / 100);
    updatedFormData.drawing = Math.floor((receivedFees * (updatedFormData.drawingPercent || 0)) / 100);
    updatedFormData.documents = Math.floor((receivedFees * (updatedFormData.documentsPercent || 0)) / 100);
    updatedFormData.siteVisit = Math.floor((receivedFees * (updatedFormData.siteVisitPercent || 0)) / 100);
    updatedFormData.marketingAndMisc = Math.floor((receivedFees * (updatedFormData.marketingAndMiscPercent || 0)) / 100);
    updatedFormData.officeManagement = Math.floor((receivedFees * (updatedFormData.officeManagementPercent || 0)) / 100);
    
    setFormData(updatedFormData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['srNo', 'finalizedFees', 'totalReceivedFees', 'year2024_25', 
                          'profitMarginPercent', 'drawingPercent', 'documentsPercent', 
                          'siteVisitPercent', 'marketingAndMiscPercent', 'officeManagementPercent',
                          'profitMargin', 'drawing', 'documents', 'siteVisit', 
                          'marketingAndMisc', 'officeManagement', 'amount'];
    
    const newValue = numericFields.includes(name) ? parseInt(value) || 0 : value;  // Use parseInt to avoid decimal issues
    
    // Update formData
    const updatedFormData = {
      ...formData,
      [name]: newValue
    };
    
    // Auto-calculate amounts when totalReceivedFees changes or percentage fields are manually changed
    const percentFields = ['profitMarginPercent', 'drawingPercent', 'documentsPercent', 
                          'siteVisitPercent', 'marketingAndMiscPercent', 'officeManagementPercent'];
    
    if (name === 'totalReceivedFees' || percentFields.includes(name)) {
      // Use current totalReceivedFees value
      const receivedFees = name === 'totalReceivedFees' ? newValue : (formData.totalReceivedFees || 0);
      
      // Auto-calculate amounts from saved percentages using Math.floor for consistent results
      updatedFormData.profitMargin = Math.floor((receivedFees * (updatedFormData.profitMarginPercent || 0)) / 100);
      updatedFormData.drawing = Math.floor((receivedFees * (updatedFormData.drawingPercent || 0)) / 100);
      updatedFormData.documents = Math.floor((receivedFees * (updatedFormData.documentsPercent || 0)) / 100);
      updatedFormData.siteVisit = Math.floor((receivedFees * (updatedFormData.siteVisitPercent || 0)) / 100);
      updatedFormData.marketingAndMisc = Math.floor((receivedFees * (updatedFormData.marketingAndMiscPercent || 0)) / 100);
      updatedFormData.officeManagement = Math.floor((receivedFees * (updatedFormData.officeManagementPercent || 0)) / 100);
    }
    
    setFormData(updatedFormData);
  };

  // Allow manual amount override
  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseInt(value) || 0  // Use parseInt to avoid decimal issues
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit' : 'Add'} {activeTab === 'projects' ? 'Project' : 'Expense'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {activeTab === 'projects' ? (
            <ProjectForm 
              formData={formData} 
              handleChange={handleChange} 
              handleAmountChange={handleAmountChange}
              addPayment={addPayment}
              removePayment={removePayment}
              updatePayment={updatePayment}
              clients={clients}
              onAddClient={onAddClient}
              percentageConfig={percentageConfig}
            />
          ) : (
            <ExpenseForm formData={formData} handleChange={handleChange} />
          )}
        </div>

        <div className="modal-actions">
          <button className="finance-btn finance-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="finance-btn finance-btn-primary" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

// Project Form
const ProjectForm = ({ formData, handleChange, handleAmountChange, addPayment, removePayment, updatePayment, clients, onAddClient, percentageConfig }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>Sr. No.</label>
          <input type="number" name="srNo" className="form-input" value={formData.srNo || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Project Number *</label>
          <input type="text" name="projectNumber" className="form-input" value={formData.projectNumber || ''} onChange={handleChange} required />
        </div>
      </div>

      <div className="form-group">
        <label>Project Name *</label>
        <input type="text" name="projectName" className="form-input" value={formData.projectName || ''} onChange={handleChange} required />
      </div>

      {/* Client Selection Field */}
      <div className="form-row">
        <div className="form-group">
          <label>Choose Client</label>
          <select 
            name="clientId" 
            className="form-input" 
            value={formData.clientId || ''} 
            onChange={handleChange}
          >
            <option value="">Select a client...</option>
            {clients.map(client => (
              <option key={client._id} value={client._id}>
                {client.name} {client.company ? `(${client.company})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <button 
            type="button" 
            className="project-btn project-btn-success add-client-btn"
            onClick={onAddClient}
            style={{
              marginTop: '24px',
              padding: '8px 16px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span>
            Add New Client
          </button>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Finalized Fees</label>
          <input type="number" name="finalizedFees" className="form-input" value={formData.finalizedFees || ''} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Total Received Fees (Auto-calculated from payments)</label>
          <input 
            type="number" 
            name="totalReceivedFees" 
            className="form-input readonly" 
            value={formData.totalReceivedFees || 0} 
            readOnly 
            style={{backgroundColor: '#f8f9fa', cursor: 'not-allowed'}}
          />
          <small className="form-helper-text">This field is automatically calculated from the payments below.</small>
        </div>
      </div>

      {/* Payment Management Section */}
      <div className="form-section-header">
        <h3>💳 Payment Details</h3>
        <button 
          type="button" 
          className="project-btn project-btn-success"
          onClick={addPayment}
          style={{marginLeft: 'auto'}}
        >
          + Add Payment
        </button>
      </div>

      {formData.payments && formData.payments.length > 0 && (
        <div className="payments-section">
          {formData.payments.map((payment, index) => (
            <div key={payment.id} className="payment-row">
              <div className="payment-header">
                <span className="payment-number">Payment #{index + 1}</span>
                <button 
                  type="button" 
                  className="remove-payment-btn"
                  onClick={() => removePayment(payment.id)}
                  title="Remove Payment"
                >
                  ×
                </button>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Payment Date *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={payment.date || ''} 
                    onChange={(e) => updatePayment(payment.id, 'date', e.target.value)}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Cheque/NEFT Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={payment.chequeNeftNumber || ''} 
                    onChange={(e) => updatePayment(payment.id, 'chequeNeftNumber', e.target.value)}
                    placeholder="Enter reference number"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Payment Mode</label>
                  <select 
                    className="form-input" 
                    value={payment.mode || 'Cheque'} 
                    onChange={(e) => updatePayment(payment.id, 'mode', e.target.value)}
                  >
                    <option value="Cheque">Cheque</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="DD">DD (Demand Draft)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Payment Amount *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={payment.amount || ''} 
                    onChange={(e) => updatePayment(payment.id, 'amount', e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    required 
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {formData.payments && formData.payments.length === 0 && (
        <div className="empty-payments">
          <p>No payments added yet. Click "Add Payment" to start adding payment details.</p>
        </div>
      )}

      {/* Yearly Distribution Section */}
      {formData.yearlyDistribution && Object.keys(formData.yearlyDistribution).length > 0 && (
        <YearlyDistributionTable 
          projectData={formData}
          showTitle={false}
          compact={false}
          associateConfig={percentageConfig}
        />
      )}

      <div className="form-section-header">
        <h3>💡 Expense Allocation (Auto-calculated from saved percentages)</h3>
        <p className="form-helper-text">Amounts are automatically calculated based on your saved percentage configuration. Use "Configure Percentages" to modify.</p>
      </div>

      {/* Profit Margin */}
      <div className="form-row percentage-row">
        <div className="form-group">
          <label>Profit Margin % (Configured)</label>
          <div className="input-with-suffix readonly-field">
            <input 
              type="number" 
              name="profitMarginPercent" 
              className="form-input readonly" 
              value={formData.profitMarginPercent || 0} 
              readOnly
              min="0"
              max="100"
              step="0.1"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>
        <div className="form-group">
          <label>Amount (Auto-calculated)</label>
          <div className="calculated-amount">
            <input 
              type="number" 
              name="profitMargin" 
              className="form-input calculated" 
              value={formData.profitMargin || ''}
              onChange={handleAmountChange}
            />
            <span className="amount-display">{formatCurrency(formData.profitMargin)}</span>
          </div>
        </div>
      </div>

      {/* Drawing */}
      <div className="form-row percentage-row">
        <div className="form-group">
          <label>Drawing % (Configured)</label>
          <div className="input-with-suffix readonly-field">
            <input 
              type="number" 
              name="drawingPercent" 
              className="form-input readonly" 
              value={formData.drawingPercent || 0} 
              readOnly
              min="0"
              max="100"
              step="0.1"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>
        <div className="form-group">
          <label>Amount (Auto-calculated)</label>
          <div className="calculated-amount">
            <input 
              type="number" 
              name="drawing" 
              className="form-input calculated" 
              value={formData.drawing || ''}
              onChange={handleAmountChange}
            />
            <span className="amount-display">{formatCurrency(formData.drawing)}</span>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="form-row percentage-row">
        <div className="form-group">
          <label>Documents % (Configured)</label>
          <div className="input-with-suffix readonly-field">
            <input 
              type="number" 
              name="documentsPercent" 
              className="form-input readonly" 
              value={formData.documentsPercent || 0} 
              readOnly
              min="0"
              max="100"
              step="0.1"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>
        <div className="form-group">
          <label>Amount (Auto-calculated)</label>
          <div className="calculated-amount">
            <input 
              type="number" 
              name="documents" 
              className="form-input calculated" 
              value={formData.documents || ""}
              onChange={handleAmountChange}
            />
            <span className="amount-display">{formatCurrency(formData.documents)}</span>
          </div>
        </div>
      </div>

      {/* Site Visit */}
      <div className="form-row percentage-row">
        <div className="form-group">
          <label>Site Visit % (Configured)</label>
          <div className="input-with-suffix readonly-field">
            <input 
              type="number" 
              name="siteVisitPercent" 
              className="form-input readonly" 
              value={formData.siteVisitPercent || 0} 
              readOnly
              min="0"
              max="100"
              step="0.1"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>
        <div className="form-group">
          <label>Amount (Auto-calculated)</label>
          <div className="calculated-amount">
            <input 
              type="number" 
              name="siteVisit" 
              className="form-input calculated" 
              value={formData.siteVisit || ""}
              onChange={handleAmountChange}
            />
            <span className="amount-display">{formatCurrency(formData.siteVisit)}</span>
          </div>
        </div>
      </div>

      {/* Marketing & Misc */}
      <div className="form-row percentage-row">
        <div className="form-group">
          <label>Marketing & Misc % (Configured)</label>
          <div className="input-with-suffix readonly-field">
            <input 
              type="number" 
              name="marketingAndMiscPercent" 
              className="form-input readonly" 
              value={formData.marketingAndMiscPercent || 0} 
              readOnly
              min="0"
              max="100"
              step="0.1"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>
        <div className="form-group">
          <label>Amount (Auto-calculated)</label>
          <div className="calculated-amount">
            <input 
              type="number" 
              name="marketingAndMisc" 
              className="form-input calculated" 
              value={formData.marketingAndMisc || ""}
              onChange={handleAmountChange}
            />
            <span className="amount-display">{formatCurrency(formData.marketingAndMisc)}</span>
          </div>
        </div>
      </div>

      {/* Office Management */}
      <div className="form-row percentage-row">
        <div className="form-group">
          <label>Office Management % (Configured)</label>
          <div className="input-with-suffix readonly-field">
            <input 
              type="number" 
              name="officeManagementPercent" 
              className="form-input readonly" 
              value={formData.officeManagementPercent || 0} 
              readOnly
              min="0"
              max="100"
              step="0.1"
            />
            <span className="input-suffix">%</span>
          </div>
        </div>
        <div className="form-group">
          <label>Amount (Auto-calculated)</label>
          <div className="calculated-amount">
            <input 
              type="number" 
              name="officeManagement" 
              className="form-input calculated" 
              value={formData.officeManagement || ""}
              onChange={handleAmountChange}
            />
            <span className="amount-display">{formatCurrency(formData.officeManagement)}</span>
          </div>
        </div>
      </div>

      {/* Custom Fields */}
      {percentageConfig.customFields && percentageConfig.customFields.length > 0 && (
        <>
          <div className="form-section-divider" style={{ margin: '20px 0', borderTop: '2px solid #e9ecef' }}></div>
          <div className="form-section-header">
            <h4 style={{ color: '#6c757d', fontSize: '16px', margin: '0 0 15px 0' }}>🔧 Custom Fields</h4>
          </div>
          {percentageConfig.customFields.map((customField, index) => {
            const amountFieldName = customField.fieldName.replace('Percent', '');
            return (
              <div key={customField.fieldName} className="form-row percentage-row">
                <div className="form-group">
                  <label>{customField.name} % (Configured)</label>
                  <div className="input-with-suffix readonly-field">
                    <input 
                      type="number" 
                      name={customField.fieldName} 
                      className="form-input readonly" 
                      value={formData[customField.fieldName] || 0} 
                      readOnly
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="input-suffix">%</span>
                  </div>
                </div>
                <div className="form-group">
                  <label>Amount (Auto-calculated)</label>
                  <div className="calculated-amount">
                    <input 
                      type="number" 
                      name={amountFieldName} 
                      className="form-input calculated" 
                      value={formData[amountFieldName] || ""}
                      onChange={handleAmountChange}
                    />
                    <span className="amount-display">{formatCurrency(formData[amountFieldName])}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      <div className="form-row">
        <div className="form-group">
          <label>Status</label>
          <select name="status" className="form-input" value={formData.status || 'Active'} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </>
  );
};

// Expense Form
const ExpenseForm = ({ formData, handleChange }) => (
  <>
    <div className="form-row">
      <div className="form-group">
        <label>Bank Name *</label>
        <select name="bankName" className="form-input" value={formData.bankName || 'Bank 1'} onChange={handleChange} required>
          <option value="Bank 1">Bank 1</option>
          <option value="Bank 2">Bank 2</option>
          <option value="Bank 3">Bank 3</option>
          <option value="Bank 4">Bank 4</option>
        </select>
      </div>
      <div className="form-group">
        <label>Month *</label>
        <select name="month" className="form-input" value={formData.month || 'April'} onChange={handleChange} required>
          {['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'].map(month => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
      </div>
    </div>

    <div className="form-group">
      <label>Year *</label>
      <input type="text" name="year" className="form-input" value={formData.year || ''} onChange={handleChange} required />
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Amount</label>
        <input type="number" name="amount" className="form-input" value={formData.amount || ""} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Drawing</label>
        <input type="number" name="drawing" className="form-input" value={formData.drawing || ""} onChange={handleChange} />
      </div>
    </div>

    <div className="form-row">
      <div className="form-group">
        <label>Site Visit</label>
        <input type="number" name="siteVisit" className="form-input" value={formData.siteVisit || ""} onChange={handleChange} />
      </div>
      <div className="form-group">
        <label>Office Management</label>
        <input type="number" name="officeManagement" className="form-input" value={formData.officeManagement || ""} onChange={handleChange} />
      </div>
    </div>

    <div className="form-group">
      <label>Description</label>
      <input type="text" name="description" className="form-input" value={formData.description || ''} onChange={handleChange} />
    </div>
  </>
);

// Percentage Configuration Modal Component
const PercentageConfigModal = ({ config, onSave, onClose }) => {
  const [tempConfig, setTempConfig] = useState({
    ...config,
    associates: config.associates || [{ name: '', company: '', percentage: 0 }],
    customFields: config.customFields || []
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTempConfig({
      ...tempConfig,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    });
  };

  const handleNumberOfAssociatesChange = (e) => {
    const count = parseInt(e.target.value) || 1;
    const newAssociates = Array.from({ length: count }, (_, index) => 
      tempConfig.associates[index] || { name: '', company: '', percentage: 0 }
    );
    
    setTempConfig({
      ...tempConfig,
      numberOfAssociates: count,
      associates: newAssociates
    });
  };

  const handleAssociateChange = (index, field, value) => {
    const updatedAssociates = tempConfig.associates.map((associate, i) => 
      i === index ? { 
        ...associate, 
        [field]: field === 'percentage' ? parseFloat(value) || 0 : value 
      } : associate
    );
    
    setTempConfig({
      ...tempConfig,
      associates: updatedAssociates
    });
  };

  const handleCustomFieldChange = (index, field, value) => {
    const updatedCustomFields = tempConfig.customFields.map((customField, i) => {
      if (i === index) {
        const updatedField = { 
          ...customField, 
          [field]: field === 'percentage' ? parseFloat(value) || 0 : value 
        };
        
        // If the name is being updated, also update the fieldName
        if (field === 'name') {
          // Create a clean field name by removing spaces and special chars, then add Percent
          const cleanName = value.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          updatedField.fieldName = cleanName ? `${cleanName}Percent` : `customField${index + 1}Percent`;
        }
        
        return updatedField;
      }
      return customField;
    });
    
    setTempConfig({
      ...tempConfig,
      customFields: updatedCustomFields
    });
  };

  const addCustomField = () => {
    const defaultName = 'New Field';
    const newCustomField = {
      name: defaultName,
      fieldName: `customField${tempConfig.customFields.length + 1}Percent`,
      percentage: 0
    };
    
    setTempConfig({
      ...tempConfig,
      customFields: [...tempConfig.customFields, newCustomField]
    });
  };

  const removeCustomField = (index) => {
    const updatedCustomFields = tempConfig.customFields.filter((_, i) => i !== index);
    setTempConfig({
      ...tempConfig,
      customFields: updatedCustomFields
    });
  };

  const calculateTotalPercentage = () => {
    const expenseTotal = Object.keys(tempConfig)
      .filter(key => key.endsWith('Percent') && key !== 'includeAssociates')
      .reduce((sum, key) => sum + (tempConfig[key] || 0), 0);
    
    const associateTotal = tempConfig.includeAssociates 
      ? tempConfig.associates.reduce((sum, associate) => sum + (associate.percentage || 0), 0)
      : 0;

    const customFieldsTotal = tempConfig.customFields.reduce((sum, field) => sum + (field.percentage || 0), 0);
    
    return expenseTotal + associateTotal + customFieldsTotal;
  };

  const handleSave = () => {
    const total = calculateTotalPercentage();
    if (total > 100) {
      alert('Total percentage cannot exceed 100%');
      return;
    }
    
    // Clean up associates array if not including associates
    const configToSave = {
      ...tempConfig,
      associates: tempConfig.includeAssociates ? tempConfig.associates : [],
      customFields: tempConfig.customFields || []
    };
    
    onSave(configToSave);
    onClose();
  };

  return (
    <div className="modal" style={{ 
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: '1000',
      padding: '20px',
      boxSizing: 'border-box',
      overflow: 'auto'
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
      }}>
        <div className="modal-header" style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: '0',
          backgroundColor: 'white',
          zIndex: '10'
        }}>
          <h2 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>⚙️ Configure Expense Percentages</h2>
          <button className="close-btn" onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#6c757d',
            padding: '4px',
            borderRadius: '4px',
            lineHeight: '1'
          }}>×</button>
        </div>
        
        <div className="modal-body" style={{
          padding: '20px 24px',
          maxHeight: 'calc(90vh - 140px)',
          overflow: 'auto'
        }}>
          <div className="percentage-info" style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#495057' }}>💡 Set the default percentages for expense allocation. These will be used automatically when you create new projects.</p>
            <p style={{ margin: '0', fontWeight: '600', fontSize: '16px', color: '#2c3e50' }}><strong>Current Total: {calculateTotalPercentage().toFixed(1)}%</strong></p>
          </div>

          {/* Associates Section */}
          <div className="associates-section" style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <input
                  type="checkbox"
                  name="includeAssociates"
                  checked={tempConfig.includeAssociates || false}
                  onChange={handleChange}
                  style={{ marginRight: '5px' }}
                />
                <span style={{ fontWeight: '500', fontSize: '16px' }}>👥 Include Associates</span>
              </label>
            </div>

            {tempConfig.includeAssociates && (
              <>
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>Number of Associates (max 5)</label>
                  <select 
                    value={tempConfig.numberOfAssociates || 1}
                    onChange={handleNumberOfAssociatesChange}
                    className="form-input"
                    style={{ width: '150px' }}
                  >
                    {[1, 2, 3, 4, 5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div className="associates-grid">
                  {tempConfig.associates.map((associate, index) => (
                    <div key={index} className="associate-row" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr 120px', 
                      gap: '10px', 
                      marginBottom: '10px',
                      padding: '10px',
                      backgroundColor: 'white',
                      borderRadius: '5px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '14px', marginBottom: '5px' }}>Associate Name</label>
                        <input
                          type="text"
                          placeholder="Enter name"
                          value={associate.name || ''}
                          onChange={(e) => handleAssociateChange(index, 'name', e.target.value)}
                          className="form-input"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '14px', marginBottom: '5px' }}>Company Name</label>
                        <input
                          type="text"
                          placeholder="Enter company"
                          value={associate.company || ''}
                          onChange={(e) => handleAssociateChange(index, 'company', e.target.value)}
                          className="form-input"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '14px', marginBottom: '5px' }}>Share %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={associate.percentage || ''}
                          onChange={(e) => handleAssociateChange(index, 'percentage', e.target.value)}
                          className="form-input"
                          style={{ fontSize: '14px' }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {tempConfig.includeAssociates && (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '8px', 
                      backgroundColor: '#fff3cd', 
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}>
                      <strong>Associates Total: {tempConfig.associates.reduce((sum, a) => sum + (a.percentage || 0), 0).toFixed(1)}%</strong>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="form-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}>
            <div className="form-group" style={{ margin: '0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>Profit Margin %</label>
              <input 
                type="number" 
                name="profitMarginPercent" 
                className="form-input" 
                value={tempConfig.profitMarginPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div className="form-group" style={{ margin: '0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>Drawing %</label>
              <input 
                type="number" 
                name="drawingPercent" 
                className="form-input" 
                value={tempConfig.drawingPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div className="form-group" style={{ margin: '0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>Documents %</label>
              <input 
                type="number" 
                name="documentsPercent" 
                className="form-input" 
                value={tempConfig.documentsPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div className="form-group" style={{ margin: '0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>Site Visit %</label>
              <input 
                type="number" 
                name="siteVisitPercent" 
                className="form-input" 
                value={tempConfig.siteVisitPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div className="form-group" style={{ margin: '0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>Marketing & Misc %</label>
              <input 
                type="number" 
                name="marketingAndMiscPercent" 
                className="form-input" 
                value={tempConfig.marketingAndMiscPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div className="form-group" style={{ margin: '0' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#495057' }}>Office Management %</label>
              <input 
                type="number" 
                name="officeManagementPercent" 
                className="form-input" 
                value={tempConfig.officeManagementPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="custom-fields-section" style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '15px',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>🔧 Custom Fields</h3>
              <button 
                type="button"
                onClick={addCustomField}
                className="btn btn-secondary"
                style={{ 
                  fontSize: '14px', 
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  border: 'none',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  minWidth: 'fit-content'
                }}
              >
                <span style={{ fontSize: '16px' }}>+</span>
                Add Field
              </button>
            </div>

            {tempConfig.customFields.length === 0 && (
              <p style={{ 
                color: '#666', 
                fontStyle: 'italic', 
                textAlign: 'center',
                margin: '20px 0',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '5px',
                border: '1px dashed #ccc'
              }}>
                No custom fields added yet. Click "Add Field" to create custom percentage categories.
              </p>
            )}

            {tempConfig.customFields.map((customField, index) => (
              <div key={index} className="custom-field-row" style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '15px', 
                marginBottom: '15px',
                padding: '15px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                position: 'relative'
              }}>
                {/* Remove button positioned at top right */}
                <button
                  type="button"
                  onClick={() => removeCustomField(index)}
                  style={{ 
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    fontSize: '18px', 
                    padding: '4px 8px',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#dc3545',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    lineHeight: '1'
                  }}
                  title="Remove this field"
                >
                  ×
                </button>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '15px',
                  alignItems: 'end',
                  paddingRight: '50px' // Space for remove button
                }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
                      Field Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter field name (e.g., Travel Expenses, Legal Fees)"
                      value={customField.name || ''}
                      onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)}
                      className="form-input"
                      style={{ 
                        fontSize: '14px',
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, minWidth: '120px' }}>
                    <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block', fontWeight: '500' }}>
                      Percentage %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0.0"
                      value={customField.percentage || ''}
                      onChange={(e) => handleCustomFieldChange(index, 'percentage', e.target.value)}
                      className="form-input"
                      style={{ 
                        fontSize: '14px',
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        boxSizing: 'border-box',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {tempConfig.customFields.length > 0 && (
              <div style={{ 
                marginTop: '15px', 
                padding: '12px 16px', 
                backgroundColor: '#e7f3ff', 
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#0056b3',
                border: '1px solid #b8daff'
              }}>
                Custom Fields Total: {tempConfig.customFields.reduce((sum, field) => sum + (field.percentage || 0), 0).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer" style={{
          padding: '16px 24px',
          borderTop: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          position: 'sticky',
          bottom: '0',
          backgroundColor: 'white',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          flexWrap: 'wrap'
        }}>
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{
              padding: '10px 20px',
              border: '1px solid #6c757d',
              backgroundColor: 'transparent',
              color: '#6c757d',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '100px'
            }}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: '#007bff',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '100px'
            }}
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
