import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { ButtonLink } from '@/components/ui/button';
import { ConfirmButton } from '@/components/admin/form-kit';
import { LocalTime } from '@/components/shared/local-time';
import { removeFactor } from './actions';

type Sess = { profile_id: string; username: string; display_name: string | null; role: string; ip: string | null; user_agent: string | null; updated_at: string };
export default async function SecurityAdmin() {
  const ctx = await adminPage('/admin/security'); if (!ctx) notFound();
  const [f, ses, logs] = await Promise.all([
    ctx.supabase.auth.mfa.listFactors(),
    ctx.supabase.rpc('admin_get_sessions', { p_limit: 30 }),
    ctx.supabase.from('activity_logs').select('id,actor_id,action,entity_type,created_at').order('created_at', { ascending: false }).limit(60),
  ]);
  const factors = f.data?.totp ?? [];
  const actors = [...new Set((logs.data ?? []).map((l) => l.actor_id).filter(Boolean))];
  const { data: profs } = actors.length ? await ctx.supabase.from('profiles').select('id,username').in('id', actors as string[]) : { data: [] };
  const who = Object.fromEntries((profs ?? []).map((p) => [p.id, p.username]));
  return (
    <main className="space-y-8">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">SECURITY</h1>
      <section className="border border-white/10 bg-ink-800/80 p-5"><h2 className="text-[11px] font-bold tracking-wider2 text-gold">AUTHENTICATOR APPS (2-STEP VERIFICATION)</h2>
        <ul className="mt-3 divide-y divide-white/10">{factors.map((x) => <li key={x.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{x.friendly_name ?? 'Authenticator'} <span className="text-xs text-steel">· added <LocalTime iso={x.created_at} withTime={false} /></span></span>
          {factors.length > 1 ? <FactorRemove id={x.id} /> : <span className="text-[10px] tracking-wider2 text-steel">LAST ONE · CANNOT REMOVE</span>}</li>)}</ul>
        {factors.length < 2 && <p className="mt-3 text-xs text-amber-300">Recommended: add a backup authenticator (second phone or password manager) so you can never be locked out.</p>}
        <div className="mt-4"><ButtonLink href="/admin/mfa/enroll?add=1&next=/admin/security" variant="outline">+ ADD ANOTHER AUTHENTICATOR</ButtonLink></div></section>
      <section className="border border-white/10 bg-ink-800/80 p-5"><h2 className="text-[11px] font-bold tracking-wider2 text-gold">ACTIVE SESSIONS & IP ADDRESSES</h2>
        {ses.error ? <p className="mt-2 text-xs text-steel">Not available for your permissions.</p> : (
          <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-[10px] tracking-wider2 text-steel"><tr><th className="py-2">USER</th><th>ROLE</th><th>IP</th><th>DEVICE</th><th>LAST SEEN</th></tr></thead><tbody className="divide-y divide-white/10">{((ses.data ?? []) as Sess[]).map((s, i) => <tr key={i}><td className="py-2 font-bold">{s.username}</td><td>{s.role}</td><td className="font-mono">{s.ip ?? '—'}</td><td className="max-w-[16rem] truncate text-steel" title={s.user_agent ?? ''}>{s.user_agent ?? '—'}</td><td><LocalTime iso={s.updated_at} /></td></tr>)}</tbody></table></div>)}
        <p className="mt-3 text-[11px] text-steel">Real IPs are shown for signed-in staff sessions only. Public visitors are counted with a salted hash (privacy/GDPR).</p></section>
      <section className="border border-white/10 bg-ink-800/80 p-5"><h2 className="text-[11px] font-bold tracking-wider2 text-gold">AUDIT LOG</h2>
        {(logs.data ?? []).length ? <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-[10px] tracking-wider2 text-steel"><tr><th className="py-2">WHEN</th><th>WHO</th><th>ACTION</th><th>ON</th></tr></thead><tbody className="divide-y divide-white/10">{logs.data!.map((l) => <tr key={l.id}><td className="py-2"><LocalTime iso={l.created_at} /></td><td>{l.actor_id ? who[l.actor_id] ?? 'system' : 'system'}</td><td className="font-mono">{l.action}</td><td className="text-steel">{l.entity_type}</td></tr>)}</tbody></table></div> : <p className="mt-2 text-xs text-steel">No entries yet.</p>}</section>
    </main>
  );
}
function FactorRemove({ id }: { id: string }) {
  async function act(fd: FormData) { 'use server'; fd.set('id', id); await removeFactor(fd); }
  return <ConfirmButton label="REMOVE" message="Remove this authenticator?" action={act} />;
}
