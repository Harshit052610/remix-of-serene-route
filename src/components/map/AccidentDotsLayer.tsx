import React, { useEffect, useRef } from 'react';
import { AccidentZone } from '@/hooks/useAccidentZones';

interface AccidentDotsLayerProps {
    map: google.maps.Map | null;
    isVisible: boolean;
    zones: AccidentZone[];
}

export const AccidentDotsLayer: React.FC<AccidentDotsLayerProps> = ({ map, isVisible, zones }) => {
    const markersRef = useRef<google.maps.Marker[]>([]);

    useEffect(() => {
        if (!map) return;

        // Clear existing markers efficiently
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];

        if (!isVisible) return;

        const infoWindow = new google.maps.InfoWindow();

        zones.forEach((zone: AccidentZone) => {
            if (!zone.lat || !zone.lng) return;

            const isBlackspot = zone.point_type === 'blackspot';

            const marker = new google.maps.Marker({
                position: { lat: zone.lat, lng: zone.lng },
                map,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: isBlackspot ? 6 : 4,
                    fillColor: isBlackspot ? '#000000' : '#EF4444',
                    fillOpacity: 0.8,
                    strokeColor: isBlackspot ? '#EF4444' : '#FFFFFF',
                    strokeWeight: 2,
                },
                zIndex: isBlackspot ? 1000 : 1,
                clickable: true
            });

            marker.addListener('mouseover', () => {
                const title = isBlackspot ? '🚨 HIGH-RISK BLACKSPOT' : '📋 HISTORICAL RECORD';
                const accentColor = isBlackspot ? '#EF4444' : '#C5A880';

                const content = `
                    <div style="font-family: 'Inter', sans-serif; min-width: 220px; padding: 10px; background: #fff;">
                        <h4 style="margin: 0 0 8px 0; font-size: 11px; font-weight: 800; color: ${accentColor}; letter-spacing: 0.1em; text-transform: uppercase;">${title}</h4>
                        
                        ${isBlackspot ? `
                            <div style="margin-bottom: 12px;">
                                <div style="font-size: 16px; font-weight: 700; color: #111; margin-bottom: 2px;">${zone.landmark}</div>
                                <div style="font-size: 10px; color: #666; font-style: italic;">${zone.risk_info}</div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #F8F9FA; padding: 8px; border-radius: 4px; border: 1px solid #EEE;">
                                <div>
                                    <div style="font-size: 9px; color: #888; text-transform: uppercase;">Incidents</div>
                                    <div style="font-size: 14px; font-weight: 700; color: #EF4444;">${zone.incident_count || '25+'}</div>
                                </div>
                                <div>
                                    <div style="font-size: 9px; color: #888; text-transform: uppercase;">Severity</div>
                                    <div style="font-size: 14px; font-weight: 700; color: #111;">${zone.severity}</div>
                                </div>
                            </div>
                        ` : `
                            <div style="font-size: 12px; color: #333; line-height: 1.6;">
                                <div style="margin-bottom: 4px;"><strong>Location:</strong> ${zone.lat.toFixed(5)}, ${zone.lng.toFixed(5)}</div>
                                <div style="margin-bottom: 4px;"><strong>Severity:</strong> <span style="color: ${zone.severity === 'Fatal' ? '#EF4444' : '#111'}; font-weight: 600;">${zone.severity}</span></div>
                                <div style="margin-bottom: 4px;"><strong>Weather:</strong> ${zone.weather}</div>
                                <div style="margin-bottom: 4px;"><strong>Road Type:</strong> ${zone.road_type}</div>
                                <div style="border-top: 1px solid #EEE; padding-top: 4px; margin-top: 4px; font-size: 10px; color: #888;">
                                    Casualties recorded: ${zone.casualties}
                                </div>
                            </div>
                        `}
                    </div>
                `;

                infoWindow.setContent(content);
                infoWindow.open({ anchor: marker, map, shouldFocus: false });
            });

            marker.addListener('mouseout', () => infoWindow.close());
            markersRef.current.push(marker);
        });

        return () => infoWindow.close();
    }, [map, zones, isVisible]);

    useEffect(() => {
        return () => {
            markersRef.current.forEach(m => m.setMap(null));
        };
    }, []);

    return null;
};
