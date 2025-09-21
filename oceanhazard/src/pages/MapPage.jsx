import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MobileMenuButton from '../components/MobileMenuButton';
import RealtimeOverlay from '../components/RealtimeOverlay';
import BottomNavigation from '../components/BottomNavigation';
import ReportForm from '../components/ReportForm';
import MapComponent from '../components/MapComponent';
import apiService from '../services/apiService';
import incoisService from '../services/incoisService';

const MapPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reports, setReports] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [incoisAlerts, setIncoisAlerts] = useState([]);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Center on India
  const [mapZoom, setMapZoom] = useState(5);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  useEffect(() => {
    // Fetch initial data
    fetchReports();
    fetchHotspots();
    fetchIncoisAlerts();
    
    // Set up WebSocket connection for real-time updates
    setupWebSocket();
    
    // Set up periodic INCOIS data refresh
    const incoisInterval = setInterval(fetchIncoisAlerts, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => {
      clearInterval(incoisInterval);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const fetchReports = async () => {
    try {
      const response = await apiService.getReports({ limit: 50 });
      setReports(response);
    } catch (error) {
      console.warn('Using mock reports data due to API failure');
      // Mock reports data for demonstration
      setReports([
        {
          id: 'report_1',
          type: 'rip_current',
          description: 'Strong rip current observed at beach',
          location: 'Mumbai Beach',
          coordinates: { lat: 19.0760, lng: 72.8777 },
          severity: 4, // high severity
          reporterName: 'Test User',
          reporterContact: 'test@example.com',
          timestamp: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'report_2',
          type: 'jellyfish',
          description: 'Large jellyfish swarm spotted',
          location: 'Goa Beach',
          coordinates: { lat: 15.2993, lng: 73.9124 },
          severity: 3, // medium severity
          reporterName: 'Beach Patroller',
          reporterContact: 'patrol@beach.com',
          timestamp: new Date().toISOString(),
          status: 'active'
        },
        {
          id: 'report_3',
          type: 'pollution',
          description: 'Plastic waste accumulation on beach',
          location: 'Chennai Beach',
          coordinates: { lat: 13.0827, lng: 80.2707 },
          severity: 2, // low severity
          reporterName: 'Environmental Officer',
          reporterContact: 'env@chennai.gov',
          timestamp: new Date().toISOString(),
          status: 'active'
        }
      ]);
    }
  };

  const fetchHotspots = async () => {
    try {
      const response = await apiService.getHotspots();
      setHotspots(response);
    } catch (error) {
      console.warn('Using mock hotspots data due to API failure');
      // Mock hotspots data for demonstration
      setHotspots([
        {
          id: 'hotspot_1',
          type: 'rip_current',
          location: 'Dangerous Rip Current Zone',
          latitude: 19.0760,
          longitude: 72.8777,
          severity: 4, // high severity
          description: 'Frequent rip current activity observed',
          lastUpdated: new Date().toISOString(),
          active: true,
          name: 'Dangerous Rip Current Zone',
          risk_level: 'high',
          report_count: 5,
          updated_at: new Date().toISOString()
        },
        {
          id: 'hotspot_2',
          type: 'jellyfish',
          location: 'Jellyfish Infestation Area',
          latitude: 15.2993,
          longitude: 73.9124,
          severity: 3, // medium severity
          description: 'Seasonal jellyfish presence',
          lastUpdated: new Date().toISOString(),
          active: true,
          name: 'Jellyfish Infestation Area',
          risk_level: 'medium',
          report_count: 3,
          updated_at: new Date().toISOString()
        }
      ]);
    }
  };

  const fetchIncoisAlerts = async () => {
    try {
      const alerts = await incoisService.getAllActiveWarnings();
      setIncoisAlerts(alerts);
      console.log('INCOIS alerts fetched:', alerts.length);
    } catch (error) {
      console.error('Error fetching INCOIS alerts:', error);
    }
  };

  const setupWebSocket = () => {
    try {
      const ws = new WebSocket('ws://localhost:8000/ws/reports');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        console.log('WebSocket message received:', message);
        
        if (message.type === 'new_report') {
          // Add new report to the list
          setReports(prev => [message.data, ...prev]);
        } else if (message.type === 'hotspots_update') {
          // Update hotspots
          setHotspots(message.data);
        } else if (message.type === 'incois_alerts_update') {
          // Update INCOIS alerts - ensure proper data structure
          const processedAlerts = message.data.map(alert => ({
            ...alert,
            // Ensure coordinates are in the right format
            coordinates: alert.coordinates || { lat: alert.latitude || 0, lng: alert.longitude || 0 },
            // Ensure type is consistent
            type: alert.type || 'unknown',
            // Ensure severity is a number
            severity: typeof alert.severity === 'number' ? alert.severity : 3,
            // Ensure description exists
            description: alert.description || alert.title || 'No description available'
          }));
          setIncoisAlerts(processedAlerts);
          console.log('INCOIS alerts updated via WebSocket:', processedAlerts.length);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to setup WebSocket:', error);
    }
  };

  const handleReportSubmit = async (formData) => {
    try {
      // The form data is already in the correct format from the ReportForm component
      console.log('Report submitted successfully:', formData);
      
      // Refresh reports to include the new one
      await fetchReports();
      
      // Center map on the new report if coordinates are available
      if (formData.latitude && formData.longitude) {
        setMapCenter([formData.latitude, formData.longitude]);
        setMapZoom(12);
      }
      
      return formData;
    } catch (error) {
      console.error('Error submitting report:', error);
      throw error;
    }
  };

  const handleMapClick = (latlng) => {
    console.log('Map clicked at:', latlng);
    // You can add functionality to create a report at the clicked location
  };

  const handleBoundsChange = async (bounds) => {
    try {
      // Fetch reports for the current map bounds
      const response = await apiService.getReportsByBounds(
        bounds.north,
        bounds.south,
        bounds.east,
        bounds.west
      );
      setReports(response);
    } catch (error) {
      console.error('Error fetching reports for bounds:', error);
    }
  };

  const handleReportClick = (report) => {
    setSelectedReport(report);
    // Center map on the selected report
    if (report.latitude && report.longitude) {
      setMapCenter([report.latitude, report.longitude]);
      setMapZoom(15);
    }
  };

  const handleHotspotClick = (hotspot) => {
    setSelectedHotspot(hotspot);
    // Center map on the selected hotspot
    if (hotspot.latitude && hotspot.longitude) {
      setMapCenter([hotspot.latitude, hotspot.longitude]);
      setMapZoom(12);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Header */}
      <Header onReportClick={() => setShowReportForm(true)} />
      
      {/* Mobile Menu Button */}
      <MobileMenuButton onClick={toggleSidebar} />
      
      {/* Main Content */}
      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        
        {/* Map Container */}
        <main className="flex-1 relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-800">
          {/* Real-Time Data Overlay */}
          <RealtimeOverlay incoisAlerts={incoisAlerts} />
          
          {/* Leaflet Map */}
          <MapComponent
            reports={reports}
            hotspots={hotspots}
            incoisAlerts={incoisAlerts}
            center={mapCenter}
            zoom={mapZoom}
            onMapClick={handleMapClick}
            onBoundsChange={handleBoundsChange}
            onReportClick={handleReportClick}
            onHotspotClick={handleHotspotClick}
            showHeatmap={true}
            showMarkers={true}
            showHotspots={true}
          />
        </main>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />
    </div>
  );
};

export default MapPage;