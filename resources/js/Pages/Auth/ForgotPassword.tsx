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
            <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-black">
                                Penggantian kata sandi dilakukan melalui admin.
                            </p>
                            <p className="text-sm text-gray-700 mt-1">
                                Hubungi {support_contact_label} melalui WhatsApp dan sertakan
                                identitas akun Anda.
                            </p>
                        </div>
                    </div>
                </div>

                {status && (
                    <div className="bg-emerald-50 rounded-lg p-3 text-sm font-medium text-gray-700">
                        {status}
                    </div>
                )}

                <div className="bg-white border border-gray-200/60 rounded-lg p-5">
                    <p className="font-medium text-black">Data yang perlu dikirim ke admin:</p>
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-gray-900">
                        <li>Username, NIM, atau NIP yang digunakan untuk login</li>
                        <li>Nama lengkap</li>
                        <li>Fakultas / Program Studi atau unit kerja</li>
                        <li>Alasan permintaan penggantian kata sandi</li>
                    </ul>
                    {support_whatsapp_number && (
                        <p className="mt-4 text-sm text-gray-900">
                            Nomor WhatsApp admin:{' '}
                            <span className="font-medium text-gray-700">
                                {support_whatsapp_number}
                            </span>
                        </p>
                    )}
                </div>

                {support_whatsapp_link ? (
                    <a
                        href={support_whatsapp_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700"
                    >
                        <MessageCircle className="h-5 w-5" />
                        Hubungi Admin via WhatsApp
                    </a>
                ) : (
                    <div className="bg-emerald-50/30 border border-gray-200/60 rounded-lg px-4 py-3 text-sm text-gray-900">
                        Nomor WhatsApp admin belum dikonfigurasi. Silakan hubungi admin/LPPM melalui
                        kanal resmi kampus.
                    </div>
                )}

                <div className="text-center">
                    <Link href="/login" className="text-sm text-emerald-600 hover:text-gray-700">
                        ← Kembali ke halaman masuk
                    </Link>
                </div>
            </div>
        </GuestLayout>
    );
}
