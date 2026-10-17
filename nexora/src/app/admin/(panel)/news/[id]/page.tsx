import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { isUuid } from '@/lib/admin/helpers';
import { ConfirmButton } from '@/components/admin/form-kit';
import { NewsForm, type NForm } from '../news-form';
import { deleteNews } from '../actions';

export default async function EditArticle({ params, searchParams }: { params: { id: string }; searchParams: { saved?: string } }) {
  const ctx = await adminPage(`/admin/news/${params.id}`); if (!ctx || !isUuid(params.id)) notFound();
  const { data } = await ctx.supabase.from('news').select('*').eq('id', params.id).limit(1);
  const n = data?.[0]; if (!n) notFound();
  async function del(fd: FormData) { 'use server'; fd.set('id', params.id); await deleteNews(fd); }
  return (
    <main className="max-w-3xl space-y-6">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">EDIT ARTICLE</h1>
      {searchParams.saved && <p role="status" className="border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">Saved.</p>}
      <NewsForm n={n as NForm} />
      <div className="border-t border-white/10 pt-6"><ConfirmButton label="DELETE ARTICLE" message="Delete this article permanently?" action={del} /></div>
    </main>
  );
}
