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

  // 3. Logica voor de kleur van de accentstreep (Groen als alles ingevuld is, anders Donkergrijs)
  // Voor de HomePage checken we even snel of er voorspellingen zijn voor de 'Next Race'
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

  const accentColor = isFullyPredicted ? 'bg-green-500' : 'bg-slate-700';
  const glowColor = isFullyPredicted ? 'shadow-[0_0_15px_rgba(34,197,94,0.4)]' : '';

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
          
          {/* KAART 1: De Volgende Race */}
          <div className="md:col-span-2 bg-[#161a23] border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
            
            {/* De Ronde Accent Streep (Zwevend) */}
            <div className={`absolute left-0 inset-y-6 w-1.5 rounded-full transition-all duration-500 ${accentColor} ${glowColor}`} />
            
            <div className="relative z-10 pl-4">
              <span className={`${isFullyPredicted ? 'bg-green-500/20 text-green-500' : 'bg-slate-800 text-slate-400'} text-[10px] font-black uppercase px-3 py-1 rounded-full italic border border-current opacity-80`}>
                {isFullyPredicted ? '✓ Completed' : 'Next Event'}
              </span>
              
              <h2 className="text-4xl font-black italic uppercase mt-4 mb-2 tracking-tight">
                {nextRace ? nextRace.race_name : "Geen races gevonden"}
              </h2>
              
              <p className="text-slate-500 mb-8 uppercase tracking-widest text-sm font-bold">
                {nextRace ? `Round ${nextRace.round} • ${nextRace.city_name || "Locatie onbekend"}` : ""}
              </p>

              {nextRace && (
                <Link
                  href={`/races/${nextRace.id}`}
                  className="inline-block bg-white text-black font-black italic uppercase px-8 py-4 rounded-xl hover:bg-slate-200 transition-all shadow-lg active:scale-95"
                >
                  {isFullyPredicted ? 'Bekijk voorspelling' : 'Voorspellen →'}
                </Link>
              )}
            </div>

            {nextRace && (
              <div className="absolute -right-10 -bottom-10 text-[12rem] font-black italic text-white/[0.02] select-none pointer-events-none uppercase">
                {nextRace.city_name?.substring(0, 3) || nextRace.location_code}
              </div>
            )}
          </div>

          {/* KAART 2: Snelmenu */}
          <div className="space-y-6">
            <Link href="/races" className="block group">
              <div className="bg-[#1c232e] border border-slate-800 p-6 rounded-2xl relative overflow-hidden transition-all hover:bg-[#222936]">
                <div className="absolute left-0 inset-y-4 w-1 bg-slate-700 rounded-full transition-all group-hover:bg-slate-400 group-hover:w-1.5" />
                <h3 className="font-black italic uppercase text-xl pl-2">
                  Kalender
                </h3>
                <p className="text-slate-500 text-sm mt-1 pl-2 font-medium italic">Alle 24 races van 2026</p>
              </div>
            </Link>

            <Link href="/predictions/season" className="block group">
              <div className="bg-[#1c232e] border border-slate-800 p-6 rounded-2xl relative overflow-hidden transition-all hover:bg-[#222936]">
                <div className="absolute left-0 inset-y-4 w-1 bg-slate-700 rounded-full transition-all group-hover:bg-slate-400 group-hover:w-1.5" />
                <h3 className="font-black italic uppercase text-xl pl-2 text-slate-200">Jaarvoorspelling</h3>
                <p className="text-slate-500 text-sm mt-1 pl-2 font-medium italic">Wie pakt de titel?</p>
              </div>
            </Link>

            <div className="bg-[#161a23]/50 border border-slate-800/50 p-6 rounded-2xl relative opacity-40 grayscale">
              <div className="absolute left-0 inset-y-4 w-1 bg-slate-800 rounded-full" />
              <h3 className="font-black italic uppercase text-xl pl-2 text-slate-500">Leaderboard</h3>
              <p className="text-slate-600 text-sm mt-1 pl-2">Coming Soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}