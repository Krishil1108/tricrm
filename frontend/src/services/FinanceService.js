import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const FinanceService = {
  // ==================== PROJECT METHODS ====================
  
  // Get all projects
  getAllProjects: async (filters = {}) => {
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

  // Get single project
  getProject: async (id) => {
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

  // Get projects by client ID
  getProjectsByClient: async (clientId, filters = {}) => {
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

  // Get projects by associate ID
  getProjectsByAssociate: async (associateId, filters = {}) => {
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

  // Create project
  createProject: async (projectData) => {
    try {
      const response = await axios.post(`${API_URL}/finance/projects`, projectData, {
        headers: getAuthHeader()
      });
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
      return response.data;
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // ==================== EXPENSE METHODS ====================
  
  // Get all expenses
  getAllExpenses: async (filters = {}) => {
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

  // Create/Update expense
  saveExpense: async (expenseData) => {
    try {
      const response = await axios.post(`${API_URL}/finance/expenses`, expenseData, {
        headers: getAuthHeader()
      });
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
      return response.data;
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // ==================== ANALYTICS METHODS ====================
  
  // Get finance statistics
  getStats: async (filters = {}) => {
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
  }
};

export default FinanceService;
