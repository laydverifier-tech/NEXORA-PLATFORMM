import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { SettingsForm } from './settings-form';
import { PrivateForm } from './private-form';

type J = Record<string, string | number | null | undefined>;

export default async function SettingsAdmin() {
  const ctx = await adminPage('/admin/settings'); if (!ctx) notFound();
  const { data } = await ctx.supabase.from('site_settings').select('key,value').in('key', ['site', 'social', 'hero', 'stats']);
  const { data: priv } = await ctx.supabase.from('private_settings').select('key,value').in('key', ['payment', 'discord_webhook']);
  const pv = Object.fromEntries((priv ?? []).map((r) => [r.key, (r.value ?? {}) as Record<string, string | null>]));
  const hook = pv.discord_webhook?.url ?? null;
  const m = Object.fromEntries((data ?? []).map((r) => [r.key, (r.value ?? {}) as J]));
  const site = m.site ?? {}, social = m.social ?? {}, hero = m.hero ?? {}, stats = m.stats ?? {};
  return (
    <main className="max-w-4xl space-y-4">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">SETTINGS</h1>
      <p className="text-xs text-steel">These values are public. Never put passwords, keys or private numbers here.</p>
      <PrivateForm whatsapp={pv.payment?.whatsapp_number ?? ''} webhookTail={hook ? hook.slice(-6) : null} />
      <SettingsForm site={site} social={social} hero={hero} stats={stats} />
    </main>
  );
}
