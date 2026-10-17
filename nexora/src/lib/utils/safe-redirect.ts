/** Only allow same-site relative paths (blocks open redirects like //evil.com or https://evil.com). */
export function safeRedirectPath(input: unknown, fallback = '/'): string {
  if (typeof input !== 'string') return fallback;
  if (!input.startsWith('/') || input.startsWith('//') || input.includes('\\')) return fallback;
  if (/[\u0000-\u001f]/.test(input)) return fallback;
  return input;
}
