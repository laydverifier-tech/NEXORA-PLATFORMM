'use client';
import { AdminForm } from '@/components/admin/form-kit';
import { Check } from '@/components/admin/form-kit';
import { saveRound } from './actions';

export function ResultsForm({ t, stage, round, squads, values }: { t: string; stage: string; round: number; squads: { id: string; squad_name: string; tag: string | null }[]; values: Record<string, { placement: number; kills: number }> }) {
  return (
    <AdminForm action={saveRound} submit="SAVE ROUND" key={`${t}-${stage}-${round}`}>
      {() => (<>
        <input type="hidden" name="t" value={t} /><input type="hidden" name="stage" value={stage} /><input type="hidden" name="round" value={round} />
        <div className="overflow-x-auto border border-white/10"><table className="w-full text-sm"><thead className="bg-ink-800 text-left text-[10px] tracking-wider2 text-steel"><tr><th className="p-3">SQUAD</th><th className="p-3">PLACEMENT</th><th className="p-3">KILLS</th></tr></thead>
          <tbody className="divide-y divide-white/10">{squads.map((s) => (
            <tr key={s.id}><td className="p-3 font-bold">{s.squad_name}{s.tag ? <span className="ml-2 text-xs text-steel">[{s.tag}]</span> : null}</td>
              <td className="p-2"><input aria-label={`${s.squad_name} placement`} name={`pl_${s.id}`} inputMode="numeric" defaultValue={values[s.id]?.placement ?? ''} className="w-20 border border-white/15 bg-ink-900 px-2 py-2" /></td>
              <td className="p-2"><input aria-label={`${s.squad_name} kills`} name={`ki_${s.id}`} inputMode="numeric" defaultValue={values[s.id]?.kills ?? ''} className="w-20 border border-white/15 bg-ink-900 px-2 py-2" /></td></tr>))}</tbody></table></div>
        <Check label="Announce on Discord after saving" name="announce" />
      </>)}
    </AdminForm>
  );
}
