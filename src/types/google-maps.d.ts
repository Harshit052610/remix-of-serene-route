/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    initMap?: () => void;
    google: typeof google;
    navigateToShop?: (placeId: string) => void;
  }
}

export {};
