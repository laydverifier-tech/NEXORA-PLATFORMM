import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { GiveawayForm } from '../giveaway-form';
export default async function NewGiveaway() {
  if (!(await adminPage('/admin/giveaways/new'))) notFound();
  return <main className="max-w-3xl space-y-6"><h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">NEW GIVEAWAY</h1><GiveawayForm /></main>;
}
