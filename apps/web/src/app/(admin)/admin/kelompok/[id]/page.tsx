'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rawApi } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Users, GraduationCap, Briefcase, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

type Mahasiswa = {
  id?: number;
  nim?: string;
  nama?: string;
  gender?: string;
  fakultas?: { id: number; nama?: string; name?: string } | null;
  prodi?: { id: number; nama?: string; name?: string } | null;
  ipk?: number | string;
  gpa?: number | string;
  sks?: number;
  semester?: number;
  alamat?: string;
  origin_regency?: string;
  phone?: string;
  no_hp?: string;
};

type Member = {
  id: number;
  role?: string;
  status?: string;
  mahasiswa?: Mahasiswa;
};

type Dosen = {
  id: number;
  nama?: string;
  nip?: string;
  no_hp?: string;
  email?: string;
  fakultas?: { nama?: string; name?: string } | null;
};

type KelompokDetail = {
  id: number;
  code?: string;
  nama_kelompok?: string;
  capacity?: number;
  peserta_count?: number;
  lokasi?: {
    id?: number;
    village_name?: string;
    district_name?: string;
    regency_name?: string;
    full_name?: string;
    address?: string;
    latitude?: string | number | null;
    longitude?: string | number | null;
    capacity?: number;
  };
  periode?: { id: number; name?: string; periode?: string };
  dosen?: Dosen[];
  members?: Member[];
  peserta?: Member[];
};

export default function KelompokDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'kelompok', Number(id)],
    queryFn: async () => {
      const res = await rawApi.get(`/admin/kelompok/${id}`);
      const body = (res.data as { data?: KelompokDetail }).data ?? (res.data as KelompokDetail);
      return body;
    },
    enabled: !!id,
  });

  const members: Member[] = useMemo(() => data?.members ?? data?.peserta ?? [], [data]);

  const stats = useMemo(() => {
    if (!members.length) return null;
    const male = members.filter((m) => m.mahasiswa?.gender === 'L').length;
    const female = members.filter((m) => m.mahasiswa?.gender === 'P').length;
    const malePct = members.length > 0 ? Math.round((male / members.length) * 1000) / 10 : 0;
    const fakSet = new Set<string>();
    const prodiSet = new Set<string>();
    const originSet: Record<string, number> = {};
    let gpaSum = 0;
    let gpaCount = 0;
    let sksSum = 0;
    let sksCount = 0;
    members.forEach((m) => {
      const mh = m.mahasiswa;
      if (mh?.fakultas) fakSet.add(mh.fakultas.nama ?? mh.fakultas.name ?? '');
      if (mh?.prodi) prodiSet.add(mh.prodi.nama ?? mh.prodi.name ?? '');
      const origin = mh?.origin_regency;
      if (origin) originSet[origin] = (originSet[origin] ?? 0) + 1;
      const gpa = Number(mh?.ipk ?? mh?.gpa ?? 0);
      if (gpa > 0) {
        gpaSum += gpa;
        gpaCount++;
      }
      const sks = Number(mh?.sks ?? 0);
      if (sks > 0) {
        sksSum += sks;
        sksCount++;
      }
    });
    return {
      male,
      female,
      malePct,
      fakultasCount: fakSet.size,
      prodiCount: prodiSet.size,
      avgGpa: gpaCount > 0 ? Math.round((gpaSum / gpaCount) * 100) / 100 : 0,
      avgSks: sksCount > 0 ? Math.round(sksSum / sksCount) : 0,
      origins: originSet,
    };
  }, [members]);

  const compliance = useMemo(() => {
    if (!stats || !data) return null;
    const total = members.length;
    return {
      h1: stats.fakultasCount >= 2,
      h2: total >= 14 && total <= 16,
      h3: stats.fakultasCount >= 2,
      h4: stats.prodiCount >= 3,
      s1: stats.malePct >= 20 && stats.malePct <= 35,
      total,
    };
  }, [stats, data, members.length]);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          Kelompok tidak ditemukan atau gagal dimuat.
        </div>
        <Link href="/admin/kelompok" className="inline-flex items-center gap-2 mt-4 text-cyan-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
      </div>
    );
  }

  const dpl = data.dosen?.[0];

  return (
    <div className="space-y-6 p-6">
      <Link href="/admin/kelompok" className="inline-flex items-center gap-2 text-sm text-cyan-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Daftar Kelompok
      </Link>

      <div className="rounded-2xl border bg-gradient-to-br from-cyan-50 to-teal-50 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-bold text-cyan-700 uppercase">{data.code}</p>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{data.nama_kelompok}</h1>
            {data.periode && <p className="text-sm text-slate-600 mt-1">{data.periode.name ?? data.periode.periode}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase">Anggota</p>
            <p className="text-3xl font-black text-cyan-700">
              {members.length}
              {data.capacity && <span className="text-base text-slate-400 font-bold">/{data.capacity}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Quick info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
            <MapPin className="h-3.5 w-3.5" /> Lokasi Penempatan
          </div>
          {data.lokasi ? (
            <>
              <p className="font-bold text-slate-900">{data.lokasi.village_name}</p>
              <p className="text-sm text-slate-600">
                Kec. {data.lokasi.district_name}, Kab. {data.lokasi.regency_name}
              </p>
              {data.lokasi.address && <p className="text-xs text-slate-500 mt-1">{data.lokasi.address}</p>}
              {data.lokasi.latitude && data.lokasi.longitude && (
                <p className="text-xs text-slate-500 mt-1 font-mono">
                  {Number(data.lokasi.latitude).toFixed(4)}, {Number(data.lokasi.longitude).toFixed(4)}
                </p>
              )}
            </>
          ) : (
            <p className="text-amber-700 text-sm">Belum ada lokasi penempatan</p>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
            <GraduationCap className="h-3.5 w-3.5" /> Dosen Pembimbing Lapangan
          </div>
          {dpl ? (
            <>
              <p className="font-bold text-slate-900">{dpl.nama}</p>
              {dpl.nip && <p className="text-xs text-slate-500 font-mono">NIP {dpl.nip}</p>}
              {dpl.fakultas && <p className="text-sm text-slate-600">{dpl.fakultas.nama ?? dpl.fakultas.name}</p>}
              {dpl.no_hp && <p className="text-xs text-slate-500 mt-1">📱 {dpl.no_hp}</p>}
              {dpl.email && <p className="text-xs text-slate-500">✉️ {dpl.email}</p>}
            </>
          ) : (
            <p className="text-amber-700 text-sm">Belum ada DPL ditugaskan</p>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase mb-2">
            <Briefcase className="h-3.5 w-3.5" /> Statistik Kelompok
          </div>
          {stats ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">L / P</span>
                <span className="font-bold">
                  {stats.male}L / {stats.female}P ({stats.malePct}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Fakultas</span>
                <span className="font-bold">{stats.fakultasCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Prodi</span>
                <span className="font-bold">{stats.prodiCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rata IPK</span>
                <span className="font-bold">{stats.avgGpa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rata SKS</span>
                <span className="font-bold">{stats.avgSks}</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Belum ada anggota</p>
          )}
        </div>
      </div>

      {/* Constraint compliance */}
      {compliance && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-500 mb-3">Validasi Constraint Plotting KKN Reguler</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <ConstraintItem label="H2 Ukuran (14-16)" pass={compliance.h2} actual={`${compliance.total} anggota`} />
            <ConstraintItem label="H3 ≥2 Fakultas" pass={compliance.h3} actual={`${stats?.fakultasCount ?? 0} fakultas`} />
            <ConstraintItem label="H4 ≥3 Prodi" pass={compliance.h4} actual={`${stats?.prodiCount ?? 0} prodi`} />
            <ConstraintItem label="S1 Gender 20-35%" pass={compliance.s1} actual={`${stats?.malePct ?? 0}%`} />
            <ConstraintItem label="Lokasi Tersedia" pass={!!data.lokasi} actual={data.lokasi ? 'Ada' : 'Belum'} />
          </div>
        </div>
      )}

      {/* Origin distribution */}
      {stats && Object.keys(stats.origins).length > 0 && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase text-slate-500 mb-3">Distribusi Asal Mahasiswa</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.origins)
              .sort(([, a], [, b]) => b - a)
              .map(([origin, count]) => (
                <span key={origin} className="rounded-full bg-cyan-50 border border-cyan-200 px-3 py-1 text-xs">
                  <b className="text-cyan-900">{origin}</b>
                  <span className="text-cyan-700 ml-1">×{count}</span>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Members table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b p-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-600" />
          <h2 className="font-black text-slate-900">Anggota Kelompok ({members.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr className="border-b">
                <th className="px-4 py-2 font-bold text-slate-600">No</th>
                <th className="px-4 py-2 font-bold text-slate-600">NIM</th>
                <th className="px-4 py-2 font-bold text-slate-600">Nama</th>
                <th className="px-4 py-2 font-bold text-slate-600">Gender</th>
                <th className="px-4 py-2 font-bold text-slate-600">Fakultas</th>
                <th className="px-4 py-2 font-bold text-slate-600">Prodi</th>
                <th className="px-4 py-2 font-bold text-slate-600">IPK</th>
                <th className="px-4 py-2 font-bold text-slate-600">Asal</th>
                <th className="px-4 py-2 font-bold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    Belum ada anggota
                  </td>
                </tr>
              )}
              {members.map((m, i) => {
                const mh = m.mahasiswa;
                return (
                  <tr key={m.id ?? i} className="border-b hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-2 font-mono text-xs">{mh?.nim ?? '-'}</td>
                    <td className="px-4 py-2 font-medium text-slate-900">{mh?.nama ?? '-'}</td>
                    <td className="px-4 py-2">
                      {mh?.gender === 'L' ? (
                        <span className="rounded bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-bold border border-blue-200">L</span>
                      ) : mh?.gender === 'P' ? (
                        <span className="rounded bg-pink-50 text-pink-700 px-2 py-0.5 text-xs font-bold border border-pink-200">P</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600">{mh?.fakultas?.nama ?? mh?.fakultas?.name ?? '-'}</td>
                    <td className="px-4 py-2 text-xs text-slate-600">{mh?.prodi?.nama ?? mh?.prodi?.name ?? '-'}</td>
                    <td className="px-4 py-2 text-slate-700">{mh?.ipk ?? mh?.gpa ?? '-'}</td>
                    <td className="px-4 py-2 text-xs text-slate-600">{mh?.origin_regency ?? '-'}</td>
                    <td className="px-4 py-2">
                      {m.status === 'approved' ? (
                        <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-bold border border-emerald-200">
                          Approved
                        </span>
                      ) : m.status === 'pending' ? (
                        <span className="rounded bg-amber-50 text-amber-700 px-2 py-0.5 text-xs font-bold border border-amber-200">
                          Pending
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">{m.status ?? '-'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ConstraintItem({ label, pass, actual }: { label: string; pass: boolean; actual: string }) {
  return (
    <div
      className={
        'rounded-lg border p-2 ' + (pass ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50')
      }
    >
      <div className="flex items-center gap-1.5">
        {pass ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        )}
        <span className={'text-xs font-bold ' + (pass ? 'text-emerald-900' : 'text-amber-900')}>{label}</span>
      </div>
      <p className={'text-xs mt-0.5 ' + (pass ? 'text-emerald-700' : 'text-amber-700')}>{actual}</p>
    </div>
  );
}
