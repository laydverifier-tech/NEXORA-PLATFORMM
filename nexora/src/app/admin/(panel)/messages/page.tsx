import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { Button } from '@/components/ui/button';
import { LocalTime } from '@/components/shared/local-time';
import { messageOp } from './actions';

function Op({ id, op, label, danger }: { id: string; op: string; label: string; danger?: boolean }) {
  return <form action={messageOp}><input type="hidden" name="id" value={id} /><input type="hidden" name="op" value={op} /><Button type="submit" variant={danger ? 'danger' : 'outline'} className="!px-3 py-1.5">{label}</Button></form>;
}
export default async function MessagesAdmin() {
  const ctx = await adminPage('/admin/messages'); if (!ctx) notFound();
  const { data } = await ctx.supabase.from('contact_messages').select('id,name,email,subject,message,is_read,created_at').order('created_at', { ascending: false }).limit(200);
  return (
    <main className="space-y-6">
      <h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">MESSAGES</h1>
      {!data?.length && <p className="border border-dashed border-white/15 p-8 text-center text-sm text-steel">Inbox is empty.</p>}
      <div className="space-y-3">{(data ?? []).map((m) => (
        <article key={m.id} className={`min-w-0 break-words border p-4 sm:p-5 ${m.is_read ? 'border-white/10' : 'border-gold/50 bg-gold/5'}`}>
          <div className="flex flex-wrap justify-between gap-2"><h2 className="font-bold">{m.subject}</h2><span className="text-xs text-steel"><LocalTime iso={m.created_at} /></span></div>
          <p className="text-xs text-steel">{m.name} · <a className="text-gold hover:underline" href={`mailto:${encodeURIComponent(m.email).replace('%40', '@')}`}>{m.email}</a></p>
          <p className="mt-3 whitespace-pre-line text-sm text-steel-light">{m.message}</p>
          <div className="mt-4 flex gap-2"><Op id={m.id} op={m.is_read ? 'unread' : 'read'} label={m.is_read ? 'MARK UNREAD' : 'MARK READ'} /><Op id={m.id} op="delete" label="DELETE" danger /></div>
        </article>))}</div>
    </main>
  );
}
