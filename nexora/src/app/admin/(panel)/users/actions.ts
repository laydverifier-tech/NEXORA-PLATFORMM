'use server';
import { revalidatePath } from 'next/cache';
import { adminAction } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { isUuid } from '@/lib/admin/helpers';
import { ASSIGNABLE_ROLES } from '@/lib/validation/admin2';

/** CEO only. Never the CEO role, never yourself. The database re-checks (RLS + aal2). */
export async function setRole(fd: FormData) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? ''); const role = String(fd.get('role') ?? '');
  if (!ctx || !ctx.roles.includes('SUPER_ADMIN') || !isUuid(id) || id === ctx.user.id || !(ASSIGNABLE_ROLES as readonly string[]).includes(role)) return;
  const { data: target } = await ctx.supabase.from('profiles').select('role').eq('id', id).limit(1);
  if (!target?.[0] || target[0].role === 'CEO') return;
  const { error } = await ctx.supabase.from('profiles').update({ role }).eq('id', id);
  if (!error) await audit(ctx, 'user.role_change', 'profile', id, { from: target[0].role, to: role });
  revalidatePath('/admin/users');
}
