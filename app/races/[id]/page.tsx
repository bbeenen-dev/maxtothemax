import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function RaceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!race) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center p-6 text-white text-center">
        <div>
          <h1 className="text-xl font-bold uppercase italic text-red-600">Race niet gevonden</h1>
          <Link href="/races" className="block mt-4 text-slate-500 underline">Terug naar kalender</Link>
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
        
        {/* Navigatie */}
        <Link href="/races" className="inline-block text-slate-500 mb-6 text-[10px] font-black uppercase tracking-widest">
           &larr; Terug naar kalender
        </Link>
                
        {/* Race Header (Zonder de gevaarlijke zwevende letters) */}
        <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-2xl shadow-xl mb-8">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
            {race.race_name}
          </h1>
          <div className="flex gap-3 mt-4">
            <span className="bg-black/30 px-2 py-1 text-xs font-bold rounded">
              {race.year}
            </span>
            <span className="text-red-100 font-bold uppercase text-xs tracking-widest pt-1">
              Round {race.round} | {race.location_code}
            </span>
          </div>
        </div>

        {/* Winnaars Sectie */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-[#161a23] border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Winner 2025</p>
            <h3 className="text-sm font-black italic uppercase text-white truncate">{race.past_winners || "Onbekend"}</h3>
          </div>
          <div className="bg-[#161a23] border border-slate-800 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1">Pole 2025</p>
            <h3 className="text-sm font-black italic uppercase text-white truncate">{race.past_qualiwinner || "Onbekend"}</h3>
          </div>
        </div>

        {/* Voorspelling Knoppen */}
        <div className="space-y-4">
          <h2 className="text-xl font-black italic uppercase border-l-4 border-red-600 pl-4 mb-4">Maak je keuze</h2>
          
          <PredictionBox title="Kwalificatie" href={`/races/${id}/predict/qualy`} isLocked={isQualyLocked} />
          
          {race.has_sprint && (
            <PredictionBox title="Sprint Race" href={`/races/${id}/predict/sprint`} isLocked={isSprintLocked} />
          )}
          
          <PredictionBox title="Hoofdrace" href={`/races/${id}/predict/race`} isLocked={isRaceLocked} />
        </div>
      </div>
    </div>
  );
}

// Interne helper component (simpel gehouden voor stabiliteit)
function PredictionBox({ title, href, isLocked }: { title: string, href: string, isLocked: boolean }) {
  if (isLocked) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex justify-between items-center opacity-50">
        <span className="font-black italic uppercase text-slate-500">{title}</span>
        <span className="text-[10px] font-bold uppercase py-1 px-2 border border-slate-700 rounded text-slate-600">Locked</span>
      </div>
    );
  }

  return (
    <Link href={href} className="bg-[#1c232e] border border-slate-800 p-5 rounded-xl flex justify-between items-center active:bg-slate-800 transition-colors">
      <span className="font-black italic uppercase text-white">{title}</span>
      <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase italic">Voorspel &rarr;</span>
    </Link>
  );
}