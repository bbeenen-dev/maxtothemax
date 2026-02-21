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
      <div className="min-h-screen bg-[#0b0e14] text-white p-10 text-center">
        <h1 className="text-xl font-bold uppercase italic text-red-600 tracking-tighter">Race niet gevonden</h1>
        <Link href="/races" className="block mt-6 text-slate-500 text-xs font-bold uppercase underline tracking-widest italic">
          &larr; Terug naar kalender
        </Link>
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
                
        {/* Race Header */}
        <div className="bg-red-700 p-8 rounded-2xl shadow-xl mb-6">
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
            {race.race_name}
          </h1>
          <div className="flex gap-3 mt-4">
            <span className="bg-black/30 px-2 py-1 text-[10px] font-bold rounded uppercase">
              {race.year}
            </span>
            <span className="text-red-100 font-bold uppercase text-[10px] tracking-widest pt-1">
              Round {race.round} | {race.location_code}
            </span>
          </div>
        </div>

        {/* Winnaars Sectie 2025 */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bg-[#161a23] border border-slate-800 rounded-xl p-4">
            <p className="text-[9px] font-black uppercase text-slate-500 mb-1 tracking-widest">Winner 2025</p>
            <h3 className="text-xs font-black italic uppercase text-white truncate">{race.past_winners || "Nog onbekend"}</h3>
          </div>
          <div className="bg-[#161a23] border border-slate-800 rounded-xl p-4">
            <p className="text-[9px] font-black uppercase text-slate-500 mb-1 tracking-widest">Pole 2025</p>
            <h3 className="text-xs font-black italic uppercase text-white truncate">{race.past_qualiwinner || "Nog onbekend"}</h3>
          </div>
        </div>

        {/* Voorspelling Knoppen */}
        <div className="space-y-4">
          <h2 className="text-xl font-black italic uppercase border-l-4 border-red-600 pl-4 mb-4">Plaats Voorspelling</h2>
          
          {/* KWALIFICATIE */}
          {isQualyLocked ? (
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex justify-between items-center opacity-40 grayscale">
              <span className="font-black italic uppercase text-slate-500">Kwalificatie</span>
              <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-800 rounded text-slate-500 tracking-tighter">Locked</span>
            </div>
          ) : (
            <Link href={`/races/${id}/predict/qualy`} className="bg-[#1c232e] border border-slate-800 p-5 rounded-xl flex justify-between items-center active:bg-slate-800 transition-colors shadow-lg">
              <span className="font-black italic uppercase text-white">Kwalificatie</span>
              <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase italic">Voorspel &rarr;</span>
            </Link>
          )}

          {/* SPRINT RACE (Alleen als deze bestaat) */}
          {race.has_sprint && (
            isSprintLocked ? (
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex justify-between items-center opacity-40 grayscale">
                <span className="font-black italic uppercase text-slate-500">Sprint Race</span>
                <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-800 rounded text-slate-500 tracking-tighter">Locked</span>
              </div>
            ) : (
              <Link href={`/races/${id}/predict/sprint`} className="bg-[#1c232e] border border-slate-800 p-5 rounded-xl flex justify-between items-center active:bg-slate-800 transition-colors shadow-lg text-red-500">
                <span className="font-black italic uppercase">Sprint Race</span>
                <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase italic">Voorspel &rarr;</span>
              </Link>
            )
          )}

          {/* HOOFDRACE */}
          {isRaceLocked ? (
            <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex justify-between items-center opacity-40 grayscale">
              <span className="font-black italic uppercase text-slate-500">Hoofdrace</span>
              <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-800 rounded text-slate-500 tracking-tighter">Locked</span>
            </div>
          ) : (
            <Link href={`/races/${id}/predict/race`} className="bg-[#1c232e] border border-slate-800 p-5 rounded-xl flex justify-between items-center active:bg-slate-800 transition-colors shadow-lg">
              <span className="font-black italic uppercase text-white">Hoofdrace</span>
              <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase italic">Voorspel &rarr;</span>
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}