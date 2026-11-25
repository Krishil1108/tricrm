import api from '../utils/api';
import clientCache from '../utils/clientCache';

export const invalidateAssociateCache = () => {
  clientCache.invalidate('associate');
  clientCache.invalidate('dashboard-stats');
};

class AssociateService {
  // Get all associates with SWR cache
  static async getAllAssociates(options = {}) {
    return clientCache.fetchWithCache('associates_all', async () => {
      try {
        const response = await api.get('/associates');
        return response.data || [];
      } catch (error) {
        console.error('Error fetching associates:', error);
        throw error;
      }
    }, options);
  }

  // Create a new associate
  static async createAssociate(associateData) {
    try {
      const response = await api.post('/associates', associateData);
      invalidateAssociateCache();
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
      invalidateAssociateCache();
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
      invalidateAssociateCache();
      return response;
    } catch (error) {
      console.error('Error deleting associate:', error);
      throw error;
    }
  }

  // Get a single associate with SWR cache
  static async getAssociate(associateId, options = {}) {
    return clientCache.fetchWithCache(`associate_${associateId}`, async () => {
      try {
        const response = await api.get(`/associates/${associateId}`);
        return response.data || response;
      } catch (error) {
        console.error('Error fetching associate:', error);
        throw error;
      }
    }, options);
  }
}

export default AssociateService;
