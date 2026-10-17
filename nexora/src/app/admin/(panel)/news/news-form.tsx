'use client';
import { AdminForm, Check, Grid, Select } from '@/components/admin/form-kit';
import { Field, TextArea } from '@/components/ui/field';
import { NEWS_CATEGORIES } from '@/lib/validation/admin';
import { saveNews } from './actions';

export type NForm = { id?: string; title?: string; slug?: string; category?: string | null; excerpt?: string | null; content?: string; cover_image_url?: string | null; seo_title?: string | null; seo_description?: string | null; is_published?: boolean };
export function NewsForm({ n = {} }: { n?: NForm }) {
  return (
    <AdminForm action={saveNews} submit={n.id ? 'SAVE ARTICLE' : 'CREATE ARTICLE'}>
      {(s) => (<>
        {n.id && <input type="hidden" name="id" value={n.id} />}
        <Grid><Field name="title" label="Title" defaultValue={n.title} required error={s.fieldErrors?.title} /><Field name="slug" label="Slug (URL)" defaultValue={n.slug} required error={s.fieldErrors?.slug} /></Grid>
        <Grid><Select label="Category" name="category" options={NEWS_CATEGORIES} defaultValue={n.category ?? 'ANNOUNCEMENT'} /><Field name="cover_image_url" label="Cover image URL (https)" defaultValue={n.cover_image_url ?? ''} error={s.fieldErrors?.cover_image_url} /></Grid>
        <TextArea name="excerpt" label="Excerpt (max 300)" defaultValue={n.excerpt ?? ''} rows={2} error={s.fieldErrors?.excerpt} />
        <TextArea name="content" label="Content (blank line = new paragraph; plain text only)" defaultValue={n.content ?? ''} rows={12} required error={s.fieldErrors?.content} />
        <Grid><Field name="seo_title" label="SEO title (max 70)" defaultValue={n.seo_title ?? ''} /><Field name="seo_description" label="SEO description (max 160)" defaultValue={n.seo_description ?? ''} /></Grid>
        <Check label="Published (visible on the website)" name="is_published" defaultChecked={n.is_published ?? false} />
      </>)}
    </AdminForm>
  );
}
