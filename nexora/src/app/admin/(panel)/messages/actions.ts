'use server';
import { revalidatePath } from 'next/cache';
import { adminAction } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { isUuid } from '@/lib/admin/helpers';

export async function messageOp(fd: FormData) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? ''); const op = String(fd.get('op') ?? '');
  if (!ctx || !isUuid(id)) return;
  if (op === 'read' || op === 'unread') await ctx.supabase.from('contact_messages').update({ is_read: op === 'read' }).eq('id', id);
  if (op === 'delete') { const { error } = await ctx.supabase.from('contact_messages').delete().eq('id', id); if (!error) await audit(ctx, 'message.delete', 'contact_message', id); }
  revalidatePath('/admin/messages');
}
