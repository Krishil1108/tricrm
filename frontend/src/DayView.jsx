import React from 'react';

const DayView = ({ currentDate }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const formatDayHeader = (date) => {
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const isCurrentHour = (hour) => {
    const now = new Date();
    return now.getHours() === hour && 
           now.toDateString() === currentDate.toDateString();
  };

  return (
    <div className="day-view">
      <div className="day-header">
        <div className="day-title">{formatDayHeader(currentDate)}</div>
      </div>
      
      <div className="day-schedule">
        <div className="time-column">
          {hours.map((hour) => (
            <div key={hour} className="time-slot">
              <span className="time-label">{formatHour(hour)}</span>
            </div>
          ))}
        </div>
        
        <div className="events-column">
          {hours.map((hour) => (
            <div 
              key={hour} 
              className={`hour-slot ${isCurrentHour(hour) ? 'current-hour' : ''}`}
            >
              {/* Events would go here */}
              {hour === 9 && (
                <div className="event sample-event">
                  <div className="event-title">Team Meeting</div>
                  <div className="event-time">9:00 AM - 10:30 AM</div>
                </div>
              )}
              {hour === 14 && (
                <div className="event sample-event">
                  <div className="event-title">Project Review</div>
                  <div className="event-time">2:00 PM - 3:00 PM</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DayView;