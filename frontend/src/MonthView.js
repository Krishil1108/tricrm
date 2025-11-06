import React from 'react';

const MonthView = ({ currentDate }) => {
  const getMonthCalendar = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // End on Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
    
    const calendar = [];
    const currentDay = new Date(startDate);
    
    while (currentDay <= endDate) {
      calendar.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return calendar;
  };

  const monthDays = getMonthCalendar(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const hasEvent = (date) => {
    // Sample events for demonstration
    const day = date.getDate();
    const month = date.getMonth();
    const currentMonth = currentDate.getMonth();
    
    if (month === currentMonth) {
      return [5, 12, 18, 25].includes(day);
    }
    return false;
  };

  const formatMonthYear = () => {
    const options = { month: 'long', year: 'numeric' };
    return currentDate.toLocaleDateString('en-US', options);
  };

  // Split days into weeks
  const weeks = [];
  for (let i = 0; i < monthDays.length; i += 7) {
    weeks.push(monthDays.slice(i, i + 7));
  }

  return (
    <div className="month-view">
      <div className="month-header">
        <h3 className="month-title">{formatMonthYear()}</h3>
      </div>
      
      <div className="month-grid">
        {/* Weekday headers */}
        <div className="weekdays">
          {weekDays.map((day) => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar weeks */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week">
            {week.map((day, dayIndex) => (
              <div 
                key={dayIndex} 
                className={`calendar-day ${
                  isToday(day) ? 'today' : ''
                } ${
                  isCurrentMonth(day) ? 'current-month' : 'other-month'
                } ${
                  hasEvent(day) ? 'has-event' : ''
                }`}
              >
                <span className="day-number">{day.getDate()}</span>
                {hasEvent(day) && (
                  <div className="event-indicators">
                    <div className="event-dot"></div>
                  </div>
                )}
                
                {/* Sample events */}
                {day.getDate() === 12 && isCurrentMonth(day) && (
                  <div className="month-event">
                    <div className="event-title">Meeting</div>
                  </div>
                )}
                {day.getDate() === 18 && isCurrentMonth(day) && (
                  <div className="month-event">
                    <div className="event-title">Workshop</div>
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

export default MonthView;