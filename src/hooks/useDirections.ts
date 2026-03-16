/// <reference types="@types/google.maps" />
import { useState, useCallback, useRef, useEffect } from 'react';
import { LatLng, RouteInfo, NavigationState } from '@/types/map';

export const useDirections = (map: google.maps.Map | null) => {
  const waitForGoogleRef = useRef<Promise<boolean> | null>(null);

  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    mode: 'simulate',
    currentPosition: null,
    destination: null,
    routes: [],
    selectedRoute: 0,
  });

  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const routeIndexRef = useRef(0);
  const currentMarkerRef = useRef<google.maps.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Initialize services (DirectionsService can be created lazily as soon as Google Maps is ready)
  useEffect(() => {
    if (!window.google?.maps) return;
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;

    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        // Google-like blue
        strokeColor: '#1A73E8',
        strokeWeight: 5,
        strokeOpacity: 0.85,
      },
    });

    return () => {
      directionsRendererRef.current?.setMap(null);
    };
  }, [map]);

  const waitForGoogle = useCallback(async () => {
    if (window.google?.maps) return true;

    if (!waitForGoogleRef.current) {
      waitForGoogleRef.current = new Promise<boolean>((resolve) => {
        const start = Date.now();
        const interval = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(interval);
            resolve(true);
            return;
          }
          if (Date.now() - start > 8000) {
            clearInterval(interval);
            resolve(false);
          }
        }, 100);
      });
    }

    return await waitForGoogleRef.current;
  }, []);

  // Get directions
  const getDirections = useCallback(
    async (
      origin: LatLng,
      destination: LatLng,
      travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING,
      accidentZones: any[] = [],
      safeShops: any[] = []
    ): Promise<{ routes: RouteInfo[]; status?: string }> => {
      const ready = await waitForGoogle();
      if (!ready) return { routes: [], status: 'MAPS_SCRIPT_NOT_LOADED' };

      if (!directionsServiceRef.current) {
        directionsServiceRef.current = new google.maps.DirectionsService();
      }

      if (!directionsServiceRef.current) {
        return { routes: [], status: 'SERVICE_NOT_READY' };
      }

      return new Promise((resolve) => {
        const baseRequest: google.maps.DirectionsRequest = {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          travelMode,
          provideRouteAlternatives: true,
        };

        // drivingOptions are only valid for DRIVING
        const request: google.maps.DirectionsRequest =
          travelMode === google.maps.TravelMode.DRIVING
            ? {
              ...baseRequest,
              drivingOptions: {
                departureTime: new Date(),
                trafficModel: google.maps.TrafficModel.BEST_GUESS,
              },
            }
            : baseRequest;

        directionsServiceRef.current!.route(request, (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRendererRef.current?.setDirections(result);

            const routes: RouteInfo[] = result.routes.map((route, index) => {
              const leg = route.legs[0];
              const polyline = route.overview_path;

              // Calculate accidents along route (within 100m of polyline)
              let accidentsOnRoute = 0;
              accidentZones.forEach(zone => {
                const zoneLatLng = new google.maps.LatLng(zone.lat, zone.lng);
                const isNear = polyline.some(point =>
                  google.maps.geometry.spherical.computeDistanceBetween(point, zoneLatLng) < 100
                );
                if (isNear) accidentsOnRoute++;
              });

              // Calculate shops along route (within 200m)
              let shopsOnRoute = 0;
              safeShops.forEach(shop => {
                const shopLatLng = new google.maps.LatLng(shop.position.lat, shop.position.lng);
                const isNear = polyline.some(point =>
                  google.maps.geometry.spherical.computeDistanceBetween(point, shopLatLng) < 200
                );
                if (isNear) shopsOnRoute++;
              });

              return {
                id: `route-${index}`,
                distance: leg.distance?.text || '',
                duration: leg.duration?.text || '',
                safetyScore: Math.max(0, 100 - (accidentsOnRoute * 15)),
                polyline: polyline,
                steps: leg.steps.map((step) => ({
                  instruction: step.instructions,
                  distance: step.distance?.text || '',
                  duration: step.duration?.text || '',
                })),
                accidentCount: accidentsOnRoute,
                shopCount: shopsOnRoute,
                publicDensity: shopsOnRoute > 5 ? 'High' : shopsOnRoute > 2 ? 'Medium' : 'Low',
                isFastest: index === 0, // Usually the first route is fastest in Google Maps
              };
            });

            setNavigationState((prev) => ({
              ...prev,
              routes,
              destination,
              selectedRoute: 0,
              lastDirectionsStatus: undefined,
            }));

            resolve({ routes });
            return;
          }

          console.error('Directions error:', status, result);
          directionsRendererRef.current?.setDirections({ routes: [] } as any);

          setNavigationState((prev) => ({
            ...prev,
            routes: [],
            destination,
            selectedRoute: 0,
            lastDirectionsStatus: String(status),
          }));

          resolve({ routes: [], status: String(status) });
        });
      });
    },
    [waitForGoogle]
  );


  // Select a route
  const selectRoute = useCallback((index: number) => {
    if (!directionsRendererRef.current) return;
    directionsRendererRef.current.setRouteIndex(index);
    setNavigationState((prev) => ({ ...prev, selectedRoute: index }));
  }, []);

  // Start navigation
  const startNavigation = useCallback((mode: 'simulate' | 'real') => {
    const { routes, selectedRoute } = navigationState;
    if (routes.length === 0) return;

    const route = routes[selectedRoute];
    routeIndexRef.current = 0;

    setNavigationState((prev) => ({
      ...prev,
      isNavigating: true,
      mode,
      currentPosition: {
        lat: route.polyline[0].lat(),
        lng: route.polyline[0].lng(),
      },
    }));

    // Camera: zoom + 45° tilt + heading like Google Maps
    if (map && route.polyline.length > 0) {
      const start = { lat: route.polyline[0].lat(), lng: route.polyline[0].lng() };
      map.panTo(start);
      map.setZoom(18);

      // 45° tilt (only works on vector maps; harmless otherwise)
      map.setTilt(45);

      // Heading based on initial segment bearing
      if (route.polyline.length > 1) {
        const a = route.polyline[0];
        const b = route.polyline[1];
        const heading = google.maps.geometry?.spherical?.computeHeading(a, b);
        if (typeof heading === 'number' && Number.isFinite(heading)) {
          map.setHeading(heading);
        }
      }
    }

    if (mode === 'simulate') {
      // Simulate navigation along the route
      simulationIntervalRef.current = setInterval(() => {
        routeIndexRef.current++;
        const polyline = route.polyline;

        if (routeIndexRef.current >= polyline.length) {
          stopNavigation();
          return;
        }

        const position = {
          lat: polyline[routeIndexRef.current].lat(),
          lng: polyline[routeIndexRef.current].lng(),
        };

        // Update marker position
        if (currentMarkerRef.current) {
          currentMarkerRef.current.setPosition(position);
        } else if (map) {
          // Rotate arrow to match movement direction
          const prevPoint = polyline[Math.max(0, routeIndexRef.current - 1)];
          const nextPoint = polyline[routeIndexRef.current];
          const heading = google.maps.geometry?.spherical?.computeHeading(prevPoint, nextPoint) ?? 0;

          currentMarkerRef.current = new google.maps.Marker({
            position,
            map,
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 6,
              fillColor: '#8B7355',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF',
              rotation: heading,
            },
          });
        }

        // Pan map to follow
        map?.panTo(position);

        setNavigationState((prev) => ({
          ...prev,
          currentPosition: position,
        }));
      }, 500);
    } else {
      // Real GPS tracking
      if (navigator.geolocation) {
        // Clear any previous watcher
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            if (currentMarkerRef.current) {
              currentMarkerRef.current.setPosition(pos);
            } else if (map) {
              currentMarkerRef.current = new google.maps.Marker({
                position: pos,
                map,
                icon: {
                  path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 6,
                  fillColor: '#8B7355',
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#FFFFFF',
                },
              });
            }

            map?.panTo(pos);

            setNavigationState((prev) => ({
              ...prev,
              currentPosition: pos,
            }));
          },
          (error) => console.error('GPS Error:', error),
          { enableHighAccuracy: true, maximumAge: 0 }
        );
      }
    }
  }, [navigationState, map]);

  // Stop navigation
  const stopNavigation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }

    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    currentMarkerRef.current?.setMap(null);
    currentMarkerRef.current = null;

    // Reset camera to normal
    map?.setTilt(0);
    map?.setHeading(0);

    setNavigationState((prev) => ({
      ...prev,
      isNavigating: false,
      currentPosition: null,
    }));
  }, [map]);

  // Clear route
  const clearRoute = useCallback(() => {
    stopNavigation();
    directionsRendererRef.current?.setDirections({ routes: [] } as any);
    setNavigationState({
      isNavigating: false,
      mode: 'simulate',
      currentPosition: null,
      destination: null,
      routes: [],
      selectedRoute: 0,
    });
  }, [stopNavigation]);

  return {
    navigationState,
    getDirections,
    selectRoute,
    startNavigation,
    stopNavigation,
    clearRoute,
  };
};
