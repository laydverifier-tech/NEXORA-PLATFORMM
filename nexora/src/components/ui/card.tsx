import { cn } from '@/lib/utils/cn';
export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border border-white/10 bg-ink-800/80 p-6 backdrop-blur-sm', className)} {...p} />;
}
