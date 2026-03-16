/// <reference types="@types/google.maps" />
import { useState, useEffect, useCallback, useRef } from 'react';
import { LatLng, MapType, LayerType, MapState } from '@/types/map';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBimU8GpiVerwBbsyUhq3c7jL_G2D2az3U';

export const useGoogleMaps = (containerId: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapState, setMapState] = useState<MapState>({
    center: { lat: 16.5062, lng: 80.6480 }, // Vijayawada, India
    zoom: 14,
    mapType: 'roadmap',
    activeLayers: [],
    is3D: false,
    showLabels: true,
  });

  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);
  const transitLayerRef = useRef<google.maps.TransitLayer | null>(null);
  const bikeLayerRef = useRef<google.maps.BicyclingLayer | null>(null);
  const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null);

  // Load Google Maps Script (reliable onload-based init)
  useEffect(() => {
    if (window.google?.maps) {
      setIsLoaded(true);
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-maps="1"]');
    if (existing) {
      existing.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.dataset.googleMaps = '1';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry,drawing`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      setIsLoaded(false);
    };

    document.head.appendChild(script);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isLoaded || !containerId) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    const mapInstance = new google.maps.Map(container, {
      center: mapState.center,
      zoom: mapState.zoom,
      mapTypeId: mapState.mapType,
      disableDefaultUI: true,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry',
          stylers: [{ saturation: -20 }],
        },
        {
          featureType: 'water',
          elementType: 'geometry.fill',
          stylers: [{ color: '#c4d7e6' }],
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry.fill',
          stylers: [{ color: '#c5e3bf' }],
        },
      ],
      gestureHandling: 'greedy',
      clickableIcons: true,
    });

    // Initialize layers
    trafficLayerRef.current = new google.maps.TrafficLayer();
    transitLayerRef.current = new google.maps.TransitLayer();
    bikeLayerRef.current = new google.maps.BicyclingLayer();

    // Street View
    streetViewRef.current = mapInstance.getStreetView();

    setMap(mapInstance);
  }, [isLoaded, containerId]);

  // Update map type
  const setMapType = useCallback((type: MapType) => {
    if (!map) return;
    map.setMapTypeId(type);
    setMapState(prev => ({ ...prev, mapType: type }));
  }, [map]);

  // Toggle layer
  const toggleLayer = useCallback((layer: LayerType) => {
    if (!map) return;

    const layerRefs: Record<LayerType, google.maps.MVCObject | null> = {
      traffic: trafficLayerRef.current,
      transit: transitLayerRef.current,
      bicycling: bikeLayerRef.current,
      labels: null,
    };

    const layerRef = layerRefs[layer];
    if (!layerRef && layer !== 'labels') return;

    setMapState(prev => {
      const isActive = prev.activeLayers.includes(layer);
      
      if (layer === 'labels') {
        return {
          ...prev,
          showLabels: !prev.showLabels,
          activeLayers: isActive
            ? prev.activeLayers.filter(l => l !== layer)
            : [...prev.activeLayers, layer],
        };
      }

      if (isActive) {
        (layerRef as any)?.setMap(null);
        return {
          ...prev,
          activeLayers: prev.activeLayers.filter(l => l !== layer),
        };
      } else {
        (layerRef as any)?.setMap(map);
        return {
          ...prev,
          activeLayers: [...prev.activeLayers, layer],
        };
      }
    });
  }, [map]);

  // Toggle 3D view
  const toggle3D = useCallback(() => {
    if (!map) return;
    
    setMapState(prev => {
      const newIs3D = !prev.is3D;
      if (newIs3D) {
        map.setTilt(45);
        map.setHeading(90);
      } else {
        map.setTilt(0);
        map.setHeading(0);
      }
      return { ...prev, is3D: newIs3D };
    });
  }, [map]);

  // Zoom controls
  const zoomIn = useCallback(() => {
    if (!map) return;
    const currentZoom = map.getZoom() || 14;
    map.setZoom(currentZoom + 1);
  }, [map]);

  const zoomOut = useCallback(() => {
    if (!map) return;
    const currentZoom = map.getZoom() || 14;
    map.setZoom(currentZoom - 1);
  }, [map]);

  // Pan to location
  const panTo = useCallback((position: LatLng) => {
    if (!map) return;
    map.panTo(position);
  }, [map]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        if (map) {
          map.panTo(pos);
          map.setZoom(16);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  }, [map]);

  // Open Street View
  const openStreetView = useCallback((position: LatLng) => {
    if (!streetViewRef.current || !map) return;
    
    streetViewRef.current.setPosition(position);
    streetViewRef.current.setVisible(true);
  }, [map]);

  // Close Street View
  const closeStreetView = useCallback(() => {
    if (!streetViewRef.current) return;
    streetViewRef.current.setVisible(false);
  }, []);

  return {
    isLoaded,
    map,
    mapState,
    setMapType,
    toggleLayer,
    toggle3D,
    zoomIn,
    zoomOut,
    panTo,
    getCurrentLocation,
    openStreetView,
    closeStreetView,
  };
};

// Declare global types
declare global {
  interface Window {
    initMap?: () => void;
    google: typeof google;
  }
}
