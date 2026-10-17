'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { Field, TextArea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { CaptchaField } from '@/components/shared/captcha-field';
import { useEffect, useState } from 'react';
import { sendContact, type ContactState } from './actions';

function Submit() { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending}>{pending ? 'SENDING…' : 'SEND MESSAGE'}</Button>; }

export function ContactForm({ subject }: { subject: string }) {
  const [s, action] = useFormState<ContactState, FormData>(sendContact, {});
  const [n, setN] = useState(0);
  useEffect(() => { if (s.error || s.fieldErrors) setN((x) => x + 1); }, [s]);
  if (s.message) return <p role="status" className="border border-emerald-500/40 p-6 text-emerald-400">{s.message}</p>;
  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2"><Field name="name" label="Name" autoComplete="name" required error={s.fieldErrors?.name} /><Field name="email" label="Email" type="email" autoComplete="email" required error={s.fieldErrors?.email} /></div>
      <Field name="subject" label="Subject" defaultValue={subject} required error={s.fieldErrors?.subject} />
      <TextArea name="message" label="Message" required error={s.fieldErrors?.message} />
      <div aria-hidden className="absolute -left-[9999px]"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <CaptchaField error={s.fieldErrors?.captcha} resetSignal={n} />
      {s.error && <p role="alert" className="text-sm text-red-400">{s.error}</p>}
      <Submit />
    </form>
  );
}
