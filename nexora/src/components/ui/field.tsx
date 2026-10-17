import { cn } from '@/lib/utils/cn';
type P = React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };
export function Field({ label, error, id, className, ...p }: P) {
  const fid = id ?? p.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={fid} className="block text-[11px] font-bold uppercase tracking-wider2 text-steel">{label}</label>
      <input id={fid} aria-invalid={!!error} className={cn('w-full border border-white/15 bg-ink-900 px-4 py-3 text-sm text-white placeholder:text-steel/60 focus:border-gold', className)} {...p} />
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function TextArea({ label, error, id, className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  const fid = id ?? p.name;
  return (
    <div className="space-y-1.5">
      <label htmlFor={fid} className="block text-[11px] font-bold uppercase tracking-wider2 text-steel">{label}</label>
      <textarea id={fid} aria-invalid={!!error} rows={6} className={cn('w-full border border-white/15 bg-ink-900 px-4 py-3 text-sm text-white placeholder:text-steel/60 focus:border-gold', className)} {...p} />
      {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
