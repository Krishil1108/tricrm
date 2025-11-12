import api from '../utils/api';

class AssociateService {
  // Get all associates
  static async getAllAssociates() {
    try {
      const response = await api.get('/associates');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching associates:', error);
      throw error;
    }
  }

  // Create a new associate
  static async createAssociate(associateData) {
    try {
      const response = await api.post('/associates', associateData);
      return response.data || response;
    } catch (error) {
      console.error('Error creating associate:', error);
      throw error;
    }
  }

  // Update an associate
  static async updateAssociate(associateId, updateData) {
    try {
      const response = await api.put(`/associates/${associateId}`, updateData);
      return response.data || response;
    } catch (error) {
      console.error('Error updating associate:', error);
      throw error;
    }
  }

  // Delete an associate
  static async deleteAssociate(associateId) {
    try {
      const response = await api.delete(`/associates/${associateId}`);
      return response;
    } catch (error) {
      console.error('Error deleting associate:', error);
      throw error;
    }
  }

  // Get a single associate
  static async getAssociate(associateId) {
    try {
      const response = await api.get(`/associates/${associateId}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching associate:', error);
      throw error;
    }
  }
}

export default AssociateService;