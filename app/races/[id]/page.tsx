"use client";

import { use, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  
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
    let isMounted = true;
    const controller = new AbortController();

    async function getRaceAndStatus() {
      // --- NIEUW: DE PLACEHOLDER GUARD ---
      // Als raceId nog niet geladen is of de Next.js placeholder bevat (%%DRP...), stop dan hier.
      if (!raceId || String(raceId).includes('%')) {
        return;
      }

      try {
        setLoading(true);
        setDbError(null);

        // 1. Haal race info op
        const { data: raceData, error: raceError } = await supabase
          .from('races')
          .select('id, race_name, sprint_race_start')
          .eq('id', raceId)
          .single();

        if (raceError) throw raceError;
        if (isMounted) setRace(raceData);

        // 2. KORTE PAUZE voor stabiliteit
        await new Promise(resolve => setTimeout(resolve, 100));

        if (!isMounted) return;

        // 3. Gebruik getSession in plaats van getUser
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (user && isMounted) {
          const [qualyCheck, sprintCheck, raceCheck] = await Promise.all([
            supabase.from('predictions_qualifying').select('id').eq('race_id', raceId).eq('user_id', user.id).maybeSingle(),
            supabase.from('predictions_sprint').select('id').eq('race_id', raceId).eq('user_id', user.id).maybeSingle(),
            supabase.from('predictions_race').select('id').eq('race_id', raceId).eq('user_id', user.id).maybeSingle(),
          ]);

          if (isMounted) {
            setStatus({
              qualy: !!qualyCheck.data,
              sprint: !!sprintCheck.data,
              race: !!raceCheck.data
            });
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          console.error("Database Error:", err);
          setDbError(err.message || "Er ging iets mis.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    getRaceAndStatus();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [raceId, supabase]);

  if (loading) return (
    <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
      <div className="text-red-600 font-black italic animate-pulse text-2xl tracking-tighter">LADEN...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 font-sans">
      <div className="max-w-md mx-auto">
        <Link href="/races" className="text-slate-500 text-[10px] font-black uppercase mb-8 inline-block tracking-[0.2em] hover:text-white transition-colors">
          &larr; Terug naar Kalender
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black italic uppercase text-white leading-tight tracking-tighter">
            {race?.race_name || "Race"} <span className="text-red-600">Card</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-3 italic">Beheer je voorspellingen</p>
        </div>

        {dbError && (
          <div className="mb-6 p-4 bg-red-900/20 border-l-4 border-red-600 rounded-r-xl text-red-500 text-[10px] uppercase font-black">
            Fout: {dbError}
          </div>
        )}

        <div className="space-y-4">
          <Link href={`/races/${raceId}/predict/qualy`} className="block group">
            <div className={`bg-[#161a23] border-y border-r transition-all relative overflow-hidden p-6 rounded-r-2xl ${status.qualy ? 'border-green-500/30 bg-green-500/[0.02]' : 'border-slate-800'}`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full ${status.qualy ? 'bg-green-500 shadow-[2px_0_15_rgba(34,197,94,0.5)]' : 'bg-red-600'}`} />
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <h2 className={`text-xl font-black italic uppercase ${status.qualy ? 'text-green-500' : 'group-hover:text-red-600'}`}>Qualifying</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Top 3 Shootout</p>
                </div>
                {status.qualy && <span className="text-green-500 font-black text-xs italic tracking-tighter">READY</span>}
              </div>
            </div>
          </Link>

          {race?.sprint_race_start && (
            <Link href={`/races/${raceId}/predict/sprint`} className="block group">
              <div className={`bg-[#161a23] border-y border-r transition-all relative overflow-hidden p-6 rounded-r-2xl ${status.sprint ? 'border-green-500/30 bg-green-500/[0.02]' : 'border-slate-800'}`}>
                <div className={`absolute top-0 left-0 w-1.5 h-full ${status.sprint ? 'bg-green-500 shadow-[2px_0_15px_rgba(34,197,94,0.5)]' : 'bg-orange-500'}`} />
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <h2 className={`text-xl font-black italic uppercase ${status.sprint ? 'text-green-500' : 'group-hover:text-orange-500'}`}>Sprint Race</h2>
                  </div>
                  {status.sprint && <span className="text-green-500 font-black text-xs italic tracking-tighter">READY</span>}
                </div>
              </div>
            </Link>
          )}

          <Link href={`/races/${raceId}/predict/race`} className="block group">
            <div className={`bg-[#161a23] border-y border-r transition-all relative overflow-hidden p-6 rounded-r-2xl ${status.race ? 'border-green-500/30 bg-green-500/[0.02]' : 'border-slate-800'}`}>
              <div className={`absolute top-0 left-0 w-1.5 h-full ${status.race ? 'bg-green-500 shadow-[2px_0_15px_rgba(34,197,94,0.5)]' : 'bg-red-600'}`} />
              <div className="flex justify-between items-center relative z-10">
                <div>
                  <h2 className={`text-xl font-black italic uppercase ${status.race ? 'text-green-500' : 'group-hover:text-red-600'}`}>Grand Prix</h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Hoofdrace Top 10</p>
                </div>
                {status.race && <span className="text-green-500 font-black text-xs italic tracking-tighter">READY</span>}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}