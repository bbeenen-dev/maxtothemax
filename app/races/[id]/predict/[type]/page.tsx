import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PredictionSortableList from '@/components/PredictionSortableList';

// Dwing de pagina om altijd de nieuwste data te laden (voorkomt 404 door caching)
export const dynamic = 'force-dynamic';

export default async function PredictionPage({ 
  params 
}: { 
  params: Promise<{ id: string; type: string }> 
}) {
  // 1. Wacht op de parameters (Cruciaal voor Next.js 15)
  const { id, type } = await params;

  // 2. Controleer of het type geldig is om fouten te voorkomen
  const validTypes = ['qualy', 'sprint', 'race'];
  if (!validTypes.includes(type)) {
    notFound();
  }

  const supabase = await createClient();

  // 3. Haal data op (inclusief teams voor de kleurcodes en namen)
  const [raceRes, driversRes] = await Promise.all([
    supabase.from('races').select('*').eq('id', id).single(),
    supabase.from('drivers')
      .select('*, teams(team_name, color_code)')
      .eq('active', true)
  ]);

  // Als de race of coureurs niet gevonden worden: 404
  if (!raceRes.data || !driversRes.data) {
    notFound();
  }

  const race = raceRes.data;
  const drivers = driversRes.data;

  // 4. Bepaal de titel op basis van het type
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

        {/* De interactieve lijst component */}
        <PredictionSortableList 
          initialDrivers={drivers} 
          raceId={id} 
          type={type} 
        />
        
        <p className="text-center text-slate-600 text-[10px] mt-8 uppercase tracking-widest font-medium">
          Let op: Je kunt je voorspelling aanpassen tot de start van de sessie.
        </p>
      </div>
    </div>
  );
}