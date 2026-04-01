import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiPlus, FiFilter, FiDownload, FiTrendingUp, FiDollarSign, 
  FiPieChart, FiList, FiGrid, FiSearch, FiCalendar, FiRefreshCw,
  FiChevronRight, FiX, FiEdit2, FiTrash2, FiEye, FiCreditCard,
  FiFolder, FiMapPin, FiBriefcase, FiFileText, FiTool, FiLoader
} from 'react-icons/fi';
import ExpenseService from './services/ExpenseService';
import { useToast } from './context/ToastContext';
import Watermark from './components/Watermark';
import Modal from './components/Modal';
import ConfirmDialog from './components/ConfirmDialog';
import './ExpensesPage.css';

// Debug logger
const DEBUG = true;
const log = (area, message, data = null) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    if (data) {
      console.log(`[${timestamp}] [EXPENSE-${area}]`, message, data);
    } else {
      console.log(`[${timestamp}] [EXPENSE-${area}]`, message);
    }
  }
};

// Category icon mapping
const categoryIcons = {
  'trending-up': FiTrendingUp,
  'pen-tool': FiTool,
  'file-text': FiFileText,
  'map-pin': FiMapPin,
  'megaphone': FiDollarSign,
  'briefcase': FiBriefcase,
  'folder': FiFolder
};

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount || 0);
};

// Format date
const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// ============== EXPENSE WIZARD COMPONENT ==============
const ExpenseWizard = ({ isOpen, onClose, onSuccess, editData = null }) => {
  const { showError, showSuccess } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [firms, setFirms] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    category: '',
    firm: '',
    bankAccount: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    referenceNumber: '',
    title: '',
    notes: '',
    tags: [],
    attachments: []
  });
  
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      log('WIZARD', 'Modal opened, loading data...');
      loadCategories();
      loadFirms();
      
      if (editData) {
        log('WIZARD', 'Edit mode - setting form data', editData);
        setFormData({
          category: editData.category?._id || '',
          firm: editData.firm?._id || '',
          bankAccount: editData.bankAccount || '',
          amount: editData.amount?.toString() || '',
          date: editData.date ? new Date(editData.date).toISOString().split('T')[0] : '',
          paymentMode: editData.paymentMode || 'Cash',
          referenceNumber: editData.referenceNumber || '',
          title: editData.title || '',
          notes: editData.notes || '',
          tags: editData.tags || [],
          attachments: []
        });
        setSelectedCategory(editData.category);
        setStep(4);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editData]);

  const loadCategories = async () => {
    log('WIZARD', 'Loading categories...');
    try {
      const res = await ExpenseService.getCategories();
      log('WIZARD', 'Categories API response:', res);
      if (res.success) {
        log('WIZARD', `Loaded ${res.data?.length || 0} categories`, res.data);
        setCategories(res.data || []);
      } else {
        log('WIZARD', 'Categories response not successful', res);
      }
    } catch (err) {
      log('WIZARD', 'Error loading categories:', err);
      console.error('Categories error details:', err.response?.data || err.message);
      showError('Failed to load categories');
    }
  };

  const loadFirms = async () => {
    log('WIZARD', 'Loading firms for wizard...');
    try {
      const res = await ExpenseService.getFirms();
      log('WIZARD', 'Firms API response:', res);
      if (res.success) {
        log('WIZARD', `Loaded ${res.data?.length || 0} firms`, res.data);
        setFirms(res.data || []);
      } else {
        log('WIZARD', 'Firms response not successful', res);
      }
    } catch (err) {
      log('WIZARD', 'Error loading firms:', err);
      console.error('Firms error details:', err.response?.data || err.message);
      showError('Failed to load firms');
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      category: '',
      firm: '',
      bankAccount: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      referenceNumber: '',
      title: '',
      notes: '',
      tags: [],
      attachments: []
    });
    setSelectedFirm(null);
    setSelectedCategory(null);
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category: category._id }));
    setSelectedCategory(category);
    setStep(2);
  };

  const handleFirmSelect = (firm) => {
    setFormData(prev => ({ ...prev, firm: firm._id, bankAccount: '' }));
    setSelectedFirm(firm);
    setStep(3);
  };

  const handleBankSelect = (accountId) => {
    setFormData(prev => ({ ...prev, bankAccount: accountId }));
    setStep(4);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      showError('Please enter a valid amount');
      return;
    }
    if (!formData.date) {
      showError('Please select a date');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editData) {
        await ExpenseService.updateExpense(editData._id, payload);
        showSuccess('Expense updated successfully');
      } else {
        await ExpenseService.createExpense(payload);
        showSuccess('Expense created successfully');
      }
      
      onSuccess?.();
      onClose();
      resetForm();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="expense-wizard-steps">
      {[
        { num: 1, label: 'Category' },
        { num: 2, label: 'Firm' },
        { num: 3, label: 'Bank' },
        { num: 4, label: 'Details' }
      ].map((s, idx) => (
        <React.Fragment key={s.num}>
          <div 
            className={`wizard-step ${step >= s.num ? 'active' : ''} ${step === s.num ? 'current' : ''}`}
            onClick={() => step > s.num && setStep(s.num)}
          >
            <span className="step-number">{s.num}</span>
            <span className="step-label">{s.label}</span>
          </div>
          {idx < 3 && <div className={`step-connector ${step > s.num ? 'active' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  const renderCategoryStep = () => {
    log('WIZARD', 'Rendering category step, categories:', categories);
    return (
    <div className="wizard-content">
      <h3>Select Expense Category</h3>
      <p className="wizard-subtitle">Choose the type of expense you want to record</p>
      {categories.length === 0 && (
        <div className="empty-state">
          <FiFolder size={40} />
          <p>No categories found. Loading...</p>
        </div>
      )}
      <div className="category-grid">
        {categories.map(cat => {
          const IconComponent = categoryIcons[cat.icon] || FiFolder;
          return (
            <div 
              key={cat._id}
              className={`category-card ${formData.category === cat._id ? 'selected' : ''}`}
              style={{ '--category-color': cat.color }}
              onClick={() => handleCategorySelect(cat)}
            >
              <div className="category-icon">
                <IconComponent size={24} />
              </div>
              <span className="category-name">{cat.name}</span>
            </div>
          );
        })}
        <div 
          className="category-card add-new"
          onClick={() => {/* TODO: Add custom category modal */}}
        >
          <div className="category-icon">
            <FiPlus size={24} />
          </div>
          <span className="category-name">Add Custom</span>
        </div>
      </div>
    </div>
  )};

  const renderFirmStep = () => {
    log('WIZARD', 'Rendering firm step, firms:', firms);
    return (
    <div className="wizard-content">
      <h3>Select Firm</h3>
      <p className="wizard-subtitle">Choose the firm for this expense</p>
      {selectedCategory && (
        <div className="selected-info">
          <span className="badge" style={{ backgroundColor: selectedCategory.color }}>
            {selectedCategory.name}
          </span>
        </div>
      )}
      <div className="firm-list">
        {firms.length === 0 ? (
          <div className="empty-state">
            <FiBriefcase size={40} />
            <p>No firms found. Please add a firm first.</p>
          </div>
        ) : (
          firms.map(firm => (
            <div 
              key={firm._id}
              className={`firm-card ${formData.firm === firm._id ? 'selected' : ''}`}
              onClick={() => handleFirmSelect(firm)}
            >
              <div className="firm-info">
                <h4>{firm.name}</h4>
                <p>{firm.shortName || firm.city || 'No details'}</p>
              </div>
              <div className="firm-banks">
                <FiCreditCard />
                <span>{firm.bankAccounts?.length || 0} accounts</span>
              </div>
              <FiChevronRight className="chevron" />
            </div>
          ))
        )}
      </div>
    </div>
  )};

  const renderBankStep = () => (
    <div className="wizard-content">
      <h3>Select Bank Account</h3>
      <p className="wizard-subtitle">Choose the payment source</p>
      <div className="selected-info">
        {selectedCategory && (
          <span className="badge" style={{ backgroundColor: selectedCategory.color }}>
            {selectedCategory.name}
          </span>
        )}
        {selectedFirm && (
          <span className="badge firm-badge">{selectedFirm.name}</span>
        )}
      </div>
      <div className="bank-list">
        {(!selectedFirm?.bankAccounts || selectedFirm.bankAccounts.length === 0) ? (
          <div className="empty-state">
            <FiCreditCard size={40} />
            <p>No bank accounts for this firm.</p>
          </div>
        ) : (
          selectedFirm.bankAccounts.filter(acc => acc.isActive !== false).map(account => (
            <div 
              key={account._id}
              className={`bank-card ${formData.bankAccount === account._id ? 'selected' : ''}`}
              onClick={() => handleBankSelect(account._id)}
            >
              <div className="bank-icon">
                <FiCreditCard size={20} />
              </div>
              <div className="bank-info">
                <h4>{account.accountName}</h4>
                <p>{account.bankName} {account.accountNumber ? `• ****${account.accountNumber.slice(-4)}` : ''}</p>
              </div>
              {account.isDefault && <span className="default-badge">Default</span>}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="wizard-content details-step">
      <h3>Expense Details</h3>
      <div className="selected-info">
        {selectedCategory && (
          <span className="badge" style={{ backgroundColor: selectedCategory.color }}>
            {selectedCategory.name}
          </span>
        )}
        {selectedFirm && (
          <span className="badge firm-badge">{selectedFirm.name}</span>
        )}
      </div>
      
      <div className="expense-form">
        <div className="form-row">
          <div className="form-group">
            <label>Amount *</label>
            <div className="input-with-prefix">
              <span className="prefix">₹</span>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="1"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Payment Mode</label>
            <select name="paymentMode" value={formData.paymentMode} onChange={handleInputChange}>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
              <option value="DD">DD</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Reference Number</label>
            <input
              type="text"
              name="referenceNumber"
              value={formData.referenceNumber}
              onChange={handleInputChange}
              placeholder="Cheque/Transaction No."
            />
          </div>
        </div>

        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Brief description of expense"
          />
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Additional details..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Attachments</label>
          <div className="attachment-upload">
            <input
              type="file"
              id="expense-attachments"
              multiple
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            />
            <label htmlFor="expense-attachments" className="upload-btn">
              <FiPlus /> Add Files
            </label>
          </div>
          {formData.attachments.length > 0 && (
            <div className="attachment-list">
              {formData.attachments.map((file, idx) => (
                <div key={idx} className="attachment-item">
                  <FiFileText />
                  <span>{file.name}</span>
                  <button type="button" onClick={() => removeAttachment(idx)}>
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large" title={editData ? 'Edit Expense' : 'Add New Expense'}>
      <div className="expense-wizard">
        {!editData && renderStepIndicator()}
        
        {step === 1 && renderCategoryStep()}
        {step === 2 && renderFirmStep()}
        {step === 3 && renderBankStep()}
        {step === 4 && renderDetailsStep()}

        <div className="wizard-actions">
          {step > 1 && !editData && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step === 4 && (
            <button 
              className="btn-primary" 
              onClick={handleSubmit}
              disabled={loading || !formData.amount || !formData.date}
            >
              {loading ? 'Saving...' : (editData ? 'Update Expense' : 'Save Expense')}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ============== FIRM MANAGEMENT MODAL ==============
const FirmManagementModal = ({ isOpen, onClose, onSuccess }) => {
  const { showError, showSuccess } = useToast();
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingFirm, setEditingFirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    gstNumber: '',
    panNumber: ''
  });
  const [bankForm, setBankForm] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    accountType: 'Current',
    isDefault: false
  });
  const [showBankForm, setShowBankForm] = useState(false);
  const [selectedFirmForBank, setSelectedFirmForBank] = useState(null);

  useEffect(() => {
    if (isOpen) {
      log('FIRM-MODAL', 'Modal opened, loading firms...');
      loadFirms();
    }
  }, [isOpen]);

  const loadFirms = async () => {
    log('FIRM-MODAL', 'Loading firms...');
    setLoading(true);
    try {
      const res = await ExpenseService.getFirms({ includeInactive: true });
      log('FIRM-MODAL', 'Firms API response:', res);
      if (res.success) {
        log('FIRM-MODAL', `Loaded ${res.data?.length || 0} firms`, res.data);
        setFirms(res.data || []);
      } else {
        log('FIRM-MODAL', 'Firms response not successful', res);
        setFirms([]);
      }
    } catch (err) {
      log('FIRM-MODAL', 'Error loading firms:', err);
      console.error('Firms error details:', err.response?.data || err.message);
      showError('Failed to load firms');
      setFirms([]);
    } finally {
      setLoading(false);
      log('FIRM-MODAL', 'Loading complete, loading state set to false');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBankForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSaveFirm = async () => {
    log('FIRM-MODAL', 'Saving firm...', formData);
    if (!formData.name.trim()) {
      showError('Firm name is required');
      return;
    }
    setLoading(true);
    try {
      let res;
      if (editingFirm) {
        res = await ExpenseService.updateFirm(editingFirm._id, formData);
        log('FIRM-MODAL', 'Update firm response:', res);
        showSuccess('Firm updated successfully');
      } else {
        res = await ExpenseService.createFirm(formData);
        log('FIRM-MODAL', 'Create firm response:', res);
        showSuccess('Firm created successfully');
      }
      await loadFirms();
      setShowForm(false);
      setEditingFirm(null);
      setFormData({ name: '', shortName: '', address: '', city: '', phone: '', email: '', gstNumber: '', panNumber: '' });
      onSuccess?.();
    } catch (err) {
      log('FIRM-MODAL', 'Error saving firm:', err);
      console.error('Save firm error details:', err.response?.data || err.message);
      showError(err.response?.data?.message || 'Failed to save firm');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBankAccount = async () => {
    log('FIRM-MODAL', 'Adding bank account...', bankForm);
    if (!bankForm.accountName.trim()) {
      showError('Account name is required');
      return;
    }
    setLoading(true);
    try {
      await ExpenseService.addBankAccount(selectedFirmForBank._id, bankForm);
      showSuccess('Bank account added successfully');
      loadFirms();
      setShowBankForm(false);
      setSelectedFirmForBank(null);
      setBankForm({ accountName: '', accountNumber: '', bankName: '', ifscCode: '', accountType: 'Current', isDefault: false });
      onSuccess?.();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to add bank account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFirm = async (firmId) => {
    if (!window.confirm('Are you sure you want to delete this firm?')) return;
    try {
      await ExpenseService.deleteFirm(firmId);
      showSuccess('Firm deleted successfully');
      loadFirms();
      onSuccess?.();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete firm');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large" title="Manage Firms & Bank Accounts">
      <div className="firm-management">
        <div className="fm-header">
          <button className="btn-primary" onClick={() => { setShowForm(true); setEditingFirm(null); }}>
            <FiPlus /> Add Firm
          </button>
        </div>

        {showForm && (
          <div className="fm-form-card">
            <h4>{editingFirm ? 'Edit Firm' : 'New Firm'}</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Firm Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Enter firm name" />
              </div>
              <div className="form-group">
                <label>Short Name</label>
                <input type="text" name="shortName" value={formData.shortName} onChange={handleInputChange} placeholder="Abbreviation" />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="City" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone number" />
              </div>
              <div className="form-group full-width">
                <label>Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Full address" />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => { setShowForm(false); setEditingFirm(null); }}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveFirm} disabled={loading}>
                {loading ? 'Saving...' : 'Save Firm'}
              </button>
            </div>
          </div>
        )}

        {showBankForm && selectedFirmForBank && (
          <div className="fm-form-card">
            <h4>Add Bank Account to {selectedFirmForBank.name}</h4>
            <div className="form-grid">
              <div className="form-group">
                <label>Account Name *</label>
                <input type="text" name="accountName" value={bankForm.accountName} onChange={handleBankInputChange} placeholder="e.g., Main Operating Account" />
              </div>
              <div className="form-group">
                <label>Bank Name</label>
                <input type="text" name="bankName" value={bankForm.bankName} onChange={handleBankInputChange} placeholder="Bank name" />
              </div>
              <div className="form-group">
                <label>Account Number</label>
                <input type="text" name="accountNumber" value={bankForm.accountNumber} onChange={handleBankInputChange} placeholder="Account number" />
              </div>
              <div className="form-group">
                <label>IFSC Code</label>
                <input type="text" name="ifscCode" value={bankForm.ifscCode} onChange={handleBankInputChange} placeholder="IFSC code" />
              </div>
              <div className="form-group">
                <label>Account Type</label>
                <select name="accountType" value={bankForm.accountType} onChange={handleBankInputChange}>
                  <option value="Current">Current</option>
                  <option value="Savings">Savings</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input type="checkbox" name="isDefault" checked={bankForm.isDefault} onChange={handleBankInputChange} />
                  Set as default account
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => { setShowBankForm(false); setSelectedFirmForBank(null); }}>Cancel</button>
              <button className="btn-primary" onClick={handleAddBankAccount} disabled={loading}>
                {loading ? 'Adding...' : 'Add Account'}
              </button>
            </div>
          </div>
        )}

        <div className="firm-list-section">
          {loading && (
            <div className="fm-loading">
              <FiLoader className="fm-spinner" size={24} />
              <span>Loading firms...</span>
            </div>
          )}
          {!loading && firms.length === 0 && (
            <div className="empty-state">
              <FiBriefcase size={40} />
              <p>No firms added yet</p>
            </div>
          )}
          {!loading && firms.map(firm => (
            <div key={firm._id} className="firm-item">
              <div className="firm-header">
                <h4>{firm.name}</h4>
                <div className="firm-actions">
                  <button title="Add Bank Account" onClick={() => { setSelectedFirmForBank(firm); setShowBankForm(true); }}>
                    <FiCreditCard />
                  </button>
                  <button title="Edit" onClick={() => { setEditingFirm(firm); setFormData(firm); setShowForm(true); }}>
                    <FiEdit2 />
                  </button>
                  <button title="Delete" onClick={() => handleDeleteFirm(firm._id)}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              <p className="firm-detail">{firm.city} {firm.phone && `• ${firm.phone}`}</p>
              {firm.bankAccounts && firm.bankAccounts.length > 0 && (
                <div className="bank-accounts-list">
                  {firm.bankAccounts.map(acc => (
                    <span key={acc._id} className="bank-tag">
                      <FiCreditCard /> {acc.accountName} {acc.isDefault && '★'}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

// ============== MAIN EXPENSES PAGE ==============
const ExpensesPage = () => {
  const { showError, showSuccess } = useToast();
  
  // Data state
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [firms, setFirms] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  
  // UI state
  const [activeTab, setActiveTab] = useState('list');
  const [showWizard, setShowWizard] = useState(false);
  const [showFirmModal, setShowFirmModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, expense: null });
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    firm: '',
    startDate: '',
    endDate: '',
    timeframe: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);

  // Load data on mount
  useEffect(() => {
    log('PAGE', 'Component mounted, loading initial data...');
    loadInitialData();
  }, []);

  // Reload expenses when filters change
  useEffect(() => {
    log('PAGE', 'Filters or pagination changed, reloading expenses...', { filters, page: pagination.page });
    loadExpenses();
  }, [filters, pagination.page]);

  const loadInitialData = async () => {
    log('PAGE', 'loadInitialData started...');
    setLoading(true);
    try {
      log('PAGE', 'Fetching categories and firms in parallel...');
      const [catRes, firmRes] = await Promise.all([
        ExpenseService.getCategories(),
        ExpenseService.getFirms()
      ]);
      
      log('PAGE', 'Categories API response:', catRes);
      log('PAGE', 'Firms API response:', firmRes);
      
      if (catRes.success) {
        log('PAGE', `Setting ${catRes.data?.length || 0} categories`);
        setCategories(catRes.data || []);
      }
      if (firmRes.success) {
        log('PAGE', `Setting ${firmRes.data?.length || 0} firms`);
        setFirms(firmRes.data || []);
      }
      
      log('PAGE', 'Loading expenses and analytics...');
      await Promise.all([loadExpenses(), loadAnalytics()]);
    } catch (err) {
      log('PAGE', 'Error in loadInitialData:', err);
      console.error('loadInitialData error details:', err.response?.data || err.message);
      showError('Failed to load data');
    } finally {
      setLoading(false);
      log('PAGE', 'loadInitialData complete');
    }
  };

  const loadExpenses = async () => {
    log('PAGE', 'loadExpenses started...');
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      // Apply timeframe filter
      if (filters.timeframe && filters.timeframe !== 'all') {
        const now = new Date();
        let startDate;
        switch (filters.timeframe) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'quarter':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            break;
        }
        if (startDate) {
          params.startDate = startDate.toISOString();
          params.endDate = new Date().toISOString();
        }
      }
      
      log('PAGE', 'Fetching expenses with params:', params);
      const res = await ExpenseService.getExpenses(params);
      log('PAGE', 'Expenses API response:', res);
      if (res.success) {
        log('PAGE', `Setting ${res.data?.expenses?.length || 0} expenses`);
        setExpenses(res.data.expenses || []);
        setPagination(prev => ({ ...prev, ...res.data.pagination }));
      }
    } catch (err) {
      log('PAGE', 'Error loading expenses:', err);
      console.error('Failed to load expenses:', err);
    }
  };

  const loadAnalytics = async () => {
    log('PAGE', 'loadAnalytics started...');
    try {
      const res = await ExpenseService.getAnalyticsSummary(filters);
      log('PAGE', 'Analytics API response:', res);
      if (res.success) {
        log('PAGE', 'Setting analytics data', res.data);
        setAnalytics(res.data);
      }
    } catch (err) {
      log('PAGE', 'Error loading analytics:', err);
      console.error('Failed to load analytics:', err);
    }
  };

  const handleRefresh = () => {
    log('PAGE', 'Refresh triggered');
    loadInitialData();
  };

  const handleDeleteExpense = async () => {
    if (!deleteConfirm.expense) return;
    log('PAGE', 'Deleting expense:', deleteConfirm.expense._id);
    try {
      await ExpenseService.deleteExpense(deleteConfirm.expense._id);
      showSuccess('Expense deleted successfully');
      setDeleteConfirm({ show: false, expense: null });
      loadExpenses();
      loadAnalytics();
    } catch (err) {
      log('PAGE', 'Error deleting expense:', err);
      showError(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  const handleFilterChange = (key, value) => {
    log('PAGE', `Filter changed: ${key}=${value}`);
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    log('PAGE', 'Clearing all filters');
    setFilters({
      search: '',
      category: '',
      firm: '',
      startDate: '',
      endDate: '',
      timeframe: 'all'
    });
  };

  const totalExpenses = useMemo(() => {
    return analytics?.summary?.[0]?.totalAmount || 0;
  }, [analytics]);

  const expenseCount = useMemo(() => {
    return analytics?.summary?.[0]?.count || 0;
  }, [analytics]);

  return (
    <div className="expenses-page">
      <Watermark />
      
      {/* Header */}
      <div className="expenses-header">
        <div className="header-left">
          <h1>Expenses</h1>
          <p>Manage and track non-project expenses</p>
        </div>
        <div className="header-actions">
          <button className="btn-icon" onClick={handleRefresh} title="Refresh">
            <FiRefreshCw />
          </button>
          <button className="btn-secondary" onClick={() => setShowFirmModal(true)}>
            <FiBriefcase /> Manage Firms
          </button>
          <button className="btn-primary" onClick={() => { setEditingExpense(null); setShowWizard(true); }}>
            <FiPlus /> Add Expense
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="expense-stats">
        <div className="stat-card">
          <div className="stat-icon total">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(totalExpenses)}</span>
            <span className="stat-label">Total Expenses</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon count">
            <FiFileText />
          </div>
          <div className="stat-content">
            <span className="stat-value">{expenseCount}</span>
            <span className="stat-label">Expense Entries</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon categories">
            <FiPieChart />
          </div>
          <div className="stat-content">
            <span className="stat-value">{categories.length}</span>
            <span className="stat-label">Categories</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon firms">
            <FiBriefcase />
          </div>
          <div className="stat-content">
            <span className="stat-value">{firms.length}</span>
            <span className="stat-label">Firms</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="expense-tabs">
        <button 
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <FiList /> Expense List
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FiPieChart /> Analytics
        </button>
      </div>

      {/* Filters */}
      <div className="expense-toolbar">
        <div className="search-box">
          <FiSearch />
          <input 
            type="text"
            placeholder="Search expenses..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        
        <div className="timeframe-selector">
          {['all', 'today', 'week', 'month', 'quarter', 'year'].map(tf => (
            <button
              key={tf}
              className={`tf-btn ${filters.timeframe === tf ? 'active' : ''}`}
              onClick={() => handleFilterChange('timeframe', tf)}
            >
              {tf === 'all' ? 'All Time' : tf.charAt(0).toUpperCase() + tf.slice(1)}
            </button>
          ))}
        </div>

        <button 
          className={`btn-filter ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <FiFilter /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Category</label>
            <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Firm</label>
            <select value={filters.firm} onChange={(e) => handleFilterChange('firm', e.target.value)}>
              <option value="">All Firms</option>
              {firms.map(firm => (
                <option key={firm._id} value={firm._id}>{firm.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>From Date</label>
            <input 
              type="date" 
              value={filters.startDate} 
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>To Date</label>
            <input 
              type="date" 
              value={filters.endDate} 
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
          <button className="btn-clear-filters" onClick={clearFilters}>
            <FiX /> Clear
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab === 'list' && (
        <div className="expense-list-section">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="empty-state">
              <FiFileText size={48} />
              <h3>No expenses found</h3>
              <p>Start by adding your first expense</p>
              <button className="btn-primary" onClick={() => setShowWizard(true)}>
                <FiPlus /> Add Expense
              </button>
            </div>
          ) : (
            <>
              <div className="expense-table-container">
                <table className="expense-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Firm / Bank</th>
                      <th>Title</th>
                      <th>Payment</th>
                      <th className="text-right">Amount</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map(expense => (
                      <tr key={expense._id}>
                        <td className="date-cell">
                          <span className="date">{formatDate(expense.date)}</span>
                        </td>
                        <td>
                          <span 
                            className="category-badge"
                            style={{ backgroundColor: expense.category?.color || '#6366f1' }}
                          >
                            {expense.category?.name || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          <div className="firm-bank-cell">
                            <span className="firm-name">{expense.firm?.name || 'N/A'}</span>
                            <span className="bank-name">{expense.bankAccountInfo?.accountName || ''}</span>
                          </div>
                        </td>
                        <td>
                          <span className="expense-title">{expense.title || '-'}</span>
                          {expense.notes && <span className="expense-notes">{expense.notes}</span>}
                        </td>
                        <td>
                          <span className="payment-mode">{expense.paymentMode}</span>
                          {expense.referenceNumber && (
                            <span className="ref-number">{expense.referenceNumber}</span>
                          )}
                        </td>
                        <td className="text-right amount-cell">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="action-btn edit"
                              title="Edit"
                              onClick={() => { setEditingExpense(expense); setShowWizard(true); }}
                            >
                              <FiEdit2 />
                            </button>
                            <button 
                              className="action-btn delete"
                              title="Delete"
                              onClick={() => setDeleteConfirm({ show: true, expense })}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="pagination">
                  <button 
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </button>
                  <span>Page {pagination.page} of {pagination.pages}</span>
                  <button 
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="expense-analytics-section">
          {/* Category Breakdown */}
          <div className="analytics-card">
            <h3><FiPieChart /> Category Breakdown</h3>
            <div className="category-breakdown">
              {analytics?.byCategory?.map(cat => {
                const percentage = totalExpenses > 0 
                  ? ((cat.totalAmount / totalExpenses) * 100).toFixed(1) 
                  : 0;
                return (
                  <div key={cat._id} className="breakdown-item">
                    <div className="breakdown-header">
                      <span className="breakdown-name" style={{ color: cat.color }}>
                        {cat.name}
                      </span>
                      <span className="breakdown-amount">{formatCurrency(cat.totalAmount)}</span>
                    </div>
                    <div className="breakdown-bar-container">
                      <div 
                        className="breakdown-bar"
                        style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <div className="breakdown-meta">
                      <span>{cat.count} expenses</span>
                      <span>{percentage}%</span>
                    </div>
                  </div>
                );
              })}
              {(!analytics?.byCategory || analytics.byCategory.length === 0) && (
                <div className="empty-analytics">No data available</div>
              )}
            </div>
          </div>

          {/* Firm Breakdown */}
          <div className="analytics-card">
            <h3><FiBriefcase /> Firm-wise Expenses</h3>
            <div className="firm-breakdown">
              {analytics?.byFirm?.map(firm => (
                <div key={firm._id} className="firm-breakdown-item">
                  <span className="firm-name">{firm.name}</span>
                  <span className="firm-amount">{formatCurrency(firm.totalAmount)}</span>
                  <span className="firm-count">{firm.count} entries</span>
                </div>
              ))}
              {(!analytics?.byFirm || analytics.byFirm.length === 0) && (
                <div className="empty-analytics">No data available</div>
              )}
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="analytics-card full-width">
            <h3><FiTrendingUp /> Monthly Trend</h3>
            <div className="monthly-trend">
              {analytics?.monthlyTrend?.map(month => (
                <div key={month._id} className="trend-bar-wrapper">
                  <div 
                    className="trend-bar"
                    style={{ 
                      height: `${Math.max(5, (month.totalAmount / (Math.max(...analytics.monthlyTrend.map(m => m.totalAmount)) || 1)) * 100)}%`
                    }}
                    title={`${month._id}: ${formatCurrency(month.totalAmount)}`}
                  />
                  <span className="trend-label">{month._id.split('-')[1]}</span>
                </div>
              ))}
              {(!analytics?.monthlyTrend || analytics.monthlyTrend.length === 0) && (
                <div className="empty-analytics">No trend data available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ExpenseWizard 
        isOpen={showWizard}
        onClose={() => { setShowWizard(false); setEditingExpense(null); }}
        onSuccess={() => { loadExpenses(); loadAnalytics(); }}
        editData={editingExpense}
      />

      <FirmManagementModal
        isOpen={showFirmModal}
        onClose={() => setShowFirmModal(false)}
        onSuccess={() => { loadInitialData(); }}
      />

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, expense: null })}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message={`Are you sure you want to delete this expense of ${formatCurrency(deleteConfirm.expense?.amount)}?`}
        confirmText="Delete"
        confirmColor="danger"
      />
    </div>
  );
};

export default ExpensesPage;
