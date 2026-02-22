import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();

  // Haal de eerstvolgende race op voor de "Next Race" kaart
  const { data: nextRaces } = await supabase
    .from('races')
    .select('*, city_name')
    .gt('race_start', new Date().toISOString())
    .order('race_start', { ascending: true })
    .limit(1);

  const nextRace = nextRaces?.[0];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white">
      
      {/* Hero Section */}
      <div className="relative w-full">
        <div className="relative w-full h-[35vh] md:h-[45vh] overflow-hidden border-b border-red-600/20">
          <Image 
            src="/hero-2026.JPG" 
            alt="F1 2026 Hero"
            fill
            priority
            quality={100}
            className="object-cover object-center" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e14]/40 via-transparent to-[#0b0e14] z-10" />
        </div>

        <div className="relative z-20 text-center px-4 -mt-20 md:-mt-24 pb-12">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-4 drop-shadow-[0_10px_30px_rgba(0,0,0,0.9)]">
            F1 <span className="text-red-600">Max2TheMax</span>
          </h1>
          <p className="text-white font-bold uppercase tracking-[0.4em] text-[10px] sm:text-sm drop-shadow-lg opacity-90">
            Season 2026 Edition
          </p>
        </div>
      </div>

      {/* Content sectie */}
      <div className="max-w-6xl mx-auto px-6 relative z-30 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KAART 1: De Volgende Race met Accent Border */}
          <div className="md:col-span-2 bg-[#161a23] border-y border-r border-slate-800 rounded-r-3xl p-8 shadow-2xl overflow-hidden relative group">
            {/* De Accent Border */}
            <div className="absolute top-0 left-0 w-2 h-full bg-red-600 shadow-[2px_0_15px_rgba(220,38,38,0.4)]" />
            
            <div className="relative z-10">
              <span className="bg-red-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full italic">
                Next Event
              </span>
              
              <h2 className="text-4xl font-black italic uppercase mt-4 mb-2">
                {nextRace ? nextRace.race_name : "Geen races gevonden"}
              </h2>
              
              <p className="text-slate-400 mb-8 uppercase tracking-widest text-sm font-bold">
                {nextRace ? `Round ${nextRace.round} • ${nextRace.city_name || "Locatie onbekend"}` : ""}
              </p>

              {nextRace && (
                <Link
                  href={`/races/${nextRace.id}`}
                  className="inline-block bg-white text-black font-black italic uppercase px-8 py-4 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"
                >
                  Voorspellen →
                </Link>
              )}
            </div>

            {nextRace && (
              <div className="absolute -right-10 -bottom-10 text-[12rem] font-black italic text-white/[0.03] select-none pointer-events-none uppercase">
                {nextRace.city_name?.substring(0, 3) || nextRace.location_code}
              </div>
            )}
          </div>

          {/* KAART 2: Snelmenu met Accent Borders */}
          <div className="space-y-6">
            <Link href="/races" className="block group">
              <div className="bg-[#1c232e] border-y border-r border-slate-700 p-6 rounded-r-2xl relative overflow-hidden transition-all group-hover:border-red-600/50">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-700 transition-all group-hover:bg-red-600 group-hover:w-1.5" />
                <h3 className="font-black italic uppercase text-xl group-hover:text-red-500 transition-colors">
                  Volledige Kalender
                </h3>
                <p className="text-slate-400 text-sm mt-1">Bekijk alle 24 races van 2026</p>
              </div>
            </Link>

            <Link href="/predictions/season" className="block group">
              <div className="bg-gradient-to-br from-red-900/20 to-red-600/5 border-y border-r border-red-900/30 p-6 rounded-r-2xl relative overflow-hidden transition-all group-hover:border-red-500/50">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-900/50 transition-all group-hover:bg-red-500 group-hover:w-1.5 group-hover:shadow-[2px_0_10px_rgba(239,68,68,0.3)]" />
                <h3 className="font-black italic uppercase text-xl">Jaarvoorspelling</h3>
                <p className="text-red-200/60 text-sm mt-1">Wie worden de kampioenen?</p>
              </div>
            </Link>

            <div className="bg-[#161a23] border-y border-r border-slate-800 p-6 rounded-r-2xl relative opacity-50 cursor-not-allowed">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-800" />
              <h3 className="font-black italic uppercase text-xl text-slate-500">Leaderboard</h3>
              <p className="text-slate-600 text-sm mt-1">Binnenkort beschikbaar...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}