'use client';
import { useEffect, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Field } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { CaptchaField } from '@/components/shared/captcha-field';
import { enterGiveaway, type EntryState } from './actions';

function Submit() { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending}>{pending ? 'SENDING…' : 'ENTER GIVEAWAY'}</Button>; }
export function EntryForm({ slug }: { slug: string }) {
  const [s, action] = useFormState<EntryState, FormData>(enterGiveaway.bind(null, slug), {});
  const [reset, setReset] = useState(0);
  useEffect(() => { if (s.error || s.fieldErrors) setReset((n) => n + 1); }, [s]);
  if (s.message) return <p role="status" className="border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-300">{s.message}</p>;
  return (
    <form action={action} className="space-y-4" noValidate>
      <Field name="contact" label="Your email or Discord / Instagram handle" required autoComplete="email" error={s.fieldErrors?.contact} />
      <div aria-hidden className="absolute -left-[9999px]"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <CaptchaField error={s.fieldErrors?.captcha} resetSignal={reset} />
      {s.error && <p role="alert" className="text-sm text-red-400">{s.error}</p>}
      <Submit />
      <p className="text-[11px] text-steel">One entry per contact. Your contact is only used to reach the winner.</p>
    </form>
  );
}
