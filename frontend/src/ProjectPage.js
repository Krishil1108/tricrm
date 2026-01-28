import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaEdit, FaTrash, FaChartPie, FaUsers } from 'react-icons/fa';
import './ProjectPage.css';
import './styles/ClientsPageEnhanced.css';
import './styles/ActionButtons.css';
import FinanceService from './services/FinanceService';
import ClientService from './services/ClientService';
import AssociateService from './services/AssociateService';
import ConfigurationVersionService from './services/ConfigurationVersionService';
import { useAuth } from './contexts/AuthContext';
import { useLoading } from './contexts/LoadingContext';
import { useToast } from './context/ToastContext';
import YearlyDistributionTable from './components/YearlyDistributionTable';
import { dataEventManager, DATA_TYPES } from './services/dataEventManager';
import Watermark from './components/Watermark';

const ProjectPage = () => {
  const location = useLocation();
  const processedEditId = useRef(null);
  const { 
    canViewProjectManagementPage,
    canAddNewProject,
    canEditProject,
    canDeleteProject,
    canConfigurePercentagesGranular,
    canImportExcel,
    canExportExcel,
    canViewProjectSummaryCards,
    canExpenseDistribution,
    canAssociateDistribution,
    hasPermission
  } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');
  const [projects, setProjects] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filters, setFilters] = useState({
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
    customFields: [], // Array of custom fields: { name: 'Custom Field', fieldName: 'customFieldPercent', percentage: 0 }
    // Visibility flags for expense fields in distribution table
    fieldVisibility: {
      profitMargin: false,
      drawing: false,
      documents: false,
      siteVisit: false,
      marketingAndMisc: false,
      officeManagement: false
    }
  });
  const [showPercentageConfig, setShowPercentageConfig] = useState(false);
  const [selectedProjectForDistribution, setSelectedProjectForDistribution] = useState(null);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [selectedProjectForAssociateDistribution, setSelectedProjectForAssociateDistribution] = useState(null);
  const [showAssociateDistributionModal, setShowAssociateDistributionModal] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(30);
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
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
  
  // Associate-related state
  const [associates, setAssociates] = useState([]);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [associateFormData, setAssociateFormData] = useState({
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

  // Handle modal close and reset edit state
  const handleCloseModal = () => {
    console.log('Closing modal, current editing item:', editingItem);
    setShowModal(false);
    
    // Clear state after modal animation completes
    setTimeout(() => {
      setEditingItem(null);
      setFormData({});
      processedEditId.current = null; // Reset the processed edit ID
      console.log('Modal state cleared');
    }, 300);
  };

  useEffect(() => {
    fetchData();
    fetchStats();
    loadPercentageConfig();
    loadClients();
    loadAssociates();
  }, [activeTab, filterStatus, filters.year]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setDropdownOpenId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Handle editProjectId from location state
  useEffect(() => {
    const editProjectId = location.state?.editProjectId;
    
    // Only proceed if we have an editProjectId and haven't processed this ID before
    if (editProjectId && processedEditId.current !== editProjectId && !showModal) {
      processedEditId.current = editProjectId;
      
      // Load the specific project for editing
      const loadProjectForEdit = async () => {
        try {
          setLoading(true);
          const response = await FinanceService.getProject(editProjectId);
          
          // Handle both direct data and nested response structure
          const projectData = response.data || response;
          
          if (projectData) {
            console.log('Loaded project data for editing:', projectData);
            
            // Set the active tab to projects
            setActiveTab('projects');
            
            // Prepare form data with proper structure and date formatting
            const formDataForEdit = {
              ...projectData,
              // Ensure required fields exist
              projectNumber: projectData.projectNumber || '',
              projectName: projectData.projectName || '',
              clientId: projectData.clientId || projectData.client?._id || '',
              clientName: projectData.clientName || projectData.client?.name || '',
              // Convert dates to proper format for date inputs
              date: formatDateForInput(projectData.date),
              completionDate: formatDateForInput(projectData.completionDate),
              // Ensure financial fields exist
              finalizedFees: projectData.finalizedFees || 0,
              totalReceivedFees: projectData.totalReceivedFees || 0,
              // Preserve other fields
              status: projectData.status || 'Active',
              projectAssociates: projectData.projectAssociates || [],
              payments: projectData.payments || []
            };
            
            console.log('Setting form data:', formDataForEdit);
            
            // Set editing item first to prevent conflicts
            setEditingItem(projectData);
            
            // Then set form data
            setFormData(formDataForEdit);
            
            // Finally show modal after a small delay
            setTimeout(() => {
              setShowModal(true);
              console.log('Modal opened with formData:', formDataForEdit);
            }, 150); // Small delay to ensure state is set
            
            // Clear the state to prevent re-triggering
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
        } catch (error) {
          console.error('Error loading project for editing:', error);
          showError('Failed to load project for editing');
          processedEditId.current = null; // Reset on error
        } finally {
          setLoading(false);
        }
      };

      loadProjectForEdit();
    }
  }, [location.state?.editProjectId]); // Remove showModal from dependencies to prevent loops

  // Helper function to convert ISO date to yyyy-MM-dd format for date inputs
  const formatDateForInput = (isoDate) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

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

  const loadAssociates = async () => {
    try {
      const associatesData = await AssociateService.getAllAssociates();
      setAssociates(Array.isArray(associatesData) ? associatesData : []);
    } catch (error) {
      console.error('Error loading associates:', error);
      showError('Failed to load associates');
      setAssociates([]);
    }
  };

  const loadPercentageConfig = async () => {
    try {
      // Try to load from version service first
      const currentConfigData = await ConfigurationVersionService.getCurrentConfiguration();
      if (currentConfigData && currentConfigData.data) {
        const config = currentConfigData.data.configuration;
        
        // Ensure default values for all fields
        const configWithDefaults = {
          profitMarginPercent: config.profitMarginPercent || 0,
          drawingPercent: config.drawingPercent || 0,
          documentsPercent: config.documentsPercent || 0,
          siteVisitPercent: config.siteVisitPercent || 0,
          marketingAndMiscPercent: config.marketingAndMiscPercent || 0,
          officeManagementPercent: config.officeManagementPercent || 0,
          includeAssociates: config.includeAssociates || false,
          numberOfAssociates: config.numberOfAssociates || 1,
          associates: config.associates || [{ id: '', name: '', company: '', percentage: 0 }],
          customFields: config.customFields || [],
          fieldVisibility: {
            profitMargin: config.fieldVisibility?.profitMargin || false,
            drawing: config.fieldVisibility?.drawing || false,
            documents: config.fieldVisibility?.documents || false,
            siteVisit: config.fieldVisibility?.siteVisit || false,
            marketingAndMisc: config.fieldVisibility?.marketingAndMisc || false,
            officeManagement: config.fieldVisibility?.officeManagement || false
          },
          _currentVersion: currentConfigData.data.version
        };
        
        // Fix any existing custom fields with incorrect fieldNames
        if (configWithDefaults.customFields && configWithDefaults.customFields.length > 0) {
          configWithDefaults.customFields = configWithDefaults.customFields.map(field => {
            const updatedField = {
              ...field,
              visible: field.visible !== undefined ? field.visible : false
            };
            
            if (updatedField.name && updatedField.name.trim()) {
              const expectedFieldName = updatedField.name.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + 'Percent';
              if (updatedField.fieldName !== expectedFieldName && !updatedField.fieldName.includes(updatedField.name.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase())) {
                updatedField.fieldName = expectedFieldName;
              }
            }
            return updatedField;
          });
        }
        
        setPercentageConfig(configWithDefaults);
        // Also save to localStorage as backup
        localStorage.setItem('finance-percentage-config', JSON.stringify(configWithDefaults));
        return;
      }
    } catch (error) {
      console.error('Error loading from version service:', error);
      console.log('Falling back to localStorage');
    }
    
    // Fallback to localStorage if version service fails
    try {
      const savedConfig = localStorage.getItem('finance-percentage-config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
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
          customFields: [],
          fieldVisibility: {
            profitMargin: false,
            drawing: false,
            documents: false,
            siteVisit: false,
            marketingAndMisc: false,
            officeManagement: false
          },
          ...parsedConfig
        };
        
        if (configWithDefaults.customFields && configWithDefaults.customFields.length > 0) {
          configWithDefaults.customFields = configWithDefaults.customFields.map(field => {
            const updatedField = {
              ...field,
              visible: field.visible !== undefined ? field.visible : false
            };
            
            if (updatedField.name && updatedField.name.trim()) {
              const expectedFieldName = updatedField.name.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase() + 'Percent';
              if (updatedField.fieldName !== expectedFieldName && !updatedField.fieldName.includes(updatedField.name.trim().replace(/[^a-zA-Z0-9]/g, '').toLowerCase())) {
                updatedField.fieldName = expectedFieldName;
              }
            }
            return updatedField;
          });
          
          localStorage.setItem('finance-percentage-config', JSON.stringify(configWithDefaults));
        }
        
        setPercentageConfig(configWithDefaults);
      }
    } catch (error) {
      console.error('Error loading percentage configuration:', error);
    }
  };

  const savePercentageConfig = async (config, changeDescription = '') => {
    try {
      // Remove internal tracking fields before saving
      const configToSave = { ...config };
      delete configToSave._currentVersion;
      
      // Save to version service
      const result = await ConfigurationVersionService.saveConfiguration(
        configToSave,
        changeDescription
      );
      
      // Also save to localStorage as backup
      localStorage.setItem('finance-percentage-config', JSON.stringify(config));
      
      // Extract version number safely
      const versionNumber = result?.data?.version || result?.version || 1;
      
      // Update local state with new version
      setPercentageConfig({
        ...config,
        _currentVersion: versionNumber
      });
      
      showSuccess(`Configuration v${versionNumber} saved successfully`);
    } catch (error) {
      showError('Error saving configuration');
      console.error('Error saving percentage configuration:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const apiFilters = { 
        status: filterStatus,
        year: filters.year 
      };
      if (activeTab === 'projects') {
        const response = await FinanceService.getAllProjects(apiFilters);
        setProjects(response.data || []);
      } else {
        const response = await FinanceService.getAllExpenses(apiFilters);
        setExpenses(response.data || []);
      }
    } catch (error) {
      showError('Error loading data');
      console.error(error);
    } finally {
      setLoading(false);
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
      const apiFilters = { 
        status: filterStatus,
        year: filters.year 
      };
      if (activeTab === 'projects') {
        await FinanceService.exportProjects();
      } else {
        await FinanceService.exportExpenses(apiFilters);
      }
      showSuccess('Export successful');
    } catch (error) {
      showError('Export failed');
    } finally {
      hideLoading();
    }
  };

  const handleApplyDefaultPercentages = async () => {
    if (!window.confirm('This will apply default expense distribution percentages (Profit Margin: 40%, Drawing: 30%, Documents: 2%, Site Visit: 10%, Marketing & Misc: 3%, Office Management: 15%) to all projects that don\'t have percentages configured. Continue?')) {
      return;
    }

    try {
      console.log('🚀 Starting apply default percentages...');
      showLoading('Applying default percentages...');
      
      const response = await FinanceService.applyDefaultPercentages();
      console.log('📊 Full response:', response);
      
      if (response.success) {
        const updatedCount = response.data?.updated || 0;
        console.log('✅ Updated count:', updatedCount);
        
        if (updatedCount > 0) {
          showSuccess(`Successfully applied default percentages to ${updatedCount} project(s)`);
          fetchData(); // Refresh the project list
          fetchStats(); // Refresh statistics
        } else {
          showSuccess('All projects already have expense distribution configured');
        }
      } else {
        console.error('❌ Response success was false:', response);
        showError('Failed to apply default percentages');
      }
    } catch (error) {
      console.error('💥 Caught error in handleApplyDefaultPercentages:', error);
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Failed to apply default percentages';
      
      if (error.response) {
        // Server responded with error
        console.error('Server error response:', error.response);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something else happened
        console.error('Request setup error:', error.message);
        errorMessage = error.message || errorMessage;
      }
      
      showError(errorMessage);
    } finally {
      hideLoading();
      console.log('🏁 Apply default percentages completed');
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
        projectLocation: '',
        clientId: '',
        projectAssociates: [], // Changed to array for multiple associates
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
      id: payment._id || `existing_payment_${index}_${Date.now()}`,
      date: formatDateForInput(payment.date) // Convert ISO date to yyyy-MM-dd
    }));
    
    let itemWithPayments = {
      ...item,
      payments: paymentsWithIds,
      paymentGivenDate: formatDateForInput(item.paymentGivenDate), // Format payment given date
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
      id: payment._id || `existing_payment_${index}_${Date.now()}`,
      date: formatDateForInput(payment.date) // Convert ISO date to yyyy-MM-dd
    }));
    
    const projectWithPayments = {
      ...project,
      payments: paymentsWithIds,
      yearlyDistribution: paymentsWithIds.length > 0 ? calculateYearlyDistribution(paymentsWithIds) : {}
    };
    
    setSelectedProjectForDistribution(projectWithPayments);
    setShowDistributionModal(true);
  };

  const handleViewAssociateDistribution = (project) => {
    setSelectedProjectForAssociateDistribution(project);
    setShowAssociateDistributionModal(true);
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
        
        // Validate no duplicate associates
        if (formData.projectAssociates && formData.projectAssociates.length > 0) {
          const associateIds = formData.projectAssociates
            .map(a => a.associateId)
            .filter(id => id); // Remove empty values
          
          const uniqueIds = new Set(associateIds);
          if (associateIds.length !== uniqueIds.size) {
            showError('You cannot select the same associate multiple times in one project');
            hideLoading();
            return;
          }
          
          // Validate that all associates have required fields
          const hasInvalidAssociate = formData.projectAssociates.some(a => {
            return a.associateId && (!a.percentage || a.percentage <= 0);
          });
          
          if (hasInvalidAssociate) {
            showError('All selected associates must have a valid share percentage');
            hideLoading();
            return;
          }
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
      const objectIdFields = ['clientId', 'associateId'];
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
      handleCloseModal();
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

  // Associate management functions
  const handleOpenAssociateModal = () => {
    setAssociateFormData({
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
    setShowAssociateModal(true);
  };

  const handleCloseAssociateModal = () => {
    setShowAssociateModal(false);
    setAssociateFormData({
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

  const handleAssociateInputChange = (e) => {
    const { name, value } = e.target;
    setAssociateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssociateSubmit = async (e) => {
    e.preventDefault();
    try {
      showLoading();
      
      // Create the full address string
      const fullAddress = [
        associateFormData.address,
        associateFormData.city,
        associateFormData.state,
        associateFormData.zipCode
      ].filter(part => part.trim()).join(', ');

      const associateDataToSend = {
        name: associateFormData.name,
        email: associateFormData.email,
        phone: associateFormData.phone,
        company: associateFormData.company,
        address: fullAddress,
        notes: associateFormData.notes
      };

      const newAssociate = await AssociateService.createAssociate(associateDataToSend);
      
      // Update the associates list
      setAssociates(prev => [...prev, newAssociate]);
      
      // Auto-select the newly created associate in the project form
      setFormData(prev => ({
        ...prev,
        associateId: newAssociate._id
      }));
      
      showSuccess('Associate added successfully');
      handleCloseAssociateModal();
    } catch (error) {
      console.error('Error creating associate:', error);
      showError('Failed to create associate: ' + (error.response?.data?.message || error.message));
    } finally {
      hideLoading();
    }
  };

  // Pagination and filtering logic
  // Filter and paginate projects
  const getFilteredProjects = () => {
    return projects.filter(project => {
      const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.projectNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (project.projectLocation && project.projectLocation.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (project.clientName && project.clientName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    });
  };

  const getPaginatedProjects = () => {
    const filtered = getFilteredProjects();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  // Filter and paginate expenses
  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           expense.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (expense.projectName && expense.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  };

  const getPaginatedExpenses = () => {
    const filtered = getFilteredExpenses();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };

  // Pagination helpers
  const getTotalPages = () => {
    const filteredData = activeTab === 'projects' ? getFilteredProjects() : getFilteredExpenses();
    return Math.ceil(filteredData.length / itemsPerPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab]);

  return (
    <div className="project-page">
      {loading && (
        <div className="loading-message">
          <div className="loading-spinner" aria-hidden="true"></div>
        </div>
      )}
      
      <div className="modern-page-header">
        <div className="header-content-enhanced">
          <div className="header-title-section">
            <div className="title-icon-wrapper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="header-icon">
                <path d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3Z"/>
              </svg>
              <h1 className="page-title-enhanced">Project Management</h1>
            </div>
          </div>
          <div className="header-actions-enhanced">
            {canAddNewProject() && (
              <button className="btn-primary-modern add-client-enhanced" onClick={handleAdd}>
                <div className="btn-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                  </svg>
                </div>
                <span className="btn-text">Add Project</span>
              </button>
            )}
            {activeTab === 'projects' && canConfigurePercentagesGranular() && (
              <button className="btn-secondary-modern export-enhanced" onClick={() => setShowPercentageConfig(true)}>
                <div className="btn-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
                  </svg>
                </div>
                <span className="btn-text">Configure</span>
              </button>
            )}
            {activeTab === 'projects' && canConfigurePercentagesGranular() && (
              <button className="btn-secondary-modern export-enhanced" onClick={handleApplyDefaultPercentages}>
                <div className="btn-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9,10H7V12H9V10M13,10H11V12H13V10M17,10H15V12H17V10M19,3H18V1H16V3H8V1H6V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
                  </svg>
                </div>
                <span className="btn-text">Apply Defaults</span>
              </button>
            )}
            {activeTab === 'projects' && canImportExcel() && (
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
                  className="btn-tertiary-modern import-enhanced"
                  tabIndex="0"
                  role="button"
                  aria-label="Import Excel file"
                  onKeyDown={handleKeyDown}
                >
                  <div className="btn-icon-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L8,15H10.5V12H13.5V15H16L12,19Z"/>
                    </svg>
                  </div>
                  <span className="btn-text">Import</span>
                </label>
              </>
            )}
            {canExportExcel() && (
              <button className="btn-secondary-modern export-enhanced" onClick={handleExport}>
                <div className="btn-icon-wrapper">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                </div>
                <div className="btn-content">
                  <span className="btn-text">Export</span>
                  <span className="btn-count">({activeTab === 'projects' ? getFilteredProjects().length : getFilteredExpenses().length})</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">

        {/* Statistics - Role-based visibility */}
        {stats && canViewProjectSummaryCards() && (
          <div className="stats-grid-enhanced">
            <div className="stat-card-modern total">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3Z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.projects?.total || 0}</div>
                <div className="stat-label">Total Projects</div>
              </div>
            </div>
            <div className="stat-card-modern active">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,6H13V13.25L17.28,15.54L16.5,17L11.5,14.25V6Z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(stats.revenue?.totalReceivedFees)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
            </div>
            <div className="stat-card-modern pending">
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(stats.revenue?.totalExpenses)}</div>
                <div className="stat-label">Total Expenses</div>
              </div>
            </div>
            <div className={`stat-card-modern ${stats.revenue?.netProfit >= 0 ? 'active' : 'inactive'}`}>
              <div className="stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{formatCurrency(stats.revenue?.netProfit)}</div>
                <div className="stat-label">Net Profit</div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Tab Switcher */}
        <div className="modern-tab-container">
          <div className="modern-tabs">
            <button
              className={`modern-tab ${activeTab === 'projects' ? 'active' : ''}`}
              onClick={() => setActiveTab('projects')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              Projects
            </button>
            <button
              className={`modern-tab ${activeTab === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}>
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              Bank Expenses
            </button>
          </div>
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
            placeholder="Search projects by name, number, location, or client..."
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
          {activeTab === 'projects' && (
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
          projects={getPaginatedProjects()}
          totalProjects={getFilteredProjects().length}
          onEdit={handleEdit}
          onViewDistribution={handleViewDistribution}
          onViewAssociateDistribution={handleViewAssociateDistribution}
          onDelete={handleDelete}
          formatCurrency={formatCurrency}
          dropdownOpenId={dropdownOpenId}
          setDropdownOpenId={setDropdownOpenId}
          canEdit={canEditProject}
          canDelete={canDeleteProject}
          canExpenseDistribution={canExpenseDistribution}
          canAssociateDistribution={canAssociateDistribution}
        />
      ) : (
        <ExpensesTable
          expenses={getPaginatedExpenses()}
          totalExpenses={getFilteredExpenses().length}
          onEdit={handleEdit}
          onDelete={handleDelete}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Pagination */}
      {getTotalPages() > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={getTotalPages()}
          onPageChange={handlePageChange}
          totalItems={activeTab === 'projects' ? getFilteredProjects().length : getFilteredExpenses().length}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* Modal */}
      {showModal && (
        <Modal
          activeTab={activeTab}
          formData={formData}
          setFormData={setFormData}
          onSave={handleSave}
          onClose={handleCloseModal}
          isEditing={!!editingItem}
          clients={clients}
          associates={associates}
          onAddClient={handleOpenClientModal}
          onAddAssociate={handleOpenAssociateModal}
          percentageConfig={percentageConfig}
          hasPermission={hasPermission}
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
                fieldVisibility={percentageConfig.fieldVisibility || {}}
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

      {/* Associate Distribution Modal */}
      {showAssociateDistributionModal && selectedProjectForAssociateDistribution && (
        <div className="modal-overlay" onClick={() => setShowAssociateDistributionModal(false)}>
          <div className="modal-content distribution-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👥 Associate Distribution - {selectedProjectForAssociateDistribution.projectName}</h3>
              <button className="modal-close" onClick={() => setShowAssociateDistributionModal(false)}>×</button>
            </div>
            <div className="modal-body distribution-modal-body">
              {selectedProjectForAssociateDistribution.projectAssociates && selectedProjectForAssociateDistribution.projectAssociates.length > 0 ? (
                <div>
                  <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span><strong>Project:</strong> {selectedProjectForAssociateDistribution.projectName}</span>
                      <span><strong>Total Received Fees:</strong> ₹{selectedProjectForAssociateDistribution.totalReceivedFees?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                  </div>

                  <div style={{ border: '1px solid #dee2e6', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                          <th style={{ padding: '16px', textAlign: 'left', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Associate</th>
                          <th style={{ padding: '16px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Share %</th>
                          <th style={{ padding: '16px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Distribution Amount</th>
                          <th style={{ padding: '16px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Amount Paid</th>
                          <th style={{ padding: '16px', textAlign: 'right', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Pending Amount</th>
                          <th style={{ padding: '16px', textAlign: 'center', borderBottom: '2px solid #dee2e6', fontWeight: '600' }}>Payment Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProjectForAssociateDistribution.projectAssociates
                          .filter(assoc => assoc.associateId && assoc.percentage > 0)
                          .map((assoc, index) => {
                            const associateName = associates.find(a => a._id === assoc.associateId)?.name || 'Unknown Associate';
                            const distributionAmount = (selectedProjectForAssociateDistribution.totalReceivedFees * (assoc.percentage / 100));
                            const amountPaid = assoc.amountPaid || 0;
                            const pendingAmount = distributionAmount - amountPaid;
                            
                            return (
                              <tr key={index} style={{ borderBottom: '1px solid #f8f9fa' }}>
                                <td style={{ padding: '16px', borderBottom: '1px solid #f8f9fa' }}>
                                  <strong style={{ color: '#495057' }}>{associateName}</strong>
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #f8f9fa', fontWeight: '600' }}>
                                  {assoc.percentage}%
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #f8f9fa', fontWeight: '600', color: '#28a745', fontSize: '15px' }}>
                                  ₹{distributionAmount.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right', borderBottom: '1px solid #f8f9fa', fontWeight: '500', color: amountPaid > 0 ? '#28a745' : '#6c757d' }}>
                                  ₹{amountPaid.toLocaleString('en-IN')}
                                </td>
                                <td style={{ 
                                  padding: '16px', 
                                  textAlign: 'right', 
                                  borderBottom: '1px solid #f8f9fa',
                                  fontWeight: '600',
                                  fontSize: '15px',
                                  color: pendingAmount > 0 ? '#dc3545' : '#28a745'
                                }}>
                                  ₹{pendingAmount.toLocaleString('en-IN')}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center', borderBottom: '1px solid #f8f9fa', fontSize: '13px', color: '#6c757d' }}>
                                  {assoc.paymentGivenDate ? new Date(assoc.paymentGivenDate).toLocaleDateString('en-IN') : '-'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                      <tfoot>
                        <tr style={{ backgroundColor: '#e9ecef', fontWeight: '600' }}>
                          <td style={{ padding: '16px', borderTop: '2px solid #dee2e6', fontSize: '15px' }}>TOTAL</td>
                          <td style={{ padding: '16px', textAlign: 'center', borderTop: '2px solid #dee2e6', fontSize: '15px' }}>
                            {selectedProjectForAssociateDistribution.projectAssociates
                              .filter(assoc => assoc.associateId && assoc.percentage > 0)
                              .reduce((sum, a) => sum + (parseFloat(a.percentage) || 0), 0)
                              .toFixed(2)}%
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', borderTop: '2px solid #dee2e6', color: '#28a745', fontSize: '16px', fontWeight: 'bold' }}>
                            ₹{selectedProjectForAssociateDistribution.projectAssociates
                              .filter(assoc => assoc.associateId && assoc.percentage > 0)
                              .reduce((sum, a) => sum + (selectedProjectForAssociateDistribution.totalReceivedFees * ((a.percentage || 0) / 100)), 0)
                              .toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', borderTop: '2px solid #dee2e6', color: '#28a745', fontSize: '15px', fontWeight: 'bold' }}>
                            ₹{selectedProjectForAssociateDistribution.projectAssociates
                              .reduce((sum, a) => sum + (a.amountPaid || 0), 0)
                              .toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right', borderTop: '2px solid #dee2e6', color: '#dc3545', fontSize: '16px', fontWeight: 'bold' }}>
                            ₹{selectedProjectForAssociateDistribution.projectAssociates
                              .filter(assoc => assoc.associateId && assoc.percentage > 0)
                              .reduce((sum, a) => {
                                const distributionAmount = selectedProjectForAssociateDistribution.totalReceivedFees * ((a.percentage || 0) / 100);
                                const amountPaid = a.amountPaid || 0;
                                return sum + (distributionAmount - amountPaid);
                              }, 0)
                              .toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '16px', borderTop: '2px solid #dee2e6' }}>-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '16px', 
                    backgroundColor: '#fff3cd', 
                    borderRadius: '8px',
                    border: '1px solid #ffc107',
                    fontSize: '14px',
                    color: '#856404'
                  }}>
                    💡 <strong>Note:</strong> Distribution amounts are calculated based on the total received fees (₹{selectedProjectForAssociateDistribution.totalReceivedFees?.toLocaleString('en-IN') || '0'}) and each associate's percentage share. This distribution is deducted before expense calculations.
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                  <h4>No Associates Found</h4>
                  <p>This project doesn't have any associates assigned with percentage shares.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAssociateDistributionModal(false)}>
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

      {/* Associate Modal */}
      {showAssociateModal && (
        <div className="modal-overlay" onClick={handleCloseAssociateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Associate</h2>
              <button className="modal-close" onClick={handleCloseAssociateModal}>×</button>
            </div>

            <form onSubmit={handleAssociateSubmit} className="modal-body">
              <div className="form-section">
                <h3>Personal Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="associate-name">Full Name *</label>
                    <input
                      type="text"
                      id="associate-name"
                      name="name"
                      className="form-input"
                      value={associateFormData.name}
                      onChange={handleAssociateInputChange}
                      placeholder="Enter associate's full name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="associate-email">Email Address *</label>
                    <input
                      type="email"
                      id="associate-email"
                      name="email"
                      className="form-input"
                      value={associateFormData.email}
                      onChange={handleAssociateInputChange}
                      placeholder="associate@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="associate-phone">Phone Number</label>
                    <input
                      type="tel"
                      id="associate-phone"
                      name="phone"
                      className="form-input"
                      value={associateFormData.phone}
                      onChange={handleAssociateInputChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="associate-company">Company</label>
                    <input
                      type="text"
                      id="associate-company"
                      name="company"
                      className="form-input"
                      value={associateFormData.company}
                      onChange={handleAssociateInputChange}
                      placeholder="Company name"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Address Information</h3>
                <div className="form-group">
                  <label htmlFor="associate-address">Street Address</label>
                  <input
                    type="text"
                    id="associate-address"
                    name="address"
                    className="form-input"
                    value={associateFormData.address}
                    onChange={handleAssociateInputChange}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="associate-city">City</label>
                    <input
                      type="text"
                      id="associate-city"
                      name="city"
                      className="form-input"
                      value={associateFormData.city}
                      onChange={handleAssociateInputChange}
                      placeholder="City"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="associate-state">State/Province</label>
                    <input
                      type="text"
                      id="associate-state"
                      name="state"
                      className="form-input"
                      value={associateFormData.state}
                      onChange={handleAssociateInputChange}
                      placeholder="State"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="associate-zipCode">ZIP/Postal Code</label>
                    <input
                      type="text"
                      id="associate-zipCode"
                      name="zipCode"
                      className="form-input"
                      value={associateFormData.zipCode}
                      onChange={handleAssociateInputChange}
                      placeholder="12345"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Additional Information</h3>
                <div className="form-group">
                  <label htmlFor="associate-notes">Notes</label>
                  <textarea
                    id="associate-notes"
                    name="notes"
                    className="form-input"
                    rows="3"
                    value={associateFormData.notes}
                    onChange={handleAssociateInputChange}
                    placeholder="Any additional notes about the associate..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="finance-btn finance-btn-secondary" onClick={handleCloseAssociateModal}>
                  Cancel
                </button>
                <button type="submit" className="finance-btn finance-btn-primary">
                  Add Associate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

// Projects Table Component
const ProjectsTable = ({ projects, onEdit, onViewDistribution, onViewAssociateDistribution, onDelete, formatCurrency, dropdownOpenId, setDropdownOpenId, canEdit, canDelete, canExpenseDistribution, canAssociateDistribution }) => {
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
    <div className="project-table-container" style={{ position: 'relative', overflow: 'visible' }}>
      <table className="project-table">
        <thead>
          <tr>
            <th>Project Number</th>
            <th>Project Name</th>
            <th>Project Location</th>
            <th>Finalized Fees</th>
            <th>Received Fees</th>
            <th>Status</th>
            <th style={{textAlign: 'center'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project._id}>
              <td>{project.projectNumber}</td>
              <td>{project.projectName}</td>
              <td>{project.projectLocation || '-'}</td>
              <td>{formatCurrency(project.finalizedFees)}</td>
              <td>{formatCurrency(project.totalReceivedFees)}</td>
              <td>
                <span className={`status-badge status-${project.status.toLowerCase().replace(' ', '')}`}>
                  {project.status}
                </span>
              </td>
              <td>
                <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', position: 'relative' }}>
                  {canEdit() && (
                    <button
                      onClick={() => onEdit(project)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      style={{ padding: '8px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                      title="Edit Project"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <FaEdit className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                    </button>
                  )}
                  {canDelete() && (
                    <button
                      onClick={() => onDelete(project._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      style={{ padding: '8px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                      title="Delete Project"
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <FaTrash className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                    </button>
                  )}
                  {(canExpenseDistribution() || canAssociateDistribution()) && (
                    <div className="dropdown-container" style={{ position: 'relative', display: 'inline-block' }}>
                      <button 
                        className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpenId(dropdownOpenId === project._id ? null : project._id);
                        }}
                        style={{
                          padding: '8px',
                          color: '#475569',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.2s ease'
                        }}
                        title="More Actions"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        ⋮
                      </button>
                    {dropdownOpenId === project._id && (
                      <div 
                        className="dropdown-menu"
                        style={{
                          position: 'fixed',
                          background: 'white',
                          border: '1px solid #dee2e6',
                          borderRadius: '6px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 9999,
                          minWidth: '180px'
                        }}
                        ref={(el) => {
                          if (el && dropdownOpenId === project._id) {
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
                        {canExpenseDistribution() && (
                          <button 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDistribution(project);
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
                            <FaChartPie style={{ color: '#17a2b8', fontSize: '16px' }} />
                            Expense Distribution
                          </button>
                        )}
                        {canAssociateDistribution() && (
                          <button 
                            className="dropdown-item"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewAssociateDistribution(project);
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
                            <FaUsers style={{ color: '#28a745', fontSize: '16px' }} />
                            Associate Distribution
                          </button>
                        )}
                      </div>
                    )}
                    </div>
                  )}
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
                <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <button
                    onClick={() => onEdit(expense)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    style={{ padding: '8px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    title="Edit Expense"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FaEdit className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
                  </button>
                  <button
                    onClick={() => onDelete(expense._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    style={{ padding: '8px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                    title="Delete Expense"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FaTrash className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
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
const Modal = ({ 
  activeTab, 
  formData, 
  setFormData, 
  onSave, 
  onClose, 
  isEditing, 
  clients, 
  associates = [], 
  onAddClient,
  onAddAssociate, 
  percentageConfig,
  hasPermission 
}) => {
  
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
              addPayment={addPayment}
              removePayment={removePayment}
              updatePayment={updatePayment}
              clients={clients}
              associates={associates}
              onAddClient={onAddClient}
              onAddAssociate={onAddAssociate}
              percentageConfig={percentageConfig}
              hasPermission={hasPermission}
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
const ProjectForm = ({ formData, handleChange, addPayment, removePayment, updatePayment, clients, associates, onAddClient, onAddAssociate, percentageConfig, hasPermission }) => {
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
          <label>Project Number *</label>
          <input type="text" name="projectNumber" className="form-input" value={formData.projectNumber || ''} onChange={handleChange} required />
        </div>
      </div>

      <div className="form-group">
        <label>Project Name *</label>
        <input type="text" name="projectName" className="form-input" value={formData.projectName || ''} onChange={handleChange} required />
      </div>

      <div className="form-group">
        <label>Project Location</label>
        <input type="text" name="projectLocation" className="form-input" value={formData.projectLocation || ''} onChange={handleChange} placeholder="Enter project location (e.g., Mumbai, Delhi, etc.)" />
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
      {hasPermission('finance', 'add_payment') && (
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
      )}

      {hasPermission('finance', 'add_payment') && formData.payments && formData.payments.length > 0 && (
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

      {hasPermission('finance', 'add_payment') && formData.payments && formData.payments.length === 0 && (
        <div className="empty-payments">
          <p>No payments added yet. Click "Add Payment" to start adding payment details.</p>
        </div>
      )}

      {/* Associates Section - Support multiple associates */}
      <div style={{ marginTop: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Associates (Optional)</h3>
          {(!formData.projectAssociates || formData.projectAssociates.length < 5) && (
            <button 
              type="button" 
              className="project-btn project-btn-success"
              onClick={() => {
                const newAssociates = [...(formData.projectAssociates || []), { 
                  associateId: '', 
                  percentage: 0, 
                  amountPaid: 0, 
                  paymentGivenDate: '' 
                }];
                handleChange({ target: { name: 'projectAssociates', value: newAssociates } });
              }}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span>
              Add Associate
            </button>
          )}
        </div>

        {formData.projectAssociates && formData.projectAssociates.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {formData.projectAssociates.map((assoc, index) => (
              <div key={index} style={{ 
                padding: '16px', 
                border: '2px solid #e9ecef', 
                borderRadius: '8px', 
                backgroundColor: '#f8f9fa',
                position: 'relative'
              }}>
                <div style={{ 
                  position: 'absolute', 
                  top: '8px', 
                  right: '8px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#6c757d' }}>
                    Associate #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newAssociates = formData.projectAssociates.filter((_, i) => i !== index);
                      handleChange({ target: { name: 'projectAssociates', value: newAssociates } });
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>

                <div className="form-row" style={{ marginTop: '24px' }}>
                  <div className="form-group">
                    <label>Choose Associate *</label>
                    <select 
                      className="form-input" 
                      value={assoc.associateId || ''} 
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        
                        // Check if this associate is already selected in another row
                        const isDuplicate = formData.projectAssociates.some((a, i) => 
                          i !== index && a.associateId === selectedId && selectedId !== ''
                        );
                        
                        if (isDuplicate) {
                          alert('This associate is already added to this project. Please select a different associate.');
                          return;
                        }
                        
                        const newAssociates = [...formData.projectAssociates];
                        newAssociates[index].associateId = selectedId;
                        handleChange({ target: { name: 'projectAssociates', value: newAssociates } });
                      }}
                      required
                      style={{
                        borderColor: (() => {
                          const isDuplicate = assoc.associateId && formData.projectAssociates.some((a, i) => 
                            i !== index && a.associateId === assoc.associateId
                          );
                          return isDuplicate ? '#dc3545' : '';
                        })()
                      }}
                    >
                      <option value="">Select an associate...</option>
                      {(associates || []).map(associate => {
                        // Check if this associate is already selected in another row
                        const isAlreadySelected = formData.projectAssociates.some((a, i) => 
                          i !== index && a.associateId === associate._id
                        );
                        return (
                          <option 
                            key={associate._id} 
                            value={associate._id}
                            disabled={isAlreadySelected}
                            style={{ color: isAlreadySelected ? '#999' : '' }}
                          >
                            {associate.name} {associate.company ? `(${associate.company})` : ''} {isAlreadySelected ? '(Already added)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {(() => {
                      const isDuplicate = assoc.associateId && formData.projectAssociates.some((a, i) => 
                        i !== index && a.associateId === assoc.associateId
                      );
                      return isDuplicate && (
                        <div style={{ 
                          marginTop: '4px', 
                          fontSize: '12px', 
                          color: '#dc3545',
                          fontWeight: '500'
                        }}>
                          ⚠️ This associate is already added
                        </div>
                      );
                    })()}
                  </div>
                  <div className="form-group">
                    <button 
                      type="button" 
                      className="project-btn project-btn-success add-client-btn"
                      onClick={onAddAssociate}
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
                      Add New Associate
                    </button>
                  </div>
                </div>

                {assoc.associateId && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Share Percentage * <span style={{fontSize: '12px', color: '#666'}}>(Amount will be deducted before expense distribution)</span></label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={assoc.percentage || ''} 
                          onChange={(e) => {
                            const newAssociates = [...formData.projectAssociates];
                            newAssociates[index].percentage = parseFloat(e.target.value) || 0;
                            handleChange({ target: { name: 'projectAssociates', value: newAssociates } });
                          }}
                          min="0"
                          max="100"
                          step="0.01"
                          placeholder="Enter percentage (0-100)"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Amount Paid</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={assoc.amountPaid || 0} 
                          onChange={(e) => {
                            const newAssociates = [...formData.projectAssociates];
                            newAssociates[index].amountPaid = parseFloat(e.target.value) || 0;
                            handleChange({ target: { name: 'projectAssociates', value: newAssociates } });
                          }}
                          min="0"
                          placeholder="Amount already paid"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Payment Given Date (Optional)</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={assoc.paymentGivenDate || ''} 
                          onChange={(e) => {
                            const newAssociates = [...formData.projectAssociates];
                            newAssociates[index].paymentGivenDate = e.target.value;
                            handleChange({ target: { name: 'projectAssociates', value: newAssociates } });
                          }}
                        />
                      </div>
                      <div className="form-group"></div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {(!formData.projectAssociates || formData.projectAssociates.length === 0) && (
          <div style={{ 
            padding: '32px', 
            textAlign: 'center', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '2px dashed #dee2e6'
          }}>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '14px' }}>
              No associates added yet. Click "Add Associate" to add up to 5 associates.
            </p>
          </div>
        )}

        {formData.projectAssociates && formData.projectAssociates.length > 0 && (
          <div style={{ 
            marginTop: '12px', 
            padding: '12px', 
            backgroundColor: '#fff3cd', 
            borderRadius: '6px',
            border: '1px solid #ffc107'
          }}>
            <strong>Total Associate Share: </strong>
            {formData.projectAssociates.reduce((sum, a) => sum + (parseFloat(a.percentage) || 0), 0).toFixed(2)}%
            {formData.projectAssociates.reduce((sum, a) => sum + (parseFloat(a.percentage) || 0), 0) > 100 && (
              <span style={{ color: '#856404', marginLeft: '8px' }}>⚠️ Warning: Total exceeds 100%</span>
            )}
          </div>
        )}


      </div>

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
    associates: config.associates || [{ id: '', name: '', company: '', percentage: 0 }],
    customFields: config.customFields || [],
    fieldVisibility: config.fieldVisibility || {
      profitMargin: false,
      drawing: false,
      documents: false,
      siteVisit: false,
      marketingAndMisc: false,
      officeManagement: false
    }
  });
  const [availableAssociates, setAvailableAssociates] = useState([]);
  const [showAddAssociateModal, setShowAddAssociateModal] = useState(false);
  const [newAssociateData, setNewAssociateData] = useState({
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

  useEffect(() => {
    loadAvailableAssociates();
  }, []);

  const loadAvailableAssociates = async () => {
    try {
      const associatesData = await AssociateService.getAllAssociates();
      setAvailableAssociates(Array.isArray(associatesData) ? associatesData : []);
    } catch (error) {
      console.error('Error loading associates:', error);
      setAvailableAssociates([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTempConfig({
      ...tempConfig,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || 0 : value)
    });
  };

  const handleVisibilityChange = (field) => {
    setTempConfig({
      ...tempConfig,
      fieldVisibility: {
        ...tempConfig.fieldVisibility,
        [field]: !tempConfig.fieldVisibility[field]
      }
    });
  };

  const handleNumberOfAssociatesChange = (e) => {
    const count = parseInt(e.target.value) || 1;
    const newAssociates = Array.from({ length: count }, (_, index) => 
      tempConfig.associates[index] || { id: '', name: '', company: '', percentage: 0 }
    );
    
    setTempConfig({
      ...tempConfig,
      numberOfAssociates: count,
      associates: newAssociates
    });
  };

  const handleAssociateSelect = (index, associateId) => {
    const selectedAssociate = availableAssociates.find(a => a._id === associateId);
    if (selectedAssociate) {
      const updatedAssociates = tempConfig.associates.map((associate, i) => 
        i === index ? { 
          id: selectedAssociate._id,
          name: selectedAssociate.name,
          company: selectedAssociate.company || '',
          percentage: associate.percentage || 0
        } : associate
      );
      setTempConfig({
        ...tempConfig,
        associates: updatedAssociates
      });
    }
  };

  const handleAddNewAssociate = async () => {
    if (!newAssociateData.name || !newAssociateData.email) {
      alert('Name and Email are required');
      return;
    }

    try {
      await AssociateService.createAssociate(newAssociateData);
      await loadAvailableAssociates();
      dataEventManager.emit(DATA_TYPES.ASSOCIATES);
      setShowAddAssociateModal(false);
      setNewAssociateData({
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
      alert('Associate added successfully!');
    } catch (error) {
      console.error('Error adding associate:', error);
      alert('Failed to add associate. Please try again.');
    }
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
      percentage: 0,
      visible: false  // Default to unchecked/hidden
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

  const handleCustomFieldVisibilityChange = (index) => {
    const updatedCustomFields = tempConfig.customFields.map((field, i) => 
      i === index ? { ...field, visible: !field.visible } : field
    );
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
    <>
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
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        position: 'relative',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
      }}>
        <div className="modal-header" style={{
          padding: '24px 28px 20px',
          borderBottom: '2px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: '0',
          backgroundColor: 'white',
          zIndex: '10',
          borderTopLeftRadius: '12px',
          borderTopRightRadius: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ margin: '0', fontSize: '20px', fontWeight: '600', color: '#2c3e50' }}>⚙️ Configure Expense Percentages</h2>
              {tempConfig._currentVersion && (
                <span style={{
                  padding: '4px 10px',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  border: '1px solid #90caf9'
                }}>
                  v{tempConfig._currentVersion}
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6c757d' }}>Set default percentages and visibility for expense categories</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#9e9e9e', fontStyle: 'italic' }}>⚠️ Changes will only apply to new projects created after saving</p>
          </div>
          <button className="close-btn" onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '28px',
            cursor: 'pointer',
            color: '#6c757d',
            padding: '4px',
            borderRadius: '4px',
            lineHeight: '1',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s'
          }}>×</button>
        </div>
        
        <div className="modal-body" style={{
          padding: '24px 28px',
          maxHeight: 'calc(90vh - 180px)',
          overflow: 'auto'
        }}>
          {/* Total Percentage Info */}
          <div className="percentage-info" style={{
            marginBottom: '24px',
            padding: '16px 20px',
            backgroundColor: '#f0f7ff',
            borderRadius: '8px',
            border: '1px solid #d0e7ff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#495057', lineHeight: '1.5' }}>
                💡 <strong>Quick Tip:</strong> Check boxes to show fields in distribution table
              </p>
              <p style={{ margin: '0', fontSize: '12px', color: '#6c757d', lineHeight: '1.4' }}>
                Unchecked fields will be hidden from the expense distribution view
              </p>
            </div>
            <div style={{ 
              padding: '8px 16px', 
              backgroundColor: calculateTotalPercentage() > 100 ? '#fff3cd' : '#d4edda',
              borderRadius: '6px',
              border: `1px solid ${calculateTotalPercentage() > 100 ? '#ffc107' : '#28a745'}`,
              minWidth: '140px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '11px', color: '#495057', marginBottom: '2px', fontWeight: '500' }}>Total Allocation</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: calculateTotalPercentage() > 100 ? '#856404' : '#155724' }}>
                {calculateTotalPercentage().toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Expense Fields Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '8px' }}>
              💼 Expense Categories
              <span style={{ fontSize: '12px', fontWeight: '400', color: '#6c757d' }}>(Check to show in table)</span>
            </h3>
            <div className="form-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px'
            }}>
              <div className="form-group" style={{ margin: '0' }}>
                <div style={{ 
                  padding: '12px 14px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  transition: 'all 0.2s'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '10px', 
                    fontSize: '13px', 
                    fontWeight: '500', 
                    color: '#495057',
                    cursor: 'pointer'
                  }}>
                    <span>Profit Margin %</span>
                    <input
                      type="checkbox"
                      checked={tempConfig.fieldVisibility?.profitMargin || false}
                      onChange={() => handleVisibilityChange('profitMargin')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#007bff' }}
                    />
                  </label>
                  <input 
                    type="number" 
                    name="profitMarginPercent" 
                    className="form-input" 
                    value={tempConfig.profitMarginPercent || ""} 
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0.0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      textAlign: 'right',
                      fontWeight: '500'
                    }}
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ margin: '0' }}>
                <div style={{ 
                  padding: '12px 14px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  transition: 'all 0.2s'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '10px', 
                    fontSize: '13px', 
                    fontWeight: '500', 
                    color: '#495057',
                    cursor: 'pointer'
                  }}>
                    <span>Drawing %</span>
                    <input
                      type="checkbox"
                      checked={tempConfig.fieldVisibility?.drawing || false}
                      onChange={() => handleVisibilityChange('drawing')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#007bff' }}
                    />
                  </label>
                  <input 
                    type="number" 
                    name="drawingPercent" 
                    className="form-input" 
                    value={tempConfig.drawingPercent || ""} 
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0.0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      textAlign: 'right',
                      fontWeight: '500'
                    }}
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ margin: '0' }}>
                <div style={{ 
                  padding: '12px 14px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  transition: 'all 0.2s'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '10px', 
                    fontSize: '13px', 
                    fontWeight: '500', 
                    color: '#495057',
                    cursor: 'pointer'
                  }}>
                    <span>Documents %</span>
                    <input
                      type="checkbox"
                      checked={tempConfig.fieldVisibility?.documents || false}
                      onChange={() => handleVisibilityChange('documents')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#007bff' }}
                    />
                  </label>
                  <input 
                    type="number" 
                    name="documentsPercent" 
                    className="form-input" 
                    value={tempConfig.documentsPercent || ""} 
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0.0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      textAlign: 'right',
                      fontWeight: '500'
                    }}
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ margin: '0' }}>
                <div style={{ 
                  padding: '12px 14px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  transition: 'all 0.2s'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '10px', 
                    fontSize: '13px', 
                    fontWeight: '500', 
                    color: '#495057',
                    cursor: 'pointer'
                  }}>
                    <span>Site Visit %</span>
                    <input
                      type="checkbox"
                      checked={tempConfig.fieldVisibility?.siteVisit || false}
                      onChange={() => handleVisibilityChange('siteVisit')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#007bff' }}
                    />
                  </label>
                  <input 
                    type="number" 
                    name="siteVisitPercent" 
                    className="form-input" 
                    value={tempConfig.siteVisitPercent || ""} 
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0.0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      textAlign: 'right',
                      fontWeight: '500'
                    }}
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ margin: '0' }}>
                <div style={{ 
                  padding: '12px 14px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  transition: 'all 0.2s'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '10px', 
                    fontSize: '13px', 
                    fontWeight: '500', 
                    color: '#495057',
                    cursor: 'pointer'
                  }}>
                    <span>Marketing & Misc %</span>
                    <input
                      type="checkbox"
                      checked={tempConfig.fieldVisibility?.marketingAndMisc || false}
                      onChange={() => handleVisibilityChange('marketingAndMisc')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#007bff' }}
                    />
                  </label>
                  <input 
                    type="number" 
                    name="marketingAndMiscPercent" 
                    className="form-input" 
                    value={tempConfig.marketingAndMiscPercent || ""} 
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0.0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      textAlign: 'right',
                      fontWeight: '500'
                    }}
                  />
                </div>
              </div>
              
              <div className="form-group" style={{ margin: '0' }}>
                <div style={{ 
                  padding: '12px 14px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #dee2e6',
                  transition: 'all 0.2s'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: '10px', 
                    fontSize: '13px', 
                    fontWeight: '500', 
                    color: '#495057',
                    cursor: 'pointer'
                  }}>
                    <span>Office Management %</span>
                    <input
                      type="checkbox"
                      checked={tempConfig.fieldVisibility?.officeManagement || false}
                      onChange={() => handleVisibilityChange('officeManagement')}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#007bff' }}
                    />
                  </label>
                  <input 
                    type="number" 
                    name="officeManagementPercent" 
                    className="form-input" 
                    value={tempConfig.officeManagementPercent || ""} 
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0.0"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      textAlign: 'right',
                      fontWeight: '500'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="custom-fields-section" style={{ marginTop: '24px', padding: '20px', backgroundColor: '#fffbf5', borderRadius: '10px', border: '1px solid #ffe4b5' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '18px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#2c3e50' }}>🔧 Custom Fields</h3>
                <p style={{ margin: '0', fontSize: '12px', color: '#6c757d' }}>Add custom expense categories as needed</p>
              </div>
              <button 
                type="button"
                onClick={addCustomField}
                className="btn btn-secondary"
                style={{ 
                  fontSize: '13px', 
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: 'none',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  boxShadow: '0 2px 4px rgba(40, 167, 69, 0.2)',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '18px', lineHeight: '1' }}>+</span>
                Add Field
              </button>
            </div>

            {tempConfig.customFields.length === 0 && (
              <p style={{ 
                color: '#6c757d', 
                fontStyle: 'italic', 
                textAlign: 'center',
                margin: '24px 0',
                padding: '24px',
                backgroundColor: 'white',
                borderRadius: '8px',
                border: '2px dashed #dee2e6',
                fontSize: '13px'
              }}>
                No custom fields added yet. Click "Add Field" to create custom percentage categories.
              </p>
            )}

            {tempConfig.customFields.map((customField, index) => (
              <div key={index} className="custom-field-row" style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '12px', 
                marginBottom: '16px',
                padding: '16px',
                backgroundColor: 'white',
                borderRadius: '10px',
                border: '1px solid #e9ecef',
                position: 'relative',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                {/* Remove button positioned at top right */}
                <button
                  type="button"
                  onClick={() => removeCustomField(index)}
                  style={{ 
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    fontSize: '20px', 
                    padding: '0',
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#dc3545',
                    border: 'none',
                    color: 'white',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    lineHeight: '1',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 4px rgba(220, 53, 69, 0.3)',
                    transition: 'all 0.2s'
                  }}
                  title="Remove this field"
                >
                  ×
                </button>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px',
                  gap: '14px',
                  alignItems: 'end',
                  paddingRight: '40px' // Space for remove button
                }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px', marginBottom: '8px', display: 'block', fontWeight: '500', color: '#495057' }}>
                      Field Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Travel Expenses, Legal Fees"
                      value={customField.name || ''}
                      onChange={(e) => handleCustomFieldChange(index, 'name', e.target.value)}
                      className="form-input"
                      style={{ 
                        fontSize: '14px',
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label style={{ fontSize: '12px', marginBottom: '8px', display: 'block', fontWeight: '500', color: '#495057' }}>
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
                        border: '1px solid #ced4da',
                        borderRadius: '6px',
                        boxSizing: 'border-box',
                        textAlign: 'right',
                        fontWeight: '500'
                      }}
                    />
                  </div>
                </div>
                
                {/* Show checkbox below the fields */}
                <div style={{ paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    fontSize: '13px', 
                    cursor: 'pointer', 
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '6px',
                    width: 'fit-content',
                    border: '1px solid #e9ecef'
                  }}>
                    <input
                      type="checkbox"
                      checked={customField.visible || false}
                      onChange={() => handleCustomFieldVisibilityChange(index)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#28a745' }}
                    />
                    <span style={{ fontSize: '13px', color: '#495057', fontWeight: '500' }}>Show in distribution table</span>
                  </label>
                </div>
              </div>
            ))}
            
            {tempConfig.customFields.length > 0 && (
              <div style={{ 
                marginTop: '16px', 
                padding: '12px 16px', 
                backgroundColor: '#e7f3ff', 
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#0056b3',
                border: '1px solid #b8daff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Custom Fields Total:</span>
                <span style={{ fontSize: '15px' }}>{tempConfig.customFields.reduce((sum, field) => sum + (field.percentage || 0), 0).toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer" style={{
          padding: '20px 28px',
          borderTop: '2px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          position: 'sticky',
          bottom: '0',
          backgroundColor: 'white',
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
          flexWrap: 'wrap'
        }}>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>
            {calculateTotalPercentage() > 100 && (
              <span style={{ color: '#dc3545', fontWeight: '500' }}>⚠️ Total exceeds 100%</span>
            )}
            {calculateTotalPercentage() === 100 && (
              <span style={{ color: '#28a745', fontWeight: '500' }}>✓ Perfect allocation</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
              style={{
                padding: '11px 24px',
                border: '1px solid #6c757d',
                backgroundColor: 'transparent',
                color: '#6c757d',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '100px',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              style={{
                padding: '11px 24px',
                border: 'none',
                backgroundColor: '#28a745',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '140px',
                boxShadow: '0 2px 4px rgba(40, 167, 69, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Add New Associate Modal */}
    {showAddAssociateModal && (
      <div style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '2000',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '2px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: '0',
            backgroundColor: 'white',
            zIndex: '10',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px'
          }}>
            <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#2c3e50' }}>➕ Add New Associate</h3>
            <button 
              onClick={() => setShowAddAssociateModal(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6c757d',
                padding: '4px',
                borderRadius: '4px',
                lineHeight: '1',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >×</button>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#495057' }}>
                  Name <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newAssociateData.name}
                  onChange={(e) => setNewAssociateData({ ...newAssociateData, name: e.target.value })}
                  placeholder="Enter associate name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#495057' }}>
                  Email <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <input
                  type="email"
                  value={newAssociateData.email}
                  onChange={(e) => setNewAssociateData({ ...newAssociateData, email: e.target.value })}
                  placeholder="Enter email"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#495057' }}>Phone</label>
                <input
                  type="text"
                  value={newAssociateData.phone}
                  onChange={(e) => setNewAssociateData({ ...newAssociateData, phone: e.target.value })}
                  placeholder="Enter phone"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#495057' }}>Company</label>
                <input
                  type="text"
                  value={newAssociateData.company}
                  onChange={(e) => setNewAssociateData({ ...newAssociateData, company: e.target.value })}
                  placeholder="Enter company"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#495057' }}>Address</label>
                <input
                  type="text"
                  value={newAssociateData.address}
                  onChange={(e) => setNewAssociateData({ ...newAssociateData, address: e.target.value })}
                  placeholder="Street address"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#495057' }}>City</label>
                <input
                  type="text"
                  value={newAssociateData.city}
                  onChange={(e) => setNewAssociateData({ ...newAssociateData, city: e.target.value })}
                  placeholder="City"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#495057' }}>State</label>
                <input
                  type="text"
                  value={newAssociateData.state}
                  onChange={(e) => setNewAssociateData({ ...newAssociateData, state: e.target.value })}
                  placeholder="State"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#495057' }}>Zip Code</label>
                <input
                  type="text"
                  value={newAssociateData.zipCode}
                  onChange={(e) => setNewAssociateData({ ...newAssociateData, zipCode: e.target.value })}
                  placeholder="Zip code"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#495057' }}>Notes</label>
                <textarea
                  value={newAssociateData.notes}
                  onChange={(e) => setNewAssociateData({ ...newAssociateData, notes: e.target.value })}
                  placeholder="Additional notes"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{
            padding: '20px 24px',
            borderTop: '2px solid #e9ecef',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            position: 'sticky',
            bottom: '0',
            backgroundColor: 'white',
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px'
          }}>
            <button 
              onClick={() => setShowAddAssociateModal(false)}
              style={{
                padding: '10px 20px',
                border: '1px solid #6c757d',
                backgroundColor: 'transparent',
                color: '#6c757d',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleAddNewAssociate}
              style={{
                padding: '10px 20px',
                border: 'none',
                backgroundColor: '#17a2b8',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Add Associate
            </button>
          </div>
        </div>
      </div>
    )}
    
    {/* Watermark */}
    <Watermark />
    </>
  );
};

// Pagination Controls Component
const PaginationControls = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show around current page
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta);
         i <= Math.min(totalPages - 1, currentPage + delta);
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      if (totalPages > 1) rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 0',
      borderTop: '1px solid #e5e7eb',
      marginTop: '20px'
    }}>
      <div style={{ fontSize: '14px', color: '#6b7280' }}>
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            background: currentPage === 1 ? '#f9fafb' : 'white',
            color: currentPage === 1 ? '#9ca3af' : '#374151',
            borderRadius: '6px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          Previous
        </button>
        
        {getVisiblePages().map((page, index) => (
          page === '...' ? (
            <span key={index} style={{ padding: '8px 4px', color: '#9ca3af' }}>...</span>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                background: currentPage === page ? '#3b82f6' : 'white',
                color: currentPage === page ? 'white' : '#374151',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                minWidth: '40px'
              }}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            background: currentPage === totalPages ? '#f9fafb' : 'white',
            color: currentPage === totalPages ? '#9ca3af' : '#374151',
            borderRadius: '6px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProjectPage;
