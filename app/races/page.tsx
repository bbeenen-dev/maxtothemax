
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
    const options: Intl.DateTimeFormatOptions = { month: 'short' };
    const month = end.toLocaleDateString('nl-NL', options);
    
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()}-${end.getDate()} ${month}`;
    }
    return `${start.getDate()} ${start.toLocaleDateString('nl-NL', { month: 'short' })} - ${end.getDate()} ${month}`;
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter border-l-8 border-slate-800 pl-6">
            F1 Kalender <span className="text-slate-500">2026</span>
          </h1>
        </header>

        {!races || races.length === 0 ? (
          <div className="bg-[#161a23] border border-dashed border-slate-700 p-12 rounded-3xl text-center">
            <p className="text-slate-500 font-medium">De kalender is leeg.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {races.map((race) => {
              const preds = allPredictions.filter(p => p.race_id === race.id);
              const isComplete = !!race.sprint_race_start 
                ? (preds.some(p => p.type === 'qualy') && preds.some(p => p.type === 'race') && preds.some(p => p.type === 'sprint'))
                : (preds.some(p => p.type === 'qualy') && preds.some(p => p.type === 'race'));

              return (
                <Link 
                  key={race.id} 
                  href={`/races/${race.id}`} 
                  className="group relative p-[2px] rounded-3xl transition-all duration-500 overflow-hidden block"
                >
                  {/* De Gradient Border (De lijn die de bocht omgaat) */}
                  <div className={`absolute inset-0 transition-opacity duration-500 ${
                    isComplete 
                      ? 'bg-[conic-gradient(from_180deg_at_0%_50%,#22c55e_0deg,#22c55e_40deg,transparent_90deg)] opacity-100' 
                      : 'bg-[conic-gradient(from_180deg_at_0%_50%,#334155_0deg,#334155_40deg,transparent_90deg)] opacity-60 group-hover:opacity-100'
                  }`} />

                  {/* De Kaart Inhoud */}
                  <div className="relative bg-[#161a23] rounded-[calc(1.5rem-1px)] p-6 h-full transition-colors group-hover:bg-[#1c222d]">
                    <div className="flex justify-between items-start mb-4">
                      <span className={`${isComplete ? 'text-green-500' : 'text-slate-500'} font-black italic uppercase text-xs tracking-widest`}>
                        Round {race.round}
                      </span>
                      {isComplete && (
                        <div className="bg-green-500/20 text-green-500 p-1 rounded-full animate-pulse">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <h2 className="text-2xl font-black italic uppercase mb-1 leading-tight tracking-tight group-hover:text-white transition-colors">
                      {race.race_name}
                    </h2>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <p className="text-slate-300 font-bold uppercase text-[10px] tracking-wider italic">
                        {race.city_name || "Unknown"}
                      </p>
                      <span className="text-slate-700 text-[10px]">•</span>
                      <p className="text-slate-500 text-[10px] font-medium uppercase">
                        {formatDateRange(race.fp1_start, race.race_start)}
                      </p>
                    </div>

                    <div className="flex gap-1.5 mt-2">
                      <div className={`h-1 w-6 rounded-full ${preds.some(p => p.type === 'qualy') ? 'bg-green-500' : 'bg-slate-800'}`} />
                      {!!race.sprint_race_start && (
                        <div className={`h-1 w-6 rounded-full ${preds.some(p => p.type === 'sprint') ? 'bg-green-500' : 'bg-slate-800'}`} />
                      )}
                      <div className={`h-1 w-6 rounded-full ${preds.some(p => p.type === 'race') ? 'bg-green-500' : 'bg-slate-800'}`} />
                    </div>
                  </div>
                  
                  <div className={`absolute -right-2 -bottom-4 text-7xl font-black italic transition-colors select-none pointer-events-none ${
                    isComplete ? 'text-green-500/5' : 'text-white/5'
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