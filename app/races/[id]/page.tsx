import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { headers } from 'next/headers';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RaceDetailPage({ params }: PageProps) {
  // 1. Forceer dynamische rendering
  await headers();

  // 2. Verkrijg ID
  const { id } = await params;
  
  try {
    const supabase = await createClient();
    
    const { data: race, error } = await supabase
      .from('races')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);

    if (!race) {
      return (
        <div className="min-h-screen bg-[#0b0e14] text-white p-10 text-center">
          <h1 className="text-xl font-bold uppercase italic text-red-600">Race niet gevonden</h1>
          <Link href="/races" className="block mt-6 text-slate-500 underline uppercase text-xs">
            &larr; Terug naar kalender
          </Link>
        </div>
      );
    }

    // VEILIGE DATUM BEREKENING
    const nu = new Date().getTime();
    const qualyTijd = race.qualifying_start ? new Date(race.qualifying_start).getTime() : 0;
    const sprintTijd = race.sprint_race_start ? new Date(race.sprint_race_start).getTime() : 0;
    const raceTijd = race.race_start ? new Date(race.race_start).getTime() : 0;

    const isQualyLocked = qualyTijd === 0 || nu > qualyTijd;
    const isSprintLocked = sprintTijd === 0 || nu > sprintTijd;
    const isRaceLocked = raceTijd === 0 || nu > raceTijd;

    return (
      <div className="min-h-screen bg-[#0b0e14] text-white p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          
          <Link href="/races" className="inline-block text-slate-500 mb-6 text-[10px] font-black uppercase tracking-widest">
             &larr; Terug naar kalender
          </Link>
                  
          <div className="bg-red-700 p-8 rounded-2xl mb-6 border border-red-500/20">
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

          <div className="space-y-4">
            <h2 className="text-xl font-black italic uppercase border-l-4 border-red-600 pl-4 mb-4">Plaats Voorspelling</h2>
            
            {/* Kwalificatie */}
            {!isQualyLocked ? (
              <Link href={`/races/${id}/predict/qualy`} className="bg-[#1c232e] border border-slate-800 p-5 rounded-xl flex justify-between items-center">
                <span className="font-black italic uppercase text-white">Kwalificatie</span>
                <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase italic">Voorspel &rarr;</span>
              </Link>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex justify-between items-center opacity-40">
                <span className="font-black italic uppercase text-slate-500">Kwalificatie</span>
                <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-800 rounded text-slate-500">Locked</span>
              </div>
            )}

            {/* Sprint (alleen als tijd bestaat) */}
            {race.sprint_race_start && (
              !isSprintLocked ? (
                <Link href={`/races/${id}/predict/sprint`} className="bg-[#1c232e] border border-slate-800 p-5 rounded-xl flex justify-between items-center">
                  <span className="font-black italic uppercase text-white">Sprint Race</span>
                  <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase italic">Voorspel &rarr;</span>
                </Link>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex justify-between items-center opacity-40">
                  <span className="font-black italic uppercase text-slate-500">Sprint Race</span>
                  <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-800 rounded text-slate-500">Locked</span>
                </div>
              )
            )}

            {/* Hoofdrace */}
            {!isRaceLocked ? (
              <Link href={`/races/${id}/predict/race`} className="bg-[#1c232e] border border-slate-800 p-5 rounded-xl flex justify-between items-center">
                <span className="font-black italic uppercase text-white">Hoofdrace</span>
                <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[10px] uppercase italic">Voorspel &rarr;</span>
              </Link>
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl flex justify-between items-center opacity-40">
                <span className="font-black italic uppercase text-slate-500">Hoofdrace</span>
                <span className="text-[9px] font-black uppercase px-2 py-1 bg-slate-800 rounded text-slate-500">Locked</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (e) {
    // Als er ECHT iets fout gaat, zien we nu een foutmelding in plaats van wit
    return (
      <div className="min-h-screen bg-[#0b0e14] text-red-500 p-10">
        <p className="font-bold">Er is een systeemfout opgetreden:</p>
        <pre className="text-xs mt-4 bg-black p-4">{JSON.stringify(e, null, 2)}</pre>
      </div>
    );
  }
}