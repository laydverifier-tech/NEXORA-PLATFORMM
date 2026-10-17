import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { TournamentForm } from '../tournament-form';

export default async function NewTournament() {
  if (!(await adminPage('/admin/tournaments/new'))) notFound();
  return <main className="max-w-4xl space-y-6"><h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">NEW TOURNAMENT</h1><TournamentForm /></main>;
}
