'use client';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { FormState } from '@/types/forms';

function Submit({ label, danger }: { label: string; danger?: boolean }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={danger ? 'danger' : 'primary'} disabled={pending}>{pending ? 'PLEASE WAIT…' : label}</Button>;
}
/** Server-action form with inline messages. `children` receives the latest state (field errors). */
export function AdminForm({ action, children, submit = 'SAVE', className }: {
  action: (s: FormState, fd: FormData) => Promise<FormState>; children: (s: FormState) => React.ReactNode; submit?: string; className?: string;
}) {
  const [s, formAction] = useFormState(action, {} as FormState);
  return (
    <form action={formAction} className={cn('space-y-5', className)} noValidate>
      {children(s)}
      {s.error && <p role="alert" className="border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{s.error}</p>}
      {s.message && <p role="status" className="border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">{s.message}</p>}
      <Submit label={submit} />
    </form>
  );
}
export function Select({ label, name, options, defaultValue }: { label: string; name: string; options: readonly string[]; defaultValue?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-[11px] font-bold uppercase tracking-wider2 text-steel">{label}</label>
      <select id={name} name={name} defaultValue={defaultValue} className="w-full border border-white/15 bg-ink-900 px-4 py-3 text-sm text-white focus:border-gold">
        {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    </div>
  );
}
export function Check({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return <label className="flex items-center gap-3 text-sm text-steel-light"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-[#e0b02a]" />{label}</label>;
}
/** Destructive actions always ask first. */
export function ConfirmButton({ label, message, action }: { label: string; message: string; action: (fd: FormData) => Promise<void> | void }) {
  return (
    <form action={action} onSubmit={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      <Button type="submit" variant="danger">{label}</Button>
    </form>
  );
}
export function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  return <div className={cn('grid gap-4', cols === 2 && 'sm:grid-cols-2', cols === 3 && 'sm:grid-cols-3', cols === 4 && 'sm:grid-cols-2 lg:grid-cols-4')}>{children}</div>;
}
