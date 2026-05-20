import { redirect } from 'next/navigation';

export default function WawancaraAliasPage(): never {
  redirect('/admin/pendaftaran?status_group=unprocessed');
}
