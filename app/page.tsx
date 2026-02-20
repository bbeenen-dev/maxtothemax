import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  const supabase = await createClient();
  
  // 1. Haal de huidige gebruiker op
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Haal de eerstvolgende race op
  const { data: nextRaces } = await supabase
    .from('races')
    .select('*')
    .gt('race_start', new Date().toISOString())
    .order('race_start', { ascending: true })
    .limit(1);

  const nextRace = nextRaces?.[0];

  // 3. Haal voorspellingen op uit de 3 verschillende tabellen (net als in de kalender)
  let userPreds = { hasQuali: false, hasRace: false, hasSprint: false };

  if (user && nextRace) {
    const [racePreds, qualiPreds, sprintPreds] = await Promise.all([
      supabase.from('predictions_race').select('id').eq('user_id', user.id).eq('race_id', nextRace.id),
      supabase.from('predictions_qualifying').select('id').eq('user_id', user.id).eq('race_id', nextRace.id),
      supabase.from('predictions_sprint').select('id').eq('user_id', user.id).eq('race_id', nextRace.id),
    ]);

    userPreds = {
      hasRace: (racePreds.data?.length ?? 0) > 0,
      hasQuali: (qualiPreds.data?.length ?? 0) > 0,
      hasSprint: (sprintPreds.data?.length ?? 0) > 0,
    };
  }

  // 4. Check of het een sprintweekend is
  const isSprintWeekend = nextRace?.sprint_race_start !== null && nextRace?.sprint_race_start !== undefined;

  // 5. Datum format helper (exact uit je kalender code)
  const formatDateRange = (fp1: string, race: string) => {
    if (!fp1 || !race) return "";
    const start = new Date(fp1);
    const end = new Date(race);
    const options: Intl.DateTimeFormatOptions = { month: 'long' };
    const month = end.toLocaleDateString('nl-NL', options);
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${month} ${end.getFullYear()}`;
    }
    
    const startMonth = start.toLocaleDateString('nl-NL', { month: 'short' });
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${month} ${end.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white">
      
      {/* Hero Section met Panorama Foto */}
      <div className="relative w-full h-[300px] md:h-[450px] flex items-center justify-center overflow-hidden">
        <img 
          src="/hero-2026.JPG" 
          alt="Max Verstappen Red Bull 2026" 
          className="absolute inset-0 w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0b0e14]/20 to-[#0b0e14] z-20" />
        
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
          <div className="md:col-span-2 bg-[#161a23]/95 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 shadow-2xl overflow-hidden relative group">
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <span className="bg-red-600 text-white text-xs font-black uppercase px-3 py-1 rounded-full italic shadow-lg">Next Event</span>
                
                {/* Status streepjes (Logica uit kalender met groene kleur) */}
                <div className="flex gap-1.5 bg-black/40 p-2 rounded-lg backdrop-blur-md">
                  <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${userPreds.hasQuali ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white/10'}`} title="Qualy" />
                  {isSprintWeekend && (
                    <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${userPreds.hasSprint ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white/10'}`} title="Sprint" />
                  )}
                  <div className={`w-8 h-1.5 rounded-full transition-all duration-500 ${userPreds.hasRace ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-white/10'}`} title="Race" />
                </div>
              </div>

              <h2 className="text-5xl md:text-6xl font-black italic uppercase mt-6 mb-2 tracking-tighter">
                {nextRace ? nextRace.race_name : "Geen races gevonden"}
              </h2>
              
              <div className="flex items-center gap-4 mb-10">
                <p className="text-slate-400 uppercase tracking-widest text-sm font-bold">
                  {nextRace ? `Round ${nextRace.round} • ${nextRace.location_code}` : ""}
                </p>
                {nextRace && (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    <p className="text-slate-400 text-sm font-medium">
                      {formatDateRange(nextRace.fp1_start, nextRace.race_start)}
                    </p>
                  </>
                )}
              </div>
              
              {nextRace && (
                <Link 
                  href={`/races/${nextRace.id}`}
                  className="inline-block bg-white text-black font-black italic uppercase px-10 py-4 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-xl hover:-translate-y-1"
                >
                  Voorspellen →
                </Link>
              )}
            </div>
            
            <div className="absolute -right-10 -bottom-10 text-[14rem] font-black italic text-white/[0.03] select-none pointer-events-none uppercase">
                {nextRace?.location_code}
            </div>
          </div>

          {/* RECHTERKANT */}
          <div className="space-y-6">
            <Link href="/predictions/season" className="block group">
              <div className="bg-gradient-to-br from-red-900/40 to-red-600/10 border border-red-900/50 p-8 rounded-2xl hover:border-red-500 transition-all shadow-lg h-full flex flex-col justify-center">
                <h3 className="font-black italic uppercase text-2xl text-white group-hover:text-red-400 transition-colors">Jaarvoorspelling</h3>
                <p className="text-red-200/60 text-sm mt-2 leading-relaxed">Bepaal wie in 2026 de wereldtitel en constructeursbeker pakt.</p>
              </div>
            </Link>

            <div className="bg-[#161a23] border border-slate-800 p-8 rounded-2xl opacity-50 relative overflow-hidden">
               <h3 className="font-black italic uppercase text-2xl text-slate-500">Leaderboard</h3>
               <p className="text-slate-600 text-sm mt-2">De stand wordt bijgewerkt na de eerste race.</p>
               <div className="absolute top-2 right-2 px-2 py-1 bg-slate-800 text-[10px] font-bold text-slate-500 rounded uppercase">Soon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}