'use client';
import { AdminForm, Check, Grid } from '@/components/admin/form-kit';
import { Field, TextArea } from '@/components/ui/field';
import { isSafeHttpsUrl } from '@/lib/utils/format';
import { saveRoster } from './actions';

export type RForm = { id?: string; nickname?: string; slug?: string; role_label?: string | null; bio?: string | null; image_url?: string | null; sort_order?: number; is_active?: boolean; socials?: Record<string, string>; stats?: Record<string, string | number> };
export function RosterForm({ p = {} }: { p?: RForm }) {
  const so = p.socials ?? {};
  return (
    <AdminForm action={saveRoster} submit={p.id ? 'SAVE PLAYER' : 'ADD PLAYER'}>
      {(s) => (<>
        {p.id && <input type="hidden" name="id" value={p.id} />}
        <Grid><Field name="nickname" label="Nickname" defaultValue={p.nickname} required error={s.fieldErrors?.nickname} /><Field name="slug" label="Slug (URL)" defaultValue={p.slug} required error={s.fieldErrors?.slug} /></Grid>
        <Grid cols={3}><Field name="role_label" label="Role (Rifler, Rusher…)" defaultValue={p.role_label ?? ''} error={s.fieldErrors?.role_label} /><Field name="sort_order" label="Order" type="number" defaultValue={p.sort_order ?? 0} /><div className="pt-7"><Check label="Visible on the site" name="is_active" defaultChecked={p.is_active ?? true} /></div></Grid>
        <div className="flex items-end gap-4">
          {isSafeHttpsUrl(p.image_url) && /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.image_url} alt="" className="h-24 w-20 border border-white/10 object-cover" />}
          <div className="flex-1"><Field name="image" label="Photo (JPG/PNG/WebP, max 4 MB)" type="file" accept="image/jpeg,image/png,image/webp" error={s.fieldErrors?.image} /></div>
        </div>
        <TextArea name="bio" label="Bio" defaultValue={p.bio ?? ''} rows={4} error={s.fieldErrors?.bio} />
        <TextArea name="stats" label={'Stats (one per line, "Label: value")'} defaultValue={Object.entries(p.stats ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n')} rows={4} />
        <Grid cols={3}>{(['instagram', 'tiktok', 'youtube', 'twitch', 'x', 'discord'] as const).map((k) => <Field key={k} name={k} label={`${k.toUpperCase()} URL`} defaultValue={so[k] ?? ''} error={s.fieldErrors?.[k]} />)}</Grid>
      </>)}
    </AdminForm>
  );
}
