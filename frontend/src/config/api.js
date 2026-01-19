// API Configuration
// Automatically detect if running in production or development
const getApiBaseUrl = () => {
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  
  // Check if running in production (deployed)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // If on trimity-crm.onrender.com (static site), use backend API
    if (window.location.hostname === 'trimity-crm.onrender.com') {
      return 'https://trimity-crm-backend.onrender.com/api';
    }
    // If on trimity-crm-backend.onrender.com (unified), use relative path
    if (window.location.hostname === 'trimity-crm-backend.onrender.com') {
      return '/api';
    }
    // For any other production domain, use relative path
    return '/api';
  }
  
  // Development fallback
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;