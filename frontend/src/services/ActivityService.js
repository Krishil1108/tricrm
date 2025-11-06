import axios from 'axios';

class ActivityService {
  constructor() {
    this.baseUrl = '/api/activities';
  }

  async getRecentActivities(limit = 3) {
    try {
      console.log('Fetching recent activities from:', `${this.baseUrl}/recent?limit=${limit}`);
      const response = await axios.get(`${this.baseUrl}/recent?limit=${limit}`);
      console.log('Activity API response:', response.data);
      
      // Ensure we return an array, even if the API returns something else
      const data = response.data;
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching recent activities:', error.response?.data || error.message);
      
      // If backend is not running, return sample data for demo purposes
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        console.log('Backend not available, showing sample activities');
        return this.getSampleActivities();
      }
      
      // Return empty array on other errors to prevent crashes
      return [];
    }
  }

  // Sample activities for demo when backend is not available
  getSampleActivities() {
    return [
      {
        _id: 'sample1',
        type: 'client_added',
        description: 'Added new client: TechCorp Solutions',
        entityName: 'TechCorp Solutions',
        timestamp: new Date().toISOString(),
        metadata: { email: 'contact@techcorp.com', company: 'TechCorp Solutions' }
      },
      {
        _id: 'sample2',
        type: 'inventory_added',
        description: 'Added new inventory item: Office Chairs (25 units)',
        entityName: 'Office Chairs',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        metadata: { category: 'Furniture', quantity: 25 }
      },
      {
        _id: 'sample3',
        type: 'meeting_scheduled',
        description: 'Scheduled meeting: Weekly Team Standup for 10/07/2025',
        entityName: 'Weekly Team Standup',
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        metadata: { type: 'Meeting', location: 'Conference Room A' }
      }
    ];
  }

  async getAllActivities(params = {}) {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(`${this.baseUrl}?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activities:', error);
      throw error;
    }
  }

  async getActivityStats(userId = null, days = 30) {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('days', days);
      
      const response = await axios.get(`${this.baseUrl}/stats/summary?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  }

  // Format activity for display
  formatActivityDescription(activity) {
    const timeAgo = this.getTimeAgo(activity.timestamp);
    return {
      ...activity,
      timeAgo,
      formattedTime: new Date(activity.timestamp).toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  }

  getTimeAgo(timestamp) {
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
      return activityTime.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: activityTime.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  // Get icon for activity type
  getActivityIcon(type) {
    const icons = {
      'client_added': '👤',
      'inventory_added': '📦',
      'meeting_scheduled': '📅',
      'note_added': '📝',
      'client_updated': '✏️',
      'inventory_updated': '📝',
      'meeting_updated': '🔄',
      'note_updated': '📄'
    };
    return icons[type] || '📋';
  }

  // Get color for activity type
  getActivityColor(type) {
    const colors = {
      'client_added': '#4CAF50',
      'inventory_added': '#2196F3',
      'meeting_scheduled': '#FF9800',
      'note_added': '#9C27B0',
      'client_updated': '#607D8B',
      'inventory_updated': '#03A9F4',
      'meeting_updated': '#FFC107',
      'note_updated': '#E91E63'
    };
    return colors[type] || '#666';
  }
}

export default new ActivityService();