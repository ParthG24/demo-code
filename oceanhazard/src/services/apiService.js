// API Service for connecting frontend to backend

const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  // Clear auth token
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Generic request handler
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...options.headers,
      },
    };

    // Add auth token if available
    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.clearToken();
          // You might want to redirect to login here
        }
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication endpoints
  async login(username, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    if (response.access_token) {
      this.setToken(response.access_token);
    }
    
    return response;
  }

  async logout() {
    this.clearToken();
    return { message: 'Logged out successfully' };
  }

  isAuthenticated() {
    return !!this.token;
  }
  async submitReport(formData) {
    return this.request('/reports', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type for multipart, let browser set it
    });
  }

  // Get all reports
  async getReports(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/reports${queryString ? `?${queryString}` : ''}`);
  }

  // Get reports by bounds (for map view)
  async getReportsByBounds(north, south, east, west) {
    return this.request(`/reports/bounds?north=${north}&south=${south}&east=${east}&west=${west}`);
  }

  // Get reports near a location
  async getReportsNearLocation(lat, lng, radius = 1000) {
    return this.request(`/reports/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  // Get hotspot data
  async getHotspots(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/hotspots${queryString ? `?${queryString}` : ''}`);
  }

  // Get hotspot by ID
  async getHotspotById(id) {
    return this.request(`/hotspots/${id}`);
  }

  // Get reports for a specific hotspot
  async getHotspotReports(hotspotId) {
    return this.request(`/hotspots/${hotspotId}/reports`);
  }

  // Upload media file
  async uploadMedia(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for multipart
    });
  }

  // Get event statistics
  async getEventStatistics() {
    return this.request('/statistics/events');
  }

  // Get report statistics by date range
  async getReportStatistics(startDate, endDate) {
    return this.request(`/statistics/reports?start=${startDate}&end=${endDate}`);
  }

  // Verify a report (for moderators)
  async verifyReport(reportId, verified = true) {
    return this.request(`/reports/${reportId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verified }),
    });
  }

  // Update report severity (for moderators)
  async updateReportSeverity(reportId, severity) {
    return this.request(`/reports/${reportId}/severity`, {
      method: 'PUT',
      body: JSON.stringify({ severity }),
    });
  }

  // Delete a report (for moderators)
  async deleteReport(reportId) {
    return this.request(`/reports/${reportId}`, {
      method: 'DELETE',
    });
  }
}

// Create and export singleton instance
const apiService = new ApiService();

export default apiService;

// Example usage:
/*
import apiService from './services/apiService';

// Submit a report
const reportData = {
  title: 'Oil Spill Near Beach',
  description: 'Large oil spill observed...',
  event_type: 'oil_spill',
  severity: 4,
  coordinates: { lat: 37.7749, lng: -122.4194 }
};

apiService.submitReport(reportData)
  .then(response => console.log('Report submitted:', response))
  .catch(error => console.error('Error:', error));

// Get reports for map bounds
apiService.getReportsByBounds(37.8, 37.7, -122.3, -122.5)
  .then(reports => console.log('Reports:', reports))
  .catch(error => console.error('Error:', error));
*/