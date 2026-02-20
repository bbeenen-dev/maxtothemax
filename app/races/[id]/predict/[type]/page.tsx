import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PredictionSortableList from '@/components/PredictionSortableList';

export default async function PredictionPage({ 
  params 
}: { 
  params: Promise<{ id: string; type: string }> 
}) {
  const { id, type } = await params;

  const validTypes = ['qualy', 'sprint', 'race'];
  if (!validTypes.includes(type)) {
    notFound();
  }

  const supabase = await createClient();

  const [raceRes, driversRes] = await Promise.all([
    supabase.from('races').select('*').eq('id', id).single(),
    supabase.from('drivers')
      .select(`
        id,
        first_name,
        last_name,
        active,
        teams (
          team_name,
          hex_color
        )
      `)
      .eq('active', true)
  ]);

  if (raceRes.error || driversRes.error) {
    return (
      <div className="p-10 text-white text-center">
        <h1 className="text-xl font-bold text-red-500 italic uppercase">Database Fout</h1>
      </div>
    );
  }

  const race = raceRes.data;

  // Hier mappen we de data naar de namen die de component verwacht
  const drivers = (driversRes.data || []).map(d => {
    const teamInfo = Array.isArray(d.teams) ? d.teams[0] : d.teams;
    return {
      driver_id: d.id,
      driver_name: `${d.first_name} ${d.last_name}`,
      teams: {
        team_name: teamInfo?.team_name || 'Privé-inschrijving',
        color_code: teamInfo?.hex_color || '#334155'
      }
    };
  });

  const displayTitle = type === 'qualy' ? 'Kwalificatie' : type === 'sprint' ? 'Sprint Race' : 'Hoofdrace';

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 text-center">
          <div className="inline-block bg-red-600 text-white text-[9px] font-black px-2 py-0.5 mb-1 uppercase tracking-[0.2em] rounded-sm italic text-center">
            Prediction Mode
          </div>
          <h1 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-tight text-center">
            {displayTitle} <span className="text-red-600">Top 10</span>
          </h1>
          <p className="text-slate-500 uppercase text-[9px] md:text-[10px] font-bold tracking-widest mt-1 text-center">
            {race.race_name} — Rangschik de coureurs
          </p>
        </header>

        <div className="bg-[#161a23]/30 rounded-3xl p-1 md:p-2 border border-slate-800/50 shadow-2xl">
          {/* HIER GAAT DE DATA NAAR DE COMPONENT */}
          <PredictionSortableList 
            initialDrivers={drivers} 
            raceId={id} 
            type={type} 
          />
        </div>
      </div>
    </div>
  );
}