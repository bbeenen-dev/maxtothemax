"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function UniversalPredictPage() {
  const params = useParams();
  const raceIdStr = params?.id as string;
  const predictType = params?.type as string;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Validatie van de ID (Voorkomt de %%DRP fout)
  const raceId = parseInt(raceIdStr);
  const isValidRaceId = !isNaN(raceId) && !raceIdStr.includes('%');

  const [drivers, setDrivers] = useState([
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

  useEffect(() => {
    if (!isValidRaceId) return;

    async function loadRace() {
      const { data } = await supabase.from('races').select('race_name').eq('id', raceId).single();
      if (data) setRaceName(data.race_name);
    }
    loadRace();
  }, [raceId, isValidRaceId]);

  const move = (index: number, direction: 'up' | 'down') => {
    const newDrivers = [...drivers];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newDrivers.length) return;
    [newDrivers[index], newDrivers[target]] = [newDrivers[target], newDrivers[index]];
    setDrivers(newDrivers);
  };

  const handleSave = async () => {
    if (!isValidRaceId) {
      alert("Fout: Race ID is nog niet geladen.");
      return;
    }

    setLoading(true);
    setMessage("⏳ Bezig met opslaan...");

    try {
      // Gebruik getSession (geen getUser!)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Je bent uitgelogd. Log opnieuw in.");

      const tableName = {
        qualy: "predictions_qualifying",
        sprint: "predictions_sprint",
        race: "predictions_race"
      }[predictType] || "predictions_race";

      const colName = predictType === 'qualy' ? "top_3_drivers" : predictType === 'sprint' ? "top_8_drivers" : "top_10_drivers";
      const count = predictType === 'qualy' ? 3 : predictType === 'sprint' ? 8 : 10;

      const { error } = await supabase.from(tableName).upsert({
        user_id: session.user.id,
        race_id: raceId,
        [colName]: drivers.slice(0, count).map(d => d.driver_id)
      }, { onConflict: 'user_id, race_id' });

      if (error) throw error;

      setMessage("✅ Opgeslagen! Je wordt nu teruggeleid...");
      
      // DE CRUCIALE STAP: Harde redirect ipv router.push
      // Dit herstelt de sessie en voorkomt dat middleware je 'vastzet' in een laden-scherm
      window.location.href = `/races/${raceId}`;

    } catch (err: any) {
      console.error(err);
      setMessage("❌ Fout: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      <div className="max-w-md mx-auto">
        <Link href={`/races/${raceIdStr}`} className="text-slate-500 text-[10px] font-black uppercase mb-8 inline-block tracking-widest">&larr; Terug</Link>
        <h1 className="text-3xl font-black italic uppercase text-red-600 mb-1">{raceName || "Laden..."}</h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase mb-8 italic tracking-widest">{predictType} Voorspelling</p>

        <div className="space-y-2 mb-8">
          {drivers.map((d, i) => (
            <div key={d.driver_id} className={`flex items-center justify-between p-3 rounded-xl border ${i < (predictType === 'qualy' ? 3 : predictType === 'sprint' ? 8 : 10) ? 'border-red-600/50 bg-red-600/5' : 'border-slate-800 opacity-50'}`}>
              <div className="flex items-center gap-3">
                <span className="font-black italic text-red-600 w-4">{i + 1}</span>
                <span className="text-xs font-bold uppercase">{d.driver_name}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => move(i, 'up')} className="p-2 bg-slate-800 rounded">▲</button>
                <button onClick={() => move(i, 'down')} className="p-2 bg-slate-800 rounded">▼</button>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleSave} 
          disabled={loading || !isValidRaceId}
          className="w-full py-4 bg-red-600 rounded-2xl font-black uppercase italic disabled:opacity-50"
        >
          {loading ? "Verwerken..." : "Opslaan"}
        </button>

        {message && <p className="mt-4 text-center text-[10px] font-black uppercase tracking-widest animate-pulse">{message}</p>}
      </div>
    </div>
  );
}