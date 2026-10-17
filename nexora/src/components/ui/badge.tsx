import { cn } from '@/lib/utils/cn';
const tones = {
  neutral: 'border-white/20 text-steel-light',
  gold: 'border-gold/60 text-gold',
  live: 'border-red-500/70 text-red-400',
  success: 'border-emerald-500/60 text-emerald-400',
  danger: 'border-red-500/60 text-red-400',
} as const;
export function Badge({ tone = 'neutral', className, ...p }: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return <span className={cn('inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider2', tones[tone], className)} {...p} />;
}
