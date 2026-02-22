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

  // 3. Handmatige check of de voorspellingen voor DEZE race bestaan
  let isComplete = false;
  if (user && nextRace) {
    // We halen de counts op voor deze specifieke race en gebruiker
    const [quali, sprint, race] = await Promise.all([
      supabase.from('predictions_qualifying').select('id', { count: 'exact', head: true }).eq('race_id', nextRace.id).eq('user_id', user.id),
      supabase.from('predictions_sprint').select('id', { count: 'exact', head: true }).eq('race_id', nextRace.id).eq('user_id', user.id),
      supabase.from('predictions_race').select('id', { count: 'exact', head: true }).eq('race_id', nextRace.id).eq('user_id', user.id)
    ]);

    const hasQuali = (quali.count ?? 0) > 0;
    const hasSprint = (sprint.count ?? 0) > 0;
    const hasRace = (race.count ?? 0) > 0;
    const needsSprint = !!nextRace.sprint_race_start;

    // De logica: als er een sprint is, moeten alle drie gedaan zijn. Zo niet, dan alleen quali en race.
    isComplete = needsSprint ? (hasQuali && hasSprint && hasRace) : (hasQuali && hasRace);
  }

  // De kleur bepalen op basis van de berekening hierboven
  const borderGradient = isComplete 
    ? 'bg-[conic-gradient(from_180deg_at_0%_50%,#22c55e_0deg,#22c55e_45deg,transparent_110deg)]' 
    : 'bg-[conic-gradient(from_180deg_at_0%_50%,#334155_0deg,#334155_45deg,transparent_110deg)]';

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white">
      
      {/* Hero Section (Ongewijzigd) */}
      <div className="relative w-full">
        <div className="relative w-full h-[35vh] md:h-[45vh] overflow-hidden border-b border-slate-800/50">
          <Image src="/hero-2026.JPG" alt="F1 2026 Hero" fill priority className="object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0e14]/40 via-transparent to-[#0b0e14] z-10" />
        </div>
        <div className="relative z-20 text-center px-4 -mt-20 md:-mt-24 pb-12">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 drop-shadow-2xl">
            F1 <span className="text-slate-400">Max2TheMax</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.4em] text-[10px]">Season 2026 Edition</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-30 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* KAART 1: De Volgende Race */}
          <Link 
            href={nextRace ? `/races/${nextRace.id}` : '#'}
            className="md:col-span-2 relative p-[2px] rounded-3xl overflow-hidden block shadow-2xl active:scale-[0.98] transition-all"
          >
            {/* HIER GEBEURT HET: De groene of grijze tapered lijn */}
            <div className={`absolute inset-0 ${borderGradient} opacity-100 transition-all duration-700`} />

            <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-8 h-full">
              <div className="relative z-10">
                <span className={`${isComplete ? 'bg-green-500/10 text-green-500 border-green-500/40' : 'bg-slate-800/50 text-slate-400 border-slate-700'} text-[10px] font-black uppercase px-3 py-1 rounded-full italic border`}>
                  {isComplete ? '✓ Alles ingevuld' : 'Nog niet volledig'}
                </span>
                
                <h2 className="text-4xl font-black italic uppercase mt-6 mb-2">
                  {nextRace ? nextRace.race_name : "Geen races"}
                </h2>
                
                <p className="text-slate-500 mb-10 uppercase tracking-widest text-xs font-bold">
                  {nextRace ? `Round ${nextRace.round} • ${nextRace.city_name}` : ""}
                </p>

                <div className={`inline-block font-black italic uppercase px-8 py-4 rounded-xl shadow-lg ${
                  isComplete ? 'bg-slate-800 text-white' : 'bg-white text-black'
                }`}>
                  {isComplete ? 'Aanpassen' : 'Voorspellen →'}
                </div>
              </div>
            </div>
          </Link>

          {/* Snelmenu (Statisch grijs voor nu) */}
          <div className="space-y-6">
            <Link href="/races" className="block relative p-[1px] rounded-2xl overflow-hidden active:scale-95">
              <div className="absolute inset-0 bg-[conic-gradient(from_180deg_at_0%_50%,#334155_0deg,#334155_30deg,transparent_80deg)]" />
              <div className="relative bg-[#1c232e] p-6 rounded-[calc(1rem-1px)]">
                <h3 className="font-black italic uppercase text-xl text-slate-200">Kalender</h3>
                <p className="text-slate-500 text-[11px] mt-1 font-bold uppercase tracking-wider">Alle races van 2026</p>
              </div>
            </Link>
            {/* ... rest van het menu ... */}
          </div>

        </div>
      </div>
    </div>
  );
}