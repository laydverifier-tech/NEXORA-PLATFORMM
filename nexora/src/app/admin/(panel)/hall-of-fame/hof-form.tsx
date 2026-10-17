'use client';
import { AdminForm, Check, Grid } from '@/components/admin/form-kit';
import { Field } from '@/components/ui/field';
import { saveHof } from './actions';
type H = { id?: string; tournament_name?: string; season?: string | null; winner?: string; prize?: string | null; mvp?: string | null; sponsor?: string | null; event_date?: string | null; sort_order?: number; is_published?: boolean };
export function HofForm({ h = {} }: { h?: H }) {
  return (
    <AdminForm action={saveHof} submit={h.id ? 'SAVE' : 'ADD CHAMPION'}>
      {(s) => (<>{h.id && <input type="hidden" name="id" value={h.id} />}
        <Grid cols={3}><Field name="tournament_name" label="Tournament" defaultValue={h.tournament_name} required error={s.fieldErrors?.tournament_name} /><Field name="season" label="Season" defaultValue={h.season ?? ''} /><Field name="winner" label="Winner" defaultValue={h.winner} required error={s.fieldErrors?.winner} /></Grid>
        <Grid cols={4}><Field name="prize" label="Prize" defaultValue={h.prize ?? ''} /><Field name="mvp" label="MVP" defaultValue={h.mvp ?? ''} /><Field name="sponsor" label="Sponsor" defaultValue={h.sponsor ?? ''} /><Field name="event_date" label="Date" type="date" defaultValue={h.event_date ?? ''} /></Grid>
        <Grid><Field name="sort_order" label="Order" type="number" defaultValue={h.sort_order ?? 0} /><div className="pt-7"><Check label="Published" name="is_published" defaultChecked={h.is_published ?? true} /></div></Grid></>)}
    </AdminForm>
  );
}
