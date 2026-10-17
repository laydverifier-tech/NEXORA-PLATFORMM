import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserRoles } from '@/lib/auth/session';
import { ADMIN_ROLES } from '@/config/roles';
import { safeRedirectPath } from '@/lib/utils/safe-redirect';
import { Forbidden } from '@/components/shared/forbidden';
import { EnrollMfa } from '../mfa-forms';

export default async function Page({ searchParams }: { searchParams: { next?: string; add?: string } }) {
  const raw = safeRedirectPath(searchParams.next, '/admin/dashboard');
  const next = raw.startsWith('/admin') ? raw : '/admin/dashboard';
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  if (!(await getUserRoles(user.id)).some((r) => ADMIN_ROLES.includes(r))) return <Forbidden />;
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const adding = searchParams.add === '1' && aal?.currentLevel === 'aal2'; // staff already verified may enroll a backup authenticator
  if (aal?.currentLevel === 'aal2' && !adding) redirect(next);
  if (!adding && aal?.nextLevel === 'aal2') redirect(`/admin/mfa/verify?next=${encodeURIComponent(next)}`); // already enrolled: verify instead
  return <EnrollMfa next={next} />;
}
