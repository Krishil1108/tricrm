import React from 'react';

const WeekView = ({ currentDate }) => {
  const getWeekDays = (date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const formatHour = (hour) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const formatDayHeader = (date) => {
    const options = { weekday: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentHour = (hour, date) => {
    const now = new Date();
    return now.getHours() === hour && 
           now.toDateString() === date.toDateString();
  };

  return (
    <div className="week-view">
      <div className="week-header">
        <div className="time-header"></div>
        {weekDays.map((day, index) => (
          <div 
            key={index} 
            className={`day-header ${isToday(day) ? 'today' : ''}`}
          >
            <div className="day-name">{formatDayHeader(day)}</div>
          </div>
        ))}
      </div>
      
      <div className="week-grid">
        <div className="time-column">
          {hours.map((hour) => (
            <div key={hour} className="time-slot">
              <span className="time-label">{formatHour(hour)}</span>
            </div>
          ))}
        </div>
        
        {weekDays.map((day, dayIndex) => (
          <div key={dayIndex} className="day-column">
            {hours.map((hour) => (
              <div 
                key={hour} 
                className={`hour-slot ${isCurrentHour(hour, day) ? 'current-hour' : ''}`}
              >
                {/* Sample events */}
                {dayIndex === 1 && hour === 9 && (
                  <div className="event sample-event">
                    <div className="event-title">Meeting</div>
                  </div>
                )}
                {dayIndex === 3 && hour === 14 && (
                  <div className="event sample-event">
                    <div className="event-title">Review</div>
                  </div>
                )}
                {dayIndex === 5 && hour === 16 && (
                  <div className="event sample-event">
                    <div className="event-title">Call</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekView;