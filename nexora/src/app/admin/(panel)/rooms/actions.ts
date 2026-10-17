'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { adminAction, UNAUTHORIZED } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { dbMessage, isUuid } from '@/lib/admin/helpers';
import { ROOM_STATUSES, STAGES } from '@/lib/admin/constants';
import { zodFields, type FormState } from '@/types/forms';

const schema = z.object({
  tournament_id: z.string().uuid(), stage: z.enum(STAGES), name: z.string().trim().min(2).max(60),
  room_id: z.string().trim().min(1).max(40), room_password: z.string().trim().max(40).optional().transform((v) => v || null),
  scheduled_at: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)]).optional().transform((v) => (v ? `${v}:00Z` : null)),
  status: z.enum(ROOM_STATUSES),
});
export async function addRoom(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await adminAction(); if (!ctx) return UNAUTHORIZED;
  const p = schema.safeParse(Object.fromEntries(fd)); if (!p.success) return { fieldErrors: zodFields(p.error), error: 'Please fix the highlighted fields.' };
  const { data, error } = await ctx.supabase.from('nx_rooms').insert(p.data).select('id').limit(1);
  if (error) return { error: dbMessage(error, 'room') };
  await audit(ctx, 'room.create', 'room', data?.[0]?.id ?? null, { stage: p.data.stage, name: p.data.name }); // password never logged
  revalidatePath('/admin/rooms');
  return { message: 'Room added.' };
}
export async function roomOp(fd: FormData) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? ''); const op = String(fd.get('op') ?? '');
  if (!ctx || !isUuid(id)) return;
  if (op === 'delete') { const { error } = await ctx.supabase.from('nx_rooms').delete().eq('id', id); if (!error) await audit(ctx, 'room.delete', 'room', id); }
  else if ((ROOM_STATUSES as readonly string[]).includes(op)) { const { error } = await ctx.supabase.from('nx_rooms').update({ status: op }).eq('id', id); if (!error) await audit(ctx, 'room.status', 'room', id, { status: op }); }
  revalidatePath('/admin/rooms');
}
