'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { Field } from '@/components/ui/field';
import { Button, ButtonLink } from '@/components/ui/button';
import { CaptchaField } from '@/components/shared/captcha-field';
import { registerSquad, type RegisterState } from './actions';

function Submit() { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? 'SENDING…' : 'REGISTER MY SQUAD'}</Button>; }

export function RegisterForm({ slug, entryFee, vipFee }: { slug: string; entryFee: number; vipFee: number | null }) {
  const [s, action] = useFormState<RegisterState, FormData>(registerSquad.bind(null, slug), {});
  const [reset, setReset] = useState(0);
  useEffect(() => { if (s.error || s.fieldErrors) setReset((n) => n + 1); }, [s]);
  const e = s.fieldErrors ?? {};
  if (s.done) {
    const d = s.done;
    return (
      <div role="status" className="space-y-5 border border-gold/50 bg-ink-800/80 p-6">
        <p className="text-[11px] font-bold tracking-[0.3em] text-gold">REGISTRATION RECEIVED</p>
        <p className="font-display text-4xl font-black">{d.order_id}</p>
        <p className="text-sm text-steel-light">{d.tournament} · {d.tier} · entry fee <strong>€{d.fee}</strong></p>
        <p className="border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">Status: <strong>PAYMENT PENDING</strong>. Your squad is only confirmed once an admin verifies your payment on WhatsApp.</p>
        {d.wa ? <ButtonLink href={d.wa} target="_blank" rel="noopener noreferrer">PAY VIA WHATSAPP</ButtonLink> : <p className="text-sm text-steel-light">We will contact you on WhatsApp with the payment details. Keep your order ID.</p>}
      </div>
    );
  }
  return (
    <form action={action} className="space-y-8" noValidate>
      <fieldset className="space-y-4"><legend className="mb-2 text-[11px] font-bold tracking-[0.3em] text-gold">SQUAD</legend>
        <div className="grid gap-4 sm:grid-cols-3"><Field name="squad_name" label="Squad name" required error={e.squad_name} /><Field name="tag" label="Tag (optional)" maxLength={6} error={e.tag} /><Field name="captain_name" label="Captain name" required error={e.captain_name} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field name="whatsapp" label="Captain WhatsApp" type="tel" autoComplete="tel" placeholder="+212 6 00 00 00 00" required error={e.whatsapp} /><Field name="discord" label="Discord (optional)" error={e.discord} /></div>
        <div className="space-y-1.5"><span className="block text-[11px] font-bold uppercase tracking-wider2 text-steel">Entry</span>
          <div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="tier" value="NORMAL" defaultChecked className="accent-[#e0b02a]" />NORMAL · €{entryFee}</label><label className="flex items-center gap-2"><input type="radio" name="tier" value="VIP" className="accent-[#e0b02a]" />VIP · €{vipFee ?? entryFee}</label></div></div>
      </fieldset>
      <fieldset className="space-y-4"><legend className="mb-2 text-[11px] font-bold tracking-[0.3em] text-gold">PLAYERS (5)</legend>
        {[1, 2, 3, 4, 5].map((i) => <div key={i} className="grid gap-4 sm:grid-cols-2"><Field name={`p${i}_nickname`} label={`Player ${i} nickname`} required error={e[`p${i}_nickname`]} /><Field name={`p${i}_uid`} label={`Player ${i} UID`} inputMode="numeric" required error={e[`p${i}_uid`]} /></div>)}
      </fieldset>
      <div aria-hidden className="absolute -left-[9999px]"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <CaptchaField error={e.captcha} resetSignal={reset} />
      {s.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{s.error}</p>}
      <Submit />
      <p className="text-[11px] text-steel">Payment is made manually via WhatsApp after you register. Registering does not confirm your slot.</p>
    </form>
  );
}
