"use client";

import { use, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface RaceData {
  id: string;
  name: string;
  location: string;
  sprint_race_start: string | null;
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

  useEffect(() => {
    async function getRace() {
      try {
        const { data, error } = await supabase
          .from('races')
          .select('id, name, location, sprint_race_start')
          .eq('id', raceId)
          .single();

        if (error) throw error;
        setRace(data);
      } catch (err: any) {
        setDbError(err.message);
      } finally {
        setLoading(false);
      }
    }
    getRace();
  }, [raceId, supabase]);

  if (loading) return (
    <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
      <div className="text-red-600 font-black italic animate-pulse text-2xl">LADEN...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 font-f1">
      <div className="max-w-md mx-auto">
        {/* Navigatie */}
        <Link href="/calendar" className="text-slate-500 text-[10px] font-black uppercase mb-8 inline-block tracking-widest hover:text-white transition-colors">
          &larr; Terug naar Kalender
        </Link>

        {/* Dynamische Header met Racenaam */}
        <div className="mb-10">
          <h1 className="text-4xl font-black italic uppercase text-white leading-tight">
            {race?.name || "Race"} <span className="text-red-600">Card</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">
            {race?.location || "Circuit"} • Maak je voorspellingen
          </p>
        </div>

        {/* Knoppen voor de verschillende sessies */}
        <div className="space-y-4">
          {/* Qualifying */}
          <Link href={`/races/${raceId}/predict/qualy`}>
            <div className="bg-[#161a23] border border-slate-800 p-6 rounded-2xl hover:border-red-600 transition-all group relative overflow-hidden block">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
              <h2 className="text-xl font-black italic uppercase group-hover:text-red-600 transition-colors">Qualifying</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Top 3 Shootout</p>
            </div>
          </Link>

          {/* Sprint Race - Alleen tonen als sprint_race_start niet NULL is */}
          {race?.sprint_race_start && (
            <Link href={`/races/${raceId}/predict/sprint`}>
              <div className="bg-[#161a23] border border-slate-800 p-6 rounded-2xl hover:border-orange-500 transition-all group relative overflow-hidden block">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <h2 className="text-xl font-black italic uppercase group-hover:text-orange-500 transition-colors">Sprint Race</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Zaterdag-race</p>
              </div>
            </Link>
          )}

          {/* Main Race */}
          <Link href={`/races/${raceId}/predict/race`}>
            <div className="bg-[#161a23] border border-slate-800 p-6 rounded-2xl hover:border-red-600 transition-all group relative overflow-hidden block">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
              <h2 className="text-xl font-black italic uppercase group-hover:text-red-600 transition-colors">Grand Prix</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Hoofdrace Top 3</p>
            </div>
          </Link>
        </div>

        {/* Foutmelding / Debug informatie */}
        {dbError && (
          <div className="mt-8 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-500 text-[10px] uppercase font-bold">
            Database Error: {dbError}
          </div>
        )}
      </div>
    </div>
  );
}