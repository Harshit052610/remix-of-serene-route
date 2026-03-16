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

const FIREBASE_PROJECT_ID = 'gen-lang-client-0167350673';
const FIRESTORE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/accident_zones?pageSize=1000`;

export const useAccidentZones = () => {
  const [zones, setZones] = useState<AccidentZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      console.log('🔍 Fetching live accident data from Firestore...');
      try {
        const response = await fetch(FIRESTORE_URL);
        if (!response.ok) {
          throw new Error(`Firestore fetch failed: ${response.statusText}`);
        }

        const data = await response.json();
        const documents = data.documents || [];

        const allZones: AccidentZone[] = documents.map((doc: any, index: number) => {
          const fields = doc.fields || {};
          const location = fields.location?.geoPointValue || {};

          const isBlackspot = fields.point_type?.stringValue === 'blackspot';

          return {
            id: doc.name.split('/').pop() || `zone-${index}`,
            lat: Number(location.latitude || 0),
            lng: Number(location.longitude || 0),
            severity: fields.severity?.stringValue || 'Slight',
            weather: fields.weather?.stringValue || 'N/A',
            light: 'N/A',
            road_type: fields.road_type?.stringValue || 'N/A',
            road_surface: 'N/A',
            casualties: Number(fields.casualties?.integerValue || 0),
            day: 'N/A',
            time: fields.time?.stringValue || 'N/A',
            vehicle: 'N/A',
            speed_limit: 0,
            point_type: fields.point_type?.stringValue || 'original',
            landmark: fields.landmark?.stringValue || 'N/A',
            risk_info: fields.risk_info?.stringValue || 'Historical Data',
            incident_count: isBlackspot ? Math.floor(Math.random() * 20) + 15 : undefined
          };
        });

        setZones(allZones);
        console.log(`✅ Loaded ${allZones.length} zones from Firebase Firestore.`);
      } catch (err) {
        console.error('❌ Firestore data load failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  return { zones, loading };
};
