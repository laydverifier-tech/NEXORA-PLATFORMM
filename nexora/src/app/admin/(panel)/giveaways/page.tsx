import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { ButtonLink } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LocalTime } from '@/components/shared/local-time';

export default async function GiveawaysAdmin() {
  const ctx = await adminPage('/admin/giveaways'); if (!ctx) notFound();
  const { data } = await ctx.supabase.from('giveaways').select('id,title,status,prize,entries_count,ends_at').order('created_at', { ascending: false });
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">GIVEAWAYS</h1><ButtonLink href="/admin/giveaways/new">+ NEW</ButtonLink></div>
      <ul className="divide-y divide-white/10 border border-white/10">{(data ?? []).map((g) => <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><Link href={`/admin/giveaways/${g.id}`} className="font-bold hover:text-gold">{g.title} <span className="text-steel">· {g.prize}</span></Link><span className="flex items-center gap-3 text-xs text-steel">{g.entries_count} entries · ends <LocalTime iso={g.ends_at} /><StatusBadge status={String(g.status)} /></span></li>)}</ul>
      {!data?.length && <p className="text-sm text-steel">No giveaways yet.</p>}
    </main>
  );
}
