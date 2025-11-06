// API utility for handling authenticated requests

const API_BASE_URL = 'http://localhost:5000/api';

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

// Specific API methods for common operations

export const api = {
  // GET request
  get: (endpoint) => apiCall(endpoint, { method: 'GET' }),

  // POST request
  post: (endpoint, data) => apiCall(endpoint, { method: 'POST', body: data }),

  // PUT request
  put: (endpoint, data) => apiCall(endpoint, { method: 'PUT', body: data }),

  // DELETE request
  delete: (endpoint) => apiCall(endpoint, { method: 'DELETE' }),

  // PATCH request
  patch: (endpoint, data) => apiCall(endpoint, { method: 'PATCH', body: data })
};

export default api;
