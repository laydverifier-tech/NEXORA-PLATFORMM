import { notFound } from 'next/navigation';
import { adminPage } from '@/lib/admin/context';
import { NewsForm } from '../news-form';
export default async function NewArticle() {
  if (!(await adminPage('/admin/news/new'))) notFound();
  return <main className="max-w-3xl space-y-6"><h1 className="break-words font-display text-xl font-black tracking-wider sm:text-3xl sm:tracking-wider2">NEW ARTICLE</h1><NewsForm /></main>;
}
