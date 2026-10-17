import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const base = 'inline-flex items-center justify-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider2 transition-colors disabled:opacity-50 disabled:pointer-events-none [clip-path:polygon(10px_0,100%_0,calc(100%-10px)_100%,0_100%)]';
const variants = {
  primary: 'bg-gold text-black hover:bg-gold-soft',
  outline: 'border border-white/25 text-white hover:border-gold hover:text-gold [clip-path:none]',
  ghost: 'text-steel-light hover:text-white [clip-path:none]',
  danger: 'bg-red-600 text-white hover:bg-red-500',
} as const;
type Variant = keyof typeof variants;

export function Button({ variant = 'primary', className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn(base, variants[variant], className)} {...p} />;
}
export function ButtonLink({ variant = 'primary', className, ...p }: React.ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(base, variants[variant], className)} {...p} />;
}
