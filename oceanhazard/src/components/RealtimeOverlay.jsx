import React, { useState, useRef, useEffect } from 'react';

const RealtimeOverlay = ({ incoisAlerts = [] }) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const overlayRef = useRef(null);

  const legendItems = [
    { type: 'rip-current', label: 'Rip Currents', color: 'bg-blue-500' },
    { type: 'jellyfish', label: 'Jellyfish Sightings', color: 'bg-red-500' },
    { type: 'pollution', label: 'Pollution', color: 'bg-green-500' },
    { type: 'pollution-alt', label: 'Pollution', color: 'bg-cyan-500' },
  ];

  const getAlertColor = (severity) => {
    if (severity >= 4) return 'bg-red-500';
    if (severity >= 3) return 'bg-orange-500';
    if (severity >= 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getAlertTypeLabel = (type) => {
    const labels = {
      tsunami: 'Tsunami',
      tsunami_incois: 'Tsunami',
      storm_surge: 'Storm Surge',
      storm_surge_incois: 'Storm Surge',
      high_waves: 'High Waves',
      high_waves_incois: 'High Waves',
      rip_current: 'Rip Current',
      rip_current_incois: 'Rip Current',
      oil_spill: 'Oil Spill',
      algal_bloom: 'Algal Bloom'
    };
    return labels[type] || type;
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const rect = overlayRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const container = overlayRef.current.parentElement;
      const containerRect = container.getBoundingClientRect();
      const overlayRect = overlayRef.current.getBoundingClientRect();
      
      let newX = e.clientX - containerRect.left - dragOffset.x;
      let newY = e.clientY - containerRect.top - dragOffset.y;
      
      // Keep within bounds
      newX = Math.max(0, Math.min(newX, containerRect.width - overlayRect.width));
      newY = Math.max(0, Math.min(newY, containerRect.height - overlayRect.height));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    if (e.target.closest('.drag-handle')) {
      setIsDragging(true);
      const touch = e.touches[0];
      const rect = overlayRef.current.getBoundingClientRect();
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      const touch = e.touches[0];
      const container = overlayRef.current.parentElement;
      const containerRect = container.getBoundingClientRect();
      const overlayRect = overlayRef.current.getBoundingClientRect();
      
      let newX = touch.clientX - containerRect.left - dragOffset.x;
      let newY = touch.clientY - containerRect.top - dragOffset.y;
      
      // Keep within bounds
      newX = Math.max(0, Math.min(newX, containerRect.width - overlayRect.width));
      newY = Math.max(0, Math.min(newY, containerRect.height - overlayRect.height));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging]);

  return (
    <div 
      ref={overlayRef}
      className={`absolute bg-gray-800/90 backdrop-blur-md border border-gray-600/50 rounded-lg text-white min-w-[220px] z-10 select-none ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        touchAction: 'none'
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Drag Handle */}
      <div className="drag-handle cursor-grab hover:cursor-grab active:cursor-grabbing p-3 pb-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Real-Time</h3>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-3 pb-3">
        {/* INCOIS Alerts */}
        {incoisAlerts.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-orange-300 mb-2">INCOIS Alerts</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {incoisAlerts.slice(0, 5).map((alert, index) => (
                <div key={alert.id} className="flex items-center gap-2 text-xs">
                  <div className={`w-2 h-2 rounded-full ${getAlertColor(alert.severity)} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-200 truncate">
                      {getAlertTypeLabel(alert.type)}
                    </div>
                    <div className="text-gray-400 truncate">
                      {alert.description}
                    </div>
                  </div>
                </div>
              ))}
              {incoisAlerts.length > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  +{incoisAlerts.length - 5} more alerts
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Legend */}
        <div className="flex flex-col gap-3">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center gap-3 text-gray-200 text-sm">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealtimeOverlay;