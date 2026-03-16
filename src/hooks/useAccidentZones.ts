import { useState, useEffect } from 'react';

export interface AccidentZone {
  id: string;
  lat: number;
  lng: number;
  severity: string;
  weather: string;
  light: string;
  road_type: string;
  road_surface: string;
  casualties: number;
  day: string;
  time: string;
  vehicle: string;
  speed_limit: number;
  point_type?: string;
  landmark?: string;
  risk_info?: string;
  incident_count?: number; // For blackspots
}

export const useAccidentZones = () => {
  const [zones, setZones] = useState<AccidentZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      console.log('🔍 Fetching accident data from localized JSON asset...');
      try {
        // Fetch from the combined JSON file in the public folder
        const response = await fetch('/accident_data.json');
        if (!response.ok) {
          throw new Error(`Data fetch failed: ${response.statusText}`);
        }

        const data: AccidentZone[] = await response.json();

        // Ensure all numeric values are correct and map back to interface
        const validatedData = data.map(zone => ({
          ...zone,
          lat: Number(zone.lat),
          lng: Number(zone.lng),
          casualties: Number(zone.casualties || 0),
          incident_count: zone.point_type === 'blackspot' ? 25 : undefined
        }));

        setZones(validatedData);
        console.log(`✅ Loaded ${validatedData.length} accident zones from static asset.`);
      } catch (err) {
        console.error('❌ Data load failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return { zones, loading };
};
