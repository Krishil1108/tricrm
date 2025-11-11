import api from '../utils/api';

class ClientService {
  // Get all clients
  static async getAllClients() {
    try {
      const response = await api.get('/clients');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  // Create a new client
  static async createClient(clientData) {
    try {
      const response = await api.post('/clients', clientData);
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
      return response;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // Get a single client
  static async getClient(clientId) {
    try {
      const response = await api.get(`/clients/${clientId}`);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  }
}

export default ClientService;