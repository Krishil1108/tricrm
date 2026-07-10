import React, { useState, useEffect } from 'react';
import { FiBox, FiCalendar, FiFileText, FiFolder, FiMail, FiPieChart, FiRepeat, FiUser } from 'react-icons/fi';
import ActivityService from '../services/ActivityService';
import './ActivitySection.css';

const ActivitySection = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  const activityIcons = {
    client_added: <FiUser />,
    inventory_added: <FiBox />,
    meeting_scheduled: <FiCalendar />,
    note_added: <FiFileText />,
    client_updated: <FiUser />,
    inventory_updated: <FiBox />,
    meeting_updated: <FiRepeat />,
    note_updated: <FiFileText />
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await ActivityService.getRecentActivities(3);
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.warn('Expected array from getRecentActivities, got:', typeof data, data);
        setActivities([]);
        setError('Invalid response format from server');
        return;
      }
      
      const formattedActivities = data.map(activity => 
        ActivityService.formatActivityDescription(activity)
      );
      setActivities(formattedActivities);
      setError(null);
      
      // Check if we're using mock data
      setUsingMockData(data.some(activity => activity._id?.startsWith('sample')));
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Failed to load recent activities');
      setActivities([]); // Set to empty array on error
      setUsingMockData(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Listen for activity updates
    const handleActivityUpdate = () => {
      fetchActivities();
    };

    // Custom event listeners for real-time updates
    window.addEventListener('activityUpdated', handleActivityUpdate);
    window.addEventListener('clientAdded', handleActivityUpdate);
    window.addEventListener('inventoryAdded', handleActivityUpdate);
    window.addEventListener('meetingScheduled', handleActivityUpdate);
    window.addEventListener('noteAdded', handleActivityUpdate);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('activityUpdated', handleActivityUpdate);
      window.removeEventListener('clientAdded', handleActivityUpdate);
      window.removeEventListener('inventoryAdded', handleActivityUpdate);
      window.removeEventListener('meetingScheduled', handleActivityUpdate);
      window.removeEventListener('noteAdded', handleActivityUpdate);
    };
  }, []);

  const handleRefresh = () => {
    fetchActivities();
  };

  if (loading) {
    return (
      <div className="activity-section">
        <div className="activity-header">
          <h3>Last activity</h3>
          <button className="refresh-btn" disabled>
            ⟳
          </button>
        </div>
        <div className="activity-loading">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Loading activities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="activity-section">
        <div className="activity-header">
          <h3>Last activity</h3>
          <button className="refresh-btn" onClick={handleRefresh}>
            ⟳
          </button>
        </div>
        <div className="activity-error">
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-section">
      <div className="activity-header">
        <h3>
          Last activity
          {usingMockData && <span className="demo-badge">Demo Mode</span>}
        </h3>
        <button className="refresh-btn" onClick={handleRefresh} title="Refresh activities">
          ⟳
        </button>
      </div>
      
      {activities.length === 0 ? (
        <div className="no-activities">
          <p>No recent activities</p>
          <span>Start by adding clients, inventory, or scheduling meetings!</span>
        </div>
      ) : (
        <div className="activity-list">
          {activities.map((activity) => (
            <div 
              key={activity._id} 
              className="activity-entry"
              style={{ borderLeftColor: ActivityService.getActivityColor(activity.type) }}
            >
              <div className="activity-meta">
                <span className="activity-icon">
                  {activityIcons[activity.type] || <FiFileText />}
                </span>
                <span className="activity-time">{activity.timeAgo}</span>
              </div>
              <div className="activity-content">
                <p className="activity-description">{activity.description}</p>
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="activity-details">
                    {activity.metadata.email && (
                      <span className="detail-tag"><FiMail className="inline-icon" />{activity.metadata.email}</span>
                    )}
                    {activity.metadata.company && (
                      <span className="detail-tag"><FiFolder className="inline-icon" />{activity.metadata.company}</span>
                    )}
                    {activity.metadata.category && (
                      <span className="detail-tag"><FiFolder className="inline-icon" />{activity.metadata.category}</span>
                    )}
                    {activity.metadata.quantity && (
                      <span className="detail-tag"><FiPieChart className="inline-icon" />Qty: {activity.metadata.quantity}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="activity-footer">
        <span className="last-updated">
          Last updated: {new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
};

export default ActivitySection;