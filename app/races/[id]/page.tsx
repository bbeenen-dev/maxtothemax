"use client";

import { use, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface RaceData {
  id: string;
  race_name: string;
  sprint_race_start: string | null;
}

interface PredictionStatus {
  qualy: boolean;
  sprint: boolean;
  race: boolean;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function RaceCardPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const raceId = resolvedParams.id;
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [race, setRace] = useState<RaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [status, setStatus] = useState<PredictionStatus>({
    qualy: false,
    sprint: false,
    race: false
  });

  useEffect(() => {
    // We maken een controller om het verzoek te kunnen annuleren als de component unmount
    const controller = new AbortController();

    async function getRaceAndStatus() {
      try {
        setLoading(true);
        setDbError(null);

        // 1. Haal eerst de race info op (publieke data)
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .select('id, race_name, sprint_race_start')
          .eq('id', raceId)
          .single();

        if (raceError) throw raceError;
        setRace(raceData);

        // 2. Haal de user op (dit kan de AbortError triggeren via de middleware)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            console.warn("Auth check waarschuwing:", userError.message);
            // We stoppen hier niet perse, want de race info hebben we al.
        }

        if (user) {
          const [qualyCheck, sprintCheck, raceCheck] = await Promise.all([
            supabase.from('predictions_qualifying').select('id').eq('race_id', raceId).eq('user_id', user.id).maybeSingle(),
            supabase.from('predictions_sprint').select('id').eq('race_id', raceId).eq('user_id', user.id).maybeSingle(),
            supabase.from('predictions_race').select('id').eq('race_id', raceId).eq('user_id', user.id).maybeSingle(),
          ]);

          setStatus({
            qualy: !!qualyCheck.data,
            sprint: !!sprintCheck.data,
            race: !!raceCheck.data
          });
        }
      } catch (err: any) {
        // Alleen een error tonen als het GEEN abort is
        if (err.name !== 'AbortError') {
          console.error("Database Error:", err);
          setDbError(err.message || "Er ging iets mis bij het ophalen van de data.");
        }
      } finally {
        setLoading(false);
      }
    }

    getRaceAndStatus();

    // Cleanup functie om de AbortError te voorkomen bij snelle navigatie
    return () => controller.abort();
  }, [raceId, supabase]);

  if (loading) return (
    <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
      <div className="text-red-600 font-black italic animate-pulse text-2xl tracking-tighter">
        LADEN...
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 font-sans">
      <div className="max-w-md mx-auto">
        <Link 
          href="/races" 
          className="text-slate-500 text-[10px] font-black uppercase mb-8 inline-block tracking-[0.2em] hover:text-white transition-colors"
        >
          &larr; Terug naar Kalender
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black italic uppercase text-white leading-tight tracking-tighter">
            {race?.race_name || "Race"} <span className="text-red-600">Card</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-3 italic">
             Beheer je voorspellingen
          </p>
        </div>

        {/* ERROR SECTIE - Nu duidelijker zichtbaar indien aanwezig */}
        {dbError && (
          <div className="mb-6 p-4 bg-red-900/20 border-l-4 border-red-600 rounded-r-xl">
             <p className="text-red-500 text-[10px] uppercase font-black tracking-widest">
               Fout bij laden: {dbError}
             </p>
             <button 
               onClick={() => window.location.reload()}
               className="text-white text-[8px] underline mt-2 uppercase font-bold"
             >
               Klik hier om te verversen
             </button>
          </div>
        )}

        <div className="space-y-4">
          {/* QUALIFYING */}
          <Link href={`/races/${raceId}/predict/qualy`} className="block group">
            <div className={`bg-[#161a23] border-y border-r transition-all relative overflow-hidden p-6 rounded-r-2xl ${
              status.qualy 
                ? 'border-green-500/30 bg-green-500/[0.02]' 
                : 'border-slate-800 hover:border-red-600/50'
            }`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-300 ${
                status.qualy 
                  ? 'bg-green-500 shadow-[2px_0_15px_rgba(34,197,94,0.5)]' 
                  : 'bg-red-600 group-hover:w-2'
              }`} />
              
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <h2 className={`text-xl font-black italic uppercase transition-colors ${
                    status.qualy ? 'text-green-500' : 'group-hover:text-red-600'
                  }`}>Qualifying</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Top 3 Shootout</p>
                </div>
                {status.qualy && (
                   <span className="text-green-500 font-black text-xs italic tracking-tighter">READY</span>
                )}
              </div>
            </div>
          </Link>

          {/* SPRINT RACE */}
          {race?.sprint_race_start && (
            <Link href={`/races/${raceId}/predict/sprint`} className="block group">
              <div className={`bg-[#161a23] border-y border-r transition-all relative overflow-hidden p-6 rounded-r-2xl ${
                status.sprint 
                  ? 'border-green-500/30 bg-green-500/[0.02]' 
                  : 'border-slate-800 hover:border-orange-500/50'
              }`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-300 ${
                  status.sprint 
                    ? 'bg-green-500 shadow-[2px_0_15px_rgba(34,197,94,0.5)]' 
                    : 'bg-orange-500 group-hover:w-2'
                }`} />
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <h2 className={`text-xl font-black italic uppercase transition-colors ${
                      status.sprint ? 'text-green-500' : 'group-hover:text-orange-500'
                    }`}>Sprint Race</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">Zaterdag-race</p>
                  </div>
                  {status.sprint && (
                    <span className="text-green-500 font-black text-xs italic tracking-tighter">READY</span>
                  )}
                </div>
              </div>
            </Link>
          )}

          {/* MAIN RACE */}
          <Link href={`/races/${raceId}/predict/race`} className="block group">
            <div className={`bg-[#161a23] border-y border-r transition-all relative overflow-hidden p-6 rounded-r-2xl ${
              status.race 
                ? 'border-green-500/30 bg-green-500/[0.02]' 
                : 'border-slate-800 hover:border-red-600/50'
            }`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-300 ${
                status.race 
                  ? 'bg-green-500 shadow-[2px_0_15px_rgba(34,197,94,0.5)]' 
                  : 'bg-red-600 group-hover:w-2'
              }`} />
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <h2 className={`text-xl font-black italic uppercase transition-colors ${
                    status.race ? 'text-green-500' : 'group-hover:text-red-600'
                  }`}>Grand Prix</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Hoofdrace Top 10</p>
                </div>
                {status.race && (
                  <span className="text-green-500 font-black text-xs italic tracking-tighter">READY</span>
                )}
              </div>
            </div>
          </Link>
        </div>

        {!race?.sprint_race_start && !loading && !dbError && (
          <div className="mt-12 pt-8 border-t border-slate-900 text-center">
             <p className="text-[8px] text-slate-700 uppercase font-black tracking-[0.2em]">
                Geen Sprintrace voor dit weekend
             </p>
          </div>
        )}
      </div>
    </div>
  );
}