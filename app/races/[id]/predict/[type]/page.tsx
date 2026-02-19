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

  // Aangepaste query met de juiste kolomnaam: hex_color
  const [raceRes, driversRes] = await Promise.all([
    supabase.from('races').select('*').eq('id', id).single(),
    supabase.from('drivers')
      .select(`
        *,
        teams!inner (
          team_name,
          hex_color
        )
      `)
      .eq('active', true)
  ]);

  // Als er een fout is, tonen we die nu duidelijk
  if (raceRes.error || driversRes.error) {
    console.error("Race Error:", raceRes.error);
    console.error("Driver Error:", driversRes.error);
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
  // We mappen de data even om zodat de SortableList niet crasht op de nieuwe kolomnaam
  const drivers = driversRes.data.map(d => ({
    ...d,
    teams: {
      ...d.teams,
      color_code: d.teams.hex_color // We hernoemen het hier intern naar wat de component verwacht
    }
  }));

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

        <PredictionSortableList 
          initialDrivers={drivers} 
          raceId={id} 
          type={type} 
        />
      </div>
    </div>
  );
}