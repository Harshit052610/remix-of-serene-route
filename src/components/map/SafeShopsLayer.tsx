/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useCallback } from 'react';
import { SafeShop, LatLng } from '@/types/map';
import { usePlacesSearch } from '@/hooks/usePlacesSearch';

interface SafeShopsLayerProps {
  map: google.maps.Map | null;
  center: LatLng;
  isVisible: boolean;
  routePath?: google.maps.LatLng[];
}

const SHOP_TYPES = ['police', 'hospital', 'pharmacy', 'cafe', 'convenience_store'];

export const SafeShopsLayer: React.FC<SafeShopsLayerProps> = ({
  map,
  center,
  isVisible,
  routePath,
}) => {
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const { searchNearby } = usePlacesSearch(map);

  const getShopIcon = (type: string): google.maps.Symbol => {
    const baseIcon = {
      scale: 10,
      fillOpacity: 1,
      strokeWeight: 2,
      strokeColor: '#FFFFFF',
    };

    const iconMap: Record<string, { path: google.maps.SymbolPath; fillColor: string }> = {
      police: { path: google.maps.SymbolPath.CIRCLE, fillColor: '#3B82F6' },
      hospital: { path: google.maps.SymbolPath.CIRCLE, fillColor: '#EF4444' },
      pharmacy: { path: google.maps.SymbolPath.CIRCLE, fillColor: '#22C55E' },
      cafe: { path: google.maps.SymbolPath.CIRCLE, fillColor: '#F59E0B' },
      convenience_store: { path: google.maps.SymbolPath.CIRCLE, fillColor: '#8B7355' },
    };

    return { ...baseIcon, ...iconMap[type] || iconMap.convenience_store };
  };

  const loadSafeShops = useCallback(async () => {
    if (!map || !isVisible) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current.clear();

    // If we have a route, search along the route
    const searchPoints: LatLng[] = routePath
      ? routePath
          .filter((_, i) => i % Math.max(1, Math.floor(routePath.length / 5)) === 0)
          .map((p) => ({ lat: p.lat(), lng: p.lng() }))
      : [center];

    for (const point of searchPoints) {
      for (const type of SHOP_TYPES) {
        try {
          const places = await searchNearby(point, type, 1500);

          places.slice(0, 5).forEach((place) => {
            if (markersRef.current.has(place.placeId)) return;

            const marker = new google.maps.Marker({
              position: place.position,
              map,
              icon: getShopIcon(type),
              title: place.name,
              optimized: true,
            });

            // Glowing effect for safe shops
            const circle = new google.maps.Circle({
              strokeColor: '#22C55E',
              strokeOpacity: 0.4,
              strokeWeight: 1,
              fillColor: '#22C55E',
              fillOpacity: 0.15,
              map,
              center: place.position,
              radius: 50,
            });

            // Animate glow
            let opacity = 0.15;
            let increasing = true;
            const interval = setInterval(() => {
              if (increasing) {
                opacity += 0.02;
                if (opacity >= 0.3) increasing = false;
              } else {
                opacity -= 0.02;
                if (opacity <= 0.1) increasing = true;
              }
              circle.setOptions({ fillOpacity: opacity });
            }, 100);

            // Info window
            const infoContent = `
              <div style="padding: 12px; font-family: 'Inter', sans-serif; max-width: 200px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <span style="font-size: 18px;">${getTypeEmoji(type)}</span>
                  <span style="font-weight: 600; font-size: 14px; color: #3d3429;">${place.name}</span>
                </div>
                ${place.rating ? `
                  <div style="font-size: 12px; color: #8B7355; margin-bottom: 4px;">
                    ⭐ ${place.rating.toFixed(1)}
                  </div>
                ` : ''}
                <div style="font-size: 12px; color: #666;">
                  ${place.address}
                </div>
                ${place.isOpen !== undefined ? `
                  <div style="font-size: 12px; margin-top: 4px; color: ${place.isOpen ? '#22C55E' : '#EF4444'};">
                    ${place.isOpen ? '✓ Open now' : '✗ Closed'}
                  </div>
                ` : ''}
                <button 
                  onclick="window.navigateToShop && window.navigateToShop('${place.placeId}')"
                  style="margin-top: 8px; padding: 6px 12px; background: #8B7355; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; width: 100%;"
                >
                  Get Directions
                </button>
              </div>
            `;

            const infoWindow = new google.maps.InfoWindow({ content: infoContent });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
            });

            // Store reference
            markersRef.current.set(place.placeId, marker);

            // Cleanup interval when marker is removed
            google.maps.event.addListenerOnce(marker, 'map_changed', () => {
              clearInterval(interval);
              circle.setMap(null);
            });
          });
        } catch (error) {
          console.error(`Error loading ${type}:`, error);
        }
      }
    }
  }, [map, isVisible, center, routePath, searchNearby]);

  useEffect(() => {
    if (isVisible) {
      loadSafeShops();
    } else {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
    }

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current.clear();
    };
  }, [isVisible, loadSafeShops]);

  return null;
};

function getTypeEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    police: '👮',
    hospital: '🏥',
    pharmacy: '💊',
    cafe: '☕',
    convenience_store: '🏪',
  };
  return emojiMap[type] || '📍';
}
