import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function RaceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  try {
    const supabase = await createClient();
    
    const { data: race, error } = await supabase
      .from('races')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!race) throw new Error("Race niet gevonden in database");

    // Als alles goed gaat, tonen we de data (zonder iconen voor de veiligheid)
    return (
      <div className="min-h-screen bg-[#0b0e14] text-white p-8">
        <h1 className="text-4xl font-black uppercase italic text-red-600">{race.race_name}</h1>
        <p className="text-slate-400 mt-2">ID bevesitgd: {race.id}</p>
        <Link href="/races" className="inline-block mt-8 bg-white/10 p-3 rounded-lg text-xs font-bold uppercase">
          ← Terug naar kalender
        </Link>
      </div>
    );

  } catch (err: any) {
    // DIT GAAT ONS VERTELLEN WAT ER MIS IS
    return (
      <div className="min-h-screen bg-orange-700 text-white p-10">
        <h1 className="text-2xl font-bold">Database Fout!</h1>
        <p className="mt-4 p-4 bg-black/20 rounded font-mono text-sm">
          {err.message || "Onbekende fout bij verbinden met Supabase"}
        </p>
        <p className="mt-6 text-sm opacity-80">
          Check of je SUPABASE_URL en SERVICE_ROLE_KEY in Vercel staan.
        </p>
        <Link href="/races" className="underline mt-4 block">Terug</Link>
      </div>
    );
  }
}