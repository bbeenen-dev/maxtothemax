import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PredictionSortableList from '@/components/PredictionSortableList';

export const dynamic = "force-dynamic";

export default async function PredictionPage({ params }: { params: { id: string, type: string } }) {
  const supabase = await createClient();

  const [raceRes, driversRes] = await Promise.all([
    supabase.from('races').select('*').eq('id', params.id).single(),
    supabase.from('drivers').select('*, teams(team_name, color_code)').eq('active', true)
  ]);

  if (!raceRes.data || !driversRes.data) notFound();

  // Handige functie om de opgeslagen data naar Supabase te sturen
  // (In een echte app zou je dit via een Server Action doen)
  async function handleSave(orderedDrivers: any[]) {
    "use server";
    console.log("Opslaan van volgorde voor type:", params.type);
    // Hier komt de code om de top 10 (of de hele lijst) in de database te zetten
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-4">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-black italic uppercase">
            Voorspelling <span className="text-red-600">{params.type}</span>
          </h1>
          <p className="text-slate-500 uppercase text-xs tracking-tighter mt-2">
            Sleep de coureurs in de juiste volgorde
          </p>
        </header>

        <PredictionSortableList 
         initialDrivers={driversRes.data} 
         raceId={params.id} 
         type={params.type} 
        />
      </div>
    </div>
  );
}