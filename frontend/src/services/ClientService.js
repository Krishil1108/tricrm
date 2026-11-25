import api, { getAuthHeader } from '../utils/api';
import clientCache from '../utils/clientCache';

const invalidateClientCache = () => {
  clientCache.invalidate('client');
  clientCache.invalidate('home_dashboard_stats');
  clientCache.invalidate('dashboard-stats');
};

class ClientService {
  // Get all clients — SWR cached so page navigation is instant
  static async getAllClients(filters = {}, options = {}) {
    const key = clientCache.generateKey('clients_list', filters);
    return clientCache.fetchWithCache(
      key,
      async () => {
        try {
          const response = await api.get('/clients');
          // api.get already returns parsed data; extract the data array
          return response.data || response || [];
        } catch (error) {
          console.error('Error fetching clients:', error);
          throw error;
        }
      },
      options
    );
  }

  // Create a new client
  static async createClient(clientData) {
    try {
      const response = await api.post('/clients', clientData);
      invalidateClientCache();
      return response.data || response;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // Update a client
  static async updateClient(clientId, updateData) {
    try {
      const response = await api.put(`/clients/${clientId}`, updateData);
      invalidateClientCache();
      return response.data || response;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  // Delete a client
  static async deleteClient(clientId) {
    try {
      const response = await api.delete(`/clients/${clientId}`);
      invalidateClientCache();
      return response;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // Get a single client — cached per ID
  static async getClient(clientId, options = {}) {
    return clientCache.fetchWithCache(
      `client_${clientId}`,
      async () => {
        try {
          const response = await api.get(`/clients/${clientId}`);
          return response.data || response;
        } catch (error) {
          console.error('Error fetching client:', error);
          throw error;
        }
      },
      options
    );
  }
}

export default ClientService;