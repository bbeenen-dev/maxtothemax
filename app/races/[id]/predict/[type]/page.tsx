"use client";

import { useState, use, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Import toegevoegd

interface Driver {
  driver_id: string;
  driver_name: string;
}

interface PageProps {
  params: Promise<{ id: string; type: string }>;
}

export default function UniversalPredictPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const raceId = resolvedParams.id;
  const predictType = resolvedParams.type;
  const router = useRouter(); // Router geïnitialiseerd

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const titles: Record<string, string> = {
    qualy: "Qualifying Top 3",
    sprint: "Sprint Top 8",
    race: "Hoofdrace Top 10"
  };

  const initialDrivers: Driver[] = [
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
  ];

  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [raceName, setRaceName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchData = async () => {
      // Gebruik getSession voor client-side stabiliteit (minder AbortErrors)
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      setIsLoggedIn(!!user);
      if (!user) {
        setMessage("⚠️ Je bent niet ingelogd op dit toestel.");
      }

      const { data: raceData } = await supabase
        .from('races')
        .select('race_name')
        .eq('id', raceId)
        .single();
      
      if (raceData) {
        setRaceName(raceData.race_name);
      }
    };
    fetchData();
  }, [supabase, raceId]);

  const move = (index: number, direction: 'up' | 'down') => {
    const newDrivers = [...drivers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newDrivers.length) return;
    
    [newDrivers[index], newDrivers[targetIndex]] = [newDrivers[targetIndex], newDrivers[index]];
    setDrivers(newDrivers);
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveStatus('idle');
    setMessage("⏳ Bezig met opslaan...");

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (authError || !user) {
        setIsLoggedIn(false);
        throw new Error("Sessie niet herkend. Log opnieuw in.");
      }

      const tableName = {
        qualy: "predictions_qualifying",
        sprint: "predictions_sprint",
        race: "predictions_race"
      }[predictType] || "predictions_race";

      let targetColumn = "";
      let count = 0;

      if (predictType === 'qualy') {
        targetColumn = "top_3_drivers";
        count = 3;
      } else if (predictType === 'sprint') {
        targetColumn = "top_8_drivers";
        count = 8;
      } else {
        targetColumn = "top_10_drivers";
        count = 10;
      }

      const topDriversIds = drivers.slice(0, count).map(d => d.driver_id);

      const payload: Record<string, any> = {
        user_id: user.id,
        race_id: raceId,
      };
      payload[targetColumn] = topDriversIds;

      const { error: dbError } = await supabase
        .from(tableName)
        .upsert(payload, { onConflict: 'user_id, race_id' });

      if (dbError) throw dbError;

      setSaveStatus('success');
      setMessage("✅ Voorspelling succesvol opgeslagen!");
      
      // CRUCIAAL STUKJE: Refresh de data en navigeer terug
      setTimeout(() => {
        router.refresh(); // Update de server-side cache
        router.push(`/races/${raceId}`); // Navigeer naar de racecard
      }, 1000);
      
    } catch (err: any) {
      setSaveStatus('error');
      setMessage(`❌ Fout: ${err.message || "Database error"}`);
      setLoading(false); // Alleen resetten bij fout, anders de navigatie afwachten
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6" key={predictType}>
      <div className="max-w-md mx-auto">
        <Link 
          href={`/races/${raceId}`} 
          className="text-slate-500 text-[10px] font-black uppercase mb-8 inline-block hover:text-white transition-colors tracking-widest"
        >
          &lt; Annuleren
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
          {drivers.map((driver, index) => {
            const limit = predictType === 'qualy' ? 3 : predictType === 'sprint' ? 8 : 10;
            const isPointZone = index < limit;

            return (
              <div 
                key={`${predictType}-${driver.driver_id}`}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isPointZone 
                    ? 'bg-red-600/10 border-red-600/50 shadow-lg shadow-red-900/10' 
                    : 'bg-[#161a23] border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`font-black italic w-4 text-center ${isPointZone ? 'text-red-600' : 'text-slate-600'}`}>
                    {index + 1}
                  </span>
                  <span className="font-bold uppercase text-xs tracking-tight">{driver.driver_name}</span>
                </div>
                
                <div className="flex gap-1">
                  <button 
                    onClick={() => move(index, 'up')} 
                    disabled={index === 0}
                    className="p-2 bg-slate-800 rounded-lg text-xs hover:bg-slate-700 disabled:opacity-10 transition-colors"
                  >
                    ▲
                  </button>
                  <button 
                    onClick={() => move(index, 'down')} 
                    disabled={index === drivers.length - 1}
                    className="p-2 bg-slate-800 rounded-lg text-xs hover:bg-slate-700 disabled:opacity-10 transition-colors"
                  >
                    ▼
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !isLoggedIn || saveStatus === 'success'}
          className={`w-full py-5 rounded-2xl font-black italic uppercase text-lg shadow-xl transition-all duration-300 ${
            saveStatus === 'success'
              ? "bg-green-600 text-white shadow-green-900/40 scale-[0.98]"
              : loading || !isLoggedIn
                ? "bg-slate-800 text-slate-600 cursor-not-allowed" 
                : "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-red-900/20"
          }`}
        >
          {loading ? "Verwerken..." : saveStatus === 'success' ? "Opgeslagen!" : "Bevestig Voorspelling"}
        </button>

        {message && (
          <div className={`mt-6 p-5 rounded-2xl text-center text-[11px] font-black uppercase tracking-widest italic border-2 transition-all animate-pulse ${
            message.includes('✅') 
              ? 'bg-green-600/10 text-green-400 border-green-500/50' 
              : 'bg-red-900/20 text-red-500 border-red-500/20'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}