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

  useEffect(() => {
    const fetchRaceData = async () => {
      const { data, error } = await supabase
        .from('races')
        .select('id, name, location, sprint_race_start')
        .eq('id', raceId)
        .single();

      if (!error && data) {
        setRace(data);
      }
      setLoading(false);
    };

    fetchRaceData();
  }, [raceId, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center">
        <div className="text-red-600 font-black italic animate-pulse">LADEN...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      <div className="max-w-md mx-auto">
        <Link 
          href="/calendar" 
          className="text-slate-500 text-[10px] font-black uppercase mb-8 inline-block tracking-widest hover:text-white transition-colors"
        >
          &larr; Terug naar Kalender
        </Link>

        {/* Header met dynamische data uit de tabel */}
        <div className="mb-8">
          <h1 className="text-4xl font-black italic uppercase text-white leading-none">
            {race?.name || "Race"} <span className="text-red-600 font-light italic">Card</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-bold uppercase italic tracking-widest mt-2">
            {race?.location || "F1 Circuit"} • Maak je keuzes
          </p>
        </div>

        <div className="space-y-4">
          {/* 1. QUALIFYING KNOP */}
          <Link href={`/races/${raceId}/predict/qualy`}>
            <div className="bg-[#161a23] border border-slate-800 p-6 rounded-2xl hover:border-red-600 transition-all group relative overflow-hidden block">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
              <h2 className="text-xl font-black italic uppercase group-hover:text-red-600 transition-colors">Qualifying</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Voorspel de Top 3</p>
            </div>
          </Link>

          {/* 2. SPRINT KNOP (Alleen tonen als sprint_race_start GEEN NULL is) */}
          {race?.sprint_race_start && (
            <Link href={`/races/${raceId}/predict/sprint`}>
              <div className="bg-[#161a23] border border-slate-800 p-6 rounded-2xl hover:border-orange-500 transition-all group relative overflow-hidden block">
                <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
                <h2 className="text-xl font-black italic uppercase group-hover:text-orange-500 transition-colors">Sprint Race</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Snelheid op zaterdag</p>
              </div>
            </Link>
          )}

          {/* 3. MAIN RACE KNOP */}
          <Link href={`/races/${raceId}/predict/race`}>
            <div className="bg-[#161a23] border border-slate-800 p-6 rounded-2xl hover:border-red-600 transition-all group relative overflow-hidden block">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
              <h2 className="text-xl font-black italic uppercase group-hover:text-red-600 transition-colors">Grand Prix</h2>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">De Hoofdrace Top 3</p>
            </div>
          </Link>
        </div>

        {/* Status indicator onderaan */}
        <div className="mt-12 flex items-center justify-center gap-2 border-t border-slate-900 pt-8">
           <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
           <span className="text-slate-600 text-[8px] font-black uppercase tracking-[0.3em]">Grid Connection Active</span>
        </div>
      </div>
    </div>
  );
}