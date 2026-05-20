import { redirect } from 'next/navigation';

export default function PesertaKknAliasPage(): never {
  redirect('/admin/pendaftaran?status_group=processed');
}
