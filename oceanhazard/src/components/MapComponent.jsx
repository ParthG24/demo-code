import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

// Fix for default markers
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon,
  iconUrl: markerIcon,
  shadowUrl: markerIconShadow,
});

// Custom icons for different event types
const eventIcons = {
  oil_spill: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiNGRjY2MDAiIHN0cm9rZT0iI0ZGNjYwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0xMiAxMkwxNiAyMEwyMCAxMkwxMiAxMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  algal_bloom: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiMwMEZGMDAiIHN0cm9rZT0iIzAwRkYwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjIiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjIwIiBjeT0iMTIiIHI9IjIiIGZpbGw9IndoaXRlIi8+CjxjaXJjbGUgY3g9IjE2IiBjeT0iMjAiIHI9IjMiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  plastic_pollution: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiNGRjMzMDAiIHN0cm9rZT0iI0ZGMzMwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEyIiBoZWlnaHQ9IjgiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjEyIiB5PSIxMiIgd2lkdGg9IjgiIGhlaWdodD0iNCIgZmlsbD0iI0ZGMzMwMCIvPgo8L3N2Zz4K',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  chemical_spill: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiM5OTMzRkYiIHN0cm9rZT0iIzk5MzNGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0xNiA4TDIwIDE2TDE2IDI0TDEyIDE2TDE2IDhaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  // INCOIS Alert Icons - Different colors for official alerts
  tsunami_incois: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiNGRjAwMDAiIHN0cm9rZT0iI0ZGMDAwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0xMiAxNkgyMFYxOEgxMlYxNloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xNCAxMkgyNlYxNEgxNFYxMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  storm_surge_incois: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiNGRjMzOTkiIHN0cm9rZT0iI0ZGMzM5OSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0xMiAxNEwyMCAxNEwxNiAyMEwxMiAxNFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  high_waves_incois: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiMzM0MzRkYiIHN0cm9rZT0iIzMzQzNGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik04IDE2TDI0IDE2TDE2IDI0TDggMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  rip_current_incois: new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTQiIGZpbGw9IiNGRkE1MDAiIHN0cm9rZT0iI0ZGQTUwMCIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0xMiAxMkwxNiAyMEwyMCAxMkwxMiAxMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  }),
  default: new L.Icon.Default()
};

// Component to handle map click events
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick && onMapClick(e.latlng);
    },
  });
  return null;
};

// Component to handle map bounds changes
const MapBoundsHandler = ({ onBoundsChange }) => {
  const map = useMap();
  
  useEffect(() => {
    const handleMoveEnd = () => {
      const bounds = map.getBounds();
      onBoundsChange && onBoundsChange({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    };
    
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, onBoundsChange]);
  
  return null;
};

// Component to handle map center changes
const MapCenterHandler = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [map, center, zoom]);
  
  return null;
};

const MapComponent = ({ 
  reports = [], 
  hotspots = [], 
  incoisAlerts = [],
  onMapClick, 
  onBoundsChange, 
  center = [20.5937, 78.9629], // Center on India
  zoom = 5,
  showHeatmap = true,
  showMarkers = true,
  showHotspots = true,
  onReportClick,
  onHotspotClick,
}) => {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Prepare heatmap data
  const heatmapData = React.useMemo(() => {
    if (!showHeatmap || !reports.length) return [];
    
    return reports.map(report => ({
      lat: report.coordinates?.lat || report.latitude,
      lng: report.coordinates?.lng || report.longitude,
      intensity: report.severity || 1,
    }));
  }, [reports, showHeatmap]);

  // Get icon for event type
  const getEventIcon = (eventType) => {
    return eventIcons[eventType] || eventIcons.default;
  };

  // Handle marker click
  const handleMarkerClick = (report, event) => {
    event.originalEvent.stopPropagation();
    onReportClick && onReportClick(report);
  };

  // Handle hotspot click
  const handleHotspotClick = (hotspot, event) => {
    event.originalEvent.stopPropagation();
    onHotspotClick && onHotspotClick(hotspot);
  };

  return (
    <div className="h-full w-full relative">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler onMapClick={onMapClick} />
        <MapBoundsHandler onBoundsChange={onBoundsChange} />
        <MapCenterHandler center={center} zoom={zoom} />
        
        {/* Heatmap Layer - Using Circle Markers as alternative */}
        {showHeatmap && heatmapData.length > 0 && (
          <>
            {heatmapData.map((point, index) => (
              <Circle
                key={index}
                center={[point.lat, point.lng]}
                radius={point.intensity * 1000} // 1km per intensity level
                pathOptions={{
                  color: '#ff6b6b',
                  fillColor: '#ff6b6b',
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              />
            ))}
          </>
        )}
        
        {/* Report Markers */}
        {showMarkers && reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.coordinates?.lat || report.latitude, report.coordinates?.lng || report.longitude]}
            icon={getEventIcon(report.event_type)}
            eventHandlers={{
              click: (e) => handleMarkerClick(report, e),
            }}
          >
            <Popup>
              <div className="p-2 max-w-xs">
                <h3 className="font-bold text-lg mb-1">{report.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                <div className="text-xs text-gray-500 mb-1">
                  <strong>Type:</strong> {report.event_type?.replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  <strong>Severity:</strong> {report.severity}/5
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Reported:</strong> {new Date(report.created_at).toLocaleDateString()}
                </div>
                {report.image_url && (
                  <div className="mt-2">
                    <img 
                      src={report.image_url} 
                      alt="Report" 
                      className="w-full h-24 object-cover rounded"
                    />
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Hotspot Markers */}
        {showHotspots && hotspots.map((hotspot) => (
          <Marker
            key={hotspot.id}
            position={[hotspot.latitude, hotspot.longitude]}
            icon={new L.DivIcon({
              className: 'hotspot-marker',
              html: `<div class="hotspot-icon" style="background-color: ${hotspot.risk_level === 'high' ? '#ff0000' : hotspot.risk_level === 'medium' ? '#ff9900' : '#00ff00'}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
            eventHandlers={{
              click: (e) => handleHotspotClick(hotspot, e),
            }}
          >
            <Popup>
              <div className="p-2 max-w-xs">
                <h3 className="font-bold text-lg mb-1">{hotspot.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{hotspot.description}</p>
                <div className="text-xs text-gray-500 mb-1">
                  <strong>Risk Level:</strong> 
                  <span className={`ml-1 px-2 py-1 rounded text-white ${
                    hotspot.risk_level === 'high' ? 'bg-red-500' : 
                    hotspot.risk_level === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                  }`}>
                    {hotspot.risk_level?.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  <strong>Reports:</strong> {hotspot.report_count || 0}
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Last Updated:</strong> {new Date(hotspot.updated_at).toLocaleDateString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* INCOIS Alert Markers */}
        {incoisAlerts.map((alert) => (
          <Marker
            key={alert.id}
            position={[alert.latitude, alert.longitude]}
            icon={getEventIcon(alert.type)}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation();
                onReportClick && onReportClick(alert);
              },
            }}
          >
            <Popup>
              <div className="p-2 max-w-xs">
                <div className="flex items-center mb-2">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    alert.severity === 5 ? 'bg-red-500' :
                    alert.severity === 4 ? 'bg-orange-500' :
                    alert.severity === 3 ? 'bg-yellow-500' :
                    alert.severity === 2 ? 'bg-blue-500' : 'bg-green-500'
                  }`}></div>
                  <h3 className="font-bold text-lg">INCOIS Alert</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                <div className="text-xs text-gray-500 mb-1">
                  <strong>Type:</strong> {alert.type?.replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  <strong>Severity:</strong> {alert.severity}/5
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  <strong>Valid Until:</strong> {new Date(alert.valid_until).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500">
                  <strong>Issued:</strong> {new Date(alert.issued_at).toLocaleDateString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <div className="text-sm font-medium mb-2">Map Controls</div>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => {}}
                className="rounded"
              />
              <span className="text-sm">Heatmap</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showMarkers}
                onChange={(e) => {}}
                className="rounded"
              />
              <span className="text-sm">Reports</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showHotspots}
                onChange={(e) => {}}
                className="rounded"
              />
              <span className="text-sm">Hotspots</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;