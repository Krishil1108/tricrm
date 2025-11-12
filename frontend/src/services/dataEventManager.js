// Event system for data refresh notifications
class DataEventManager {
  constructor() {
    this.listeners = {};
  }

  // Subscribe to data update events
  subscribe(dataType, callback) {
    if (!this.listeners[dataType]) {
      this.listeners[dataType] = [];
    }
    this.listeners[dataType].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[dataType] = this.listeners[dataType].filter(cb => cb !== callback);
    };
  }

  // Emit data update event
  emit(dataType, data = null) {
    if (this.listeners[dataType]) {
      this.listeners[dataType].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in data event callback:', error);
        }
      });
    }

    // Also emit browser events for activity tracking
    this.emitBrowserEvents(dataType, data);
  }

  // Emit browser events for activity updates
  emitBrowserEvents(dataType, data) {
    const eventMap = {
      [DATA_TYPES.CLIENTS]: 'clientAdded',
      [DATA_TYPES.ASSOCIATES]: 'associateAdded',
      [DATA_TYPES.MEETINGS]: 'meetingScheduled',
      [DATA_TYPES.NOTES]: 'noteAdded'
    };

    const eventName = eventMap[dataType];
    if (eventName) {
      window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
      window.dispatchEvent(new CustomEvent('activityUpdated'));
    }
  }

  // Emit multiple data types at once
  emitMultiple(dataTypes, data = null) {
    dataTypes.forEach(dataType => this.emit(dataType, data));
  }
}

// Create global instance
export const dataEventManager = new DataEventManager();

// Data type constants
export const DATA_TYPES = {
  CLIENTS: 'clients',
  ASSOCIATES: 'associates',
  MEETINGS: 'meetings',
  NOTES: 'notes'
};