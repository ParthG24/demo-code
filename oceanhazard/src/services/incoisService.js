// INCOIS (Indian National Centre for Ocean Information Services) Integration Service
// This service fetches real-time ocean hazard data from INCOIS APIs

class INCOISService {
  constructor() {
    // INCOIS API endpoints (these are example endpoints - actual INCOIS APIs may vary)
    this.baseURL = 'https://incois.gov.in/incois_test';
    this.endpoints = {
      tsunami: '/tsunami_warning.json',
      storm_surge: '/storm_surge_warning.json',
      high_waves: '/high_wave_warning.json',
      rip_currents: '/rip_current_warning.json',
      oil_spill: '/oil_spill_alerts.json',
      algal_bloom: '/algal_bloom_alerts.json',
      weather_warnings: '/weather_warnings.json'
    };
    
    // Cache for storing fetched data
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generic method to fetch data with caching (API calls removed - using mock data only)
  async fetchWithCache(url, cacheKey) {
    // Skip API calls and return mock data directly
    return this.getMockData(cacheKey);
  }

  // Get Tsunami Warnings (API calls removed - using mock data only)
  async getTsunamiWarnings() {
    const data = this.getMockData('tsunami');
    return this.processTsunamiData(data);
  }

  // Get Storm Surge Warnings (API calls removed - using mock data only)
  async getStormSurgeWarnings() {
    const data = this.getMockData('storm_surge');
    return this.processStormSurgeData(data);
  }

  // Get High Wave Warnings (API calls removed - using mock data only)
  async getHighWaveWarnings() {
    const data = this.getMockData('high_waves');
    return this.processHighWaveData(data);
  }

  // Get Rip Current Warnings (API calls removed - using mock data only)
  async getRipCurrentWarnings() {
    const data = this.getMockData('rip_currents');
    return this.processRipCurrentData(data);
  }

  // Get Oil Spill Alerts (API calls removed - using mock data only)
  async getOilSpillAlerts() {
    const data = this.getMockData('oil_spill');
    return this.processOilSpillData(data);
  }

  // Get Algal Bloom Alerts (API calls removed - using mock data only)
  async getAlgalBloomAlerts() {
    const data = this.getMockData('algal_bloom');
    return this.processAlgalBloomData(data);
  }

  // Get All Active Warnings (API calls removed - using mock data only)
  async getAllActiveWarnings() {
    const warnings = [];
    
    // Return mock data directly without API calls
    warnings.push(...this.processTsunamiData(this.getMockData('tsunami')));
    warnings.push(...this.processStormSurgeData(this.getMockData('storm_surge')));
    warnings.push(...this.processHighWaveData(this.getMockData('high_waves')));
    warnings.push(...this.processRipCurrentData(this.getMockData('rip_currents')));
    warnings.push(...this.processOilSpillData(this.getMockData('oil_spill')));
    warnings.push(...this.processAlgalBloomData(this.getMockData('algal_bloom')));

    return warnings;
  }

  // Data processing methods
  processTsunamiData(data) {
    if (!data || !data.warnings) return [];
    
    return data.warnings.map(warning => ({
      id: `tsunami_${warning.id}`,
      type: 'tsunami',
      title: 'Tsunami Warning',
      description: warning.description,
      severity: this.mapSeverity(warning.level),
      latitude: warning.latitude,
      longitude: warning.longitude,
      coordinates: {
        lat: warning.latitude,
        lng: warning.longitude
      },
      area: warning.affected_area,
      issued_at: new Date(warning.issued_time),
      valid_until: new Date(warning.valid_until),
      source: 'INCOIS',
      is_active: warning.status === 'active'
    }));
  }

  processStormSurgeData(data) {
    if (!data || !data.warnings) return [];
    
    return data.warnings.map(warning => ({
      id: `storm_surge_${warning.id}`,
      type: 'storm_surge',
      title: 'Storm Surge Warning',
      description: warning.description,
      severity: this.mapSeverity(warning.level),
      latitude: warning.latitude,
      longitude: warning.longitude,
      coordinates: {
        lat: warning.latitude,
        lng: warning.longitude
      },
      area: warning.affected_area,
      issued_at: new Date(warning.issued_time),
      valid_until: new Date(warning.valid_until),
      source: 'INCOIS',
      is_active: warning.status === 'active'
    }));
  }

  processHighWaveData(data) {
    if (!data || !data.warnings) return [];
    
    return data.warnings.map(warning => ({
      id: `high_waves_${warning.id}`,
      type: 'high_waves',
      title: 'High Wave Warning',
      description: warning.description,
      severity: this.mapSeverity(warning.level),
      latitude: warning.latitude,
      longitude: warning.longitude,
      coordinates: {
        lat: warning.latitude,
        lng: warning.longitude
      },
      wave_height: warning.wave_height,
      issued_at: new Date(warning.issued_time),
      valid_until: new Date(warning.valid_until),
      source: 'INCOIS',
      is_active: warning.status === 'active'
    }));
  }

  processRipCurrentData(data) {
    if (!data || !data.warnings) return [];
    
    return data.warnings.map(warning => ({
      id: `rip_current_${warning.id}`,
      type: 'rip_current',
      title: 'Rip Current Warning',
      description: warning.description,
      severity: this.mapSeverity(warning.level),
      latitude: warning.latitude,
      longitude: warning.longitude,
      coordinates: {
        lat: warning.latitude,
        lng: warning.longitude
      },
      beach_name: warning.beach_name,
      issued_at: new Date(warning.issued_time),
      valid_until: new Date(warning.valid_until),
      source: 'INCOIS',
      is_active: warning.status === 'active'
    }));
  }

  processOilSpillData(data) {
    if (!data || !data.alerts) return [];
    
    return data.alerts.map(alert => ({
      id: `oil_spill_${alert.id}`,
      type: 'oil_spill',
      title: 'Oil Spill Alert',
      description: alert.description,
      severity: this.mapSeverity(alert.level),
      latitude: alert.latitude,
      longitude: alert.longitude,
      coordinates: {
        lat: alert.latitude,
        lng: alert.longitude
      },
      area_affected: alert.area_affected,
      estimated_volume: alert.estimated_volume,
      reported_at: new Date(alert.reported_time),
      source: 'INCOIS',
      is_active: alert.status === 'active'
    }));
  }

  processAlgalBloomData(data) {
    if (!data || !data.alerts) return [];
    
    return data.alerts.map(alert => ({
      id: `algal_bloom_${alert.id}`,
      type: 'algal_bloom',
      title: 'Algal Bloom Alert',
      description: alert.description,
      severity: this.mapSeverity(alert.level),
      latitude: alert.latitude,
      longitude: alert.longitude,
      coordinates: {
        lat: alert.latitude,
        lng: alert.longitude
      },
      bloom_type: alert.bloom_type,
      area_affected: alert.area_affected,
      detected_at: new Date(alert.detected_time),
      source: 'INCOIS',
      is_active: alert.status === 'active'
    }));
  }

  mapSeverity(level) {
    switch (level?.toLowerCase()) {
      case 'extreme':
      case 'critical':
        return 5;
      case 'high':
        return 4;
      case 'moderate':
      case 'medium':
        return 3;
      case 'low':
        return 2;
      case 'minimal':
        return 1;
      default:
        return 3;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Mock data for development/testing
  getMockData(type) {
    console.log(`Returning mock data for ${type}`);
    
    switch (type) {
      case 'tsunami':
        return {
          warnings: [{
            id: 1,
            level: 'high',
            description: 'Tsunami warning for coastal areas of Tamil Nadu and Andhra Pradesh',
            latitude: 13.0827,
            longitude: 80.2707,
            affected_area: 'Tamil Nadu and Andhra Pradesh coast',
            issued_time: new Date().toISOString(),
            valid_until: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }]
        };
      
      case 'storm_surge':
        return {
          warnings: [{
            id: 1,
            level: 'moderate',
            description: 'Storm surge warning for Odisha coast',
            latitude: 20.2961,
            longitude: 85.8245,
            affected_area: 'Odisha coast',
            issued_time: new Date().toISOString(),
            valid_until: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }]
        };
      
      case 'high_waves':
        return {
          warnings: [{
            id: 1,
            level: 'moderate',
            description: 'High wave warning for Kerala coast',
            latitude: 10.8505,
            longitude: 76.2711,
            wave_height: '3-4 meters',
            issued_time: new Date().toISOString(),
            valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          }]
        };
      
      case 'oil_spill':
        return {
          alerts: [{
            id: 1,
            level: 'high',
            description: 'Oil spill detected near Mumbai coast',
            latitude: 19.0760,
            longitude: 72.8777,
            area_affected: '10 sq km',
            estimated_volume: '5000 liters',
            reported_time: new Date().toISOString(),
            status: 'active'
          }]
        };
      
      case 'algal_bloom':
        return {
          alerts: [{
            id: 1,
            level: 'moderate',
            description: 'Algal bloom detected in Arabian Sea',
            latitude: 15.2993,
            longitude: 74.1240,
            bloom_type: 'Red tide',
            area_affected: '25 sq km',
            detected_time: new Date().toISOString(),
            status: 'active'
          }]
        };
      
      default:
        return { warnings: [] };
    }
  }
}

// Create and export singleton instance
const incoisService = new INCOISService();

export default incoisService;