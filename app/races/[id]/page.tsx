import Link from 'next/link';

export default async function RaceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // We wachten alleen op de ID, we raken Supabase nog even niet aan
  const { id } = await params;

  return (
    <div className="min-h-screen bg-blue-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md bg-black/20 p-10 rounded-3xl border-4 border-white/20 backdrop-blur-md">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-4">
          Diagnose Modus
        </h1>
        <p className="text-blue-100 mb-8">
          Als je dit blauwe scherm ziet, werkt de routing van je app goed! 
          Het probleem zit dan waarschijnlijk in de database-verbinding.
        </p>
        
        <div className="bg-white/10 p-4 rounded-xl font-mono text-sm mb-8">
          Geladen ID: <span className="text-yellow-400 font-bold">{id}</span>
        </div>

        <Link 
          href="/races" 
          className="inline-block bg-white text-blue-900 px-6 py-3 rounded-xl font-black uppercase italic text-sm hover:bg-blue-100 transition-colors"
        >
          ← Terug naar kalender
        </Link>
      </div>
      
      <p className="mt-8 text-blue-300 text-[10px] uppercase tracking-[0.3em] font-bold">
        Next.js 15 Runtime Check
      </p>
    </div>
  );
}