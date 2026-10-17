'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { mainNav } from '@/config/site';
import { Logo } from '@/components/shared/logo';
import { ButtonLink } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export function Navbar() {
  const [compact, setCompact] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setCompact(window.scrollY > 24);
    on(); window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={cn('fixed inset-x-0 top-0 z-50 border-b transition-all', compact ? 'border-white/10 bg-ink-950/90 py-2 backdrop-blur' : 'border-transparent bg-transparent py-5')}>
      <nav aria-label="Main" className="mx-auto flex max-w-7xl items-center justify-between px-5">
        <Logo />
        <ul className="hidden items-center gap-7 lg:flex">
          {mainNav.map((n) => <li key={n.href}><Link href={n.href} className="text-[11px] font-bold tracking-wider2 text-steel-light transition-colors hover:text-gold">{n.label}</Link></li>)}
        </ul>
        <div className="hidden items-center gap-3 lg:flex">
          <ButtonLink href="/discord" prefetch={false} variant="outline">JOIN DISCORD</ButtonLink>
        </div>
        <button className="lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label="Toggle menu" onClick={() => setOpen(!open)}>
          <span className="block h-0.5 w-6 bg-white" /><span className="mt-1.5 block h-0.5 w-6 bg-white" /><span className="mt-1.5 block h-0.5 w-4 bg-gold" />
        </button>
      </nav>
      {open && (
        <div id="mobile-nav" className="border-t border-white/10 bg-ink-950 px-5 pb-6 pt-4 lg:hidden">
          <ul className="space-y-1">
            {mainNav.map((n) => <li key={n.href}><Link onClick={() => setOpen(false)} href={n.href} className="block py-3 text-sm font-bold tracking-wider2">{n.label}</Link></li>)}
            <li><Link onClick={() => setOpen(false)} href="/discord" prefetch={false} className="block py-3 text-sm font-bold tracking-wider2 text-gold">JOIN DISCORD</Link></li>
          </ul>
        </div>
      )}
    </header>
  );
}
