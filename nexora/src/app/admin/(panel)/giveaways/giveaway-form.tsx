'use client';
import { AdminForm, Grid, Select } from '@/components/admin/form-kit';
import { Field, TextArea } from '@/components/ui/field';
import { toInput } from '@/lib/admin/helpers';
import { GIVEAWAY_STATUSES } from '@/lib/validation/admin2';
import { saveGiveaway } from './actions';
export type GForm = { id?: string; title?: string; slug?: string; prize?: string; description?: string | null; rules?: string | null; prize_image_url?: string | null; starts_at?: string; ends_at?: string; max_entries?: number | null; winners_count?: number; status?: string };
export function GiveawayForm({ g = {} }: { g?: GForm }) {
  const locked = g.status && !(GIVEAWAY_STATUSES as readonly string[]).includes(g.status); // ENDED / DRAWING / WINNER_SELECTED
  return (
    <AdminForm action={saveGiveaway} submit={g.id ? 'SAVE GIVEAWAY' : 'CREATE GIVEAWAY'}>
      {(s) => (<>{g.id && <input type="hidden" name="id" value={g.id} />}
        <Grid><Field name="title" label="Title" defaultValue={g.title} required error={s.fieldErrors?.title} /><Field name="slug" label="Slug (URL)" defaultValue={g.slug} required error={s.fieldErrors?.slug} /></Grid>
        <Grid cols={3}><Field name="prize" label="Prize (e.g. €50)" defaultValue={g.prize} required error={s.fieldErrors?.prize} /><Field name="winners_count" label="Winners" type="number" defaultValue={g.winners_count ?? 1} /><Field name="max_entries" label="Max entries (optional)" type="number" defaultValue={g.max_entries ?? ''} /></Grid>
        <p className="text-[11px] text-steel">Dates are UTC. The ending time is enforced by the database clock.</p>
        <Grid><Field name="starts_at" label="Starts" type="datetime-local" defaultValue={toInput(g.starts_at)} error={s.fieldErrors?.starts_at} /><Field name="ends_at" label="Ends" type="datetime-local" defaultValue={toInput(g.ends_at)} error={s.fieldErrors?.ends_at} /></Grid>
        {locked ? <p className="text-xs text-steel">Status: <strong>{g.status}</strong> (managed by the system)</p> : <Select label="Status" name="status" options={GIVEAWAY_STATUSES} defaultValue={g.status ?? 'DRAFT'} />}
        <Field name="prize_image_url" label="Prize image URL (https)" defaultValue={g.prize_image_url ?? ''} error={s.fieldErrors?.prize_image_url} />
        <TextArea name="description" label="Description" rows={3} defaultValue={g.description ?? ''} /><TextArea name="rules" label="Entry rules" rows={4} defaultValue={g.rules ?? ''} /></>)}
    </AdminForm>
  );
}
