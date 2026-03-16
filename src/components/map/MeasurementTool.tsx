/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Trash2 } from 'lucide-react';
import { LatLng } from '@/types/map';

interface MeasurementToolProps {
  map: google.maps.Map | null;
  isActive: boolean;
  onClose: () => void;
}

export const MeasurementTool: React.FC<MeasurementToolProps> = ({
  map,
  isActive,
  onClose,
}) => {
  const [points, setPoints] = useState<LatLng[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  // Calculate distance between two points
  const calculateDistance = useCallback((p1: LatLng, p2: LatLng): number => {
    if (!window.google?.maps?.geometry) return 0;
    return google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(p1.lat, p1.lng),
      new google.maps.LatLng(p2.lat, p2.lng)
    );
  }, []);

  // Add point
  const addPoint = useCallback((position: LatLng) => {
    if (!map) return;

    const marker = new google.maps.Marker({
      position,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#8B7355',
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: '#FFFFFF',
      },
      draggable: true,
    });

    markersRef.current.push(marker);

    setPoints((prev) => {
      const newPoints = [...prev, position];
      
      // Update polyline
      if (polylineRef.current) {
        polylineRef.current.setPath(
          newPoints.map((p) => new google.maps.LatLng(p.lat, p.lng))
        );
      }

      // Calculate total distance
      let total = 0;
      for (let i = 1; i < newPoints.length; i++) {
        total += calculateDistance(newPoints[i - 1], newPoints[i]);
      }
      setTotalDistance(total);

      return newPoints;
    });

    // Handle marker drag
    marker.addListener('drag', () => {
      updatePolyline();
    });
  }, [map, calculateDistance]);

  // Update polyline from markers
  const updatePolyline = useCallback(() => {
    const newPoints = markersRef.current.map((m) => {
      const pos = m.getPosition()!;
      return { lat: pos.lat(), lng: pos.lng() };
    });

    if (polylineRef.current) {
      polylineRef.current.setPath(
        newPoints.map((p) => new google.maps.LatLng(p.lat, p.lng))
      );
    }

    setPoints(newPoints);

    // Calculate total distance
    let total = 0;
    for (let i = 1; i < newPoints.length; i++) {
      total += calculateDistance(newPoints[i - 1], newPoints[i]);
    }
    setTotalDistance(total);
  }, [calculateDistance]);

  // Initialize
  useEffect(() => {
    if (!map || !isActive) return;

    // Create polyline
    polylineRef.current = new google.maps.Polyline({
      map,
      strokeColor: '#8B7355',
      strokeWeight: 3,
      strokeOpacity: 0.8,
    });

    // Add click listener
    clickListenerRef.current = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        addPoint({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    });

    // Change cursor
    map.setOptions({ draggableCursor: 'crosshair' });

    return () => {
      // Cleanup
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
      }
      polylineRef.current?.setMap(null);
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      map.setOptions({ draggableCursor: null });
    };
  }, [map, isActive, addPoint]);

  // Clear measurements
  const clearMeasurements = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    polylineRef.current?.setPath([]);
    setPoints([]);
    setTotalDistance(0);
  };

  // Format distance
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  if (!isActive) return null;

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 glass-panel rounded-2xl p-4 z-20 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <span className="text-muted-foreground">Distance: </span>
          <span className="font-semibold">{formatDistance(totalDistance)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearMeasurements}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Click on the map to add measurement points
      </p>
    </div>
  );
};
