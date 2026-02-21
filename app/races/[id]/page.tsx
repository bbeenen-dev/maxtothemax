"use client";

import { use, useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface RaceData {
  id: string;
  name: string;
  location: string;
  sprint_race_start: string | null; // Exacte naam uit jouw tabel
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

  useEffect(() => {
    const fetchRaceData = async () => {
      // We halen specifiek de kolom sprint_race_start op
      const { data, error } = await supabase
        .from('races')
        .select('id, name, location, sprint_race_start')
        .eq('id', raceId)
        .single();

      if (error) {
        console.error("Fout bij ophalen race data:", error);
      } else if (data) {
        setRace(data);
      }
      setLoading(false);
    };

    fetchRaceData();
  }, [raceId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-red-600 font-black italic animate-pulse tracking-tighter text-2xl">
          LADEN...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      <div className="max-w-md mx-auto">
        <Link 
          href="/calendar" 
          className="text-slate-500 text-[10px] font-black uppercase mb-8 inline-block tracking-[0.2em] hover:text-white transition-colors"
        >
          &larr; Kalender
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black italic uppercase text-white leading-none">
            {race?.name || "Race"} <span className="text-red-600">Card</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em] mt-3">
            {race?.location || "Circuit Location"}
          </p>
        </div>

        <div className="space-y-4">
          {/* QUALIFYING */}
          <Link href={`/races/${raceId}/predict/qualy`}>
            <div className="bg-[#161a23] border border-slate-800 p-6 rounded-2xl hover:border-red-600 transition-all group relative overflow-hidden block">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
              <h2 className="text-xl font-black italic uppercase group-hover:text-red-600 transition-colors">Qualifying</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Top 3 Shootout</p>
            </div>
          </Link>

          {/* SPRINT RACE - De check op jouw specifieke veld */}
          {race && race.sprint_race_start !== null && (
            <Link href={`/races/${raceId}/predict/sprint`}>
              <div className="bg-[#161a23] border border-slate-800 p-6 rounded-2xl hover:border-orange-500 transition-all group relative overflow-hidden block">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <h2 className="text-xl font-black italic uppercase group-hover:text-orange-500 transition-colors">Sprint Race</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest italic">Zaterdag-race</p>
              </div>
            </Link>
          )}

          {/* MAIN RACE */}
          <Link href={`/races/${raceId}/predict/race`}>
            <div className="bg-[#161a23] border border-slate-800 p-6 rounded-2xl hover:border-red-600 transition-all group relative overflow-hidden block">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
              <h2 className="text-xl font-black italic uppercase group-hover:text-red-600 transition-colors">Grand Prix</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Hoofdrace Top 3</p>
            </div>
          </Link>
        </div>

        {/* DEBUGGING SECTIE - Alleen zichtbaar als er iets geks is */}
        {!race?.sprint_race_start && (
            <p className="mt-8 text-[8px] text-slate-800 uppercase text-center font-bold tracking-widest opacity-30">
                Geen sprint gedetecteerd voor ID: {raceId}
            </p>
        )}
      </div>
    </div>
  );
}