import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { safeRedirectPath } from '@/lib/utils/safe-redirect';
import { LoginForm } from './login-form';

export const metadata = { title: 'Admin login', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeRedirectPath(searchParams.next, '/admin/dashboard');
  const { data: { user } } = await createClient().auth.getUser();
  if (user) redirect(next.startsWith('/admin') ? next : '/admin/dashboard'); // the panel re-checks role + 2FA
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm border border-white/10 bg-ink-800/80 p-8">
        <p className="font-display text-3xl font-black tracking-[0.3em]">NEXORA</p>
        <p className="mt-1 text-[10px] font-bold tracking-wider2 text-gold">ADMIN CONSOLE · 2-STEP LOGIN</p>
        <div className="mt-8"><LoginForm next={next} /></div>
        <p className="mt-6 text-[11px] text-steel">Staff only. Every sign-in requires your authenticator app.</p>
      </div>
    </main>
  );
}
