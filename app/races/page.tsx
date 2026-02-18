import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function CalendarPage() {
  const supabase = await createClient();
  
  // Haal alle races op voor 2026 uit de database
  const { data: races } = await supabase
    .from('races')
    .select('*')
    .order('round', { ascending: true });

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter border-l-8 border-red-600 pl-6">
            F1 Kalender <span className="text-red-600">2026</span>
          </h1>
          <p className="text-slate-400 mt-2 uppercase tracking-widest font-bold text-sm">
            Voorspel elk race-weekend en verzamel punten
          </p>
        </header>

        {!races || races.length === 0 ? (
          <div className="bg-[#161a23] border border-dashed border-slate-700 p-12 rounded-3xl text-center">
            <p className="text-slate-500 font-medium">De kalender is momenteel leeg. Voeg races toe in de database!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {races.map((race) => (
              <Link 
                key={race.id} 
                href={`/races/${race.id}`} 
                className="group relative bg-[#161a23] border border-slate-800 rounded-2xl p-6 hover:border-red-600 transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.1)] overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-red-600 font-black italic uppercase text-sm tracking-widest">
                      Round {race.round}
                    </span>
                    <span className="bg-black/50 text-slate-400 text-[10px] font-bold px-2 py-1 rounded">
                      {race.location_code}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black italic uppercase group-hover:text-white transition-colors mb-1">
                    {race.race_name}
                  </h2>
                  <p className="text-slate-500 text-sm font-medium">
                    {new Date(race.race_start).toLocaleDateString('nl-NL', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                
                {/* Decoratieve achtergrond nummers */}
                <div className="absolute -right-4 -bottom-6 text-8xl font-black italic text-white/[0.02] group-hover:text-white/[0.05] transition-all">
                  {race.round}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}