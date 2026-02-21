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
    return <div className="p-20 text-white">Race niet gevonden.</div>;
  }

  const nu = new Date();
  const isQualyLocked = race.qualifying_start ? nu > new Date(race.qualifying_start) : true;
  const isRaceLocked = race.race_start ? nu > new Date(race.race_start) : true;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      {/* Header: Hardcoded kleur ipv gradient om CSS fouten uit te sluiten */}
      <div className="bg-red-700 p-8 rounded-2xl mb-8">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
          {race.race_name}
        </h1>
        <p className="mt-2 text-red-100 font-bold uppercase text-xs tracking-widest">
          Round {race.round} | {race.location_code}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-black italic uppercase border-l-4 border-red-600 pl-4 mb-6">Maak je keuze</h2>
        
        {/* Kwalificatie */}
        {isQualyLocked ? (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl opacity-50 flex justify-between">
            <span className="font-black italic uppercase text-slate-500">Kwalificatie</span>
            <span className="text-[10px] font-bold uppercase text-slate-600 italic">Locked</span>
          </div>
        ) : (
          <Link href={`/races/${id}/predict/qualy`} className="bg-[#1c232e] border border-slate-800 p-5 rounded-xl flex justify-between items-center">
            <span className="font-black italic uppercase text-white">Kwalificatie</span>
            <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase italic">Voorspel &rarr;</span>
          </Link>
        )}

        {/* Race */}
        {isRaceLocked ? (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl opacity-50 flex justify-between">
            <span className="font-black italic uppercase text-slate-500">Hoofdrace</span>
            <span className="text-[10px] font-bold uppercase text-slate-600 italic">Locked</span>
          </div>
        ) : (
          <Link href={`/races/${id}/predict/race`} className="bg-[#1c232e] border border-slate-800 p-5 rounded-xl flex justify-between items-center">
            <span className="font-black italic uppercase text-white">Hoofdrace</span>
            <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase italic">Voorspel &rarr;</span>
          </Link>
        )}
      </div>

      <Link href="/races" className="block mt-12 text-slate-500 text-[10px] font-black uppercase tracking-widest">
         &larr; Terug naar kalender
      </Link>
    </div>
  );
}