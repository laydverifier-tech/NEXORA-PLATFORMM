import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { ButtonLink } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalTime } from '@/components/shared/local-time';

export default async function NewsAdmin() {
  const ctx = await adminPage('/admin/news'); if (!ctx) notFound();
  const { data } = await ctx.supabase.from('news').select('id,title,category,is_published,published_at,created_at').order('created_at', { ascending: false });
  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">NEWS</h1><ButtonLink href="/admin/news/new">+ NEW ARTICLE</ButtonLink></div>
      <ul className="divide-y divide-white/10 border border-white/10">{(data ?? []).map((n) => <li key={n.id} className="flex items-center justify-between gap-3 p-4"><Link href={`/admin/news/${n.id}`} className="font-bold hover:text-gold">{n.title}</Link><span className="flex items-center gap-3 text-xs text-steel">{n.category && <Badge>{n.category}</Badge>}<Badge tone={n.is_published ? 'success' : 'neutral'}>{n.is_published ? 'PUBLISHED' : 'DRAFT'}</Badge><LocalTime iso={n.published_at ?? n.created_at} withTime={false} /></span></li>)}</ul>
      {!data?.length && <p className="text-sm text-steel">No articles yet.</p>}
    </main>
  );
}
