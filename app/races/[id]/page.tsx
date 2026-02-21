"use client";

import { useState, use } from 'react'; // Gebruik 'use' voor params in Client Components
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js'; // De universele client
import Link from 'next/link';

// Initialiseer de client (gebruik je omgevingsvariabelen)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function QualyPredictPage({ params }: PageProps) {
  const router = useRouter();
  
  // Next.js 15: unwrappen van params in Client Component
  const resolvedParams = use(params);
  const raceId = resolvedParams.id;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");

  const handleSave = async () => {
    if (!selectedDriver) {
      setMessage("❌ Selecteer eerst een coureur");
      return;
    }

    setLoading(true);
    setMessage("⏳ Bezig met opslaan...");

    try {
      // Haal de huidige sessie op
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Je moet ingelogd zijn om te kunnen voorspellen.");
      }

      const { error } = await supabase
        .from('predictions_qualifying')
        .upsert({
          user_id: session.user.id,
          race_id: raceId,
          driver_id: selectedDriver,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage("✅ Voorspelling opgeslagen!");
      
      // Geef de gebruiker even tijd om het succesbericht te zien
      setTimeout(() => {
        router.push(`/races/${raceId}`);
        router.refresh(); // Belangrijk om de groene balkjes te updaten!
      }, 1200);
      
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Fout: ${err.message || "Er is iets misgegaan"}`);
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
          &larr; Annuleren
        </Link>

        <h1 className="text-3xl font-black italic uppercase text-red-600 mb-2 leading-none">
          Pole Position
        </h1>
        <p className="text-slate-400 text-xs font-bold uppercase mb-8 italic">
          Wie pakt de eerste startplek?
        </p>

        <div className="bg-[#161a23] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          {/* Accentlijn bovenin */}
          <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>

          <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-[0.2em]">
            Selecteer Coureur
          </label>
          
          <select 
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl p-4 text-white mb-8 focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none appearance-none cursor-pointer font-bold"
          >
            <option value="">-- Maak een keuze --</option>
            <option value="1">Max Verstappen</option>
            <option value="2">Lando Norris</option>
            <option value="3">Charles Leclerc</option>
            <option value="4">Lewis Hamilton</option>
            <option value="5">Oscar Piastri</option>
          </select>

          <button
            onClick={handleSave}
            disabled={loading}
            className={`w-full py-5 rounded-xl font-black italic uppercase tracking-tighter text-lg transition-all shadow-lg ${
              loading 
                ? "bg-slate-800 text-slate-500 cursor-not-allowed" 
                : "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-red-900/20"
            }`}
          >
            {loading ? "Systeem laadt..." : "Bevestig Voorspelling"}
          </button>

          {message && (
            <div className={`mt-6 p-4 rounded-lg text-center text-[10px] font-black uppercase tracking-widest italic animate-pulse ${
              message.includes('❌') ? 'bg-red-900/20 text-red-500 border border-red-500/20' : 'bg-green-900/20 text-green-400 border border-green-500/20'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}