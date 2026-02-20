import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { headers } from 'next/headers';

export default async function CalendarPage() {
  // Forceert dynamische rendering om cache-problemen met de groene rand te voorkomen
  await headers(); 

  const supabase = await createClient();
  
  // 1. Haal de huidige gebruiker op
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Haal alle races op
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .order('round', { ascending: true });

  // 3. Haal de voorspellingen van de gebruiker op
  const { data: userPredictions } = user 
    ? await supabase.from('predictions').select('race_id, type').eq('user_id', user.id)
    : { data: [] };

  // Functie voor datumweergave: "15 - 17 maart 2026"
  const formatDateRange = (fp1: string, race: string) => {
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
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter border-l-8 border-red-600 pl-6">
            F1 Kalender <span className="text-red-600">2026</span>
          </h1>
          <p className="text-slate-400 mt-2 uppercase tracking-widest font-bold text-sm">
            {user ? 'Check je voorspellingen per weekend' : 'Log in om te voorspellen'}
          </p>
        </header>

        {!races || races.length === 0 ? (
          <div className="bg-[#161a23] border border-dashed border-slate-700 p-12 rounded-3xl text-center">
            <p className="text-slate-500 font-medium">De kalender is leeg.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {races.map((race) => {
              // Zoek voorspellingen voor deze specifieke race
              const preds = userPredictions?.filter(p => p.race_id === race.id) || [];
              
              // Verbeterde checks: we maken ze ongevoelig voor hoofdletters en spaties
              const hasQuali = preds.some(p => p.type?.trim().toLowerCase() === 'qualy');
              const hasRace = preds.some(p => p.type?.trim().toLowerCase() === 'race');
              const hasSprint = preds.some(p => p.type?.trim().toLowerCase() === 'sprint');
              
              // Bepaal of dit een sprintweekend is (als de starttijd niet leeg is)
              const isSprintWeekend = race.sprint_race_start !== null && race.sprint_race_start !== undefined;
              
              // Bepaal of de voorspellingen compleet zijn
              const isComplete = isSprintWeekend 
                ? (hasQuali && hasRace && hasSprint) 
                : (hasQuali && hasRace);

              return (
                <Link 
                  key={race.id} 
                  href={`/races/${race.id}`} 
                  className={`group relative bg-[#161a23] border-2 rounded-2xl p-6 transition-all duration-300 overflow-hidden ${
                    isComplete 
                      ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.25)]' 
                      : 'border-slate-800 hover:border-red-600'
                  }`}
                >
                  {/* DEBUG INFO: Zo kun je zien wat de code detecteert */}
                  <div className="absolute top-2 right-2 flex gap-2 text-[8px] font-mono text-slate-600">
                    <span>Q:{hasQuali ? '✅' : '❌'}</span>
                    {isSprintWeekend && <span>S:{hasSprint ? '✅' : '❌'}</span>}
                    <span>R:{hasRace ? '✅' : '❌'}</span>
                  </div>

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`${isComplete ? 'text-green-500' : 'text-red-600'} font-black italic uppercase text-sm tracking-widest`}>
                        Round {race.round}
                      </span>
                      {isComplete && (
                        <span className="text-[10px] bg-green-500 text-white font-bold px-2 py-0.5 rounded uppercase">
                          Ready
                        </span>
                      )}
                    </div>
                    
                    <h2 className="text-2xl font-black italic uppercase mb-1">
                      {race.race_name}
                    </h2>
                    
                    <p className="text-slate-500 text-sm font-medium">
                      {formatDateRange(race.fp1_start, race.race_start)}
                    </p>

                    {/* Visuele balkjes status */}
                    <div className="flex gap-1.5 mt-4">
                      <div className={`h-1.5 w-8 rounded-full ${hasQuali ? 'bg-green-500' : 'bg-white/10'}`} />
                      {isSprintWeekend && (
                        <div className={`h-1.5 w-8 rounded-full ${hasSprint ? 'bg-green-500' : 'bg-white/10'}`} />
                      )}
                      <div className={`h-1.5 w-8 rounded-full ${hasRace ? 'bg-green-500' : 'bg-white/10'}`} />
                    </div>
                  </div>
                  
                  {/* Achtergrond Round nummer */}
                  <div className={`absolute -right-4 -bottom-6 text-8xl font-black italic transition-all ${
                    isComplete ? 'text-green-500/[0.08]' : 'text-white/[0.02]'
                  }`}>
                    {race.round}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}