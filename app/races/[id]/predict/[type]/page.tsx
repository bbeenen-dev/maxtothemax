import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PredictionSortableList from '@/components/PredictionSortableList';

export default async function PredictionPage({ params }: { params: Promise<{ id: string; type: string }> }) {
  const { id, type } = await params;
  const supabase = await createClient();

  const [raceRes, driversRes] = await Promise.all([
    supabase.from('races').select('*').eq('id', id).single(),
    supabase.from('drivers').select(`id, first_name, last_name, teams(team_name, hex_color)`).eq('active', true)
  ]);

  if (!raceRes.data || !driversRes.data) return notFound();

  // We maken de data hier "hufterproof"
  const formattedDrivers = driversRes.data.map((d: any) => ({
    driver_id: String(d.id),
    driver_name: `${d.first_name} ${d.last_name}`,
    team_name: d.teams?.team_name || 'F1 Team',
    color_code: d.teams?.hex_color || '#334155'
  }));

  return (
    <div className="min-h-screen bg-[#0b0e14] p-4 text-white">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black italic uppercase text-center mb-6">
          {type} <span className="text-red-600">Voorspelling</span>
        </h1>
        <PredictionSortableList 
          initialDrivers={formattedDrivers} 
          raceId={id} 
          type={type} 
        />
      </div>
    </div>
  );
}