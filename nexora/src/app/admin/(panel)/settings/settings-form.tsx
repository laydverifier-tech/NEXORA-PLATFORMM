'use client';
import { AdminForm, Grid } from '@/components/admin/form-kit';
import { Field } from '@/components/ui/field';
import { saveSettings } from './actions';

type J = Record<string, string | number | null | undefined>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));
function H({ children }: { children: React.ReactNode }) { return <h2 className="border-b border-white/10 pb-2 pt-4 text-[11px] font-bold tracking-[0.3em] text-gold">{children}</h2>; }

export function SettingsForm({ site, social, hero, stats }: { site: J; social: J; hero: J; stats: J }) {
  return (
    <AdminForm action={saveSettings} submit="SAVE SETTINGS">
        {(f) => { const e = f.fieldErrors ?? {}; return (<>
          <H>SITE</H>
          <Grid cols={3}><Field name="site_name" label="Site name" defaultValue={s(site.name) || 'NEXORA'} required error={e.site_name} /><Field name="site_tagline" label="Tagline" defaultValue={s(site.tagline)} /><Field name="site_hashtag" label="Hashtag" defaultValue={s(site.hashtag)} /></Grid>
          <Field name="contact_email" label="Public contact email" type="email" defaultValue={s(site.contact_email)} error={e.contact_email} />
          <H>HOME HERO</H>
          <Grid cols={3}><Field name="hero_eyebrow" label="Small text above" defaultValue={s(hero.eyebrow)} /><Field name="hero_title" label="Big title" defaultValue={s(hero.title) || 'NEXORA'} required error={e.hero_title} /><Field name="hero_tagline" label="Tagline" defaultValue={s(hero.tagline)} /></Grid>
          <Grid><Field name="cta1_label" label="Button 1 label" defaultValue={s(hero.cta1_label)} /><Field name="cta1_href" label="Button 1 link (/path or https://)" defaultValue={s(hero.cta1_href)} error={e.cta1_href} /><Field name="cta2_label" label="Button 2 label" defaultValue={s(hero.cta2_label)} /><Field name="cta2_href" label="Button 2 link" defaultValue={s(hero.cta2_href)} error={e.cta2_href} /></Grid>
          <Grid><Field name="video_url" label="Hero video URL (https, mp4/webm)" defaultValue={s(hero.video_url)} error={e.video_url} /><Field name="poster_url" label="Hero poster image URL (https)" defaultValue={s(hero.poster_url)} error={e.poster_url} /></Grid>
          <H>SOCIAL MEDIA</H>
          <Grid><Field name="tournament_handle" label="Tournament handle" defaultValue={s(social.tournament_handle)} /><Field name="gaming_handle" label="Gaming handle" defaultValue={s(social.gaming_handle)} /></Grid>
          <Grid cols={3}>{(['instagram_url', 'tiktok_url', 'youtube_url', 'twitch_url', 'x_url', 'discord_url'] as const).map((k) => <Field key={k} name={k} label={`${k.replace('_url', '').toUpperCase()} (https)`} defaultValue={s(social[k])} error={e[k]} />)}</Grid>
          <H>OFFICIAL STATS (leave empty = “COMING SOON”)</H>
          <Grid cols={3}>{(['tournaments', 'players', 'teams', 'countries', 'total_views', 'community'] as const).map((k) => <Field key={k} name={`stat_${k}`} label={k.replace('_', ' ').toUpperCase()} defaultValue={s(stats[k])} />)}</Grid>
        </>); }}
      </AdminForm>
  );
}
