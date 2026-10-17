'use server';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { rateLimitFor } from '@/lib/security/rate-limit';
import { alertSecurity } from '@/lib/admin/notify';
import { loginSchemaAdmin } from '@/lib/validation/admin';
import { safeRedirectPath } from '@/lib/utils/safe-redirect';
import { zodFields, type FormState } from '@/types/forms';

const GENERIC = 'Invalid email or password.';
export async function adminLogin(_: FormState, fd: FormData): Promise<FormState> {
  const p = loginSchemaAdmin.safeParse(Object.fromEntries(fd));
  if (!p.success) return { fieldErrors: zodFields(p.error) };
  if (!(await rateLimitFor('admin_login', 8, 900, p.data.email)).ok) { await alertSecurity('Admin login throttled (too many attempts).'); return { error: 'Too many attempts. Try again in a few minutes.' }; }
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: p.data.email, password: p.data.password });
  if (error) return { error: GENERIC }; // never reveal whether the account exists
  const { data: { user } } = await supabase.auth.getUser();
  const { data: prof } = user ? await supabase.from('profiles').select('role').eq('id', user.id).limit(1) : { data: null };
  if (!user || !['CEO', 'ADMIN', 'ORGANIZER'].includes(String(prof?.[0]?.role))) {
    await supabase.auth.signOut(); // valid account but not staff: same generic error, no session kept
    return { error: GENERIC };
  }
  await supabase.from('activity_logs').insert({ actor_id: user.id, action: 'admin.login.password_ok', entity_type: 'session', metadata: {} });
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const next = safeRedirectPath(p.data.next, '/admin/dashboard');
  redirect(`/admin/mfa/${aal?.nextLevel === 'aal2' ? 'verify' : 'enroll'}?next=${encodeURIComponent(next.startsWith('/admin') ? next : '/admin/dashboard')}`);
}
