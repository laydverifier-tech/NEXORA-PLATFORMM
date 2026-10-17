'use server';
import { revalidatePath } from 'next/cache';
import { adminAction } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { isUuid } from '@/lib/admin/helpers';
import { rateLimit } from '@/lib/security/rate-limit';

const OPS = {
  confirm: { status: 'CONFIRMED', payment_status: 'CONFIRMED' }, reject: { status: 'REJECTED', payment_status: 'REJECTED' },
  refund: { status: 'WITHDRAWN', payment_status: 'REFUNDED' }, pending: { status: 'PENDING', payment_status: 'PENDING' },
} as const;
export async function setRegistration(fd: FormData) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? ''); const op = String(fd.get('op') ?? '') as keyof typeof OPS;
  if (!ctx || !isUuid(id) || !(op in OPS)) return;
  if (!(await rateLimit('admin_write', 60, 60)).ok) return;
  const { error } = await ctx.supabase.from('squad_registrations').update({ ...OPS[op], reviewed_by: ctx.user.id, reviewed_at: new Date().toISOString() }).eq('id', id);
  if (!error) await audit(ctx, `registration.${op}`, 'squad_registration', id);
  revalidatePath('/admin/registrations');
}
