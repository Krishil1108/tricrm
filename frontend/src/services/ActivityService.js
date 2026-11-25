import axios from 'axios';
import API_BASE_URL from '../config/api';
import { getAuthHeader } from '../utils/api';

const ActivityService = {
  baseUrl: `${API_BASE_URL}/activities`,

  getRecentActivities: async (limit = 3) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/activities/recent?limit=${limit}`, {
        headers: getAuthHeader()
      });

      const raw = response.data?.data ?? response.data;
      return Array.isArray(raw) ? raw : [];
    } catch (error) {
      console.error('Error fetching recent activities:', error.response?.data || error.message);
      return [];
    }
  },

  getAllActivities: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_BASE_URL}/activities?${queryString}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  },

  getActivityStats: async (userId = null, days = 30) => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('days', days);

      const response = await axios.get(`${API_BASE_URL}/activities/stats/summary?${params.toString()}`, {
        headers: getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  },

  formatActivityDescription: (activity) => {
    const timeAgo = ActivityService.getTimeAgo(activity.timestamp);
    return {
      ...activity,
      timeAgo,
      formattedTime: new Date(activity.timestamp).toLocaleString('en-IN', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  },

  getTimeAgo: (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now - activityTime) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return activityTime.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: activityTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  },

  getActivityIcon: (type) => {
    const icons = {
      client_added: '👤',
      associate_added: '🤝',
      project_added: '📁',
      payment_added: '💰',
      whatsapp_sent: '💬',
      note_added: '📝',
      client_updated: '✏️',
      note_updated: '📄'
    };
    return icons[type] || '📋';
  },

  getActivityColor: (type) => {
    const colors = {
      client_added: '#4CAF50',
      associate_added: '#2196F3',
      project_added: '#6366f1',
      payment_added: '#10b981',
      whatsapp_sent: '#22c55e',
      note_added: '#9C27B0',
      client_updated: '#607D8B',
      note_updated: '#E91E63'
    };
    return colors[type] || '#666';
  }
};

export default ActivityService;
