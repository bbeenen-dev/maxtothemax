"use client";

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Gebruik de omgevingsvariabelen voor de client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PageProps {
  params: Promise<{ id: string; type: string }>;
}

export default function UniversalPredictPage({ params }: PageProps) {
  const router = useRouter();
  
  // Next.js 15 unwrapping
  const resolvedParams = use(params);
  const raceId = resolvedParams.id;
  const predictType = resolvedParams.type; // 'qualy', 'sprint' of 'race'

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Titels mappen op basis van het type in de URL
  const titles: Record<string, string> = {
    qualy: "Pole Position",
    sprint: "Sprint Winnaar",
    race: "Hoofdrace Winnaar"
  };

  // Tabelnamen mappen op basis van het type
  const tables: Record<string, string> = {
    qualy: "predictions_qualifying",
    sprint: "predictions_sprint",
    race: "predictions_race"
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoggedIn(false);
        setMessage("⚠️ Je bent niet ingelogd op dit toestel.");
      }
    };
    checkUser();
  }, []);

  const handleSave = async () => {
    if (!selectedDriver) {
      setMessage("❌ Selecteer eerst een coureur");
      return;
    }

    setLoading(true);
    setMessage("⏳ Bezig met opslaan...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error("Sessie verlopen, log opnieuw in.");

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
        router.refresh();
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
          className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-8 inline-block"
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
             <Link href="/login" className="block mb-4 p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-center text-red-500 text-xs font-bold uppercase">
               Tik hier om in te loggen
             </Link>
          )}

          <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">
            Kies Coureur
          </label>
          
          <select 
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl p-4 text-white mb-8 outline-none font-bold"
          >
            <option value="">-- Maak een keuze --</option>
            {/* Hier kun je later je lijst met coureurs inladen */}
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
                ? "bg-slate-800 text-slate-600 cursor-not-allowed" 
                : "bg-red-600 text-white hover:bg-red-700 active:scale-95"
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