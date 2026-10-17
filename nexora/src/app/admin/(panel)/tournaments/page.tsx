import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { StatusBadge } from '@/components/ui/status-badge';
import { ButtonLink } from '@/components/ui/button';
import { LocalTime } from '@/components/shared/local-time';
import { euro } from '@/lib/utils/format';

export default async function TournamentsAdmin() {
  const ctx = await adminPage('/admin/tournaments'); if (!ctx) notFound();
  const { data } = await ctx.supabase.from('tournaments').select('id,name,slug,status,prize_pool,max_teams,registration_end').order('created_at', { ascending: false });
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">TOURNAMENTS</h1><ButtonLink href="/admin/tournaments/new">+ NEW</ButtonLink></div>
      <div className="overflow-x-auto border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-ink-800 text-[10px] tracking-wider2 text-steel"><tr><th className="p-3">NAME</th><th className="p-3">STATUS</th><th className="p-3">PRIZE</th><th className="p-3">SLOTS</th><th className="p-3">REG. CLOSES</th><th className="p-3" /></tr></thead>
        <tbody className="divide-y divide-white/10">{(data ?? []).map((t) => <tr key={t.id}><td className="p-3 font-bold">{t.name}</td><td className="p-3"><StatusBadge status={String(t.status)} /></td><td className="p-3">{euro(t.prize_pool)}</td><td className="p-3">{t.max_teams}</td><td className="p-3 text-xs"><LocalTime iso={t.registration_end} /></td><td className="p-3 text-right"><Link className="text-gold hover:underline" href={`/admin/tournaments/${t.id}`}>EDIT</Link></td></tr>)}</tbody></table>
        {!data?.length && <p className="p-6 text-sm text-steel">No tournaments yet.</p>}</div>
    </main>
  );
}
