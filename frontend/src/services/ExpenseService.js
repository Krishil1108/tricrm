import axios from 'axios';
import API_BASE_URL from '../config/api';

const API_URL = API_BASE_URL;

// Debug logger
const DEBUG = true;
const log = (area, message, data = null) => {
  if (DEBUG) {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
    if (data !== null) {
      console.log(`[${timestamp}] [ExpenseService-${area}]`, message, data);
    } else {
      console.log(`[${timestamp}] [ExpenseService-${area}]`, message);
    }
  }
};

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper to normalize API response - handles both {success: true} and {status: 'success'} formats
const normalizeResponse = (response) => {
  const data = response.data;
  return {
    success: data.success === true || data.status === 'success',
    data: data.data,
    message: data.message,
    pagination: data.pagination
  };
};

const ExpenseService = {
  // ==================== EXPENSE CATEGORY METHODS ====================
  
  // Get all categories
  getCategories: async (includeInactive = false) => {
    log('CATEGORIES', 'Fetching categories...', { includeInactive });
    try {
      const response = await axios.get(`${API_URL}/expenses/categories`, {
        headers: getAuthHeader(),
        params: { includeInactive }
      });
      log('CATEGORIES', 'Raw response:', response);
      log('CATEGORIES', 'Response data:', response.data);
      return normalizeResponse(response);
    } catch (error) {
      log('CATEGORIES', 'Error:', error.response?.data || error.message);
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Create custom category
  createCategory: async (categoryData) => {
    log('CATEGORIES', 'Creating category...', categoryData);
    try {
      const response = await axios.post(`${API_URL}/expenses/categories`, categoryData, {
        headers: getAuthHeader()
      });
      log('CATEGORIES', 'Create response:', response.data);
      return normalizeResponse(response);
    } catch (error) {
      log('CATEGORIES', 'Create error:', error.response?.data || error.message);
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    try {
      const response = await axios.put(`${API_URL}/expenses/categories/${id}`, categoryData, {
        headers: getAuthHeader()
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/expenses/categories/${id}`, {
        headers: getAuthHeader()
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  // ==================== FIRM METHODS ====================
  
  // Get all firms
  getFirms: async (params = {}) => {
    log('FIRMS', 'Fetching firms...', params);
    try {
      const response = await axios.get(`${API_URL}/expenses/firms`, {
        headers: getAuthHeader(),
        params
      });
      log('FIRMS', 'Raw response:', response);
      log('FIRMS', 'Response data:', response.data);
      return normalizeResponse(response);
    } catch (error) {
      log('FIRMS', 'Error:', error.response?.data || error.message);
      console.error('Error fetching firms:', error);
      throw error;
    }
  },

  // Get single firm
  getFirm: async (id) => {
    log('FIRMS', 'Fetching single firm...', { id });
    try {
      const response = await axios.get(`${API_URL}/expenses/firms/${id}`, {
        headers: getAuthHeader()
      });
      log('FIRMS', 'Single firm response:', response.data);
      return normalizeResponse(response);
    } catch (error) {
      log('FIRMS', 'Error fetching firm:', error.response?.data || error.message);
      console.error('Error fetching firm:', error);
      throw error;
    }
  },

  // Create firm
  createFirm: async (firmData) => {
    log('FIRMS', 'Creating firm...', firmData);
    try {
      const response = await axios.post(`${API_URL}/expenses/firms`, firmData, {
        headers: getAuthHeader()
      });
      log('FIRMS', 'Create firm response:', response.data);
      return normalizeResponse(response);
    } catch (error) {
      log('FIRMS', 'Create firm error:', error.response?.data || error.message);
      console.error('Error creating firm:', error);
      throw error;
    }
  },

  // Update firm
  updateFirm: async (id, firmData) => {
    log('FIRMS', 'Updating firm...', { id, firmData });
    try {
      const response = await axios.put(`${API_URL}/expenses/firms/${id}`, firmData, {
        headers: getAuthHeader()
      });
      log('FIRMS', 'Update firm response:', response.data);
      return normalizeResponse(response);
    } catch (error) {
      log('FIRMS', 'Update firm error:', error.response?.data || error.message);
      console.error('Error updating firm:', error);
      throw error;
    }
  },

  // Delete firm
  deleteFirm: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/expenses/firms/${id}`, {
        headers: getAuthHeader()
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error deleting firm:', error);
      throw error;
    }
  },

  // Add bank account to firm
  addBankAccount: async (firmId, accountData) => {
    try {
      const response = await axios.post(`${API_URL}/expenses/firms/${firmId}/bank-accounts`, accountData, {
        headers: getAuthHeader()
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error adding bank account:', error);
      throw error;
    }
  },

  // Update bank account
  updateBankAccount: async (firmId, accountId, accountData) => {
    try {
      const response = await axios.put(`${API_URL}/expenses/firms/${firmId}/bank-accounts/${accountId}`, accountData, {
        headers: getAuthHeader()
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error updating bank account:', error);
      throw error;
    }
  },

  // Delete bank account
  deleteBankAccount: async (firmId, accountId) => {
    try {
      const response = await axios.delete(`${API_URL}/expenses/firms/${firmId}/bank-accounts/${accountId}`, {
        headers: getAuthHeader()
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error deleting bank account:', error);
      throw error;
    }
  },

  // ==================== EXPENSE METHODS ====================
  
  // Get all expenses with filters
  getExpenses: async (filters = {}) => {
    log('EXPENSES', 'Fetching expenses with filters:', filters);
    try {
      const response = await axios.get(`${API_URL}/expenses`, {
        headers: getAuthHeader(),
        params: filters
      });
      log('EXPENSES', 'Raw response:', response);
      log('EXPENSES', 'Response data:', response.data);
      const normalized = normalizeResponse(response);
      log('EXPENSES', 'Normalized response:', normalized);
      log('EXPENSES', `Found ${normalized.data?.expenses?.length || 0} expenses`);
      return normalized;
    } catch (error) {
      log('EXPENSES', 'Error fetching expenses:', error.response?.data || error.message);
      console.error('Error fetching expenses:', error);
      throw error;
    }
  },

  // Get single expense
  getExpense: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/expenses/${id}`, {
        headers: getAuthHeader()
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error fetching expense:', error);
      throw error;
    }
  },

  // Create expense
  createExpense: async (expenseData) => {
    log('EXPENSES', 'Creating expense...', expenseData);
    try {
      const formData = new FormData();
      
      // Append all fields
      Object.keys(expenseData).forEach(key => {
        if (key === 'attachments' && expenseData.attachments) {
          // Handle file attachments
          expenseData.attachments.forEach(file => {
            formData.append('attachments', file);
          });
          log('EXPENSES', `Added ${expenseData.attachments.length} attachments`);
        } else if (key === 'tags' && Array.isArray(expenseData.tags)) {
          formData.append('tags', expenseData.tags.join(','));
          log('EXPENSES', 'Added tags:', expenseData.tags);
        } else if (expenseData[key] !== undefined && expenseData[key] !== null) {
          formData.append(key, expenseData[key]);
        }
      });

      // Log what's being sent
      log('EXPENSES', 'FormData fields:', {
        category: expenseData.category,
        firm: expenseData.firm,
        bankAccount: expenseData.bankAccount,
        amount: expenseData.amount,
        date: expenseData.date,
        paymentMode: expenseData.paymentMode,
        title: expenseData.title
      });

      const response = await axios.post(`${API_URL}/expenses`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      log('EXPENSES', 'Create response:', response.data);
      return normalizeResponse(response);
    } catch (error) {
      log('EXPENSES', 'Error creating expense:', error.response?.data || error.message);
      console.error('Error creating expense:', error);
      throw error;
    }
  },

  // Update expense
  updateExpense: async (id, expenseData) => {
    try {
      const formData = new FormData();
      
      Object.keys(expenseData).forEach(key => {
        if (key === 'attachments' && expenseData.attachments) {
          expenseData.attachments.forEach(file => {
            if (file instanceof File) {
              formData.append('attachments', file);
            }
          });
        } else if (key === 'tags' && Array.isArray(expenseData.tags)) {
          formData.append('tags', expenseData.tags.join(','));
        } else if (expenseData[key] !== undefined && expenseData[key] !== null) {
          formData.append(key, expenseData[key]);
        }
      });

      const response = await axios.put(`${API_URL}/expenses/${id}`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },

  // Delete expense
  deleteExpense: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/expenses/${id}`, {
        headers: getAuthHeader()
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // Remove attachment
  removeAttachment: async (expenseId, attachmentId) => {
    try {
      const response = await axios.delete(`${API_URL}/expenses/${expenseId}/attachments/${attachmentId}`, {
        headers: getAuthHeader()
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error removing attachment:', error);
      throw error;
    }
  },

  // ==================== ANALYTICS METHODS ====================
  
  // Get expense analytics summary
  getAnalyticsSummary: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/expenses/analytics/summary`, {
        headers: getAuthHeader(),
        params: filters
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      throw error;
    }
  },

  // Get expense trends
  getTrends: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/expenses/analytics/trends`, {
        headers: getAuthHeader(),
        params
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error fetching trends:', error);
      throw error;
    }
  },

  // Get year-over-year comparison
  getComparison: async (years = 3) => {
    try {
      const response = await axios.get(`${API_URL}/expenses/analytics/comparison`, {
        headers: getAuthHeader(),
        params: { years }
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error fetching comparison:', error);
      throw error;
    }
  },

  // Get fiscal year summary
  getFiscalYearSummary: async (fy) => {
    try {
      const response = await axios.get(`${API_URL}/expenses/analytics/fiscal-year`, {
        headers: getAuthHeader(),
        params: { fy }
      });
      return normalizeResponse(response);
    } catch (error) {
      console.error('Error fetching fiscal year summary:', error);
      throw error;
    }
  },

  // ==================== UTILITY METHODS ====================
  
  // Format currency
  formatCurrency: (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  },

  // Format date
  formatDate: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  },

  // Get fiscal year from date
  getFiscalYear: (date) => {
    const d = new Date(date);
    const month = d.getMonth();
    const year = d.getFullYear();
    if (month >= 3) {
      return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
  },

  // Get available fiscal years
  getAvailableFiscalYears: () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const startYear = currentMonth >= 3 ? currentYear : currentYear - 1;
    const years = [];
    for (let i = 0; i < 5; i++) {
      const fy = startYear - i;
      years.push(`${fy}-${fy + 1}`);
    }
    return years;
  }
};

export default ExpenseService;
