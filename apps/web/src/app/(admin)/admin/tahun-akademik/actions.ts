'use server';

import { revalidatePath } from 'next/cache';
import { fetchApiAuthStrict, getAuthFetchErrorMessage } from '@/lib/server-api';

const PATH = '/admin/tahun-akademik';
const REVALIDATE = '/admin/tahun-akademik';

type TahunAkademikActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

export async function createTahunAkademik(year: string, is_active: boolean): Promise<TahunAkademikActionResult> {
  const result = await fetchApiAuthStrict<{ message?: string }>(PATH, {
    method: 'POST',
    body: JSON.stringify({ year, is_active }),
  });

  if (result.kind !== 'ok') {
    return { ok: false, message: getAuthFetchErrorMessage(result, 'Gagal menambahkan tahun akademik.') };
  }

  revalidatePath(REVALIDATE);

  return { ok: true, message: result.data?.message };
}

export async function toggleTahunAkademikStatus(
  id: number,
  year: string,
  is_active: boolean,
): Promise<TahunAkademikActionResult> {
  const result = await fetchApiAuthStrict<{ message?: string }>(`${PATH}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ year, is_active: !is_active }),
  });

  if (result.kind !== 'ok') {
    return { ok: false, message: getAuthFetchErrorMessage(result, 'Gagal memperbarui status tahun akademik.') };
  }

  revalidatePath(REVALIDATE);

  return { ok: true, message: result.data?.message };
}

export async function deleteTahunAkademik(id: number): Promise<TahunAkademikActionResult> {
  const result = await fetchApiAuthStrict<null>(`${PATH}/${id}`, { method: 'DELETE' });

  if (result.kind !== 'ok') {
    return { ok: false, message: getAuthFetchErrorMessage(result, 'Gagal menghapus tahun akademik.') };
  }

  revalidatePath(REVALIDATE);

  return { ok: true, message: 'Tahun akademik dihapus.' };
}
