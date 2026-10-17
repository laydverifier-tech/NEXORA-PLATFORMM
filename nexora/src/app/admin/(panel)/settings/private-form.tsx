'use client';
import { useState, useTransition } from 'react';
import { AdminForm, Grid } from '@/components/admin/form-kit';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { savePrivateSettings, testWebhook } from './private-actions';

export function PrivateForm({ whatsapp, webhookTail }: { whatsapp: string; webhookTail: string | null }) {
  const [msg, setMsg] = useState(''); const [pending, start] = useTransition();
  return (
    <section className="space-y-3 border border-gold/30 p-5">
      <h2 className="text-[11px] font-bold tracking-[0.3em] text-gold">PRIVATE · PAYMENT & DISCORD</h2>
      <p className="text-xs text-steel">Never shown publicly. The WhatsApp number is only revealed to a squad after it registers.</p>
      <AdminForm action={savePrivateSettings} submit="SAVE PRIVATE SETTINGS">
        {(s) => (<>
          <input type="hidden" name="keep_webhook" value={webhookTail ? '1' : '0'} />
          <Grid><Field name="whatsapp_number" label="Payment WhatsApp number" defaultValue={whatsapp} placeholder="+212 6 00 00 00 00" error={s.fieldErrors?.whatsapp_number} />
            <Field name="discord_webhook_url" label={webhookTail ? `Discord webhook (saved …${webhookTail}; leave blank to keep)` : 'Discord webhook URL (optional)'} error={s.fieldErrors?.discord_webhook_url} /></Grid>
        </>)}
      </AdminForm>
      {webhookTail && <div className="flex items-center gap-3"><Button type="button" variant="outline" disabled={pending} onClick={() => start(async () => { const r = await testWebhook(); setMsg(r.message ?? r.error ?? ''); })}>SEND TEST MESSAGE</Button>{msg && <span role="status" className="text-xs text-steel-light">{msg}</span>}</div>}
    </section>
  );
}
