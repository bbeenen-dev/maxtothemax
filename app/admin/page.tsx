// app/admin/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Haal het profiel op om te checken of iemand admin is
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user?.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/'); // Stuur niet-admins direct terug
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">F1 Admin Dashboard</h1>
      {/* Hier komen je knoppen voor resultaten en de "slacker-lijst" */}
    </div>
  );
}