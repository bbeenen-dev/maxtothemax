"use client";

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// We gebruiken de SSR browser client voor betere cookie-handling
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string; type: string }>;
}

export default function UniversalPredictPage({ params }: PageProps) {
  const router = useRouter();
  
  // Next.js 15 unwrapping van de Promise params
  const resolvedParams = use(params);
  const raceId = resolvedParams.id;
  const predictType = resolvedParams.type;

  // Initialiseer de Supabase client BINNEN de component
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const titles: Record<string, string> = {
    qualy: "Pole Position",
    sprint: "Sprint Winnaar",
    race: "Hoofdrace Winnaar"
  };

  const tables: Record<string, string> = {
    qualy: "predictions_qualifying",
    sprint: "predictions_sprint",
    race: "predictions_race"
  };

  // Check login status bij het laden
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoggedIn(false);
        setMessage("⚠️ Je bent niet ingelogd op dit toestel.");
      } else {
        setIsLoggedIn(true);
      }
    };
    checkUser();
  }, [supabase]);

  const handleSave = async () => {
    if (!selectedDriver) {
      setMessage("❌ Selecteer eerst een coureur");
      return;
    }

    setLoading(true);
    setMessage("⏳ Bezig met opslaan...");

    try {
      // Haal de meest actuele sessie op
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsLoggedIn(false);
        throw new Error("Sessie niet gevonden. Log opnieuw in.");
      }

      const tableName = tables[predictType] || "predictions_race";

      const { error } = await supabase
        .from(tableName)
        .upsert({
          user_id: session.user.id,
          race_id: raceId,
          driver_id: selectedDriver,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage("✅ Voorspelling opgeslagen!");
      
      setTimeout(() => {
        router.push(`/races/${raceId}`);
        router.refresh(); // Forceert de server om de race-detailpagina opnieuw te renderen
      }, 1200);
      
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Fout: ${err.message || "Database error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      <div className="max-w-md mx-auto">
        <Link 
          href={`/races/${raceId}`} 
          className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8 inline-block hover:text-white transition-colors"
        >
          &larr; Terug naar race
        </Link>

        <h1 className="text-3xl font-black italic uppercase text-red-600 leading-none mb-1">
          {titles[predictType] || "Voorspelling"}
        </h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase mb-8 italic tracking-widest">
          F1 Prediction Dashboard
        </p>

        <div className="bg-[#161a23] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>

          {!isLoggedIn && (
             <Link href="/login" className="block mb-6 p-4 bg-red-600/10 border border-red-600/20 rounded-xl text-center text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
               Je moet inloggen om te voorspellen &rarr;
             </Link>
          )}

          <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">
            Selecteer Coureur
          </label>
          
          <select 
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            disabled={!isLoggedIn}
            className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl p-4 text-white mb-8 outline-none font-bold focus:border-red-600 disabled:opacity-30 transition-all"
          >
            <option value="">-- Maak een keuze --</option>
            <option value="1">Max Verstappen</option>
            <option value="2">Lando Norris</option>
            <option value="3">Charles Leclerc</option>
            <option value="4">Oscar Piastri</option>
            <option value="5">Lewis Hamilton</option>
          </select>

          <button
            onClick={handleSave}
            disabled={loading || !isLoggedIn}
            className={`w-full py-5 rounded-xl font-black italic uppercase tracking-tighter text-lg transition-all ${
              loading || !isLoggedIn
                ? "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50" 
                : "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-lg shadow-red-900/20"
            }`}
          >
            {loading ? "Opslaan..." : "Bevestig Keuze"}
          </button>

          {message && (
            <div className={`mt-6 p-4 rounded-lg text-center text-[10px] font-black uppercase tracking-widest italic border ${
              message.includes('❌') || message.includes('⚠️') 
                ? 'bg-red-900/20 text-red-500 border-red-500/20' 
                : 'bg-green-900/20 text-green-400 border-green-500/20'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}