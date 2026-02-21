import Link from 'next/link';
import Image from 'next/image';
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
      
      {/* Hero Section: Panorama Layout */}
      <div className="relative w-full overflow-hidden bg-[#0b0e14]">
        
        {/* Container die de verhouding van de foto volgt (3:1 is typisch panorama) */}
        <div className="relative w-full aspect-[3/1] md:aspect-[21/7] max-h-[40vh]">
          <Image 
            src="/hero-2026.JPG" 
            alt="F1 2026 Hero"
            fill
            priority
            quality={100}
            className="object-contain object-top" // object-contain zorgt dat de hele foto zichtbaar is
          />
          
          {/* Fade-out naar de rest van de pagina om zwarte balken onder de foto te voorkomen */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e14] via-transparent to-transparent z-10" />
        </div>

        {/* Hero Content: Iets lager geplaatst voor het panorama effect */}
        <div className="relative z-20 text-center px-4 -mt-12 sm:-mt-20 md:-mt-28 pb-12">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            F1 <span className="text-red-600">Max2TheMax</span>
          </h1>
          <p className="text-white font-bold uppercase tracking-[0.4em] text-[10px] sm:text-sm drop-shadow-lg opacity-90">
            Season 2026 Edition
          </p>
        </div>
      </div>

      {/* Content sectie met kaarten */}
      <div className="max-w-6xl mx-auto px-6 relative z-30 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KAART 1: De Volgende Race */}
          <div className="md:col-span-2 bg-[#161a23] border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
            <div className="relative z-10">
              <span className="bg-red-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full italic">
                Next Event
              </span>
              
              <h2 className="text-4xl font-black italic uppercase mt-4 mb-2">
                {nextRace ? nextRace.race_name : "Geen races gevonden"}
              </h2>
              
              <p className="text-slate-400 mb-8 uppercase tracking-widest text-sm font-bold">
                {nextRace ? `Round ${nextRace.round} • ${nextRace.location_code}` : ""}
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

            {nextRace?.location_code && (
              <div className="absolute -right-10 -bottom-10 text-[12rem] font-black italic text-white/[0.03] select-none pointer-events-none">
                {nextRace.location_code}
              </div>
            )}
          </div>

          {/* KAART 2: Snelmenu */}
          <div className="space-y-6">
            <Link href="/races" className="block group">
              <div className="bg-[#1c232e] border border-slate-700 p-6 rounded-2xl group-hover:border-red-600 transition-all">
                <h3 className="font-black italic uppercase text-xl group-hover:text-red-500 transition-colors">
                  Volledige Kalender
                </h3>
                <p className="text-slate-400 text-sm mt-1">Bekijk alle 24 races van 2026</p>
              </div>
            </Link>

            <Link href="/predictions/season" className="block group">
              <div className="bg-gradient-to-br from-red-900/40 to-red-600/10 border border-red-900/50 p-6 rounded-2xl group-hover:border-red-500 transition-all">
                <h3 className="font-black italic uppercase text-xl">Jaarvoorspelling</h3>
                <p className="text-red-200/60 text-sm mt-1">Wie worden de kampioenen?</p>
              </div>
            </Link>

            <div className="bg-[#161a23] border border-slate-800 p-6 rounded-2xl opacity-50 cursor-not-allowed">
              <h3 className="font-black italic uppercase text-xl text-slate-500">Leaderboard</h3>
              <p className="text-slate-600 text-sm mt-1">Binnenkort beschikbaar...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}