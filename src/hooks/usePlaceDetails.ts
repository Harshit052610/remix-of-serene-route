/// <reference types="@types/google.maps" />

import { useCallback, useEffect, useRef, useState } from "react";

export interface PlacePhoto {
  url: string;
  width?: number;
  height?: number;
}

export interface PlaceDetailsExtended {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  userRatingsTotal?: number;
  isOpen?: boolean;
  phoneNumber?: string;
  website?: string;
  googleMapsUrl?: string;
  types?: string[];
  photos: PlacePhoto[];
}

export const usePlaceDetails = (map: google.maps.Map | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (!map || !window.google?.maps?.places) return;
    placesServiceRef.current = new google.maps.places.PlacesService(map);
  }, [map]);

  const fetchPlaceDetails = useCallback(
    async (placeId: string): Promise<PlaceDetailsExtended | null> => {
      if (!placesServiceRef.current) return null;

      setIsLoading(true);
      setError(null);

      try {
        return await new Promise((resolve) => {
          placesServiceRef.current!.getDetails(
            {
              placeId,
              fields: [
                "place_id",
                "name",
                "formatted_address",
                "geometry",
                "types",
                "rating",
                "user_ratings_total",
                "opening_hours",
                "photos",
                "formatted_phone_number",
                "website",
                "url",
              ],
            },
            (place, status) => {
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                place?.geometry?.location
              ) {
                const photos: PlacePhoto[] = (place.photos || []).slice(0, 10).map((p) => ({
                  url: p.getUrl({ maxWidth: 900, maxHeight: 600 }),
                  width: p.width,
                  height: p.height,
                }));

                resolve({
                  placeId: place.place_id || placeId,
                  name: place.name || "",
                  address: place.formatted_address || "",
                  location: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  },
                  rating: place.rating,
                  userRatingsTotal: place.user_ratings_total,
                  isOpen: place.opening_hours?.isOpen?.(),
                  phoneNumber: place.formatted_phone_number,
                  website: place.website,
                  googleMapsUrl: place.url,
                  types: place.types,
                  photos,
                });
              } else {
                resolve(null);
              }
            }
          );
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load place details");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { fetchPlaceDetails, isLoading, error };
};
