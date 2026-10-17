'use client';
import { Button } from '@/components/ui/button';
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <h1 className="font-display text-4xl font-black tracking-wider">SOMETHING WENT WRONG</h1>
      <p className="max-w-sm text-sm text-steel">An unexpected error occurred. Please try again.</p>
      <Button onClick={reset}>TRY AGAIN</Button>
    </main>
  );
}
