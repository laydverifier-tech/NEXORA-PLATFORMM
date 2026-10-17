export const dynamic = 'force-dynamic';
/** Authoritative server clock for countdowns (display only — security-sensitive timing is enforced in the DB). */
export function GET() {
  return Response.json({ now: Date.now() }, { headers: { 'Cache-Control': 'no-store' } });
}
