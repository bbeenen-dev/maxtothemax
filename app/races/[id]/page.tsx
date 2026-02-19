import { createClient } from '@/lib/supabase/server'; // Check of dit pad klopt met jouw project
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function RaceDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  // Haal de race op inclusief de details die we nodig hebben
  const { data: race } = await supabase
    .from('races')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!race) {
    notFound();
  }

  const nu = new Date();

  // Deadlines controleren (UTC naar Local wordt automatisch afgehandeld door JS Date)
  const isQualyLocked = nu > new Date(race.qualifying_start);
  const isSprintLocked = race.has_sprint ? nu > new Date(race.sprint_race_start) : true;
  const isRaceLocked = nu > new Date(race.race_start);

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigatie */}
        <Link href="/races" className="text-red-600 font-bold text-sm uppercase tracking-widest hover:underline mb-6 block">
          ← Terug naar kalender
        </Link>

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

        {/* Info Sectie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-800 border-x border-b border-slate-800 rounded-b-2xl overflow-hidden mb-12">
          <div className="bg-[#161a23] p-6 text-center">
            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Winnaar 2025</p>
            <p className="text-2xl font-black italic">{race.past_winners?.['2025'] || 'Nog onbekend'}</p>
          </div>
          <div className="bg-[#161a23] p-6 text-center border-l border-slate-800">
            <p className="text-slate-400 text-xs uppercase font-bold mb-1">Pole Position 2025</p>
            <p className="text-2xl font-black italic">{race.past_qualiwinner?.['2025'] || 'Nog onbekend'}</p>
          </div>
        </div>

        {/* Voorspelling Knoppen */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black italic uppercase tracking-tight border-l-4 border-red-600 pl-4">
            Plaats je voorspelling
          </h2>

          <div className="grid gap-4">
            {/* KWALIFICATIE */}
            <PredictionCard 
              title="Kwalificatie" 
              time={race.qualifying_start} 
              isLocked={isQualyLocked} 
              href={`/races/${race.id}/predict/qualy`}
            />

            {/* SPRINT (Alleen als van toepassing) */}
            {race.has_sprint && (
              <PredictionCard 
                title="Sprint Race" 
                time={race.sprint_race_start} 
                isLocked={isSprintLocked} 
                href={`/races/${race.id}/predict/sprint`}
              />
            )}

            {/* HOOFDRACE */}
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

// Sub-component voor de knoppen/kaarten
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