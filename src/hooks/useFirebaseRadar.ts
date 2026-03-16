import { useState, useEffect, useCallback } from 'react';
import { RadarDevice } from '@/types/map';

const FIREBASE_URL = 'https://safetyradar-f5a42-default-rtdb.firebaseio.com';
const RADAR_SYSTEM_PATH = 'radar_system';
const DEVICES_PATH = 'devices';

export const useFirebaseRadar = () => {
  const [devices, setDevices] = useState<RadarDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch devices from Firebase Radar System
  const fetchDevices = useCallback(async () => {
    try {
      setIsScanning(true);
      const response = await fetch(`${FIREBASE_URL}/${RADAR_SYSTEM_PATH}.json`, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Failed to fetch radar data');
      }

      const data = await response.json();

      // Expected shape from your scanner:
      // { signals: [{ mac, vendor, rssi, distance }], count }
      const signals: any[] = Array.isArray(data?.signals) ? data.signals : [];

      const deviceList: RadarDevice[] = signals
        .filter((s) => s?.mac)
        .map((signal) => {
          const mac = String(signal.mac).toLowerCase();
          const vendor = signal.vendor ? String(signal.vendor) : 'Unknown Vendor';
          const rssi = typeof signal.rssi === 'number' ? signal.rssi : Number(signal.rssi);
          const distance = typeof signal.distance === 'number' ? signal.distance : Number(signal.distance);

          // Optional real per-device GPS (only if your scanner provides it)
          const lat = typeof signal.lat === 'number' ? signal.lat : Number(signal.lat);
          const lng = typeof signal.lng === 'number' ? signal.lng : Number(signal.lng);
          const hasRealPos = Number.isFinite(lat) && Number.isFinite(lng);

          return {
            id: mac,
            position: hasRealPos ? { lat, lng } : undefined,
            name: vendor,
            lastUpdate: Date.now(),
            status: 'active',
            mac,
            vendor,
            rssi: Number.isFinite(rssi) ? rssi : undefined,
            distance: Number.isFinite(distance) ? distance : undefined,
          };
        });

      setDevices(deviceList);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      console.error('Firebase radar error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setDevices([]);
      setIsConnected(false);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // NOTE: No demo/mock devices. Radar UI is driven only by real Firebase data.

  // Set up real-time updates
  useEffect(() => {
    fetchDevices();

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchDevices, 10000);

    return () => clearInterval(interval);
  }, [fetchDevices]);

  // Trigger SOS for a device
  const triggerSOS = useCallback(async (deviceId: string) => {
    try {
      await fetch(`${FIREBASE_URL}/${DEVICES_PATH}/${deviceId}.json`, {
        method: 'PATCH',
        body: JSON.stringify({
          sos: true,
          timestamp: Date.now(),
        }),
      });
      
      setDevices(prev =>
        prev.map(d =>
          d.id === deviceId ? { ...d, status: 'sos' as const } : d
        )
      );
    } catch (err) {
      console.error('Failed to trigger SOS:', err);
    }
  }, []);

  // Clear SOS
  const clearSOS = useCallback(async (deviceId: string) => {
    try {
      await fetch(`${FIREBASE_URL}/${DEVICES_PATH}/${deviceId}.json`, {
        method: 'PATCH',
        body: JSON.stringify({
          sos: false,
          timestamp: Date.now(),
        }),
      });
      
      setDevices(prev =>
        prev.map(d =>
          d.id === deviceId ? { ...d, status: 'active' as const } : d
        )
      );
    } catch (err) {
      console.error('Failed to clear SOS:', err);
    }
  }, []);

  return {
    devices,
    isConnected,
    isScanning,
    error,
    fetchDevices,
    triggerSOS,
    clearSOS,
  };
};
