import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import calComService from '../services/calcom';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Cal.com doesn't need authentication state

  // Load Cal.com bookings on mount
  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  // Load events from Cal.com
  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const bookings = await calComService.getUpcomingBookings(50);
      
      const processedEvents = bookings.map(booking => ({
        id: booking.id,
        title: booking.title || booking.eventType?.title || 'Meeting',
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
        location: booking.location || 'Online',
        description: booking.description || '',
        attendees: booking.attendees || [],
        isAllDay: false
      }));
      
      setEvents(processedEvents);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setError('Failed to load calendar bookings');
    } finally {
      setLoading(false);
    }
  };

  // Cal.com uses API key authentication - no manual auth needed

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      if (event.start.date) {
        // All-day event
        return event.start.date === dateStr;
      } else if (event.start.dateTime) {
        // Timed event
        const eventDate = new Date(event.start.dateTime).toISOString().split('T')[0];
        return eventDate === dateStr;
      }
      return false;
    });
  };

  // Handle date click
  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dayEvents = getEventsForDate(date);
    setSelectedEvents(dayEvents);
  };

  // Generate calendar grid
  const generateCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    // Calculate calendar grid
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDateForComparison = new Date();
    currentDateForComparison.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === currentDateForComparison.toDateString();
      const hasEvents = getEventsForDate(date).length > 0;
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        hasEvents,
        isSelected,
        events: getEventsForDate(date)
      });
    }

    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Time formatting is handled inline in the modal

  // Cal.com doesn't need authentication UI

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-nav">
          <button onClick={goToPreviousMonth} className="nav-button">
            <ChevronLeft size={20} />
          </button>
          <h2 className="calendar-title">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={goToNextMonth} className="nav-button">
            <ChevronRight size={20} />
          </button>
        </div>
        <button onClick={loadEvents} disabled={loading} className="refresh-button">
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="calendar-grid">
        <div className="weekdays">
          {weekDays.map(day => (
            <div key={day} className="weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="days-grid">
          {generateCalendarGrid().map((dayData, index) => (
            <div
              key={index}
              className={`calendar-day ${!dayData.isCurrentMonth ? 'other-month' : ''} 
                         ${dayData.isToday ? 'today' : ''} 
                         ${dayData.isSelected ? 'selected' : ''} 
                         ${dayData.hasEvents ? 'has-events' : ''}`}
              onClick={() => handleDateClick(dayData.date)}
            >
              <span className="day-number">{dayData.day}</span>
              {dayData.hasEvents && (
                <div className="event-indicators">
                  {dayData.events.slice(0, 2).map((event, i) => (
                    <div key={i} className="event-preview" title={event.title}>
                      {event.title.length > 12 ? event.title.substring(0, 12) + "..." : event.title}
                    </div>
                  ))}
                  {dayData.events.length > 2 && (
                    <span className="more-events">+{dayData.events.length - 2} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedDate && selectedEvents.length > 0 && (
        <div className="event-modal-overlay" onClick={() => setSelectedDate(null)}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Events for {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button className="close-modal" onClick={() => setSelectedDate(null)}>×</button>
            </div>
            <div className="events-list">
              {selectedEvents.map((event, index) => (
                <div key={index} className="event-item">
                  <div className="event-header">
                    <h4 className="event-title">{event.title}</h4>
                    <div className="event-time">
                      <Clock size={14} />
                      {event.start.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })} - {event.end.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </div>
                  {event.description && (
                    <p className="event-description">{event.description}</p>
                  )}
                  {event.location && (
                    <div className="event-location">
                      <MapPin size={14} />
                      {event.location}
                    </div>
                  )}
                  {event.attendees && event.attendees.length > 0 && (
                    <div className="event-attendees">
                      <span>With: {event.attendees.map(a => a.name || a.email).join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;