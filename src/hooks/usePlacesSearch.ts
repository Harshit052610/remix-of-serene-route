/// <reference types="@types/google.maps" />
import { useState, useCallback, useRef, useEffect } from 'react';
import { LatLng } from '@/types/map';

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  name: string;
  address: string;
  position: LatLng;
  placeId: string;
  types: string[];
  rating?: number;
  isOpen?: boolean;
}

export const usePlacesSearch = (map: google.maps.Map | null) => {
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<PlacePrediction[]>([]);

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Initialize services
  useEffect(() => {
    if (!window.google?.maps?.places) return;

    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  useEffect(() => {
    if (!map || !window.google?.maps?.places) return;
    placesServiceRef.current = new google.maps.places.PlacesService(map);
  }, [map]);

  // Search for places
  const search = useCallback(async (query: string): Promise<void> => {
    if (!query.trim() || !autocompleteServiceRef.current) {
      setPredictions([]);
      return;
    }

    setIsSearching(true);

    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query,
          sessionToken: sessionTokenRef.current!,
          componentRestrictions: { country: 'in' },
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(
              results.map((r) => ({
                placeId: r.place_id,
                description: r.description,
                mainText: r.structured_formatting.main_text,
                secondaryText: r.structured_formatting.secondary_text || '',
              }))
            );
          } else {
            setPredictions([]);
          }
          setIsSearching(false);
        }
      );
    } catch (error) {
      console.error('Search error:', error);
      setPredictions([]);
      setIsSearching(false);
    }
  }, []);

  // Get place details
  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    if (!placesServiceRef.current) return null;

    return new Promise((resolve) => {
      placesServiceRef.current!.getDetails(
        {
          placeId,
          fields: ['name', 'formatted_address', 'geometry', 'types', 'rating', 'opening_hours'],
          sessionToken: sessionTokenRef.current!,
        },
        (place, status) => {
          // Generate new session token after fetching details
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();

          if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
            const details: PlaceDetails = {
              name: place.name || '',
              address: place.formatted_address || '',
              position: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
              },
              placeId,
              types: place.types || [],
              rating: place.rating,
              isOpen: place.opening_hours?.isOpen?.(),
            };
            resolve(details);
          } else {
            resolve(null);
          }
        }
      );
    });
  }, []);

  // Select a prediction
  const selectPrediction = useCallback(async (prediction: PlacePrediction) => {
    const details = await getPlaceDetails(prediction.placeId);
    
    // Save to recent searches
    setRecentSearches((prev) => {
      const updated = [prediction, ...prev.filter((p) => p.placeId !== prediction.placeId)].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });

    setPredictions([]);
    return details;
  }, [getPlaceDetails]);

  // Clear search
  const clearSearch = useCallback(() => {
    setPredictions([]);
  }, []);

  // Search nearby places by type
  const searchNearby = useCallback(async (
    position: LatLng,
    type: string,
    radius: number = 2000
  ): Promise<PlaceDetails[]> => {
    if (!placesServiceRef.current) return [];

    return new Promise((resolve) => {
      placesServiceRef.current!.nearbySearch(
        {
          location: new google.maps.LatLng(position.lat, position.lng),
          radius,
          type,
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            const places: PlaceDetails[] = results
              .filter((r) => r.geometry?.location)
              .map((r) => ({
                name: r.name || '',
                address: r.vicinity || '',
                position: {
                  lat: r.geometry!.location!.lat(),
                  lng: r.geometry!.location!.lng(),
                },
                placeId: r.place_id || '',
                types: r.types || [],
                rating: r.rating,
                isOpen: r.opening_hours?.isOpen?.(),
              }));
            resolve(places);
          } else {
            resolve([]);
          }
        }
      );
    });
  }, []);

  return {
    predictions,
    isSearching,
    recentSearches,
    search,
    selectPrediction,
    clearSearch,
    getPlaceDetails,
    searchNearby,
  };
};
