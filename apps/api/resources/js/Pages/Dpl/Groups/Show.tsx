import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { StatusBadge } from '@/Components/UI';
import { Download, ScrollText } from 'lucide-react';

interface GroupMember {
  id: number;
  status: string;
  role: string;
  student: {
    nim: string;
    name: string;
    faculty_name: string;
    program_name: string;
  };
  nilai?: {
    id: number;
    is_finalized: boolean;
  } | null;
}

interface WorkProgram {
  id: number;
  title: string;
  status: string;
}

interface GroupDetail {
  id: number;
  code: string;
  name: string;
  status: string;
  is_grading_finalized?: boolean;
  capacity: number;
  period_name: string;
  village_name: string;
  address?: string | null;
  members: GroupMember[];
  work_programs: WorkProgram[];
  posko?: {
    latitude: number;
    longitude: number;
    photo_url: string;
    photo_name: string;
    updated_at?: string | null;
  } | null;
}

interface Props {
  group: GroupDetail;
}

export default function DplGroupShow({ group }: Props) {
  return (
    <AppLayout title={group.name}>
      <Head title={`Kelompok ${group.code}`} />

      <div className="space-y-8">
        <section className="rounded-lg border border-emerald-50/60 bg-white p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <Link
                  href="/dosen/groups"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Kembali ke daftar kelompok
                </Link>
              </div>
              <h1 className="mt-3 text-2xl font-semibold text-emerald-950">
                {group.name} <span className="text-emerald-950">({group.code})</span>
              </h1>
              <p className="mt-2 text-sm text-emerald-950">
                {group.period_name} · {group.village_name}
              </p>
              {group.address ? <p className="text-sm text-emerald-950">{group.address}</p> : null}
            </div>
            <StatusBadge status={group.status} />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  window.location.href = `/admin/certificates/bulk-download?kelompok_id=${group.id}`;
                }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-all font-semibold uppercase text-xs "
              >
                <ScrollText size={18} />
                Unduh sertifikat kelompok
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <div className="rounded-lg border border-emerald-50/60 bg-white p-6">
              <h2 className="text-lg font-semibold text-emerald-950">Anggota Kelompok</h2>
              <p className="mt-1 text-sm text-emerald-950">
                Kapasitas terisi {group.members.length} dari {group.capacity} mahasiswa.
              </p>
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-emerald-100/60">
                  <thead className="bg-emerald-50/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-950">
                        Mahasiswa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-950">
                        Fakultas
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-950">
                        Prodi
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-950">
                        Peran
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-950">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-950 pr-10">
                        Otoritas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100/60">
                    {group.members.length > 0 ? (
                      group.members.map((member) => (
                        <tr key={member.id}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-emerald-950">
                              {member.student.name}
                            </p>
                            <p className="text-xs text-emerald-950">{member.student.nim}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-emerald-950">
                            {member.student.faculty_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-emerald-950">
                            {member.student.program_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-emerald-950">
                            {member.role || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={member.status} />
                          </td>
                          <td className="px-4 py-3 text-right pr-10">
                            {member.nilai?.is_finalized && (
                              <a
                                href={`/certificates/${member.nilai.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-50/60 bg-white text-emerald-950 hover:text-emerald-600 hover:border-emerald-600 transition-all shadow-sm"
                                title="Unduh Sertifikat"
                              >
                                <Download size={16} />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-emerald-950">
                          Belum ada anggota terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-50/60 bg-white p-6">
              <h2 className="text-lg font-semibold text-emerald-950">Program Kerja</h2>
              <div className="mt-4 space-y-3">
                {group.work_programs.length > 0 ? (
                  group.work_programs.map((program) => (
                    <div
                      key={program.id}
                      className="flex items-center justify-between rounded-lg border border-emerald-50/60 bg-emerald-50/30 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-emerald-950">{program.title}</p>
                      </div>
                      <StatusBadge status={program.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-emerald-950">
                    Belum ada program kerja untuk kelompok ini.
                  </p>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-lg border border-emerald-50/60 bg-white p-6">
              <h2 className="text-lg font-semibold text-emerald-950">Data Posko</h2>
              {group.posko ? (
                <div className="mt-4 space-y-4">
                  <img
                    src={group.posko.photo_url}
                    alt="Foto posko"
                    className="h-56 w-full rounded-lg border border-emerald-50/60 object-cover"
                  />
                  <div className="rounded-lg border border-emerald-50/60 bg-emerald-50/30 p-4 text-sm text-emerald-950">
                    <p>Latitude: {group.posko.latitude}</p>
                    <p>Longitude: {group.posko.longitude}</p>
                    {group.posko.updated_at ? <p>Diperbarui: {group.posko.updated_at}</p> : null}
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${group.posko.latitude},${group.posko.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                  >
                    {' '}
                    Buka lokasi di Google Maps
                  </a>
                </div>
              ) : (
                <p className="mt-4 text-sm text-emerald-950">
                  Kelompok ini belum mengunggah data posko.
                </p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </AppLayout>
  );
}
