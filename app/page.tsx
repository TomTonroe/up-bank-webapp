import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function Home() {
  // Always redirect to dashboard
  redirect('/dashboard');
}
