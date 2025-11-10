import React, { useState, useEffect } from 'react';
import './ProjectPage.css';
import FinanceService from './services/FinanceService';
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
    officeManagementPercent: 0
  });
  const [showPercentageConfig, setShowPercentageConfig] = useState(false);
  const [selectedProjectForDistribution, setSelectedProjectForDistribution] = useState(null);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  
  const { showLoading, hideLoading } = useLoading();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchData();
    fetchStats();
    loadPercentageConfig();
  }, [activeTab, filters]);

  const loadPercentageConfig = () => {
    try {
      const savedConfig = localStorage.getItem('finance-percentage-config');
      if (savedConfig) {
        setPercentageConfig(JSON.parse(savedConfig));
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
      setFormData({
        srNo: projects.length + 1,
        projectNumber: '',
        projectName: '',
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
    
    const itemWithPayments = {
      ...item,
      payments: paymentsWithIds,
      yearlyDistribution: paymentsWithIds.length > 0 ? calculateYearlyDistribution(paymentsWithIds) : {}
    };
    
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
      
      // Clean payments data - remove frontend-only id field and ensure proper types
      if (cleanFormData.payments) {
        cleanFormData.payments = cleanFormData.payments
          .filter(payment => payment.date && payment.amount) // Only include valid payments
          .map(payment => ({
            date: payment.date,
            chequeNeftNumber: payment.chequeNeftNumber || '',
            mode: payment.mode || 'Cheque',
            amount: parseFloat(payment.amount) || 0
          }));
      }
      
      // Remove frontend-only fields
      delete cleanFormData.yearlyDistribution;
      
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

  return (
    <div className="project-page">
      <div className="page-header">
        <h1>� Project Management</h1>
        <div className="project-actions">
          <button className="project-btn project-btn-primary" onClick={handleAdd}>
            ➕ Add New
          </button>
          {activeTab === 'projects' && (
            <button className="project-btn project-btn-info" onClick={() => setShowPercentageConfig(true)}>
              ⚙️ Configure Percentages
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
                📥 Import Excel
              </label>
            </>
          )}
          <button className="project-btn project-btn-secondary" onClick={handleExport}>
            📤 Export Excel
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
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDistributionModal(false)}>
                Close
              </button>
            </div>
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
            <th>Actions</th>
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
                  <button className="action-btn action-btn-edit" onClick={() => onEdit(project)}>
                    ✏️ Edit
                  </button>
                  <button className="action-btn action-btn-view" onClick={() => onViewDistribution(project)}>
                    📊 Distribution
                  </button>
                  <button className="action-btn action-btn-delete" onClick={() => onDelete(project._id)}>
                    🗑️ Delete
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
            <th>Actions</th>
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
                  <button className="action-btn action-btn-edit" onClick={() => onEdit(expense)}>
                    ✏️ Edit
                  </button>
                  <button className="action-btn action-btn-delete" onClick={() => onDelete(expense._id)}>
                    🗑️ Delete
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
  return payments.reduce((total, payment) => total + (parseFloat(payment.amount) || 0), 0);
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
      distribution[financialYear] += parseFloat(payment.amount) || 0;
    }
  });
  
  return distribution;
};

// Modal Component
const Modal = ({ activeTab, formData, setFormData, onSave, onClose, isEditing }) => {
  
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
    
    // Auto-calculate expense allocations
    const receivedFees = totalReceived;
    updatedFormData.profitMargin = Math.round((receivedFees * (updatedFormData.profitMarginPercent || 0)) / 100);
    updatedFormData.drawing = Math.round((receivedFees * (updatedFormData.drawingPercent || 0)) / 100);
    updatedFormData.documents = Math.round((receivedFees * (updatedFormData.documentsPercent || 0)) / 100);
    updatedFormData.siteVisit = Math.round((receivedFees * (updatedFormData.siteVisitPercent || 0)) / 100);
    updatedFormData.marketingAndMisc = Math.round((receivedFees * (updatedFormData.marketingAndMiscPercent || 0)) / 100);
    updatedFormData.officeManagement = Math.round((receivedFees * (updatedFormData.officeManagementPercent || 0)) / 100);
    
    setFormData(updatedFormData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ['srNo', 'finalizedFees', 'totalReceivedFees', 'year2024_25', 
                          'profitMarginPercent', 'drawingPercent', 'documentsPercent', 
                          'siteVisitPercent', 'marketingAndMiscPercent', 'officeManagementPercent',
                          'profitMargin', 'drawing', 'documents', 'siteVisit', 
                          'marketingAndMisc', 'officeManagement', 'amount'];
    
    const newValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;
    
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
      
      // Auto-calculate amounts from saved percentages
      updatedFormData.profitMargin = Math.round((receivedFees * (updatedFormData.profitMarginPercent || 0)) / 100);
      updatedFormData.drawing = Math.round((receivedFees * (updatedFormData.drawingPercent || 0)) / 100);
      updatedFormData.documents = Math.round((receivedFees * (updatedFormData.documentsPercent || 0)) / 100);
      updatedFormData.siteVisit = Math.round((receivedFees * (updatedFormData.siteVisitPercent || 0)) / 100);
      updatedFormData.marketingAndMisc = Math.round((receivedFees * (updatedFormData.marketingAndMiscPercent || 0)) / 100);
      updatedFormData.officeManagement = Math.round((receivedFees * (updatedFormData.officeManagementPercent || 0)) / 100);
    }
    
    setFormData(updatedFormData);
  };

  // Allow manual amount override
  const handleAmountChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value) || 0
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
const ProjectForm = ({ formData, handleChange, handleAmountChange, addPayment, removePayment, updatePayment }) => {
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
  const [tempConfig, setTempConfig] = useState(config);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTempConfig({
      ...tempConfig,
      [name]: parseFloat(value) || 0
    });
  };

  const handleSave = () => {
    // Validate that percentages don't exceed 100%
    const total = Object.values(tempConfig).reduce((sum, val) => sum + val, 0);
    if (total > 100) {
      alert('Total percentage cannot exceed 100%');
      return;
    }
    onSave(tempConfig);
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>⚙️ Configure Expense Percentages</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="percentage-info">
            <p>💡 Set the default percentages for expense allocation. These will be used automatically when you create new projects.</p>
            <p><strong>Current Total: {Object.values(tempConfig).reduce((sum, val) => sum + val, 0).toFixed(1)}%</strong></p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Profit Margin %</label>
              <input 
                type="number" 
                name="profitMarginPercent" 
                className="form-input" 
                value={tempConfig.profitMarginPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            
            <div className="form-group">
              <label>Drawing %</label>
              <input 
                type="number" 
                name="drawingPercent" 
                className="form-input" 
                value={tempConfig.drawingPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            
            <div className="form-group">
              <label>Documents %</label>
              <input 
                type="number" 
                name="documentsPercent" 
                className="form-input" 
                value={tempConfig.documentsPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            
            <div className="form-group">
              <label>Site Visit %</label>
              <input 
                type="number" 
                name="siteVisitPercent" 
                className="form-input" 
                value={tempConfig.siteVisitPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            
            <div className="form-group">
              <label>Marketing & Misc %</label>
              <input 
                type="number" 
                name="marketingAndMiscPercent" 
                className="form-input" 
                value={tempConfig.marketingAndMiscPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
            
            <div className="form-group">
              <label>Office Management %</label>
              <input 
                type="number" 
                name="officeManagementPercent" 
                className="form-input" 
                value={tempConfig.officeManagementPercent || ""} 
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Configuration</button>
        </div>
      </div>
    </div>
  );
};

export default ProjectPage;
