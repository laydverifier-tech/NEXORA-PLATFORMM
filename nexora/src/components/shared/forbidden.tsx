import { ButtonLink } from '@/components/ui/button';
export function Forbidden() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-xs font-bold tracking-wider2 text-gold">403</p>
      <h1 className="font-display text-4xl font-black tracking-wider">ACCESS DENIED</h1>
      <p className="max-w-sm text-sm text-steel">Your account does not have permission to view this area.</p>
      <ButtonLink href="/" variant="outline">BACK HOME</ButtonLink>
    </main>
  );
}
