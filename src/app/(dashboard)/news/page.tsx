import { redirect } from 'next/navigation';

// News Feed feature has been removed. Redirect to dashboard.
export default function NewsPage() {
  redirect('/dashboard');
}
