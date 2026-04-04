import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';

export default function TacticalDashboard() {
    return (
        <AppLayout title="Dashboard Alternatif">
            <Head title="Dashboard Alternatif" />
            <div className="p-8 text-center text-slate-500">
                <p>Halaman ini sudah digantikan oleh Dashboard utama.</p>
            </div>
        </AppLayout>
    );
}
