'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';

const CODE = /^\d{6}$/;

export function EnrollMfa({ next }: { next: string }) {
  const router = useRouter();
  const started = useRef(false);
  const [qr, setQr] = useState(''); const [secret, setSecret] = useState(''); const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (started.current) return; started.current = true;
    (async () => {
      const sb = createClient();
      const { data: list } = await sb.auth.mfa.listFactors();
      for (const f of list?.all ?? []) if (f.status === 'unverified') await sb.auth.mfa.unenroll({ factorId: f.id }); // drop abandoned attempts
      const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: `NEXORA ${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 6)}` });
      if (error || !data) { setErr('Could not start authenticator setup. Make sure TOTP is enabled in Supabase Auth → MFA.'); return; }
      setQr(data.totp.qr_code); setSecret(data.totp.secret); setFactorId(data.id);
    })();
  }, []);
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (!CODE.test(code)) return setErr('Enter the 6-digit code from your authenticator app.');
    setBusy(true);
    const sb = createClient();
    const ch = await sb.auth.mfa.challenge({ factorId });
    if (ch.error || !ch.data) { setBusy(false); return setErr('Challenge failed. Refresh and try again.'); }
    const v = await sb.auth.mfa.verify({ factorId, challengeId: ch.data.id, code });
    if (v.error) { setBusy(false); return setErr('Invalid code. Check your phone clock and try again.'); }
    router.replace(next); router.refresh();
  }
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-black tracking-wider2">SET UP 2-STEP VERIFICATION</h1>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-steel-light"><li>Open Google Authenticator, Microsoft Authenticator, Authy or 1Password.</li><li>Scan the QR code (or type the key).</li><li>Enter the 6-digit code to finish.</li></ol>
      {qr ? <div className="flex flex-col items-center gap-3 bg-white p-4">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={qr} alt="Authenticator QR code" className="h-48 w-48" /></div> : !err && <p className="text-sm text-steel">Generating QR code…</p>}
      {secret && <p className="break-all border border-white/10 p-3 font-mono text-xs text-steel-light">Key: {secret}</p>}
      <form onSubmit={verify} className="space-y-4" noValidate>
        <Field name="code" label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
        {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
        <Button type="submit" disabled={busy || !factorId} className="w-full">{busy ? 'VERIFYING…' : 'ACTIVATE & CONTINUE'}</Button>
      </form>
      <p className="text-[11px] text-steel">Tip: enroll a second authenticator later (Security page) as a backup.</p>
    </div>
  );
}

export function VerifyMfa({ next }: { next: string }) {
  const router = useRouter();
  const [code, setCode] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function verify(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (!CODE.test(code)) return setErr('Enter the 6-digit code.');
    setBusy(true);
    const sb = createClient();
    const { data: list } = await sb.auth.mfa.listFactors();
    const f = list?.totp?.[0];
    if (!f) { router.replace(`/admin/mfa/enroll?next=${encodeURIComponent(next)}`); return; }
    const ch = await sb.auth.mfa.challenge({ factorId: f.id });
    if (ch.error || !ch.data) { setBusy(false); return setErr('Challenge failed. Try again.'); }
    const v = await sb.auth.mfa.verify({ factorId: f.id, challengeId: ch.data.id, code });
    if (v.error) { setBusy(false); setCode(''); return setErr('Invalid or expired code.'); }
    router.replace(next); router.refresh();
  }
  return (
    <form onSubmit={verify} className="space-y-5" noValidate>
      <h1 className="font-display text-2xl font-black tracking-wider2">VERIFICATION CODE</h1>
      <p className="text-sm text-steel-light">Open your authenticator app and enter the current 6-digit code for NEXORA.</p>
      <Field name="code" label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
      {err && <p role="alert" className="text-sm text-red-400">{err}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'VERIFYING…' : 'VERIFY'}</Button>
    </form>
  );
}
