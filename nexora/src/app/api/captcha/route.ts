import { NextResponse } from 'next/server';
import { createChallenge } from '@/lib/security/captcha';
import { rateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';
export async function GET() {
  if (!(await rateLimit('captcha', 40, 600)).ok) return new NextResponse(null, { status: 429 });
  return NextResponse.json(createChallenge(), { headers: { 'Cache-Control': 'no-store' } });
}
