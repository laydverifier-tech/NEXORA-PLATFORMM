'use server';
import { revalidatePath } from 'next/cache';
import { adminAction } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';

export async function removeFactor(fd: FormData) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? '');
  if (!ctx || !/^[0-9a-f-]{36}$/i.test(id)) return;
  const { data } = await ctx.supabase.auth.mfa.listFactors();
  if ((data?.totp?.length ?? 0) < 2) return; // never remove the last verified authenticator
  const { error } = await ctx.supabase.auth.mfa.unenroll({ factorId: id });
  if (!error) await audit(ctx, 'mfa.factor_removed', 'mfa_factor', null);
  revalidatePath('/admin/security');
}
