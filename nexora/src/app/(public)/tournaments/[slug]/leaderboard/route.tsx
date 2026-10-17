import { ImageResponse } from 'next/og';
import { getLeaderboard, getResultStages, getTournament } from '@/services/content';

export const runtime = 'nodejs';
export const revalidate = 60;
const GOLD = '#e0b02a';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  if (!/^[a-z0-9][a-z0-9-]{1,80}$/.test(params.slug)) return new Response('Not found', { status: 404 });
  const t = await getTournament(params.slug); if (!t) return new Response('Not found', { status: 404 });
  const q = new URL(req.url).searchParams;
  const stages = await getResultStages(t.id);
  const stage = stages.includes(q.get('stage') ?? '') ? q.get('stage')! : (stages[0] ?? null);
  const rows = stage ? (await getLeaderboard(t.id, stage)).slice(0, 12) : [];
  const story = q.get('format') !== 'post';
  const W = 1080, H = story ? 1920 : 1350;
  const top = Math.min(20, Math.max(0, Number(q.get('top')) || (stage === 'GROUP_A' || stage === 'GROUP_B' || stage === 'LAST_CHANCE' ? 8 : 3)));
  const rowH = story ? 104 : 76;
  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg,#2a1d06,#0a0a0a 55%)', color: '#fff', padding: '70px 60px', fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', fontSize: 28, letterSpacing: 10, color: GOLD, fontWeight: 700 }}>NEXORA · {t.name.toUpperCase()}</div>
        <div style={{ display: 'flex', fontSize: story ? 120 : 96, fontWeight: 900, fontStyle: 'italic', marginTop: 20, color: GOLD }}>RESULTS</div>
        <div style={{ display: 'flex', fontSize: story ? 70 : 56, fontWeight: 900, marginBottom: 30 }}>{(stage ?? '').replace(/_/g, ' ')}</div>
        <div style={{ display: 'flex', fontSize: 20, letterSpacing: 4, color: '#9a9aa6', padding: '0 20px 10px', fontWeight: 700 }}>
          <div style={{ display: 'flex', width: 90 }}>RANK</div><div style={{ display: 'flex', flex: 1 }}>SQUAD</div><div style={{ display: 'flex', width: 120, justifyContent: 'flex-end' }}>KILLS</div><div style={{ display: 'flex', width: 90, justifyContent: 'flex-end' }}>B!</div><div style={{ display: 'flex', width: 130, justifyContent: 'flex-end' }}>PTS</div>
        </div>
        {rows.map((r) => {
          const q8 = r.rank <= top;
          return (
            <div key={r.rank + r.squad_name} style={{ display: 'flex', alignItems: 'center', height: rowH, margin: '5px 0', padding: '0 20px', background: q8 ? 'linear-gradient(90deg,#f5d060,#d9a41c)' : 'rgba(255,255,255,0.08)', color: q8 ? '#000' : '#fff', fontSize: story ? 38 : 32, fontWeight: 800 }}>
              <div style={{ display: 'flex', width: 90, fontSize: story ? 44 : 36 }}>{r.rank}</div><div style={{ display: 'flex', flex: 1 }}>{r.squad_name.slice(0, 22)}</div>
              <div style={{ display: 'flex', width: 120, justifyContent: 'flex-end' }}>{r.kills}</div><div style={{ display: 'flex', width: 90, justifyContent: 'flex-end' }}>{r.booyahs}</div><div style={{ display: 'flex', width: 130, justifyContent: 'flex-end', fontSize: story ? 46 : 38 }}>{Number(r.points)}</div>
            </div>
          );
        })}
        {!rows.length && <div style={{ display: 'flex', fontSize: 36, color: '#9a9aa6', marginTop: 40 }}>No results yet.</div>}
        <div style={{ display: 'flex', flex: 1 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, fontWeight: 800, color: GOLD, letterSpacing: 4 }}><div style={{ display: 'flex' }}>#GONEXORA</div><div style={{ display: 'flex' }}>@nexora_tour</div></div>
      </div>
    ),
    { width: W, height: H, headers: { 'cache-control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
