'use client';
import { AdminForm, Check, Grid, Select } from '@/components/admin/form-kit';
import { Field, TextArea } from '@/components/ui/field';
import { PARTNER_TYPES } from '@/lib/validation/admin2';
import { savePartner } from './actions';
type P = { id?: string; name?: string; logo_url?: string | null; website_url?: string | null; partner_type?: string | null; description?: string | null; is_active?: boolean };
export function PartnerForm({ p = {} }: { p?: P }) {
  return (
    <AdminForm action={savePartner} submit={p.id ? 'SAVE PARTNER' : 'ADD PARTNER'}>
      {(s) => (<>{p.id && <input type="hidden" name="id" value={p.id} />}
        <Grid><Field name="name" label="Name" defaultValue={p.name} required error={s.fieldErrors?.name} /><Select label="Partnership type" name="partner_type" options={PARTNER_TYPES} defaultValue={p.partner_type ?? 'TOURNAMENT'} /></Grid>
        <Grid><Field name="logo_url" label="Logo URL (https)" defaultValue={p.logo_url ?? ''} error={s.fieldErrors?.logo_url} /><Field name="website_url" label="Website (https)" defaultValue={p.website_url ?? ''} error={s.fieldErrors?.website_url} /></Grid>
        <TextArea name="description" label="Description" rows={2} defaultValue={p.description ?? ''} /><Check label="Active (shown on the website)" name="is_active" defaultChecked={p.is_active ?? true} /></>)}
    </AdminForm>
  );
}
