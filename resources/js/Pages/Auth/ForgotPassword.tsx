import { Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { MessageCircle, ShieldCheck } from 'lucide-react';

interface Props {
 status?: string;
 support_contact_label?: string;
 support_whatsapp_number?: string | null;
 support_whatsapp_link?: string | null;
}

export default function ForgotPassword({
 status,
 support_contact_label = 'Admin KKN / LPPM',
 support_whatsapp_number,
 support_whatsapp_link,
}: Props) {
 return (
 <GuestLayout title="Lupa Kata Sandi">
 <div className="space-y-4">
 <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800">
 <div className="flex items-start gap-3">
 <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
 <div>
 <p className="font-semibold">Penggantian kata sandi dilakukan melalui admin.</p>
 <p className="mt-1 text-emerald-700">
 Untuk keamanan, silakan hubungi {support_contact_label} melalui WhatsApp dan sertakan identitas akun Anda.
 </p>
 </div>
 </div>
 </div>

 {status && (
 <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
 {status}
 </div>
 )}

 <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700">
 <p className="font-semibold text-slate-900">Data yang perlu dikirim ke admin:</p>
 <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600">
 <li>Username, NIM, atau NIP yang digunakan untuk login</li>
 <li>Nama lengkap</li>
 <li>Fakultas / Program Studi atau unit kerja</li>
 <li>Alasan permintaan penggantian kata sandi</li>
 </ul>
 {support_whatsapp_number && (
 <p className="mt-4 text-xs font-medium text-slate-500">
 Nomor WhatsApp admin: <span className="font-semibold text-slate-700">{support_whatsapp_number}</span>
 </p>
 )}
 </div>

 {support_whatsapp_link ? (
 <a
 href={support_whatsapp_link}
 target="_blank"
 rel="noreferrer"
 className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white transition hover:bg-emerald-700"
 >
 <MessageCircle className="h-4 w-4" />
 Hubungi Admin via WhatsApp
 </a>
 ) : (
 <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
 Nomor WhatsApp admin belum dikonfigurasi. Silakan hubungi admin/LPPM melalui kanal resmi kampus.
 </div>
 )}

 <div className="text-center">
 <Link href="/login" className="text-sm text-emerald-600 hover:text-emerald-700">
 ← Kembali ke halaman masuk
 </Link>
 </div>
 </div>
 </GuestLayout>
 );
}
