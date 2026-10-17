import 'server-only';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { z } from 'zod';
import { adminAction, UNAUTHORIZED } from './context';
import { audit } from './audit';
import { dbMessage, isUuid } from './helpers';
import { rateLimit } from '@/lib/security/rate-limit';
import { zodFields, type FormState } from '@/types/forms';

/** Generic validated insert/update with rate limit + audit. Redirects back to the list on success. */
export async function crudSave<S extends z.ZodTypeAny>(fd: FormData, o: { table: string; schema: S; entity: string; path: string; map?: (d: z.infer<S>, id: string) => Record<string, unknown>; label: (d: z.infer<S>) => string }): Promise<FormState> {
  const ctx = await adminAction(); if (!ctx) return UNAUTHORIZED;
  if (!(await rateLimit('admin_write', 60, 60)).ok) return { error: 'Slow down a little.' };
  const p = o.schema.safeParse(Object.fromEntries(fd)); if (!p.success) return { fieldErrors: zodFields(p.error), error: 'Please fix the highlighted fields.' };
  const id = String(fd.get('id') ?? ''); if (id && !isUuid(id)) return { error: `Invalid ${o.entity}.` };
  const row = o.map ? o.map(p.data, id) : p.data;
  const q = id ? ctx.supabase.from(o.table).update(row).eq('id', id).select('id') : ctx.supabase.from(o.table).insert(row).select('id');
  const { data, error } = await q; if (error) return { error: dbMessage(error, o.entity) };
  await audit(ctx, `${o.entity}.${id ? 'update' : 'create'}`, o.entity, data?.[0]?.id ?? id ?? null, { label: o.label(p.data) });
  revalidatePath(o.path);
  redirect(`${o.path}?saved=1`);
}
export async function crudDelete(fd: FormData, o: { table: string; entity: string; path: string }) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? ''); if (!ctx || !isUuid(id)) return;
  const { error } = await ctx.supabase.from(o.table).delete().eq('id', id);
  if (!error) await audit(ctx, `${o.entity}.delete`, o.entity, id);
  revalidatePath(o.path); redirect(o.path);
}
