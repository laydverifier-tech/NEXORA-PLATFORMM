import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function Section({ className, children, id }: { className?: string; children: React.ReactNode; id?: string }) {
  return <section id={id} className={cn('mx-auto max-w-7xl px-5 py-16 sm:py-20', className)}>{children}</section>;
}
export function SectionHeading({ eyebrow, title, href, cta }: { eyebrow?: string; title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-[11px] font-bold tracking-[0.35em] text-gold">{eyebrow}</p>}
        <h2 className="font-display text-3xl font-black tracking-wider sm:text-4xl">{title}</h2>
      </div>
      {href && <Link href={href} className="shrink-0 text-[11px] font-bold tracking-wider2 text-steel-light hover:text-gold">{cta ?? 'VIEW ALL'} →</Link>}
    </div>
  );
}
export function PageHero({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="border-b border-white/10 bg-[radial-gradient(ellipse_at_top,rgba(224,176,42,0.10),transparent_60%)]">
      <div className="mx-auto max-w-7xl px-5 pb-14 pt-32 sm:pb-20 sm:pt-40">
        {eyebrow && <p className="mb-3 text-[11px] font-bold tracking-[0.35em] text-gold">{eyebrow}</p>}
        <h1 className="break-words font-display text-3xl font-black tracking-wider sm:text-6xl">{title}</h1>
        {children && <div className="mt-4 max-w-2xl text-steel-light">{children}</div>}
      </div>
    </header>
  );
}
export function EmptyState({ title, text, children }: { title: string; text?: string; children?: React.ReactNode }) {
  return (
    <div className="border border-dashed border-white/15 px-6 py-12 text-center">
      <p className="font-display text-xl font-black tracking-wider2">{title}</p>
      {text && <p className="mx-auto mt-2 max-w-md text-sm text-steel">{text}</p>}
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  );
}
