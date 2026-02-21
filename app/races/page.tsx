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
    if (!fp1 || !race) return "";
    const start = new Date(fp1);
    const end = new Date(race);
    const options: Intl.DateTimeFormatOptions = { month: 'short' }; // 'short' voor compacte weergave naast de stad
    const month = end.toLocaleDateString('nl-NL', options);
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${month}`;
    }
    const startMonth = start.toLocaleDateString('nl-NL', { month: 'short' });
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${month}`;
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
          <div className="bg-[#161a23] border border-dashed border-slate-700 p-12 rounded-3xl text-center">
            <p className="text-slate-500 font-medium">De kalender is leeg.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {races.map((race) => {
              const preds = allPredictions.filter(p => p.race_id === race.id);
              const hasQuali = preds.some(p => p.type === 'qualy');
              const hasRace = preds.some(p => p.type === 'race');
              const hasSprint = preds.some(p => p.type === 'sprint');
              const isSprintWeekend = !!race.sprint_race_start;
              const isComplete = isSprintWeekend 
                ? (hasQuali && hasRace && hasSprint) 
                : (hasQuali && hasRace);

              return (
                <Link 
                  key={race.id} 
                  href={`/races/${race.id}`} 
                  className={`group relative bg-[#161a23] border-2 rounded-2xl p-6 transition-all duration-300 overflow-hidden ${
                    isComplete ? 'border-green-500 shadow-lg shadow-green-900/10' : 'border-slate-800 hover:border-red-600'
                  }`}
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`${isComplete ? 'text-green-500' : 'text-red-600'} font-black italic uppercase text-sm tracking-widest`}>
                        Round {race.round}
                      </span>
                      {isComplete && (
                        <span className="text-[10px] bg-green-500 text-[#0b0e14] font-bold px-2 py-0.5 rounded uppercase animate-pulse">
                          Ready
                        </span>
                      )}
                    </div>
                    
                    <h2 className="text-2xl font-black italic uppercase mb-1 leading-tight">{race.race_name}</h2>
                    
                    {/* Nieuwe sectie voor City Name en Datum */}
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold uppercase text-xs tracking-wider">
                        {race.city_name || "Unknown City"}
                      </p>
                      <span className="text-slate-600">•</span>
                      <p className="text-slate-400 text-xs font-medium">
                        {formatDateRange(race.fp1_start, race.race_start)}
                      </p>
                    </div>

                    {/* De Streepjes (Indicators) */}
                    <div className="flex gap-1.5 mt-5">
                      <div className={`h-1.5 w-8 rounded-full transition-all duration-500 ${hasQuali ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-800'}`} />
                      {isSprintWeekend && (
                        <div className={`h-1.5 w-8 rounded-full transition-all duration-500 ${hasSprint ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-800'}`} />
                      )}
                      <div className={`h-1.5 w-8 rounded-full transition-all duration-500 ${hasRace ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-800'}`} />
                    </div>
                  </div>
                  
                  <div className={`absolute -right-4 -bottom-6 text-8xl font-black italic transition-colors ${isComplete ? 'text-green-500/10' : 'text-white/5'}`}>
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