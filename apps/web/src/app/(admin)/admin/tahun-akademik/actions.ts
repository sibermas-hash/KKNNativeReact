'use server';

import { revalidatePath } from 'next/cache';
import { fetchApiAuth } from '@/lib/server-api';

const PATH = '/admin/tahun-akademik';
const REVALIDATE = '/admin/tahun-akademik';

export async function createTahunAkademik(year: string, is_active: boolean) {
  const res = await fetchApiAuth(PATH, {
    method: 'POST',
    body: JSON.stringify({ year, is_active }),
  });
  revalidatePath(REVALIDATE);
  return res;
}

export async function toggleTahunAkademikStatus(id: number, year: string, is_active: boolean) {
  await fetchApiAuth(`${PATH}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ year, is_active: !is_active }),
  });
  revalidatePath(REVALIDATE);
}

export async function deleteTahunAkademik(id: number) {
  await fetchApiAuth(`${PATH}/${id}`, { method: 'DELETE' });
  revalidatePath(REVALIDATE);
}
