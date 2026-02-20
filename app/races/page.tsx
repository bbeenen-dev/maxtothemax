import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { headers } from 'next/headers';

export default async function CalendarPage() {
  await headers(); 
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  const { data: races } = await supabase
    .from('races')
    .select('*')
    .order('round', { ascending: true });

  // 3. Ophalen uit de 3 specifieke tabellen
  let allPredictions: { race_id: any; type: string }[] = [];

  if (user) {
    const [racePreds, qualiPreds, sprintPreds] = await Promise.all([
      supabase.from('predictions_race').select('race_id').eq('user_id', user.id),
      supabase.from('predictions_qualifying').select('race_id').eq('user_id', user.id),
      supabase.from('predictions_sprint').select('race_id').eq('user_id', user.id),
    ]);

    if (racePreds.data) racePreds.data.forEach(p => allPredictions.push({ race_id: p.race_id, type: 'race' }));
    if (qualiPreds.data) qualiPreds.data.forEach(p => allPredictions.push({ race_id: p.race_id, type: 'qualy' }));
    if (sprintPreds.data) sprintPreds.data.forEach(p => allPredictions.push({ race_id: p.race_id, type: 'sprint' }));
  }

  const formatDateRange = (fp1: string, race: string) => {
    const start = new Date(fp1);
    const end = new Date(race);
    const month = end.toLocaleDateString('nl-NL', { month: 'long' });
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
        </header>

        {!races || races.length === 0 ? (
          <div className="text-center p-12">p-12 <p>Geen races gevonden.</p></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {races.map((race) => {
              // Filter de samengevoegde lijst op de huidige race
              const preds = allPredictions.filter(p => p.race_id === race.id);
              
              const hasQuali = preds.some(p => p.type === 'qualy');
              const hasRace = preds.some(p => p.type === 'race');
              const hasSprint = preds.some(p => p.type === 'sprint');
              
              const isSprintWeekend = race.sprint_race_start !== null && race.sprint_race_start !== undefined;
              
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
                  <div className="absolute top-2 right-2 flex gap-2 text-[8px] font-mono text-slate-600">
                    <span>Q:{hasQuali ? '✅' : '❌'}</span>
                    {isSprintWeekend && <span>S:{hasSprint ? '✅' : '❌'}</span>}
                    <span>R:{hasRace ? '✅' : '❌'}</span>
                  </div>

                  <div className="relative z-10">
                    <span className={`${isComplete ? 'text-green-500' : 'text-red-600'} font-black italic uppercase text-sm tracking-widest`}>
                      Round {race.round}
                    </span>
                    <h2 className="text-2xl font-black italic uppercase mb-1 mt-2">{race.race_name}</h2>
                    <p className="text-slate-500 text-sm font-medium">{formatDateRange(race.fp1_start, race.race_start)}</p>

                    <div className="flex gap-1.5 mt-4">
                      <div className={`h-1.5 w-8 rounded-full ${hasQuali ? 'bg-green-500' : 'bg-white/10'}`} />
                      {isSprintWeekend && (
                        <div className={`h-1.5 w-8 rounded-full ${hasSprint ? 'bg-green-500' : 'bg-white/10'}`} />
                      )}
                      <div className={`h-1.5 w-8 rounded-full ${hasRace ? 'bg-green-500' : 'bg-white/10'}`} />
                    </div>
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