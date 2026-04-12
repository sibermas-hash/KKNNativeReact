import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
// @ts-expect-error - missing leaflet types
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location {
    id: number;
    name: string;
    lat: number;
    lng: number;
    members_count?: number;
    village: string;
}

interface Props {
    locations: Location[];
    className?: string;
}

export default function GisMap({ locations, className = "h-[400px] w-full rounded-[2rem] overflow-hidden shadow-sm border border-slate-100" }: Props) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return (
            <div className={`${className} bg-slate-50 flex items-center justify-center animate-pulse`}>
                <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-xs">Memuat Peta Sebaran...</p>
            </div>
        );
    }

    // Default center to Purwokerto (UIN SAIZU location area)
    const defaultCenter: [number, number] = [-7.4244, 109.2302];

    return (
        <div className={className}>
            <MapContainer 
                center={locations.length > 0 ? [locations[0].lat, locations[0].lng] : defaultCenter} 
                zoom={10} 
                className="w-full h-full z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {locations.filter(loc => loc.lat && loc.lng).map((loc) => (
                    <Marker key={loc.id} position={[loc.lat, loc.lng]}>
                        <Popup className="premium-popup">
                            <div className="p-2 space-y-2">
                                <h4 className="font-bold text-slate-900 uppercase tracking-tighter text-sm leading-none">{loc.name}</h4>
                                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{loc.village}</p>
                                <div className="pt-2 border-t border-slate-50 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{loc.members_count || 0} Mahasiswa</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
