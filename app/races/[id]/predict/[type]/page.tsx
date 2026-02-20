// app/races/[id]/predict/[type]/page.tsx
import PredictionSortableList from '@/components/PredictionSortableList';

export default async function PredictionPage({ params }: { params: Promise<{ id: string; type: string }> }) {
  const { id, type } = await params;

  // TEST DATA - Geen Supabase aanroep
  const testDrivers = [
    { driver_id: '1', driver_name: 'Max Verstappen', team_name: 'Red Bull', color_code: '#3671C6' },
    { driver_id: '2', driver_name: 'Lando Norris', team_name: 'McLaren', color_code: '#FF8000' },
  ];

  return (
    <div className="min-h-screen bg-[#0b0e14] p-8 text-white">
      <h1 className="text-xl mb-4">Test Modus: {type}</h1>
      <PredictionSortableList 
        initialDrivers={testDrivers} 
        raceId={id} 
        type={type} 
      />
    </div>
  );
}