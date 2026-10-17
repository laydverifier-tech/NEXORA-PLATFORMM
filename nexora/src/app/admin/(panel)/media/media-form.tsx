'use client';
import { AdminForm, Check, Grid, Select } from '@/components/admin/form-kit';
import { Field } from '@/components/ui/field';
import { MEDIA_CATEGORIES } from '@/lib/validation/admin2';
import { saveMedia } from './actions';
type M = { id?: string; title?: string; category?: string; video_url?: string; thumbnail_url?: string | null; view_count?: number; is_published?: boolean };
export function MediaForm({ m = {} }: { m?: M }) {
  return (
    <AdminForm action={saveMedia} submit={m.id ? 'SAVE VIDEO' : 'ADD VIDEO'}>
      {(s) => (<>{m.id && <input type="hidden" name="id" value={m.id} />}
        <Grid><Field name="title" label="Title" defaultValue={m.title} required error={s.fieldErrors?.title} /><Select label="Category" name="category" options={MEDIA_CATEGORIES} defaultValue={m.category} /></Grid>
        <Grid><Field name="video_url" label="Video URL (https)" defaultValue={m.video_url} required error={s.fieldErrors?.video_url} /><Field name="thumbnail_url" label="Thumbnail URL (https)" defaultValue={m.thumbnail_url ?? ''} error={s.fieldErrors?.thumbnail_url} /></Grid>
        <Grid><Field name="view_count" label="Views" type="number" defaultValue={m.view_count ?? 0} /><div className="pt-7"><Check label="Published" name="is_published" defaultChecked={m.is_published ?? false} /></div></Grid></>)}
    </AdminForm>
  );
}
