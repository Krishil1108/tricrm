import axios from 'axios';
import API_BASE_URL from '../config/api';
import clientCache from '../utils/clientCache';

const API_URL = API_BASE_URL;

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const invalidateFinanceCache = () => {
  clientCache.invalidate('finance');
  clientCache.invalidate('project');
  clientCache.invalidate('dashboard-stats');
};

const FinanceService = {
  // ==================== PROJECT METHODS ====================
  
  // Get all projects
  getAllProjects: async (filters = {}, options = {}) => {
    const key = clientCache.generateKey('finance_projects', filters);
    return clientCache.fetchWithCache(
      key,
      async () => {
        try {
          const response = await axios.get(`${API_URL}/finance/projects`, {
            headers: getAuthHeader(),
            params: filters
          });
          return response.data;
        } catch (error) {
          console.error('Error fetching projects:', error);
          throw error;
        }
      },
      options
    );
  },

  // Get single project
  getProject: async (id, options = {}) => {
    return clientCache.fetchWithCache(
      `finance_project_${id}`,
      async () => {
        try {
          const response = await axios.get(`${API_URL}/finance/projects/${id}`, {
            headers: getAuthHeader()
          });
          return response.data;
        } catch (error) {
          console.error('Error fetching project:', error);
          throw error;
        }
      },
      options
    );
  },

  // Get projects by client ID
  getProjectsByClient: async (clientId, filters = {}, options = {}) => {
    const key = clientCache.generateKey(`finance_client_${clientId}_projects`, filters);
    return clientCache.fetchWithCache(
      key,
      async () => {
        try {
          const response = await axios.get(`${API_URL}/finance/clients/${clientId}/projects`, {
            headers: getAuthHeader(),
            params: filters
          });
          return response.data.data || response.data;
        } catch (error) {
          console.error('Error fetching client projects:', error);
          throw error;
        }
      },
      options
    );
  },

  // Get projects by associate ID
  getProjectsByAssociate: async (associateId, filters = {}, options = {}) => {
    const key = clientCache.generateKey(`finance_associate_${associateId}_projects`, filters);
    return clientCache.fetchWithCache(
      key,
      async () => {
        try {
          const response = await axios.get(`${API_URL}/finance/projects/associate/${associateId}`, {
            headers: getAuthHeader(),
            params: filters
          });
          return response.data.data || response.data;
        } catch (error) {
          console.error('Error fetching associate projects:', error);
          throw error;
        }
      },
      options
    );
  },

  // Create project
  createProject: async (projectData) => {
    try {
      const response = await axios.post(`${API_URL}/finance/projects`, projectData, {
        headers: getAuthHeader()
      });
      invalidateFinanceCache();
      return response.data;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Update project
  updateProject: async (id, projectData) => {
    try {
      const response = await axios.put(`${API_URL}/finance/projects/${id}`, projectData, {
        headers: getAuthHeader()
      });
      invalidateFinanceCache();
      return response.data;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Delete project
  deleteProject: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/finance/projects/${id}`, {
        headers: getAuthHeader()
      });
      invalidateFinanceCache();
      return response.data;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Remove project from specific client
  removeProjectFromClient: async (clientId, projectId) => {
    try {
      const response = await axios.delete(`${API_URL}/finance/clients/${clientId}/projects/${projectId}`, {
        headers: getAuthHeader()
      });
      invalidateFinanceCache();
      return response.data;
    } catch (error) {
      console.error('Error removing project from client:', error);
      throw error;
    }
  },

  // ==================== EXPENSE METHODS ====================
  
  // Get all expenses
  getAllExpenses: async (filters = {}, options = {}) => {
    const key = clientCache.generateKey('finance_expenses', filters);
    return clientCache.fetchWithCache(
      key,
      async () => {
        try {
          const response = await axios.get(`${API_URL}/finance/expenses`, {
            headers: getAuthHeader(),
            params: filters
          });
          return response.data;
        } catch (error) {
          console.error('Error fetching expenses:', error);
          throw error;
        }
      },
      options
    );
  },

  // Create/Update expense
  saveExpense: async (expenseData) => {
    try {
      const response = await axios.post(`${API_URL}/finance/expenses`, expenseData, {
        headers: getAuthHeader()
      });
      clientCache.invalidate('expense');
      clientCache.invalidate('dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Error saving expense:', error);
      throw error;
    }
  },

  // Delete expense
  deleteExpense: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/finance/expenses/${id}`, {
        headers: getAuthHeader()
      });
      clientCache.invalidate('expense');
      clientCache.invalidate('dashboard-stats');
      return response.data;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // ==================== ANALYTICS METHODS ====================
  
  // Get finance statistics
  getStats: async (filters = {}, options = {}) => {
    const key = clientCache.generateKey('finance_stats', filters);
    return clientCache.fetchWithCache(
      key,
      async () => {
        try {
          const response = await axios.get(`${API_URL}/finance/stats`, {
            headers: getAuthHeader(),
            params: filters
          });
          return response.data;
        } catch (error) {
          console.error('Error fetching stats:', error);
          throw error;
        }
      },
      options
    );
  },

  // ==================== IMPORT/EXPORT METHODS ====================
  
  // Import projects from Excel
  importProjects: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API_URL}/finance/import/projects`, formData, {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      });
      invalidateFinanceCache();
      return response.data;
    } catch (error) {
      console.error('Error importing projects:', error);
      throw error;
    }
  },

  // Export projects to Excel
  exportProjects: async () => {
    try {
      const response = await axios.get(`${API_URL}/finance/export/projects`, {
        headers: getAuthHeader(),
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `finance_projects_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true, message: 'Export successful' };
    } catch (error) {
      console.error('Error exporting projects:', error);
      throw error;
    }
  },

  // Export expenses to Excel
  exportExpenses: async (filters = {}) => {
    try {
      const response = await axios.get(`${API_URL}/finance/export/expenses`, {
        headers: getAuthHeader(),
        params: filters,
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `bank_expenses_${filters.year || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true, message: 'Export successful' };
    } catch (error) {
      console.error('Error exporting expenses:', error);
      throw error;
    }
  },

  // ==================== ASSOCIATE PAYMENT METHODS ====================
  
  // Add payment transaction for an associate
  addAssociatePaymentTransaction: async (paymentData) => {
    try {
      const response = await axios.post(`${API_URL}/finance/projects/associate-payment`, paymentData, {
        headers: getAuthHeader()
      });
      invalidateFinanceCache();
      return response.data;
    } catch (error) {
      console.error('Error adding associate payment transaction:', error);
      throw error;
    }
  },

  // Get payment transactions for an associate in a project
  getAssociatePaymentTransactions: async (projectId, associateId, options = {}) => {
    return clientCache.fetchWithCache(
      `associate_payments_${projectId}_${associateId}`,
      async () => {
        try {
          const response = await axios.get(`${API_URL}/finance/projects/${projectId}/associate/${associateId}/payments`, {
            headers: getAuthHeader()
          });
          return response.data;
        } catch (error) {
          console.error('Error fetching associate payment transactions:', error);
          throw error;
        }
      },
      options
    );
  },

  // Update payment transaction for an associate
  updateAssociatePaymentTransaction: async (projectId, associateId, transactionId, paymentData) => {
    try {
      const response = await axios.put(`${API_URL}/finance/projects/${projectId}/associate/${associateId}/payments/${transactionId}`, paymentData, {
        headers: getAuthHeader()
      });
      invalidateFinanceCache();
      return response.data;
    } catch (error) {
      console.error('Error updating associate payment transaction:', error);
      throw error;
    }
  },

  // Delete payment transaction for an associate
  deleteAssociatePaymentTransaction: async (projectId, associateId, transactionId) => {
    try {
      const response = await axios.delete(`${API_URL}/finance/projects/${projectId}/associate/${associateId}/payments/${transactionId}`, {
        headers: getAuthHeader()
      });
      invalidateFinanceCache();
      return response.data;
    } catch (error) {
      console.error('Error deleting associate payment transaction:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // ==================== FINANCIAL OVERVIEW METHOD ====================

  // Get consolidated financial overview (used by FinanceDashboard)
  getFinancialOverview: async (filters = {}, options = {}) => {
    const key = clientCache.generateKey('finance_overview', filters);
    return clientCache.fetchWithCache(
      key,
      async () => {
        try {
          const response = await axios.get(`${API_URL}/finance/overview`, {
            headers: getAuthHeader(),
            params: filters
          });
          return response.data;
        } catch (error) {
          console.error('Error fetching financial overview:', error);
          throw error;
        }
      },
      options
    );
  },

  // ==================== UTILITY METHODS ====================
  
  // Reconcile: fix projects where totalReceivedFees doesn't match actual payment sums
  reconcileReceivedFees: async () => {
    try {
      const response = await axios.post(`${API_URL}/finance/reconcile-received-fees`, {}, {
        headers: getAuthHeader()
      });
      invalidateFinanceCache();
      return response.data;
    } catch (error) {
      console.error('Error reconciling received fees:', error);
      throw error;
    }
  },

  // Apply default expense percentages to projects without configuration
  applyDefaultPercentages: async () => {
    try {
      const response = await axios.post(`${API_URL}/finance/projects/apply-default-percentages`, {}, {
        headers: getAuthHeader()
      });
      invalidateFinanceCache();
      return response.data;
    } catch (error) {
      console.error('❌ Error applying default percentages:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      console.error('Error request:', error.request);
      console.error('Error config:', error.config);
      throw error;
    }
  }
};

export default FinanceService;
