import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { PageViewTracker } from '@/components/shared/pageview';
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:bg-gold focus:px-4 focus:py-2 focus:text-black">Skip to content</a>
      <Navbar />
      <div id="main" className="min-h-screen">{children}</div>
      <Footer />
      <PageViewTracker />
    </>
  );
}
