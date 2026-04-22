import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  ZoomControl,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Users, Navigation, Search, Info, Map as MapIcon, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix for Leaflet default icon issues with build tools
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom Emerald Marker Icon
const emeraldIcon = new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'emerald-marker'
});

// Helper component to recenter map
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface Group {
  id: number;
  nama: string;
  students_count: number;
}

interface Location {
  id: number;
  name: string;
  district: string;
  regency: string;
  latitude: number;
  longitude: number;
  address: string;
  groups: Group[];
}

interface Props {
  locations: Location[];
  config: {
    center: [number, number];
    zoom: number;
  };
}

export default function LocationsMap({ locations, config }: Props) {
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>(config.center);
  const [mapZoom, setMapZoom] = useState(config.zoom);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.regency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFlyTo = (loc: Location) => {
    setMapCenter([loc.latitude, loc.longitude]);
    setMapZoom(15);
    setActiveLocation(loc);
  };

  const totalGroups = locations.reduce((acc, loc) => acc + loc.groups.length, 0);

  return (
    <PublicLayout>
      <Head title="Peta Sebaran KKN" />

      <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-emerald-50">
        {/* Top Floating Header */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-4xl px-4">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-surface p-4 flex flex-col md:flex-row items-center gap-4 shadow-xl rounded-2xl"
          >
            <div className="flex items-center gap-3 pr-4 border-r border-emerald-100 hidden md:flex">
              <div className="p-2 bg-primary-100 rounded-lg text-primary-700">
                <MapIcon size={20} />
              </div>
              <div>
                <h1 className="text-sm font-bold text-emerald-950 uppercase tracking-wider">Sebaran KKN</h1>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">UIN SAIZU Purwokerto</p>
              </div>
            </div>

            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-emerald-400" />
              </div>
              <input
                type="text"
                placeholder="Cari desa, kecamatan, atau kabupaten..."
                className="block w-full pl-10 pr-4 py-2.5 border-emerald-100 focus:ring-primary-500 focus:border-primary-500 rounded-xl text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-1 bg-emerald-50 p-1 rounded-xl">
               <button 
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'map' ? 'bg-white text-primary-700 shadow-sm' : 'text-emerald-600 hover:text-emerald-800'
                }`}
               >
                 <MapIcon size={14} /> Peta
               </button>
               <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'list' ? 'bg-white text-primary-700 shadow-sm' : 'text-emerald-600 hover:text-emerald-800'
                }`}
               >
                 <Layers size={14} /> Daftar
               </button>
            </div>

            <div className="flex items-center gap-2 hidden md:flex pl-4 border-l border-emerald-100">
               <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                      SA
                    </div>
                 ))}
               </div>
               <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter ml-1">
                 {locations.length} Desa Terjangkau
               </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Results - Only in Map Mode */}
        {viewMode === 'map' && (
          <div className="absolute top-24 bottom-6 left-6 z-[1000] w-80 hidden lg:flex flex-col gap-4">
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="glass-surface p-4 flex-1 overflow-hidden flex flex-col rounded-2xl shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Hasil Pencarian</span>
                <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-[10px] font-bold">
                  {filteredLocations.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleFlyTo(loc)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      activeLocation?.id === loc.id 
                        ? 'bg-primary-50 border-primary-200 shadow-sm' 
                        : 'bg-white border-emerald-50 hover:border-primary-200 hover:shadow-md'
                    }`}
                  >
                    <h3 className="text-sm font-bold text-emerald-950 mb-1">{loc.name}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-tight mb-2">
                      <Navigation size={10} />
                      <span>{loc.district}, {loc.regency}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold">
                        <Users size={10} />
                        {loc.groups.length} Kelompok
                      </div>
                    </div>
                  </button>
                ))}
                
                {filteredLocations.length === 0 && (
                  <div className="py-8 text-center">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-emerald-300" />
                    </div>
                    <p className="text-xs text-emerald-500 font-medium">Tidak ada lokasi ditemukan</p>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="glass-surface p-4 bg-primary-600 text-white rounded-2xl shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <Info size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest opacity-80">Total Kelompok</div>
                  <div className="text-xl font-bold">{totalGroups} Kelompok Aktif</div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Content Area */}
        <div className="h-full w-full z-0 pt-24">
          {viewMode === 'map' ? (
            <div className="h-full w-full">
              <MapContainer 
                center={mapCenter} 
                zoom={mapZoom} 
                scrollWheelZoom={true}
                className="h-full w-full"
                zoomControl={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ZoomControl position="bottomright" />
                <ChangeView center={mapCenter} zoom={mapZoom} />

                {filteredLocations.map((loc) => (
                  <Marker 
                    key={loc.id} 
                    position={[loc.latitude, loc.longitude]}
                    icon={emeraldIcon}
                    eventHandlers={{
                      click: () => setActiveLocation(loc),
                    }}
                  >
                    <Popup className="premium-popup">
                      <div className="p-1 min-w-[200px]">
                        <div className="mb-2">
                          <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest block">Lokasi KKN</span>
                          <h3 className="text-sm font-bold text-emerald-950">{loc.name}</h3>
                          <p className="text-[10px] text-emerald-500 font-medium leading-tight">{loc.address || `${loc.district}, ${loc.regency}`}</p>
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t border-emerald-50">
                          {loc.groups.map(group => (
                            <div key={group.id} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-[8px] font-bold text-primary-700 shadow-sm">
                                    {group.nama.substring(0, 2).toUpperCase()}
                                </div>
                                <span className="text-[11px] font-bold text-emerald-900">{group.nama}</span>
                              </div>
                              <span className="text-[10px] font-medium text-emerald-600 bg-white px-1.5 py-0.5 rounded-md">
                                {group.students_count} Mhs
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3">
                          <Link 
                            href={route('public.locations', { search: loc.name })}
                            className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-primary-600 text-white rounded-lg text-[10px] font-bold hover:bg-primary-700 transition-colors"
                          >
                            Lihat Detail Desa
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto px-6 pb-20"
            >
              <div className="glass-surface rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto app-workspace">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th>Desa / Lokasi</th>
                        <th>Kecamatan</th>
                        <th>Kabupaten</th>
                        <th>Kelompok</th>
                        <th className="text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredLocations.map((loc) => (
                        <tr key={loc.id}>
                          <td>
                            <div className="font-bold text-emerald-950">{loc.name}</div>
                            <div className="text-[10px] text-emerald-500 font-medium">{loc.address || 'Alamat belum disetel'}</div>
                          </td>
                          <td>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg uppercase">
                              {loc.district}
                            </span>
                          </td>
                          <td>
                            <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg uppercase">
                              {loc.regency}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-primary-100 text-primary-700 rounded-lg">
                                <Users size={14} />
                              </div>
                              <span className="text-sm font-bold text-emerald-900">{loc.groups.length} Kelompok</span>
                            </div>
                          </td>
                          <td className="text-right">
                            <button 
                              onClick={() => {
                                setViewMode('map');
                                handleFlyTo(loc);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-primary-100 transition-all"
                            >
                              <MapPin size={14} /> Fokus Peta
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom Card for Mobile */}
        <AnimatePresence>
          {activeLocation && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-6 left-4 right-4 z-[1000] lg:hidden"
            >
              <div className="glass-surface p-4 rounded-2xl shadow-2xl relative">
                <button 
                  onClick={() => setActiveLocation(null)}
                  className="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg text-emerald-900"
                >
                  <Users size={20} />
                </button>
                <h3 className="text-lg font-bold text-emerald-950">{activeLocation.name}</h3>
                <p className="text-xs text-emerald-600 font-bold mb-4 uppercase">{activeLocation.district}, {activeLocation.regency}</p>
                
                <div className="grid grid-cols-2 gap-3">
                   {activeLocation.groups.map(group => (
                     <div key={group.id} className="p-2 bg-emerald-50 rounded-xl flex items-center gap-2">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-[10px] font-bold text-primary-700 shadow-sm shrink-0">
                          {group.nama.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-[10px] font-bold text-emerald-900 truncate">{group.nama}</div>
                          <div className="text-[8px] font-bold text-emerald-500 uppercase">{group.students_count} Mahasiswa</div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .emerald-marker {
          filter: hue-rotate(80deg) brightness(0.9) saturate(1.2);
        }
        .premium-popup .leaflet-popup-content-wrapper {
          border-radius: 1rem;
          padding: 0;
          box-shadow: 0 10px 25px -5px rgba(6, 78, 59, 0.1);
        }
        .premium-popup .leaflet-popup-content {
          margin: 0.5rem;
        }
        .leaflet-container {
          font-family: inherit;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1fae5;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a7f3d0;
        }
      `}</style>
    </PublicLayout>
  );
}
