import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { RosterForm } from '../roster-form';
export default async function NewPlayer() {
  if (!(await adminPage('/admin/roster/new'))) notFound();
  return <main className="max-w-3xl space-y-6"><h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">ADD PLAYER</h1><RosterForm /></main>;
}
