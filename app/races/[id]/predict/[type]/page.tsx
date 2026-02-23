"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Driver {
  driver_id: string;
  driver_name: string;
}

export default function UniversalPredictPage() {
  const params = useParams();
  const raceIdStr = params?.id as string;
  const predictType = params?.type as string;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Validatie van de ID (Voorkomt de %%DRP fout en syntax errors)
  const raceId = parseInt(raceIdStr);
  const isValidRaceId = !isNaN(raceId) && !raceIdStr.includes('%');

  const [drivers, setDrivers] = useState<Driver[]>([
    { driver_id: "VER", driver_name: "Max Verstappen" },
    { driver_id: "LAW", driver_name: "Liam Lawson" },
    { driver_id: "NOR", driver_name: "Lando Norris" },
    { driver_id: "PIA", driver_name: "Oscar Piastri" },
    { driver_id: "LEC", driver_name: "Charles Leclerc" },
    { driver_id: "HAM", driver_name: "Lewis Hamilton" },
    { driver_id: "RUS", driver_name: "George Russell" },
    { driver_id: "ANT", driver_name: "Kimi Antonelli" },
    { driver_id: "ALO", driver_name: "Fernando Alonso" },
    { driver_id: "STR", driver_name: "Lance Stroll" },
    { driver_id: "HUL", driver_name: "Nico Hülkenberg" },
    { driver_id: "BOR", driver_name: "Gabriel Bortoleto" },
    { driver_id: "SAI", driver_name: "Carlos Sainz" },
    { driver_id: "ALB", driver_name: "Alex Albon" },
    { driver_id: "GAS", driver_name: "Pierre Gasly" },
    { driver_id: "COL", driver_name: "Franco Colapinto" },
    { driver_id: "OCO", driver_name: "Esteban Ocon" },
    { driver_id: "BEA", driver_name: "Oliver Bearman" },
    { driver_id: "TSU", driver_name: "Yuki Tsunoda" },
    { driver_id: "LIN", driver_name: "Arvid Lindblad" },
    { driver_id: "PER", driver_name: "Sergio Perez" },
    { driver_id: "BOT", driver_name: "Valtteri Bottas" },
  ]);

  const [raceName, setRaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const titles: Record<string, string> = {
    qualy: "Qualifying Top 3",
    sprint: "Sprint Top 8",
    race: "Hoofdrace Top 10"
  };

  useEffect(() => {
    if (!isValidRaceId) return;

    async function loadRace() {
      const { data } = await supabase
        .from('races')
        .select('race_name')
        .eq('id', raceId)
        .single();
      
      if (data) setRaceName(data.race_name);
    }
    loadRace();
  }, [raceId, isValidRaceId, supabase]);

  const move = (index: number, direction: 'up' | 'down') => {
    const newDrivers = [...drivers];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newDrivers.length) return;
    [newDrivers[index], newDrivers[target]] = [newDrivers[target], newDrivers[index]];
    setDrivers(newDrivers);
  };

  const handleSave = async () => {
    // Extra veiligheidscheck voor raceId
    if (!isValidRaceId) {
      alert("Fout: De race-informatie is nog niet volledig geladen.");
      return;
    }

    setLoading(true);
    setMessage("⏳ Bezig met opslaan...");

    try {
      // Gebruik getSession voor de meest stabiele client-side auth check
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Je sessie is verlopen. Log opnieuw in.");
      }

      const tableName = {
        qualy: "predictions_qualifying",
        sprint: "predictions_sprint",
        race: "predictions_race"
      }[predictType] || "predictions_race";

      const config = {
        qualy: { col: "top_3_drivers", count: 3 },
        sprint: { col: "top_8_drivers", count: 8 },
        race: { col: "top_10_drivers", count: 10 }
      }[predictType as 'qualy' | 'sprint' | 'race'] || { col: "top_10_drivers", count: 10 };

      const topDriversIds = drivers.slice(0, config.count).map(d => d.driver_id);

      const { error: dbError } = await supabase.from(tableName).upsert({
        user_id: session.user.id,
        race_id: raceId, // Hier sturen we nu gegarandeerd een integer
        [config.col]: topDriversIds,
      }, { onConflict: 'user_id, race_id' });

      if (dbError) throw dbError;

      setMessage("✅ Voorspelling opgeslagen! Je wordt teruggeleid...");
      
      // DE FIX VOOR HET ZWARTE SCHERM: 
      // Gebruik window.location.replace voor een volledige browser-refresh naar de racepagina.
      // Dit zorgt dat de middleware de sessie weer vers oppakt zonder Next.js navigatie-bugs.
      window.location.replace(`/races/${raceId}`);

    } catch (err: any) {
      console.error("Save error:", err);
      setMessage(`❌ Fout: ${err.message || "Er ging iets mis"}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      <div className="max-w-md mx-auto">
        <Link 
          href={`/races/${raceIdStr}`} 
          className="text-slate-500 text-[10px] font-black uppercase mb-8 inline-block hover:text-white transition-colors tracking-widest"
        >
          &larr; Annuleren
        </Link>

        <div className="mb-2">
          <p className="text-slate-300 text-xs font-black uppercase tracking-[0.25em] italic leading-none">
            {raceName || "Laden..."}
          </p>
        </div>

        <h1 className="text-3xl font-black italic uppercase text-red-600 leading-none mb-1">
          {titles[predictType] || "Voorspelling"}
        </h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase mb-8 italic tracking-widest leading-none">
          Zet jouw top {predictType === 'qualy' ? '3' : predictType === 'sprint' ? '8' : '10'} bovenaan
        </p>

        <div className="space-y-2 mb-8">
          {drivers.map((d, i) => {
            const limit = predictType === 'qualy' ? 3 : predictType === 'sprint' ? 8 : 10;
            const isPointZone = i < limit;
            return (
              <div 
                key={d.driver_id} 
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isPointZone 
                    ? 'bg-red-600/10 border-red-600/50 shadow-lg shadow-red-900/10' 
                    : 'bg-[#161a23] border-slate-800 opacity-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-black italic w-4 text-center ${isPointZone ? 'text-red-600' : 'text-slate-600'}`}>
                    {i + 1}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-tight">{d.driver_name}</span>
                </div>
                
                <div className="flex gap-1">
                  <button 
                    onClick={() => move(i, 'up')} 
                    disabled={i === 0 || loading}
                    className="p-2 bg-slate-800 rounded-lg text-xs hover:bg-slate-700 disabled:opacity-10 transition-colors"
                  >▲</button>
                  <button 
                    onClick={() => move(i, 'down')} 
                    disabled={i === drivers.length - 1 || loading}
                    className="p-2 bg-slate-800 rounded-lg text-xs hover:bg-slate-700 disabled:opacity-10 transition-colors"
                  >▼</button>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={handleSave} 
          disabled={loading || !isValidRaceId}
          className={`w-full py-5 rounded-2xl font-black italic uppercase text-lg shadow-xl transition-all duration-300 ${
            loading || !isValidRaceId
              ? "bg-slate-800 text-slate-600 cursor-not-allowed" 
              : "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-red-900/20"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verwerken...
            </span>
          ) : "Bevestig Voorspelling"}
        </button>

        {message && (
          <div className={`mt-6 p-5 rounded-2xl text-center text-[11px] font-black uppercase tracking-widest italic border-2 transition-all ${
            message.includes('✅') 
              ? 'bg-green-600/10 text-green-400 border-green-500/50' 
              : 'bg-red-900/20 text-red-500 border-red-500/20 animate-pulse'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}