'use client';
import { AdminForm, Check, Grid, Select } from '@/components/admin/form-kit';
import { Field, TextArea } from '@/components/ui/field';
import { TOURNAMENT_STATUSES } from '@/lib/validation/admin';
import { toInput } from '@/lib/admin/helpers';
import { saveTournament } from './actions';

export type TForm = { id?: string; name?: string; slug?: string; game?: string; description?: string | null; rules?: string | null; prize_pool?: number; entry_fee?: number; vip_fee?: number | null; max_teams?: number; rounds?: number; region?: string | null; status?: string; banner_url?: string | null; registration_start?: string; registration_end?: string; tournament_start?: string; tournament_end?: string | null; prizes?: Record<number, number> };
export function TournamentForm({ t = {} }: { t?: TForm }) {
  return (
    <AdminForm action={saveTournament} submit={t.id ? 'SAVE CHANGES' : 'CREATE TOURNAMENT'}>
      {(s) => (<>
        {t.id && <input type="hidden" name="id" value={t.id} />}
        <Grid><Field name="name" label="Name" defaultValue={t.name} required error={s.fieldErrors?.name} /><Field name="slug" label="Slug (URL)" defaultValue={t.slug} required error={s.fieldErrors?.slug} /></Grid>
        <Grid cols={3}><Field name="game" label="Game" defaultValue={t.game ?? 'Free Fire'} required error={s.fieldErrors?.game} /><Field name="region" label="Region" defaultValue={t.region ?? ''} error={s.fieldErrors?.region} /><Select label="Status" name="status" options={TOURNAMENT_STATUSES} defaultValue={t.status ?? 'DRAFT'} /></Grid>
        <Grid cols={4}><Field name="prize_pool" label="Prize pool (€)" type="number" step="0.01" defaultValue={t.prize_pool ?? 0} error={s.fieldErrors?.prize_pool} /><Field name="entry_fee" label="Entry fee (€)" type="number" step="0.01" defaultValue={t.entry_fee ?? 0} error={s.fieldErrors?.entry_fee} /><Field name="vip_fee" label="VIP fee (€)" type="number" step="0.01" defaultValue={t.vip_fee ?? ''} error={s.fieldErrors?.vip_fee} /><Field name="max_teams" label="Slots (squads)" type="number" defaultValue={t.max_teams ?? 24} error={s.fieldErrors?.max_teams} /></Grid>
        <Grid cols={4}><Field name="prize1" label="Top 1 (€)" type="number" step="0.01" defaultValue={t.prizes?.[1] ?? 0} /><Field name="prize2" label="Top 2 (€)" type="number" step="0.01" defaultValue={t.prizes?.[2] ?? 0} /><Field name="prize3" label="Top 3 (€)" type="number" step="0.01" defaultValue={t.prizes?.[3] ?? 0} /><Field name="prize_mvp" label="MVP (€)" type="number" step="0.01" defaultValue={t.prizes?.[0] ?? 0} /></Grid>
        <p className="text-[11px] text-steel">All dates are UTC.</p>
        <Grid cols={4}><Field name="registration_start" label="Registration opens" type="datetime-local" defaultValue={toInput(t.registration_start)} error={s.fieldErrors?.registration_start} /><Field name="registration_end" label="Registration closes" type="datetime-local" defaultValue={toInput(t.registration_end)} error={s.fieldErrors?.registration_end} /><Field name="tournament_start" label="Tournament starts" type="datetime-local" defaultValue={toInput(t.tournament_start)} error={s.fieldErrors?.tournament_start} /><Field name="tournament_end" label="Tournament ends (optional)" type="datetime-local" defaultValue={toInput(t.tournament_end)} /></Grid>
        <Grid><Field name="rounds" label="Rounds" type="number" defaultValue={t.rounds ?? 12} error={s.fieldErrors?.rounds} /><Field name="banner_url" label="Banner URL (https)" defaultValue={t.banner_url ?? ''} error={s.fieldErrors?.banner_url} /></Grid>
        <TextArea name="description" label="Description" defaultValue={t.description ?? ''} rows={3} error={s.fieldErrors?.description} />
        <TextArea name="rules" label="Rules / format (one rule per line)" defaultValue={t.rules ?? ''} rows={8} error={s.fieldErrors?.rules} />
      </>)}
    </AdminForm>
  );
}
