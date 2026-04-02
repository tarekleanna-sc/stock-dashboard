import { redirect } from 'next/navigation';

// Price Alerts feature has been removed. Redirect to dashboard.
export default function AlertsPage() {
  redirect('/dashboard');
}
