import { ButtonLink } from '@/components/ui/button';
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="text-xs font-bold tracking-wider2 text-gold">404</p>
      <h1 className="font-display text-5xl font-black tracking-wider">PAGE NOT FOUND</h1>
      <p className="max-w-sm text-sm text-steel">This page does not exist or is no longer available.</p>
      <ButtonLink href="/">BACK HOME</ButtonLink>
    </main>
  );
}
