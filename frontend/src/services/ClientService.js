import api from '../utils/api';

class ClientService {
  // Get all clients
  static async getAllClients() {
    try {
      return await api.get('/clients');
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  // Create a new client
  static async createClient(clientData) {
    try {
      return await api.post('/clients', clientData);
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  // Update a client
  static async updateClient(clientId, updateData) {
    try {
      return await api.put(`/clients/${clientId}`, updateData);
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  // Delete a client
  static async deleteClient(clientId) {
    try {
      return await api.delete(`/clients/${clientId}`);
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // Get a single client
  static async getClient(clientId) {
    try {
      return await api.get(`/clients/${clientId}`);
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  }
}

export default ClientService;