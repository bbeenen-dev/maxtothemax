import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function RaceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  try {
    const supabase = await createClient();
    const { data: race, error } = await supabase
      .from('races')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!race) throw new Error("Race niet gevonden");

    const nu = new Date();
    const isQualyLocked = race.qualifying_start ? nu > new Date(race.qualifying_start) : true;
    const isSprintLocked = race.has_sprint && race.sprint_race_start ? nu > new Date(race.sprint_race_start) : true;
    const isRaceLocked = race.race_start ? nu > new Date(race.race_start) : true;

    return (
      <div className="min-h-screen bg-[#0b0e14] text-white p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          
          <Link href="/races" className="inline-block text-slate-500 mb-6 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
             &larr; Terug naar kalender
          </Link>
                  
          {/* Header Kaart */}
          <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden mb-8">
            <div className="relative z-10">
              <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                {race.race_name}
              </h1>
              <div className="flex gap-4 mt-4 items-center">
                <span className="bg-black/40 backdrop-blur-md text-white px-3 py-1 text-sm font-bold rounded">
                  {race.year}
                </span>
                <span className="text-red-100 font-medium uppercase tracking-widest text-sm">
                  Round {race.round} | {race.location_code}
                </span>
              </div>
            </div>
            <div className="absolute -right-6 -bottom-8 text-[10rem] font-black italic text-white/5 select-none uppercase pointer-events-none leading-none">
               {race.location_code}
            </div>
          </div>

          {/* Winnaars van vorig jaar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="bg-[#161a23] border border-slate-800 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Winner 2025</p>
              <h3 className="text-lg font-black italic uppercase text-white leading-none">
                {race.past_winners || "Nog onbekend"}
              </h3>
            </div>
            <div className="bg-[#161a23] border border-slate-800 rounded-2xl p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Pole 2025</p>
              <h3 className="text-lg font-black italic uppercase text-white leading-none">
                {race.past_qualiwinner || "Nog onbekend"}
              </h3>
            </div>
          </div>

          {/* Voorspelling Sectie */}
          <div className="space-y-6">
            <h2 className="text-2xl font-black italic uppercase tracking-tight border-l-4 border-red-600 pl-4">
              Maak je keuze
            </h2>

            <div className="grid gap-4">
              <PredictionCard title="Kwalificatie" isLocked={isQualyLocked} href={`/races/${id}/predict/qualy`} />
              {race.has_sprint && (
                <PredictionCard title="Sprint Race" isLocked={isSprintLocked} href={`/races/${id}/predict/sprint`} />
              )}
              <PredictionCard title="Hoofdrace" isLocked={isRaceLocked} href={`/races/${id}/predict/race`} />
            </div>
          </div>
        </div>
      </div>
    );

  } catch (err: any) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center p-6 text-white">
        <div className="text-center bg-[#161a23] p-10 rounded-3xl border border-red-600/30 max-w-md">
          <h1 className="text-xl font-black uppercase italic text-red-600">Fout bij laden</h1>
          <p className="text-slate-500 text-sm mt-2">{err.message}</p>
          <Link href="/races" className="inline-block mt-6 bg-white/5 px-6 py-3 rounded-xl text-white font-bold uppercase text-xs">
            &larr; Probeer opnieuw
          </Link>
        </div>
      </div>
    );
  }
}

// Hulpsubcomponent voor de knoppen
function PredictionCard({ title, isLocked, href }: { title: string, isLocked: boolean, href: string }) {
  if (isLocked) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex justify-between items-center opacity-50 grayscale">
        <h3 className="text-xl font-black italic uppercase text-slate-400">{title}</h3>
        <div className="bg-slate-800 text-slate-500 px-4 py-2 rounded-lg font-black text-[10px] uppercase italic">
          Locked
        </div>
      </div>
    );
  }

  return (
    <Link href={href} className="group bg-[#1c232e] border border-slate-800 p-6 rounded-2xl flex justify-between items-center hover:border-red-600 transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.1)]">
      <h3 className="text-xl font-black italic uppercase group-hover:text-red-500 transition-colors">{title}</h3>
      <div className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-black text-[10px] uppercase italic group-hover:bg-red-500 transition-all shadow-lg">
        Voorspel nu
      </div>
    </Link>
  );
}