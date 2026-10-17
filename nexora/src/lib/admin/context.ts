import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ADMIN_ROLES, type AppRole } from '@/config/roles';
import { getUserRoles } from '@/lib/auth/session';

export type AdminCtx = { supabase: ReturnType<typeof createClient>; user: { id: string; email?: string }; roles: AppRole[] };

const resolve = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser(); // validated against Supabase Auth, never the raw cookie
  if (!user) return { state: 'anon' as const };
  const roles = await getUserRoles(user.id);
  if (!roles.some((r) => ADMIN_ROLES.includes(r))) return { state: 'forbidden' as const };
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== 'aal2') return { state: 'mfa' as const, next: aal?.nextLevel === 'aal2' ? 'verify' : 'enroll' };
  return { state: 'ok' as const, ctx: { supabase, user: { id: user.id, email: user.email }, roles } satisfies AdminCtx };
});

/** Pages/layouts: login → role → TOTP (aal2). Returns null when signed in but not staff (caller renders 403). */
export async function adminPage(nextPath: string): Promise<AdminCtx | null> {
  const r = await resolve();
  if (r.state === 'anon') redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  if (r.state === 'mfa') redirect(`/admin/mfa/${r.next}?next=${encodeURIComponent(nextPath)}`);
  return r.state === 'ok' ? r.ctx : null;
}
/** Server actions: re-verify EVERYTHING (the form body is never trusted). null = refuse. The database enforces aal2 again via RLS. */
export async function adminAction(): Promise<AdminCtx | null> {
  const r = await resolve();
  return r.state === 'ok' ? r.ctx : null;
}
export const UNAUTHORIZED = { error: 'Your session expired or you are not allowed to do this. Please sign in again.' } as const;
