import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocalTime } from '@/components/shared/local-time';
import { ASSIGNABLE_ROLES } from '@/lib/validation/admin2';
import { setRole } from './actions';

export default async function UsersAdmin() {
  const ctx = await adminPage('/admin/users'); if (!ctx) notFound();
  const isCeo = ctx.roles.includes('SUPER_ADMIN');
  const { data } = await ctx.supabase.from('profiles').select('id,username,display_name,role,created_at').order('created_at').limit(300);
  return (
    <main className="max-w-4xl space-y-6">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">USERS & ROLES</h1>
      <p className="text-xs text-steel">{isCeo ? 'Only the CEO can change roles. Staff roles require their own 2-step login.' : 'Read-only: only the CEO can change roles.'}</p>
      <ul className="divide-y divide-white/10 border border-white/10">{(data ?? []).map((u) => (
        <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-bold">{u.display_name ?? u.username}</p><p className="text-xs text-steel">@{u.username} · <LocalTime iso={u.created_at} withTime={false} /></p></div>
          <div className="flex items-center gap-3"><Badge tone={u.role === 'CEO' ? 'gold' : 'neutral'}>{String(u.role)}</Badge>
            {isCeo && u.role !== 'CEO' && u.id !== ctx.user.id && <form action={setRole} className="flex items-center gap-2"><input type="hidden" name="id" value={u.id} /><select name="role" defaultValue={String(u.role)} aria-label={`Role for ${u.username}`} className="border border-white/15 bg-ink-900 px-2 py-2 text-xs">{ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select><Button type="submit" variant="outline" className="!px-3 py-1.5">SET</Button></form>}</div></li>))}</ul>
    </main>
  );
}
