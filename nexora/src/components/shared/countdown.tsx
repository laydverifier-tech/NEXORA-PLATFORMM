'use client';
import { useEffect, useState } from 'react';

/**
 * Counts down to `target` using the SERVER clock: on mount it asks /api/time and cancels the device-clock offset
 * (cached pages can't leak a stale "now"). Until synced it shows a neutral placeholder instead of a wrong number.
 */
export function Countdown({ target, doneLabel = 'STARTED' }: { target: string; doneLabel?: string }) {
  const t = new Date(target).getTime();
  const [offset, setOffset] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    let alive = true;
    const t0 = Date.now();
    fetch('/api/time', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j: { now: number }) => { if (alive) setOffset(j.now - (t0 + Date.now()) / 2); })
      .catch(() => { if (alive) setOffset(0); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (offset === null) return;
    const tick = () => setNow(Date.now() + offset);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [offset]);
  if (!Number.isFinite(t)) return null;
  const ready = offset !== null && now > 0;
  const left = Math.max(0, t - now);
  if (ready && left === 0) return <p className="font-display text-2xl font-black tracking-wider2 text-gold">{doneLabel}</p>;
  const parts: [string, string, number][] = [['D', 'DAYS', Math.floor(left / 864e5)], ['H', 'HRS', Math.floor(left / 36e5) % 24], ['M', 'MIN', Math.floor(left / 6e4) % 60], ['S', 'SEC', Math.floor(left / 1e3) % 60]];
  return (
    <div role="timer" aria-busy={!ready} aria-label={ready ? `Time remaining: ${parts.map(([l, , v]) => `${v}${l}`).join(' ')}` : 'Loading countdown'} className="flex items-center gap-2 font-display text-3xl font-black tabular-nums sm:text-5xl">
      {parts.map(([l, label, v], i) => (
        <span key={l} className="flex items-center gap-2">
          <span className="flex flex-col items-center"><span>{ready ? String(v).padStart(2, '0') : '––'}</span><span className="text-[10px] font-bold tracking-wider2 text-steel">{label}</span></span>
          {i < 3 && <span aria-hidden className="pb-4 text-gold">:</span>}
        </span>
      ))}
    </div>
  );
}
