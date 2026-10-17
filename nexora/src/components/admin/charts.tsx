/** Dependency-free SVG bar chart (server-renderable, accessible via <title>/<desc>). */
export function BarChart({ data, label }: { data: { label: string; value: number; sub?: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 700, H = 160, bw = W / Math.max(1, data.length);
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 24}`} role="img" aria-label={label} className="w-full">
        <title>{label}</title>
        {data.map((d, i) => {
          const h = Math.max(2, (d.value / max) * H);
          return (
            <g key={d.label + i}>
              <rect x={i * bw + 2} y={H - h} width={Math.max(2, bw - 4)} height={h} fill="#e0b02a" opacity={0.9}><title>{`${d.label}: ${d.value} views${d.sub !== undefined ? `, ${d.sub} visitors` : ''}`}</title></rect>
              {(i % Math.ceil(data.length / 8) === 0) && <text x={i * bw + bw / 2} y={H + 16} textAnchor="middle" fontSize="10" fill="#9a9aa6">{d.label}</text>}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
export function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="border border-white/10 bg-ink-800/80 p-5">
      <p className="text-[10px] font-bold tracking-wider2 text-steel">{label}</p>
      <p className="mt-2 font-display text-3xl font-black">{typeof value === 'number' ? value.toLocaleString('en-GB') : value}</p>
      {hint && <p className="mt-1 text-[10px] text-steel">{hint}</p>}
    </div>
  );
}
export function RankList({ title, rows, empty = 'No data yet' }: { title: string; rows: { name: string; n: number }[]; empty?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="border border-white/10 bg-ink-800/80 p-5">
      <h3 className="mb-3 text-[11px] font-bold tracking-wider2 text-gold">{title}</h3>
      {rows.length === 0 ? <p className="text-xs text-steel">{empty}</p> : (
        <ul className="space-y-2">{rows.map((r) => (
          <li key={r.name} className="text-xs"><div className="flex justify-between gap-3"><span className="truncate text-steel-light">{r.name}</span><span className="font-bold">{r.n.toLocaleString('en-GB')}</span></div><div className="mt-1 h-1 bg-white/10"><div className="h-1 bg-gold" style={{ width: `${(r.n / max) * 100}%` }} /></div></li>))}
        </ul>)}
    </div>
  );
}
