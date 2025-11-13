import api from '../utils/api';

class ConfigurationVersionService {
  // Get current active configuration
  static async getCurrentConfiguration() {
    try {
      const response = await api.get('/configuration-versions/current');
      return response.data;
    } catch (error) {
      console.error('Error fetching current configuration:', error);
      throw error;
    }
  }

  // Save new configuration version
  static async saveConfiguration(configuration, changeDescription = '') {
    try {
      const response = await api.post('/configuration-versions/save', {
        configuration,
        changeDescription
      });
      return response.data;
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }

  // Get configuration by version number
  static async getConfigurationByVersion(versionNumber) {
    try {
      const response = await api.get(`/configuration-versions/version/${versionNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching configuration by version:', error);
      throw error;
    }
  }

  // Get configuration history
  static async getConfigurationHistory(limit = 10) {
    try {
      const response = await api.get('/configuration-versions/history', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching configuration history:', error);
      throw error;
    }
  }

  // Get all configuration versions
  static async getAllVersions() {
    try {
      const response = await api.get('/configuration-versions/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching all versions:', error);
      throw error;
    }
  }
}

export default ConfigurationVersionService;
