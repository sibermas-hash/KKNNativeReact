import { redirect } from 'next/navigation';

// /admin route is handled by (hub) group - this prevents double rendering
export default function AdminIndex() {
  redirect('/admin');
}
