import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with React
// @ts-expect-error - missing leaflet types
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Props {
  lat: number;
  lng: number;
  label?: string;
  zoom?: number;
  height?: string;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function GeotaggingMap({
  lat,
  lng,
  label = 'Lokasi Laporan',
  zoom = 15,
  height = '300px',
}: Props) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted)
    return (
      <div style={{ height, backgroundColor: '#f8fafc' }} className="rounded-2xl animate-pulse" />
    );

  const position: [number, number] = [lat, lng];

  return (
    <div
      className="relative w-full overflow-hidden rounded-[2rem] border border-emerald-100 shadow-xl group/map"
      style={{ height }}
    >
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <ChangeView center={position} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="p-2 text-center">
              <p className="text-[12px] font-bold uppercase tracking-widest text-emerald-600 mb-1">
                Geotagging Verified
              </p>
              <p className="text-xs font-bold text-black uppercase ">{label}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Tactical Overlay */}
      <div className="absolute top-4 right-4 z-[1000] px-4 py-2 bg-emerald-600/90 backdrop-blur-md border border-emerald-500/30 text-white text-xs font-bold uppercase tracking-[0.2em] shadow-2xl pointer-events-none group-hover/map:opacity-0 transition-opacity">
        TERMINAL DATA SPASIAL v4.0
      </div>
    </div>
  );
}
