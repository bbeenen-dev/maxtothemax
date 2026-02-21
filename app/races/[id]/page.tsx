import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

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
    .maybeSingle();

  if (!race) {
    return <div className="p-20 text-white">Race niet gevonden.</div>;
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      {/* Simpele Header */}
      <div className="bg-red-700 p-6 rounded-xl mb-6">
        <h1 className="text-3xl font-bold uppercase">{race.race_name}</h1>
        <p className="opacity-80">Round {race.round} | {race.location_code}</p>
      </div>

      {/* Simpele Lijst met links */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold uppercase mb-4">Voorspellen</h2>
        
        <Link href={`/races/${id}/predict/qualy`} className="block p-4 bg-slate-800 rounded-lg">
           Kwalificatie &rarr;
        </Link>

        {race.has_sprint && (
          <Link href={`/races/${id}/predict/sprint`} className="block p-4 bg-slate-800 rounded-lg">
             Sprint Race &rarr;
          </Link>
        )}

        <Link href={`/races/${id}/predict/race`} className="block p-4 bg-slate-800 rounded-lg">
           Hoofdrace &rarr;
        </Link>
      </div>

      <Link href="/races" className="block mt-10 text-slate-500 text-sm italic">
        &larr; Terug naar kalender
      </Link>
    </div>
  );
}