import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED = ['/admin'];
const isProtected = (p: string) => p.startsWith('/admin') && !p.startsWith('/admin/login');
const NOINDEX = ['/admin', '/auth'];

/** Refreshes the Supabase session cookie and does the COARSE auth gate. Role checks happen server-side in layouts + RLS. */
export async function updateSession(request: NextRequest) {
  // Admin pages get a STRICT nonce-based CSP (no 'unsafe-inline' scripts); Next.js applies the nonce to its own scripts.
  let csp = '';
  const isAdmin = request.nextUrl.pathname.startsWith('/admin');
  const nonce = isAdmin ? btoa(crypto.randomUUID()) : '';
  if (isAdmin) {
    let origin = ''; try { origin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').origin; } catch { /* unset */ }
    const dev = process.env.NODE_ENV !== 'production';
    csp = ["default-src 'self'", `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`, "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob: https:", "media-src 'self' https:", "font-src 'self' data:", `connect-src 'self' ${origin}${dev ? ' ws: wss:' : ''}`.trim(), "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'", "object-src 'none'"].join('; ');
  }
  const mkNext = () => {
    const h = new Headers(request.headers);
    if (isAdmin) { h.set('x-nonce', nonce); h.set('Content-Security-Policy', csp); }
    return NextResponse.next({ request: { headers: h } });
  };
  let response = mkNext();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;

  if (!url || !anon) {
    // Not configured yet: never let protected areas render without auth.
    if (isProtected(pathname)) return NextResponse.redirect(new URL('/admin/login', request.url));
    return response;
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list: { name: string; value: string; options: CookieOptions }[]) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = mkNext();
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() validates the JWT with Supabase Auth. Never trust getSession() on the server.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && isProtected(pathname)) {
    const login = new URL('/admin/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }
  if (NOINDEX.some((p) => pathname.startsWith(p))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set('Cache-Control', 'private, no-store'); // never cache auth/private areas; public pages stay cacheable
  }
  if (csp) response.headers.set('Content-Security-Policy', csp);
  return response;
}
