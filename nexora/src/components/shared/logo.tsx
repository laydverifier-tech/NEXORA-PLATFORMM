import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export function Logo({ className, wordmark = true, size = 40 }: { className?: string; wordmark?: boolean; size?: number }) {
  return (
    <Link href="/" aria-label="NEXORA home" className={cn('flex items-center gap-3', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.png" alt="" width={size} height={Math.round(size * 0.86)} className="w-auto" style={{ height: size }} />
      {wordmark && <span className="font-display text-2xl font-black tracking-[0.3em]">NEXORA</span>}
    </Link>
  );
}
