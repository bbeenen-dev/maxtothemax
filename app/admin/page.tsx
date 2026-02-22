// app/admin/page.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login'); 
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-blue-500">
            F1 Admin <span className="text-white">Dashboard</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">
            Paddock Beheer • {user.email}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Uitslagen Invoeren - Verwijst naar app/admin/results/page.tsx */}
          <Link href="/admin/results" className="group">
            <div className="h-full bg-[#161a23] border border-slate-800 p-8 rounded-3xl transition-all hover:border-blue-500/50">
              <div className="text-2xl mb-4">🏁</div>
              <h2 className="text-xl font-black uppercase italic mb-2">Uitslagen</h2>
              <p className="text-slate-400 text-sm mb-6">Voer kwalificatie- en raceresultaten in.</p>
              <span className="text-blue-500 text-[10px] font-black uppercase tracking-widest">Open Menu &rarr;</span>
            </div>
          </Link>

          {/* Slacker overzicht - In jouw structuur is dit deze pagina zelf */}
          <div className="bg-[#161a23] border border-slate-800 p-8 rounded-3xl">
             <div className="text-2xl mb-4">⚠️</div>
             <h2 className="text-xl font-black uppercase italic mb-2">Paddock Status</h2>
             <p className="text-slate-400 text-sm mb-6">Wie heeft er nog niet voorspeld?</p>
             {/* Hieronder kun je later de lijst met namen renderen via een Server Component */}
             <div className="text-red-500 text-[10px] font-black uppercase tracking-widest opacity-50 italic">
               Lijst wordt hieronder geladen...
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}