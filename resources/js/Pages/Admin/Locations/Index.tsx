import { useState, useEffect } from 'react';
import { useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button, FormInput, FormTextarea, ConfirmDialog, Pagination } from '@/Components/ui';
import type { PageProps, Location } from '@/types';
import type { PaginationMeta } from '@/Components/UI/Pagination';
import {
    MapIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    UsersIcon,
    GlobeAltIcon,
    ShieldExclamationIcon
} from '@heroicons/react/24/outline';

interface Props extends PageProps {
    locations: {
        data: Location[];
        links: any[];
        meta: PaginationMeta;
    };
    filters: {
        search?: string;
    };
}

export default function LocationsIndex({ locations, filters }: Props) {
    const [editing, setEditing] = useState<Location | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [deleting, setDeleting] = useState<Location | null>(null);
    const [search, setSearch] = useState(filters.search || '');

    const form = useForm({
        village_name: '',
        address: '',
        latitude: '',
        longitude: '',
        capacity: '20',
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get('/admin/locations', { search }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/admin/locations/${editing.id}`, {
                onSuccess: () => { setEditing(null); setShowForm(false); form.reset(); },
            });
        } else {
            form.post('/admin/locations', {
                onSuccess: () => { setShowForm(false); form.reset(); },
            });
        }
    }

    function startEdit(l: Location) {
        setEditing(l);
        setShowForm(true);
        form.setData({
            village_name: l.village_name,
            address: l.address ?? '',
            latitude: l.latitude ? String(l.latitude) : '',
            longitude: l.longitude ? String(l.longitude) : '',
            capacity: String(l.capacity),
        });
    }

    function cancelForm() {
        setEditing(null);
        setShowForm(false);
        form.reset();
    }

    const deleteForm = useForm({});

    return (
        <AppLayout title="Tactical Map Registry">
            <div className="space-y-12 pb-16 animate-in fade-in duration-1000">
                {/* Elite Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-white/5 relative">
                    <div className="absolute -left-12 top-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="px-3 py-1 rounded-full bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[10px] font-black uppercase tracking-[0.3em]">GEOGRAPHICAL DEPLOYMENT</div>
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-light animate-pulse" />
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic line-height-1">
                            Tactical <span className="text-accent-gold text-glow-gold">Map</span>
                        </h1>
                        <p className="text-white/40 text-sm mt-4 font-medium uppercase tracking-[0.15em]">Registry of mission-approved geographical coordinates and field sectors.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-6 py-3 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col items-center">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">MAPPED SECTORS</span>
                            <span className="text-xl font-black text-white mt-1">{locations.meta?.total || 0}</span>
                        </div>
                        {!showForm && (
                            <button onClick={() => setShowForm(true)} className="group flex items-center gap-3 px-8 py-5 bg-gradient-to-br from-primary to-primary-dark text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border border-white/10 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <PlusIcon className="w-5 h-5 text-accent-gold" />
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">REGISTER SECTOR</span>
                            </button>
                        )}
                    </div>
                </div>

                {showForm && (
                    <div className="p-10 glass rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none text-white">
                            <GlobeAltIcon className="h-48 w-48 rotate-12" />
                        </div>

                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-accent-gold/10 text-accent-gold border border-accent-gold/20 shadow-xl">
                                    {editing ? <PencilSquareIcon className="h-6 w-6" /> : <PlusIcon className="h-6 w-6" />}
                                </div>
                                {editing ? 'Recalibrate Sector' : 'Initialize New Sector'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">SECTOR NOMENCLATURE (VILLAGE)</label>
                                    <FormInput
                                        placeholder="E.G. DESA KARANGSALAM"
                                        value={form.data.village_name}
                                        onChange={(e) => form.setData('village_name', e.target.value)}
                                        className="bg-black/40 border-white/10 text-xs font-black tracking-widest text-white h-14 rounded-2xl focus:border-accent-gold/50"
                                        required
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">SCHOLAR CAPACITY</label>
                                    <FormInput
                                        type="number"
                                        placeholder="E.G. 20"
                                        value={form.data.capacity}
                                        onChange={(e) => form.setData('capacity', e.target.value)}
                                        className="bg-black/40 border-white/10 text-xs font-black tracking-widest text-accent-gold h-14 rounded-2xl focus:border-accent-gold/50"
                                        required
                                    />
                                </div>
                                <div className="col-span-full space-y-2.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">STRATEGIC ADDRESS</label>
                                    <FormTextarea
                                        placeholder="ENTER FULL SYSTEM ADDRESS..."
                                        value={form.data.address}
                                        onChange={(e) => form.setData('address', e.target.value)}
                                        rows={3}
                                        className="bg-black/40 border-white/10 text-xs font-medium tracking-widest text-white/60 p-5 rounded-2xl focus:border-accent-gold/50"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 italic">TEL-COORDINATE: LATITUDE</label>
                                    <FormInput
                                        type="number"
                                        step="any"
                                        placeholder="-7.4245"
                                        value={form.data.latitude}
                                        onChange={(e) => form.setData('latitude', e.target.value)}
                                        className="bg-black/40 border-white/10 text-xs font-mono text-white/50 h-12 rounded-xl"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1 italic">TEL-COORDINATE: LONGITUDE</label>
                                    <FormInput
                                        type="number"
                                        step="any"
                                        placeholder="109.2312"
                                        value={form.data.longitude}
                                        onChange={(e) => form.setData('longitude', e.target.value)}
                                        className="bg-black/40 border-white/10 text-xs font-mono text-white/50 h-12 rounded-xl"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                                <button type="submit" disabled={form.processing} className="px-12 py-5 bg-gradient-to-br from-primary to-primary-dark text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all border border-white/10">
                                    {editing ? 'COMMIT RECALIBRATION' : 'AUTHORIZE INITIATION'}
                                </button>
                                <button type="button" onClick={cancelForm} className="px-8 py-5 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                    ABORT
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Registry Ledger (Table) */}
                <div className="space-y-8">
                    <div className="relative group max-w-xl">
                        <MagnifyingGlassIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20 group-focus-within:text-accent-gold transition-colors" />
                        <input
                            placeholder="SCAN MAPPED SECTORS..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-16 pr-8 py-5 bg-white/[0.02] border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white outline-none focus:border-accent-gold/40 shadow-2xl transition-all"
                        />
                    </div>

                    <div className="bg-white/[0.02] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden backdrop-blur-xxl relative">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none text-white">
                            <MapIcon className="h-64 w-64" />
                        </div>
                        <div className="overflow-x-auto relative z-10">
                            <table className="min-w-full divide-y divide-white/5">
                                <thead className="bg-white/[0.02]">
                                    <tr>
                                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Sector Identity</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Strategic Address</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Coordinates</th>
                                        <th className="px-8 py-6 text-left text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-center">Unit Capacity</th>
                                        <th className="px-8 py-6 text-right text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Control</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                    {locations.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-24 text-center">
                                                <div className="flex flex-col items-center">
                                                    <MapPinIcon className="h-12 w-12 text-white/5 mb-4" />
                                                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] italic">No tactical sectors detected in central maps.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        locations.data.map((l) => (
                                            <tr key={l.id} className="group hover:bg-white/[0.04] transition-all duration-300">
                                                <td className="px-8 py-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 rounded-xl bg-primary/10 text-primary-light border border-primary/20 shadow-xl group-hover:rotate-12 transition-all">
                                                            <MapPinIcon className="h-5 w-5" />
                                                        </div>
                                                        <span className="text-base font-black text-white tracking-widest uppercase italic group-hover:text-accent-gold transition-colors leading-none">{l.village_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-10">
                                                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest line-clamp-1 max-w-xs">{l.address || 'UNDEFINED'}</span>
                                                </td>
                                                <td className="px-8 py-10">
                                                    <div className="flex items-center gap-2 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-lg w-fit">
                                                        <GlobeAltIcon className="h-3 w-3 text-accent-gold" />
                                                        <span className="text-[10px] text-white/20 font-mono tracking-tighter">
                                                            {l.latitude && l.longitude ? `${l.latitude}, ${l.longitude}` : 'NO TELEMETRY'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-10 text-center">
                                                    <div className="inline-flex items-center gap-3 group-hover:scale-110 transition-transform">
                                                        <span className="text-xl font-black text-white tabular-nums italic leading-none">{l.capacity}</span>
                                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">UNITS</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-10 text-right">
                                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                        <button onClick={() => startEdit(l)} className="p-3 rounded-xl bg-white/5 border border-white/5 text-white/40 hover:text-accent-gold hover:bg-white/10 transition-all">
                                                            <PencilSquareIcon className="h-5 w-5" />
                                                        </button>
                                                        <button onClick={() => setDeleting(l)} className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all">
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {locations.meta && (
                            <div className="px-8 py-6 bg-white/[0.01] border-t border-white/5">
                                <Pagination meta={locations.meta} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => { if (deleting) deleteForm.delete(`/admin/locations/${deleting.id}`, { onSuccess: () => setDeleting(null) }); }}
                title="WIPE TACTICAL SECTOR"
                message={`CRITICAL: TERMINATING SECTOR "${deleting?.village_name}" WILL REMOVE ALL GEOGRAPHICAL DATA FROM THE REGISTRY. PROCEED?`}
                processing={deleteForm.processing}
                confirmLabel="CONFIRM WIPE"
            />
        </AppLayout>
    );
}
