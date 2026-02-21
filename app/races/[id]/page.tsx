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
    async function getRaceAndStatus() {
      try {
        setLoading(true);
        
        // 1. Haal de race gegevens op
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .select('id, race_name, sprint_race_start')
          .eq('id', raceId)
          .single();

        if (raceError) throw raceError;
        setRace(raceData);

        // 2. Haal de huidige gebruiker op
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // 3. Check parallel of er voorspellingen bestaan in de 3 tabellen
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
        console.error("Database Error:", err);
        setDbError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    getRaceAndStatus();
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
          <h1 className="text-4xl font-black italic uppercase text-white leading-tight">
            {race?.race_name || "Race"} <span className="text-red-600">Card</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-3 italic">
             Maak je voorspellingen
          </p>
        </div>

        <div className="space-y-4">
          {/* Qualifying Knop */}
          <Link href={`/races/${raceId}/predict/qualy`}>
            <div className={`bg-[#161a23] border p-6 rounded-2xl transition-all group relative overflow-hidden block ${status.qualy ? 'border-green-500/50 hover:border-green-500' : 'border-slate-800 hover:border-red-600'}`}>
              <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${status.qualy ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-600'}`}></div>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-xl font-black italic uppercase transition-colors ${status.qualy ? 'text-green-500' : 'group-hover:text-red-600'}`}>Qualifying</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-white/40">Top 3 Shootout</p>
                </div>
                {status.qualy && <span className="text-green-500 font-black text-xs italic">GEDAAN</span>}
              </div>
            </div>
          </Link>

          {/* SPRINT RACE */}
          {race?.sprint_race_start && (
            <Link href={`/races/${raceId}/predict/sprint`}>
              <div className={`bg-[#161a23] border p-6 rounded-2xl transition-all group relative overflow-hidden block ${status.sprint ? 'border-green-500/50 hover:border-green-500' : 'border-slate-800 hover:border-orange-500'}`}>
                <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${status.sprint ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-orange-500'}`}></div>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className={`text-xl font-black italic uppercase transition-colors ${status.sprint ? 'text-green-500' : 'group-hover:text-orange-500'}`}>Sprint Race</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic text-white/40">Zaterdag-race</p>
                  </div>
                  {status.sprint && <span className="text-green-500 font-black text-xs italic">GEDAAN</span>}
                </div>
              </div>
            </Link>
          )}

          {/* Main Race Knop */}
          <Link href={`/races/${raceId}/predict/race`}>
            <div className={`bg-[#161a23] border p-6 rounded-2xl transition-all group relative overflow-hidden block ${status.race ? 'border-green-500/50 hover:border-green-500' : 'border-slate-800 hover:border-red-600'}`}>
              <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${status.race ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-600'}`}></div>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-xl font-black italic uppercase transition-colors ${status.race ? 'text-green-500' : 'group-hover:text-red-600'}`}>Grand Prix</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-white/40">Hoofdrace Top 10</p>
                </div>
                {status.race && <span className="text-green-500 font-black text-xs italic">GEDAAN</span>}
              </div>
            </div>
          </Link>
        </div>

        {dbError && (
          <div className="mt-10 p-4 bg-red-900/20 border border-red-900/40 rounded-xl text-red-500 text-[10px] uppercase font-black tracking-widest">
            Fout bij laden: {dbError}
          </div>
        )}

        {!race?.sprint_race_start && !loading && !dbError && (
          <div className="mt-12 pt-8 border-t border-slate-900 text-center">
             <p className="text-[8px] text-slate-700 uppercase font-black tracking-[0.2em]">
                Geen Sprintrace beschikbaar voor dit weekend
             </p>
          </div>
        )}
      </div>
    </div>
  );
}