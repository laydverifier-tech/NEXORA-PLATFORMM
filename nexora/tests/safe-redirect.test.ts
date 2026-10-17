import { describe, it, expect } from 'vitest';
import { safeRedirectPath } from '../src/lib/utils/safe-redirect';
import { registerSchema, loginSchema } from '../src/lib/validation/auth';

describe('safeRedirectPath', () => {
  it('allows relative paths', () => expect(safeRedirectPath('/captain/dashboard')).toBe('/captain/dashboard'));
  it.each(['//evil.com', 'https://evil.com', '/\\evil.com', 'javascript:alert(1)', '/a\nb', undefined, 5])('blocks %p', (v) => expect(safeRedirectPath(v, '/x')).toBe('/x'));
});
describe('auth schemas', () => {
  it('rejects weak password', () => expect(registerSchema.safeParse({ email: 'a@b.co', password: 'short', displayName: 'Adam' }).success).toBe(false));
  it('accepts strong registration', () => expect(registerSchema.safeParse({ email: 'A@B.co', password: 'Str0ngPassword', displayName: 'Nex.Adam' }).success).toBe(true));
  it('normalizes email', () => { const r = loginSchema.parse({ email: ' A@B.CO ', password: 'x' }); expect(r.email).toBe('a@b.co'); });
});
