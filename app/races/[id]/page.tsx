import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function RaceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: race, error } = await supabase
    .from('races')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  // Foutafhandeling zonder iconen
  if (error || !race) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center p-6 text-white text-center">
        <div className="bg-[#161a23] p-10 rounded-3xl border border-red-600/30">
          <h1 className="text-xl font-bold uppercase italic">Race niet gevonden</h1>
          <p className="text-slate-500 text-sm mt-2 italic">ID: {id}</p>
          <Link href="/races" className="block mt-6 text-red-600 font-bold uppercase text-xs">
            ← Terug naar kalender
          </Link>
        </div>
      </div>
    );
  }

  const nu = new Date();
  const isQualyLocked = race.qualifying_start ? nu > new Date(race.qualifying_start) : true;
  const isSprintLocked = race.has_sprint && race.sprint_race_start ? nu > new Date(race.sprint_race_start) : true;
  const isRaceLocked = race.race_start ? nu > new Date(race.race_start) : true;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        <Link href="/races" className="inline-block text-slate-500 mb-6 text-xs font-bold uppercase tracking-widest">
           ← Terug naar kalender
        </Link>
                
        <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-2xl shadow-2xl mb-8">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            {race.race_name}
          </h1>
          <p className="mt-2 text-red-100 font-medium uppercase tracking-widest text-sm">
            Round {race.round} | {race.location_code}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="bg-[#161a23] border border-slate-800 rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Winner 2025</p>
            <h3 className="text-lg font-black italic uppercase text-white">{race.past_winners || "Onbekend"}</h3>
          </div>
          <div className="bg-[#161a23] border border-slate-800 rounded-2xl p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Pole 2025</p>
            <h3 className="text-lg font-black italic uppercase text-white">{race.past_qualiwinner || "Onbekend"}</h3>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-black italic uppercase border-l-4 border-red-600 pl-4 mb-4">Plaats je voorspelling</h2>
          
          <PredictionLink title="Kwalificatie" href={`/races/${id}/predict/qualy`} isLocked={isQualyLocked} />
          {race.has_sprint && (
            <PredictionLink title="Sprint Race" href={`/races/${id}/predict/sprint`} isLocked={isSprintLocked} />
          )}
          <PredictionLink title="Hoofdrace" href={`/races/${id}/predict/race`} isLocked={isRaceLocked} />
        </div>
      </div>
    </div>
  );
}

function PredictionLink({ title, href, isLocked }: { title: string, href: string, isLocked: boolean }) {
  if (isLocked) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl opacity-50 flex justify-between items-center">
        <span className="text-xl font-black italic uppercase text-slate-400">{title}</span>
        <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Locked</span>
      </div>
    );
  }

  return (
    <Link href={href} className="group bg-[#1c232e] border border-slate-800 p-6 rounded-2xl flex justify-between items-center hover:border-red-600 transition-all">
      <span className="text-xl font-black italic uppercase group-hover:text-red-500">{title}</span>
      <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase italic group-hover:bg-red-500">Voorspel nu</span>
    </Link>
  );
}