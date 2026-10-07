import API_BASE_URL_CONFIG from '../config/api';
import clientCache from './clientCache';

const API_BASE_URL = API_BASE_URL_CONFIG;

// Get auth headers with token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Handle API errors
const handleResponse = async (response) => {
  if (response.status === 401) {
    // Unauthorized - redirect to login
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'An error occurred');
  }

  return data;
};

// Generic API call function
export const apiCall = async (endpoint, options = {}) => {
  const { method = 'GET', body, headers = {} } = options;

  const config = {
    method,
    headers: {
      ...getAuthHeaders(),
      ...headers
    }
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return await handleResponse(response);
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Invalidate relevant cache based on endpoint
const invalidateRelatedCache = (endpoint) => {
  if (endpoint.includes('/clients')) {
    clientCache.invalidate('client');
  } else if (endpoint.includes('/associates')) {
    clientCache.invalidate('associate');
  } else if (endpoint.includes('/projects') || endpoint.includes('/finance')) {
    clientCache.invalidate('finance');
    clientCache.invalidate('project');
  } else if (endpoint.includes('/expenses')) {
    clientCache.invalidate('expense');
  } else {
    clientCache.invalidate();
  }
  clientCache.invalidate('dashboard-stats');
};

// Specific API methods for common operations with client caching
export const api = {
  // GET request with stale-while-revalidate caching
  get: (endpoint, options = {}) => {
    return clientCache.fetchWithCache(
      `api_get:${endpoint}`,
      () => apiCall(endpoint, { method: 'GET' }),
      options
    );
  },

  // POST request
  post: async (endpoint, data) => {
    const res = await apiCall(endpoint, { method: 'POST', body: data });
    invalidateRelatedCache(endpoint);
    return res;
  },

  // PUT request
  put: async (endpoint, data) => {
    const res = await apiCall(endpoint, { method: 'PUT', body: data });
    invalidateRelatedCache(endpoint);
    return res;
  },

  // DELETE request
  delete: async (endpoint) => {
    const res = await apiCall(endpoint, { method: 'DELETE' });
    invalidateRelatedCache(endpoint);
    return res;
  },

  // PATCH request
  patch: async (endpoint, data) => {
    const res = await apiCall(endpoint, { method: 'PATCH', body: data });
    invalidateRelatedCache(endpoint);
    return res;
  }
};

export default api;

