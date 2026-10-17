'use server';
import { redirect } from 'next/navigation';
import { adminAction, UNAUTHORIZED } from '@/lib/admin/context';
import { audit } from '@/lib/admin/audit';
import { dbMessage, isUuid } from '@/lib/admin/helpers';
import { notifyDiscord } from '@/lib/admin/notify';
import { siteConfig } from '@/config/site';
import { rateLimit } from '@/lib/security/rate-limit';
import { newsSchema } from '@/lib/validation/admin';
import { zodFields, type FormState } from '@/types/forms';

export async function saveNews(_: FormState, fd: FormData): Promise<FormState> {
  const ctx = await adminAction(); if (!ctx) return UNAUTHORIZED;
  if (!(await rateLimit('admin_write', 60, 60)).ok) return { error: 'Slow down a little.' };
  const p = newsSchema.safeParse(Object.fromEntries(fd)); if (!p.success) return { fieldErrors: zodFields(p.error), error: 'Please fix the highlighted fields.' };
  const id = String(fd.get('id') ?? ''); if (id && !isUuid(id)) return { error: 'Invalid article.' };
  const row = { ...p.data, ...(p.data.is_published ? { published_at: new Date().toISOString() } : {}) };
  let nid = id; let firstPublish = p.data.is_published && !id;
  if (id) {
    if (p.data.is_published) { const { data: cur } = await ctx.supabase.from('news').select('published_at').eq('id', id).limit(1); if (cur?.[0]?.published_at) row.published_at = cur[0].published_at as string; else firstPublish = true; }
    const { error } = await ctx.supabase.from('news').update(row).eq('id', id); if (error) return { error: dbMessage(error, 'article') };
  } else {
    const { data, error } = await ctx.supabase.from('news').insert({ ...row, author_id: ctx.user.id }).select('id').limit(1);
    if (error || !data?.[0]) return { error: dbMessage(error ?? { message: 'no row' }, 'article') }; nid = data[0].id as string;
  }
  await audit(ctx, id ? 'news.update' : 'news.create', 'news', nid, { title: p.data.title, published: p.data.is_published });
  if (firstPublish) await notifyDiscord(ctx, `📰 ${p.data.title}\n${siteConfig.url}/news/${p.data.slug}`);
  redirect(`/admin/news/${nid}?saved=1`);
}
export async function deleteNews(fd: FormData) {
  const ctx = await adminAction(); const id = String(fd.get('id') ?? ''); if (!ctx || !isUuid(id)) return;
  const { error } = await ctx.supabase.from('news').delete().eq('id', id); if (!error) await audit(ctx, 'news.delete', 'news', id);
  redirect('/admin/news');
}
