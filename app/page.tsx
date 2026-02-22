import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();

  // 1. Haal de huidige gebruiker op
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Haal de eerstvolgende race op
  const { data: nextRaces } = await supabase
    .from('races')
    .select('*, city_name')
    .gt('race_start', new Date().toISOString())
    .order('race_start', { ascending: true })
    .limit(1);

  const nextRace = nextRaces?.[0];

  // 3. Logica voor voorspelling status
  let isFullyPredicted = false;
  if (user && nextRace) {
    const [q, s, r] = await Promise.all([
      supabase.from('predictions_qualifying').select('id').eq('race_id', nextRace.id).eq('user_id', user.id).maybeSingle(),
      supabase.from('predictions_sprint').select('id').eq('race_id', nextRace.id).eq('user_id', user.id).maybeSingle(),
      supabase.from('predictions_race').select('id').eq('race_id', nextRace.id).eq('user_id', user.id).maybeSingle(),
    ]);
    
    const needsSprint = !!nextRace.sprint_race_start;
    isFullyPredicted = needsSprint 
      ? (!!q.data && !!s.data && !!r.data)
      : (!!q.data && !!r.data);
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white">
      
      {/* Hero Section */}
      <div className="relative w-full">
        <div className="relative w-full h-[35vh] md:h-[45vh] overflow-hidden border-b border-slate-800/50">
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
            F1 <span className="text-slate-400">Max2TheMax</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px] sm:text-sm drop-shadow-lg opacity-90">
            Season 2026 Edition
          </p>
        </div>
      </div>

      {/* Content sectie */}
      <div className="max-w-6xl mx-auto px-6 relative z-30 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KAART 1: De Volgende Race met Tapered Border */}
          <Link 
            href={nextRace ? `/races/${nextRace.id}` : '#'}
            className="md:col-span-2 group relative p-[2px] rounded-3xl transition-all duration-500 overflow-hidden block shadow-2xl"
          >
            {/* Tapered Gradient Border */}
            <div className={`absolute inset-0 transition-opacity duration-500 ${
              isFullyPredicted 
                ? 'bg-[conic-gradient(from_180deg_at_0%_50%,#22c55e_0deg,#22c55e_40deg,transparent_90deg)] opacity-100' 
                : 'bg-[conic-gradient(from_180deg_at_0%_50%,#475569_0deg,#475569_40deg,transparent_90deg)] opacity-80'
            }`} />

            <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-8 h-full">
              <div className="relative z-10">
                <span className={`${isFullyPredicted ? 'bg-green-500/20 text-green-500 border-green-500/50' : 'bg-slate-800 text-slate-400 border-slate-700'} text-[10px] font-black uppercase px-3 py-1 rounded-full italic border opacity-80`}>
                  {isFullyPredicted ? '✓ Voorspelling voltooid' : 'Eerstvolgende race'}
                </span>
                
                <h2 className="text-4xl md:text-5xl font-black italic uppercase mt-6 mb-2 tracking-tight group-hover:text-white transition-colors">
                  {nextRace ? nextRace.race_name : "Geen races gevonden"}
                </h2>
                
                <p className="text-slate-500 mb-10 uppercase tracking-[0.2em] text-sm font-bold">
                  {nextRace ? `Round ${nextRace.round} • ${nextRace.city_name || "Locatie onbekend"}` : ""}
                </p>

                <div className="inline-block bg-white text-black font-black italic uppercase px-8 py-4 rounded-xl group-hover:bg-slate-200 transition-all shadow-lg active:scale-95">
                  {isFullyPredicted ? 'Aanpassen →' : 'Nu Voorspellen →'}
                </div>
              </div>

              {nextRace && (
                <div className="absolute -right-10 -bottom-10 text-[12rem] font-black italic text-white/[0.03] select-none pointer-events-none uppercase">
                  {nextRace.city_name?.substring(0, 3) || nextRace.location_code}
                </div>
              )}
            </div>
          </Link>

          {/* KAART 2: Snelmenu met subtielere Tapered Borders */}
          <div className="space-y-6">
            <Link href="/races" className="block group relative p-[1px] rounded-2xl overflow-hidden transition-all">
              {/* Menu Tapered Border - licht op bij hover */}
              <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#475569_0deg,#475569_20deg,transparent_60deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative bg-[#1c232e] p-6 rounded-[calc(1rem-1px)] transition-colors group-hover:bg-[#222936]">
                <h3 className="font-black italic uppercase text-xl text-slate-200 group-hover:text-white">
                  Kalender
                </h3>
                <p className="text-slate-500 text-sm mt-1 font-medium italic">Alle 24 races van 2026</p>
              </div>
            </Link>

            <Link href="/predictions/season" className="block group relative p-[1px] rounded-2xl overflow-hidden transition-all">
              <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#475569_0deg,#475569_20deg,transparent_60deg)] opacity-40 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative bg-[#1c232e] p-6 rounded-[calc(1rem-1px)] transition-colors group-hover:bg-[#222936]">
                <h3 className="font-black italic uppercase text-xl text-slate-200 group-hover:text-white">Jaarvoorspelling</h3>
                <p className="text-slate-500 text-sm mt-1 font-medium italic">Wie pakt de wereldtitel?</p>
              </div>
            </Link>

            <div className="opacity-40 grayscale block relative p-[1px] rounded-2xl overflow-hidden cursor-not-allowed">
               <div className="absolute inset-0 bg-slate-800 opacity-20" />
               <div className="relative bg-[#161a23] p-6 rounded-[calc(1rem-1px)]">
                <h3 className="font-black italic uppercase text-xl text-slate-500">Leaderboard</h3>
                <p className="text-slate-600 text-sm mt-1">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}