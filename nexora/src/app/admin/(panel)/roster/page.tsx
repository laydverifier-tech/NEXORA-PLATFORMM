import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { initials, isSafeHttpsUrl } from '@/lib/utils/format';

export default async function RosterAdmin() {
  const ctx = await adminPage('/admin/roster'); if (!ctx) notFound();
  const { data } = await ctx.supabase.from('roster_members').select('id,nickname,role_label,image_url,is_active,sort_order').order('sort_order');
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">ROSTER</h1><ButtonLink href="/admin/roster/new">+ ADD PLAYER</ButtonLink></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(data ?? []).map((p) => (
        <Link key={p.id} href={`/admin/roster/${p.id}`} className="group border border-white/10 bg-ink-800/80 hover:border-gold/60">
          <div className="aspect-[4/5] bg-ink-900">{isSafeHttpsUrl(p.image_url) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center font-display text-6xl font-black text-white/10">{initials(p.nickname)}</div>}</div>
          <div className="flex items-center justify-between p-3"><div><p className="font-bold">{p.nickname}</p><p className="text-[10px] tracking-wider2 text-gold">{p.role_label ?? '—'}</p></div>{!p.is_active && <Badge>HIDDEN</Badge>}</div>
        </Link>))}</div>
      {!data?.length && <p className="text-sm text-steel">No players yet.</p>}
    </main>
  );
}
