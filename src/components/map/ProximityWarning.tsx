import React, { useEffect, useState, useRef } from 'react';
import { AccidentZone } from '@/hooks/useAccidentZones';
import { LatLng } from '@/types/map';

interface ProximityWarningProps {
    map: google.maps.Map | null;
    currentPosition: LatLng | null;
    zones: AccidentZone[];
}

export const ProximityWarning: React.FC<ProximityWarningProps> = ({ map, currentPosition, zones }) => {
    const [warning, setWarning] = useState<{ distance: number, zone: AccidentZone } | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
    const markerListenersRef = useRef<google.maps.MapsEventListener[]>([]);

    useEffect(() => {
        if (!map || !currentPosition) return;

        let closestDistance = Infinity;
        let closestZone: AccidentZone | null = null;

        const userLatLng = new google.maps.LatLng(currentPosition.lat, currentPosition.lng);

        for (const zone of zones) {
            const zoneLatLng = new google.maps.LatLng(zone.lat, zone.lng);
            const distance = google.maps.geometry.spherical.computeDistanceBetween(userLatLng, zoneLatLng);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestZone = zone;
            }
        }

        if (closestDistance <= 500 && closestZone) {
            setWarning({ distance: closestDistance, zone: closestZone });

            if (!markerRef.current) {
                const isBlackspot = closestZone.point_type === 'blackspot';
                markerRef.current = new google.maps.Marker({
                    position: { lat: closestZone.lat, lng: closestZone.lng },
                    map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 14,
                        fillColor: isBlackspot ? '#ef4444' : '#991b1b',
                        fillOpacity: 0.9,
                        strokeColor: '#fff',
                        strokeWeight: 2,
                    },
                    animation: google.maps.Animation.BOUNCE,
                });

                infoWindowRef.current = new google.maps.InfoWindow({
                    disableAutoPan: true,
                });

                const mOver = markerRef.current.addListener('mouseover', () => {
                    if (!closestZone) return;
                    const isB = closestZone.point_type === 'blackspot';
                    const contentString = `
                        <div style="font-family: 'Inter', sans-serif; color: #111; padding: 4px; min-width: 200px;">
                            <h3 style="color: #ef4444; font-weight: bold; font-size: 14px; margin-bottom: 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px;">
                                ${isB ? '🚨 Blackspot Danger' : '⚠️ History Detected'}
                            </h3>
                            <div style="font-size: 11px; line-height: 1.5;">
                                <strong>Severity:</strong> ${closestZone.severity}<br/>
                                ${closestZone.risk_info ? `<strong>Risk:</strong> ${closestZone.risk_info}<br/>` : ''}
                                ${closestZone.landmark ? `<strong>Landmark:</strong> ${closestZone.landmark}<br/>` : ''}
                            </div>
                        </div>
                    `;
                    if (infoWindowRef.current && markerRef.current && map) {
                        infoWindowRef.current.setContent(contentString);
                        infoWindowRef.current.open(map, markerRef.current);
                    }
                });

                const mOut = markerRef.current.addListener('mouseout', () => {
                    infoWindowRef.current?.close();
                });

                markerListenersRef.current = [mOver, mOut];
            } else {
                markerRef.current.setPosition({ lat: closestZone.lat, lng: closestZone.lng });
            }
        } else {
            setWarning(null);
            setIsExpanded(false);
            if (markerRef.current) {
                markerRef.current.setMap(null);
                markerRef.current = null;
            }
            if (infoWindowRef.current) {
                infoWindowRef.current.close();
                infoWindowRef.current = null;
            }
            markerListenersRef.current.forEach(l => google.maps.event.removeListener(l));
            markerListenersRef.current = [];
        }
    }, [map, currentPosition, zones]);

    useEffect(() => {
        return () => {
            if (markerRef.current) markerRef.current.setMap(null);
            if (infoWindowRef.current) infoWindowRef.current.close();
            markerListenersRef.current.forEach(l => google.maps.event.removeListener(l));
        }
    }, []);

    if (!warning) return null;

    return (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-[#111111] border border-[#2A2A2A] rounded-md shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-50">
            <div className="flex items-center gap-5">
                <div className="flex-shrink-0 animate-pulse w-3 h-3 rounded-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.9)]" />
                <div className="flex-1">
                    <h3 className="text-[#C5A880] font-serif tracking-[0.2em] uppercase text-[10px] font-bold mb-1.5 opacity-90">
                        {warning.zone.point_type === 'blackspot' ? 'Critical Blackspot Detected' : 'Caution: Accident History'}
                    </h3>
                    <p className="text-zinc-300 font-serif text-sm tracking-wide">
                        Safety Warning <span className="text-red-500 font-medium ml-1">[{Math.round(warning.distance)}m ahead]</span>
                    </p>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex-shrink-0 text-[10px] uppercase tracking-wider font-bold text-[#C5A880] border border-[#C5A880]/50 px-3 py-1.5 rounded hover:bg-[#C5A880] hover:text-[#111] transition-colors"
                >
                    {isExpanded ? 'Hide' : 'Know More'}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#2A2A2A] text-zinc-400 text-sm font-serif leading-relaxed">
                    {warning.zone.point_type === 'blackspot' ? (
                        <>
                            This is a high-risk zone tagged as <strong className="text-red-500">{warning.zone.landmark}</strong>.
                            Reported risk: <span className="text-zinc-200 italic">"{warning.zone.risk_info}"</span>.
                            Exercise extreme caution.
                        </>
                    ) : (
                        <>
                            This accident occurred on a <strong className="text-zinc-200">{warning.zone.day || 'Recorded Day'}</strong> involving a <strong className="text-zinc-200">{warning.zone.vehicle || 'Vehicle'}</strong>.
                            Historical severity: <strong className="text-zinc-200">{warning.zone.severity}</strong>.
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
