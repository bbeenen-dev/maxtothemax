import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Timer } from 'lucide-react'; 

export default async function RaceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .eq('id', id)
    .single();

  if (!race) {
    notFound();
  }

  const nu = new Date();

  // Deadlines controleren
  const isQualyLocked = nu > new Date(race.qualifying_start);
  const isSprintLocked = race.has_sprint ? nu > new Date(race.sprint_race_start) : true;
  const isRaceLocked = nu > new Date(race.race_start);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
                
        {/* Race Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-800 p-8 rounded-t-2xl shadow-2xl">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
            {race.race_name}
          </h1>
          <div className="flex gap-4 mt-4 items-center">
            <span className="bg-black text-white px-3 py-1 text-sm font-bold rounded">
              {race.year}
            </span>
            <span className="text-red-100 font-medium uppercase tracking-widest text-sm">
              Round {race.round} | {race.location_code}
            </span>
          </div>
        </div>

        {/* Sectie: Winnaars van vorig jaar (Gekoppeld aan juiste database velden) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
          
          {/* Kaart: Winner 2025 (past_winners) */}
          <div className="bg-[#161a23] border border-slate-800 rounded-2xl p-4 relative overflow-hidden group">
            <div className="relative z-10 flex items-center gap-3">
              <div className="bg-red-600/10 p-2 rounded-lg">
                <Trophy className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">
                  Winner 2025
                </p>
                <h3 className="text-lg md:text-xl font-black italic uppercase text-white leading-none">
                  {race.past_winners || "Nog onbekend"}
                </h3>
              </div>
            </div>
            <div className="absolute right-2 bottom-0 text-4xl font-black italic text-white/[0.02] select-none uppercase">
              Win
            </div>
          </div>

          {/* Kaart: Pole Position 2025 (past_qualiwinner) */}
          <div className="bg-[#161a23] border border-slate-800 rounded-2xl p-4 relative overflow-hidden group">
            <div className="relative z-10 flex items-center gap-3">
              <div className="bg-blue-600/10 p-2 rounded-lg">
                <Timer className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 leading-none mb-1">
                  Pole 2025
                </p>
                <h3 className="text-lg md:text-xl font-black italic uppercase text-white leading-none">
                  {race.past_qualiwinner || "Nog onbekend"}
                </h3>
              </div>
            </div>
            <div className="absolute right-2 bottom-0 text-4xl font-black italic text-white/[0.02] select-none uppercase">
              P1
            </div>
          </div>
        </div>

        {/* Voorspelling Knoppen */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black italic uppercase tracking-tight border-l-4 border-red-600 pl-4">
            Plaats je voorspelling
          </h2>

          <div className="grid gap-4">
            <PredictionCard 
              title="Kwalificatie" 
              time={race.qualifying_start} 
              isLocked={isQualyLocked} 
              href={`/races/${race.id}/predict/qualy`}
            />

            {race.has_sprint && (
              <PredictionCard 
                title="Sprint Race" 
                time={race.sprint_race_start} 
                isLocked={isSprintLocked} 
                href={`/races/${race.id}/predict/sprint`}
              />
            )}

            <PredictionCard 
              title="Hoofdrace" 
              time={race.race_start} 
              isLocked={isRaceLocked} 
              href={`/races/${race.id}/predict/race`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionCard({ title, time, isLocked, href }: { title: string, time: string, isLocked: boolean, href: string }) {
  const formattedTime = new Date(time).toLocaleString('nl-NL', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  if (isLocked) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex justify-between items-center opacity-60 grayscale cursor-not-allowed">
        <div>
          <h3 className="text-xl font-bold italic uppercase text-slate-400">{title}</h3>
          <p className="text-xs text-slate-500 font-mono">Gesloten op {formattedTime}</p>
        </div>
        <span className="bg-slate-800 text-slate-400 px-4 py-2 rounded font-bold text-xs uppercase italic">Locked</span>
      </div>
    );
  }

  return (
    <Link href={href} className="group bg-[#1c232e] border border-slate-700 p-6 rounded-xl flex justify-between items-center hover:border-red-600 transition-all hover:shadow-[0_0_20px_rgba(220,38,38,0.15)]">
      <div>
        <h3 className="text-xl font-bold italic uppercase group-hover:text-red-500 transition-colors">{title}</h3>
        <p className="text-xs text-slate-400 font-mono">Deadline: {formattedTime}</p>
      </div>
      <span className="bg-red-600 text-white px-4 py-2 rounded font-bold text-xs uppercase italic group-hover:bg-red-500 transition-colors">
        Voorspel nu
      </span>
    </Link>
  );
}