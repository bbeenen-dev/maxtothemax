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

  // We verwijderen !inner om te voorkomen dat coureurs zonder team volledig verdwijnen
  // En we halen hex_color op
  const [raceRes, driversRes] = await Promise.all([
    supabase.from('races').select('*').eq('id', id).single(),
    supabase.from('drivers')
      .select(`
        *,
        teams (
          team_name,
          hex_color
        )
      `)
      .eq('active', true)
  ]);

  // Foutafhandeling voor database-connectie
  if (raceRes.error || driversRes.error) {
    console.error("Database Error:", raceRes.error || driversRes.error);
    return (
      <div className="p-20 text-white text-center">
        <h1 className="text-2xl font-bold text-red-500">Database Verbindingsfout</h1>
        <p className="text-slate-400 mt-2">
          {raceRes.error?.message || driversRes.error?.message}
        </p>
      </div>
    );
  }

  const race = raceRes.data;

  // Verbeterde mapping: zorgt dat de lijst niet leeg blijft als de structuur iets afwijkt
  const drivers = (driversRes.data || []).map(d => {
    // Supabase relaties kunnen soms als array of als object binnenkomen
    const teamInfo = Array.isArray(d.teams) ? d.teams[0] : d.teams;
    
    return {
      ...d,
      teams: {
        team_name: teamInfo?.team_name || 'Privé-inschrijving',
        color_code: teamInfo?.hex_color || '#334155' // fallback kleur als hex_color mist
      }
    };
  });

  // Veiligheidscheck: als er echt geen coureurs zijn
  if (drivers.length === 0) {
    return (
      <div className="p-20 text-white text-center border border-dashed border-slate-800 rounded-3xl">
        <h1 className="text-xl font-bold italic uppercase">Geen coureurs gevonden</h1>
        <p className="text-slate-500 text-sm mt-2">
          Er staan momenteel geen actieve coureurs in de database voor deze sessie.
        </p>
      </div>
    );
  }

  const displayTitle = type === 'qualy' ? 'Kwalificatie' : type === 'sprint' ? 'Sprint Race' : 'Hoofdrace';

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <div className="inline-block bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 mb-2 uppercase tracking-widest rounded-sm">
            Live Voorspellen
          </div>
          <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">
            {displayTitle} <span className="text-red-600">Top 10</span>
          </h1>
          <p className="text-slate-500 uppercase text-[10px] font-bold tracking-widest mt-2">
            {race.race_name} — Sleep de coureurs in de juiste volgorde
          </p>
        </header>

        {/* De lijst wordt alleen gerenderd als er drivers zijn */}
        <PredictionSortableList 
          initialDrivers={drivers} 
          raceId={id} 
          type={type} 
        />
      </div>
    </div>
  );
}