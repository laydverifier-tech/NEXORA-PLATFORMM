'use client';
import { useEffect, useRef, useState } from 'react';
import { ButtonLink } from '@/components/ui/button';
import type { HeroSettings } from '@/types/content';

const safeHref = (h: string | undefined, fb: string) => (h && (/^\/(?!\/)/.test(h) || /^https:\/\//.test(h)) ? h : fb);
const isHttps = (u?: string | null): u is string => !!u && /^https:\/\//.test(u);

/**
 * Cinematic hero (all texts/media editable from the admin panel). Never autoplays with sound, never blocks rendering:
 * the poster is plain CSS, the <video> mounts after window load, is skipped for reduced-motion / data-saver, and can be paused.
 */
export function Hero({ hero, name }: { hero: HeroSettings; name: string }) {
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(true);
  const ref = useRef<HTMLVideoElement>(null);
  const poster = isHttps(hero.poster_url) ? hero.poster_url : '/media/hero-poster.jpg';
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saver = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (reduce || saver) return;
    const start = () => setEnabled(true);
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
    return () => window.removeEventListener('load', start);
  }, []);
  const toggle = () => { const v = ref.current; if (!v) return; if (v.paused) { void v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); } };
  const custom = isHttps(hero.video_url) ? hero.video_url : null;
  return (
    <section aria-label={name} className="relative isolate flex min-h-[92svh] items-center overflow-hidden bg-ink-950 bg-cover bg-center" style={{ backgroundImage: `url(${poster})` }}>
      {enabled && (
        <video ref={ref} className="absolute inset-0 -z-10 h-full w-full object-cover" autoPlay muted loop playsInline preload="auto" poster={poster} aria-hidden="true" tabIndex={-1}>
          {custom ? <source src={custom} type={custom.endsWith('.webm') ? 'video/webm' : 'video/mp4'} /> : (<>
            <source src="/media/hero-sm.webm" type="video/webm" media="(max-width: 767px)" />
            <source src="/media/hero-sm.mp4" type="video/mp4" media="(max-width: 767px)" />
            <source src="/media/hero.webm" type="video/webm" />
            <source src="/media/hero.mp4" type="video/mp4" />
          </>)}
        </video>
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink-950/85 via-ink-950/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-ink-950 to-transparent" />
      <div className="mx-auto w-full max-w-7xl px-5 pt-20">
        {hero.eyebrow && <p className="mb-5 text-[11px] font-bold tracking-[0.5em] text-gold">{hero.eyebrow}</p>}
        <h1 className="font-display text-[16vw] font-black leading-[0.85] tracking-[0.06em] sm:text-[12vw] lg:text-[11rem]">{hero.title || name}</h1>
        {hero.tagline && <p className="mt-5 text-base font-bold tracking-[0.4em] text-steel-light sm:text-xl">{hero.tagline}</p>}
        <div className="mt-10 flex flex-wrap gap-3">
          {hero.cta1_label && <ButtonLink href={safeHref(hero.cta1_href, '/about')}>{hero.cta1_label}</ButtonLink>}
          {hero.cta2_label && <ButtonLink href={safeHref(hero.cta2_href, '/tournaments')} variant="outline">{hero.cta2_label}</ButtonLink>}
        </div>
      </div>
      {enabled && <button onClick={toggle} aria-label={playing ? 'Pause background video' : 'Play background video'} className="absolute bottom-6 right-5 border border-white/25 bg-ink-950/60 px-3 py-2 text-[10px] font-bold tracking-wider2 text-steel-light backdrop-blur hover:border-gold hover:text-gold">{playing ? 'PAUSE' : 'PLAY'}</button>}
    </section>
  );
}
