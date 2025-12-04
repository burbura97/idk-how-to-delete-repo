import axios from 'axios';

// Cal.com API configuration
const CAL_API_KEY = process.env.REACT_APP_CAL_API_KEY;
const CAL_USERNAME = process.env.REACT_APP_CAL_USERNAME;
const CAL_API_BASE = 'https://api.cal.com/v1';

class CalComService {
  constructor() {
    this.apiKey = CAL_API_KEY;
    this.username = CAL_USERNAME;
  }

  async makeRequest(endpoint, options = {}) {
    try {
      const response = await axios({
        method: 'GET',
        url: `${CAL_API_BASE}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });
      return response.data;
    } catch (error) {
      console.error('Cal.com API error:', error.response?.data || error.message);
      throw new Error(`Failed to connect to Cal.com: ${error.response?.data?.message || error.message}`);
    }
  }

  async getUpcomingBookings(limit = 10) {
    try {
      const today = new Date().toISOString();
      const response = await this.makeRequest(`/bookings?take=${limit}&startTime=${today}`);
      return response.bookings || [];
    } catch (error) {
      console.error('Failed to fetch upcoming bookings:', error);
      // Return mock data for fallback
      return this.getMockBookings();
    }
  }

  async getTodayBookings() {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayISO = today.toISOString().split('T')[0];
      const tomorrowISO = tomorrow.toISOString().split('T')[0];
      
      const response = await this.makeRequest(`/bookings?startTime=${todayISO}&endTime=${tomorrowISO}`);
      return response.bookings || [];
    } catch (error) {
      console.error('Failed to fetch today bookings:', error);
      return [];
    }
  }

  async getEventTypes() {
    try {
      const response = await this.makeRequest('/event-types');
      return response.event_types || [];
    } catch (error) {
      console.error('Failed to fetch event types:', error);
      return [];
    }
  }

  getBookingUrl(eventTypeSlug) {
    return `https://cal.com/${this.username}/${eventTypeSlug}`;
  }

  getMockBookings() {
    const now = new Date();
    return [
      {
        id: 1,
        title: 'Team Standup',
        startTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        endTime: new Date(now.getTime() + 2.5 * 60 * 60 * 1000).toISOString(),
        attendees: [{ name: 'Development Team' }]
      },
      {
        id: 2,
        title: 'Client Call - Project Review',
        startTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
        endTime: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
        attendees: [{ name: 'Client ABC' }]
      },
      {
        id: 3,
        title: '1-on-1 Meeting',
        startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        endTime: new Date(now.getTime() + 24.5 * 60 * 60 * 1000).toISOString(),
        attendees: [{ name: 'Team Lead' }]
      }
    ];
  }
}

export default new CalComService();