import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  
  // Haal de eerstvolgende race op voor de "Next Race" kaart
  const { data: nextRaces } = await supabase
    .from('races')
    .select('*')
    .gt('race_start', new Date().toISOString())
    .order('race_start', { ascending: true })
    .limit(1);

  const nextRace = nextRaces?.[0];

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white">
      
      {/* Hero Section met Panorama Foto */}
      <div className="relative w-full h-[300px] md:h-[450px] flex items-center justify-center overflow-hidden">
        {/* De Foto */}
        <img 
          src="/hero-2026.JPG" 
          alt="Max Verstappen Red Bull 2026" 
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />
        
        {/* Overlays voor leesbaarheid en overloop */}
        <div className="absolute inset-0 bg-black/40 z-10" /> {/* Maakt foto iets donkerder voor tekst contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b0e14]/20 to-[#0b0e14] z-20" />
        
        {/* Titel bovenop de foto */}
        <div className="z-30 text-center px-4">
          <h1 className="text-5xl sm:text-7xl md:text-9xl font-black italic uppercase tracking-tighter leading-none mb-4 drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            F1 <span className="text-red-600">Max2TheMax</span>
          </h1>
          <p className="text-white font-bold uppercase tracking-[0.3em] text-xs sm:text-sm drop-shadow-md">
            Season 2026 Edition
          </p>
        </div>
      </div>

      {/* Content Sectie */}
      <div className="max-w-6xl mx-auto px-6 -mt-10 md:-mt-20 relative z-40 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KAART 1: De Volgende Race */}
          <div className="md:col-span-2 bg-[#161a23]/90 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
            <div className="relative z-10">
              <span className="bg-red-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full italic">Next Event</span>
              <h2 className="text-4xl font-black italic uppercase mt-4 mb-2">
                {nextRace ? nextRace.race_name : "Geen races gevonden"}
              </h2>
              <p className="text-slate-400 mb-8 uppercase tracking-widest text-sm font-bold">
                {nextRace ? `Round ${nextRace.round} • ${nextRace.location_code}` : ""}
              </p>
              
              {nextRace && (
                <Link 
                  href={`/races/${nextRace.id}`}
                  className="inline-block bg-white text-black font-black italic uppercase px-8 py-4 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg"
                >
                  Voorspellen →
                </Link>
              )}
            </div>
            
            {/* Decoratieve achtergrond tekst */}
            <div className="absolute -right-10 -bottom-10 text-[12rem] font-black italic text-white/[0.03] select-none pointer-events-none">
                {nextRace?.location_code}
            </div>
          </div>

          {/* KAART 2: Snelmenu */}
          <div className="space-y-6">
            <Link href="/races" className="block group">
              <div className="bg-[#1c232e] border border-slate-700 p-6 rounded-2xl hover:border-red-600 transition-all shadow-lg">
                <h3 className="font-black italic uppercase text-xl group-hover:text-red-500 text-white">Volledige Kalender</h3>
                <p className="text-slate-400 text-sm mt-1">Bekijk alle 24 races van 2026</p>
              </div>
            </Link>

            <Link href="/predictions/season" className="block group">
              <div className="bg-gradient-to-br from-red-900/40 to-red-600/10 border border-red-900/50 p-6 rounded-2xl hover:border-red-500 transition-all shadow-lg">
                <h3 className="font-black italic uppercase text-xl text-white">Jaarvoorspelling</h3>
                <p className="text-red-200/60 text-sm mt-1">Wie worden de kampioenen?</p>
              </div>
            </Link>

            <div className="bg-[#161a23] border border-slate-800 p-6 rounded-2xl opacity-50">
               <h3 className="font-black italic uppercase text-xl text-slate-500">Leaderboard</h3>
               <p className="text-slate-600 text-sm mt-1">Binnenkort beschikbaar...</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}