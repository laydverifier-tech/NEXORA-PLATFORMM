export const metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';
export default function MfaLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-12">
      <div className="w-full max-w-md border border-white/10 bg-ink-800/80 p-8">
        <p className="mb-6 font-display text-2xl font-black tracking-[0.3em]">NEXORA</p>
        {children}
      </div>
    </main>
  );
}
