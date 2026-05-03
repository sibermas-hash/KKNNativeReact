'use client';

import { useQuery } from '@tanstack/react-query';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function StudentDashboard() {
  const endpoints = studentEndpoints(api);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.student.dashboard,
    queryFn: async () => {
      const res = await endpoints.dashboard();
      return (res.data as { success: boolean; data: Record<string, unknown> }).data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const d = data as Record<string, unknown> | undefined;
  const registration = d?.registration as Record<string, unknown> | null | undefined;
  const group = registration?.group as Record<string, unknown> | null | undefined;
  const grade = d?.grade as Record<string, unknown> | null | undefined;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Laporan Harian</p>
          <p className="mt-1 text-3xl font-bold text-teal-600">{(d?.daily_report_count as number) || 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Program Kerja</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">{(d?.work_program_count as number) || 0}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Status Pendaftaran</p>
          <p className="mt-1 text-lg font-semibold capitalize text-slate-800">
            {registration?.status === 'approved' ? '✅ Disetujui' : registration?.status === 'pending' ? '⏳ Menunggu' : registration?.status === 'rejected' ? '❌ Ditolak' : 'Belum Mendaftar'}
          </p>
        </div>
      </div>

      {group && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Kelompok</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Nama Kelompok</p>
              <p className="text-sm font-medium">{(group.name as string) || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Kode</p>
              <p className="text-sm font-medium">{(group.code as string) || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Lokasi</p>
              <p className="text-sm font-medium">{((group.location as Record<string, unknown>)?.name as string) || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">DPL</p>
              <p className="text-sm font-medium">{((group.lecturer as Record<string, unknown>)?.name as string) || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {grade && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Nilai</h2>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-500">Total Skor</p>
              <p className="text-2xl font-bold text-teal-600">{(grade.score as number)?.toFixed(1) || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Grade</p>
              <p className="text-2xl font-bold text-amber-600">{(grade.letter as string) || '-'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link href="/mahasiswa/laporan-harian/buat" className="rounded-2xl bg-teal-600 p-4 text-center text-white shadow-sm transition hover:bg-teal-700">
          <p className="text-2xl">📋</p>
          <p className="mt-2 text-sm font-semibold">Buat Laporan</p>
        </Link>
        <Link href="/mahasiswa/program-kerja/buat" className="rounded-2xl bg-blue-600 p-4 text-center text-white shadow-sm transition hover:bg-blue-700">
          <p className="text-2xl">🎯</p>
          <p className="mt-2 text-sm font-semibold">Program Kerja</p>
        </Link>
        <Link href="/mahasiswa/izin/buat" className="rounded-2xl bg-amber-600 p-4 text-center text-white shadow-sm transition hover:bg-amber-700">
          <p className="text-2xl">✈️</p>
          <p className="mt-2 text-sm font-semibold">Ajukan Izin</p>
        </Link>
        <Link href="/mahasiswa/sertifikat" className="rounded-2xl bg-purple-600 p-4 text-center text-white shadow-sm transition hover:bg-purple-700">
          <p className="text-2xl">🎓</p>
          <p className="mt-2 text-sm font-semibold">Sertifikat</p>
        </Link>
      </div>
    </div>
  );
}
