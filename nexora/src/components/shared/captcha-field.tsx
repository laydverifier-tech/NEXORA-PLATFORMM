'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => void } } }

/** Renders Cloudflare Turnstile when configured, otherwise the built-in image captcha (token + answer fields). */
export function CaptchaField({ error, resetSignal }: { error?: string; resetSignal?: number }) {
  const [c, setC] = useState<{ token: string; image: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const load = useCallback(() => { setC(null); setFailed(false); fetch('/api/captcha', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : Promise.reject())).then(setC).catch(() => setFailed(true)); }, []);
  useEffect(() => { if (!SITE_KEY) load(); }, [load, resetSignal]);
  useEffect(() => {
    if (!SITE_KEY || !box.current) return;
    const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'; s.async = true;
    s.onload = () => window.turnstile?.render(box.current!, { sitekey: SITE_KEY, theme: 'dark' }); document.head.appendChild(s);
    return () => { s.remove(); };
  }, []);
  if (SITE_KEY) return <div><div ref={box} /><p role="alert" className="mt-1 text-xs text-red-400">{error}</p></div>;
  return (
    <div className="space-y-1.5">
      <span className="block text-[11px] font-bold uppercase tracking-wider2 text-steel">Security check</span>
      <div className="flex flex-wrap items-center gap-3">
        {c ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.image} width={190} height={64} alt="Captcha: type the 5 characters shown" className="border border-white/15" /> : <div className="flex h-16 w-[190px] items-center justify-center border border-white/15 text-xs text-steel">{failed ? 'Could not load' : 'Loading…'}</div>}
        <button type="button" onClick={load} className="text-[11px] font-bold tracking-wider2 text-gold hover:underline">NEW CODE</button>
      </div>
      <input type="hidden" name="captcha_token" value={c?.token ?? ''} />
      <input name="captcha_answer" required maxLength={5} autoComplete="off" autoCapitalize="characters" inputMode="text" aria-label="Captcha answer" placeholder="Type the code" className="w-full max-w-[190px] border border-white/15 bg-ink-900 px-4 py-3 text-sm uppercase tracking-[0.3em] text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-steel/60 focus:border-gold" />
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
