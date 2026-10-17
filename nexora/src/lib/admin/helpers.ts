export const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const toInput = (iso?: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : ''); // UTC for <input type="datetime-local">
/** Friendly, non-leaky messages for database errors (raw errors are only logged server-side). */
export function dbMessage(e: { code?: string; message: string }, what = 'item'): string {
  console.error('[admin-db]', e.code, e.message);
  if (e.code === '23505') return `This ${what} already exists (duplicate slug or name).`;
  if (e.code === '42501') return 'Not allowed. Your session needs 2-step verification and the right permission.';
  if (e.code === '23514' || e.code === '23502' || e.code === '22P02') return 'Some values are not valid. Please check the fields.';
  return 'Could not save. Please try again.';
}
export const csvCell = (v: unknown) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`; }; // blocks CSV formula injection
