/// <reference types="@types/google.maps" />
import React, { useEffect, useRef } from 'react';
import { RadarDevice, LatLng } from '@/types/map';
import { useFirebaseRadar } from '@/hooks/useFirebaseRadar';

interface RadarScannerProps {
  map: google.maps.Map | null;
  isVisible: boolean;
  center: LatLng;
}

export const RadarScanner: React.FC<RadarScannerProps> = ({ map, isVisible, center }) => {
  const { devices, isConnected, isScanning } = useFirebaseRadar();
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const circleRef = useRef<google.maps.Circle | null>(null);

  // Update markers when devices change
  useEffect(() => {
    if (!map) return;

    // Always clear when not visible
    if (!isVisible) {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
      return;
    }

    // Remove old markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    // Add new markers ONLY when we have real per-device GPS.
    // If a device doesn't include lat/lng from Firebase, we do NOT place a phone marker.
    devices
      .filter((d) => d.position)
      .forEach((device) => {
        const marker = new google.maps.Marker({
          position: device.position!,
          map,
          label: {
            text: '📱',
            fontSize: '16px',
          },
          title: device.mac || device.id,
          animation: device.status === 'sos' ? google.maps.Animation.BOUNCE : undefined,
        });

        const vendor = device.vendor || device.name || 'Unknown Vendor';
        const mac = device.mac || device.id;
        const rssi = typeof device.rssi === 'number' ? `${device.rssi} dBm` : '—';
        const dist = typeof device.distance === 'number' ? `${device.distance} m` : '—';

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; font-family: 'Inter', sans-serif;">
              <div style="font-weight: 600; font-size: 14px; color: #3d3429;">${vendor}</div>
              <div style="font-size: 12px; color: #8B7355; margin-top: 4px;">MAC: <span style="font-weight: 500;">${mac}</span></div>
              <div style="font-size: 12px; color: #8B7355; margin-top: 4px;">Signal: <span style="font-weight: 500;">${rssi}</span></div>
              <div style="font-size: 12px; color: #8B7355; margin-top: 4px;">Distance (estimate): <span style="font-weight: 500;">${dist}</span></div>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });

        markersRef.current.set(device.id, marker);
      });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
    };
  }, [map, devices, isVisible, center]);

  // Radar circle animation
  useEffect(() => {
    if (!map || !isVisible) {
      circleRef.current?.setMap(null);
      return;
    }

    circleRef.current = new google.maps.Circle({
      strokeColor: '#8B7355',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#8B7355',
      fillOpacity: 0.1,
      map,
      center,
      radius: 2000,
    });

    return () => {
      circleRef.current?.setMap(null);
    };
  }, [map, isVisible, center]);

  if (!isVisible) return null;

  return (
    <div className="absolute left-4 bottom-28 glass-panel rounded-xl p-4 min-w-[200px] z-10 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-success glow-safe' : 'bg-muted-foreground'
          }`}
        />
        <span className="text-sm font-medium">
          {isScanning ? 'Scanning...' : 'Radar Active'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          {devices.length} device{devices.length !== 1 ? 's' : ''} detected
        </div>

        <div className="max-h-44 overflow-auto pr-1 space-y-2">
          {devices.map((device) => (
            <div key={device.id} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/50">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-sm">
                📱
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {device.vendor || device.name || 'Unknown Vendor'}
                </div>
                <div className="text-xs text-muted-foreground truncate">{device.mac || device.id}</div>
                <div className="text-xs text-muted-foreground">
                  RSSI: {typeof device.rssi === 'number' ? `${device.rssi} dBm` : '—'} · Distance:{' '}
                  {typeof device.distance === 'number' ? `${device.distance} m` : '—'}
                </div>
              </div>
            </div>
          ))}

          {devices.length === 0 && !isScanning && (
            <div className="text-sm text-muted-foreground">
              No signals yet. Start your .bat scanner and keep Radar open.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function getDeviceColor(status: string): string {
  switch (status) {
    case 'sos':
      return '#EF4444';
    case 'active':
      return '#22C55E';
    default:
      return '#9CA3AF';
  }
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
