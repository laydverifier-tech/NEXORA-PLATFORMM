import Link from 'next/link';
import { adminPage } from '@/lib/admin/context';
import { Forbidden } from '@/components/shared/forbidden';
import { AdminNav } from '@/components/admin/admin-nav';
import { Button } from '@/components/ui/button';
import { adminSignOut } from '../actions';

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const ctx = await adminPage('/admin/dashboard');
  if (!ctx) return <Forbidden />; // children are never rendered for non-staff
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[230px_1fr]">
      <aside className="border-b border-white/10 bg-ink-900 p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <Link href="/admin/dashboard" className="mb-4 block font-display text-xl font-black tracking-[0.3em]">NEXORA<span className="ml-2 text-[10px] tracking-wider2 text-gold">ADMIN</span></Link>
        <AdminNav />
        <div className="mt-4 hidden border-t border-white/10 pt-4 text-[10px] tracking-wider2 text-steel lg:block"><p className="truncate">{ctx.user.email}</p><p className="mt-1 text-emerald-400">● 2FA VERIFIED</p><Link href="/" className="mt-3 block hover:text-gold">← VIEW SITE</Link></div>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <span className="text-[10px] font-bold tracking-wider2 text-emerald-400 lg:hidden">● 2FA</span>
          <form action={adminSignOut} className="ml-auto"><Button variant="ghost" type="submit">LOGOUT</Button></form>
        </header>
        <div className="p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
