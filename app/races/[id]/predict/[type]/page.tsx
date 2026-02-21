"use client";

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface Driver {
  id: string;
  name: string;
}

interface PageProps {
  params: Promise<{ id: string; type: string }>;
}

export default function UniversalPredictPage({ params }: PageProps) {
  const router = useRouter();
  
  // Next.js 15 unwrapping
  const resolvedParams = use(params);
  const raceId = resolvedParams.id;
  const predictType = resolvedParams.type;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const titles: Record<string, string> = {
    qualy: "Qualifying Top 3",
    sprint: "Sprint Top 3",
    race: "Hoofdrace Top 3"
  };

  const initialDrivers: Driver[] = [
    { id: "1", name: "Max Verstappen" },
    { id: "2", name: "Lando Norris" },
    { id: "3", name: "Charles Leclerc" },
    { id: "4", name: "Oscar Piastri" },
    { id: "5", name: "Lewis Hamilton" },
    { id: "6", name: "George Russell" },
    { id: "7", name: "Carlos Sainz" },
    { id: "8", name: "Sergio Perez" },
  ];

  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // Forceer een verse check zonder cache
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      if (!user) {
        setMessage("⚠️ Je bent niet ingelogd op dit toestel.");
      }
    };
    checkUser();
  }, [supabase]);

  const move = (index: number, direction: 'up' | 'down') => {
    const newDrivers = [...drivers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newDrivers.length) return;
    
    [newDrivers[index], newDrivers[targetIndex]] = [newDrivers[targetIndex], newDrivers[index]];
    setDrivers(newDrivers);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage("⏳ Bezig met opslaan...");

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setIsLoggedIn(false);
        throw new Error("Sessie niet herkend. Log opnieuw in.");
      }

      const tableName = {
        qualy: "predictions_qualifying",
        sprint: "predictions_sprint",
        race: "predictions_race"
      }[predictType] || "predictions_race";

      const payload = {
        user_id: user.id,
        race_id: raceId,
        driver_id_1: drivers[0].id,
        driver_id_2: drivers[1].id,
        driver_id_3: drivers[2].id,
        updated_at: new Date().toISOString(),
      };

      const { error: dbError } = await supabase
        .from(tableName)
        .upsert(payload, { onConflict: 'user_id, race_id' });

      if (dbError) {
        console.error("Supabase Error:", dbError);
        throw new Error(`DB [${dbError.code}]: ${dbError.message}`);
      }

      setMessage("✅ Top 3 succesvol opgeslagen!");
      
      setTimeout(() => {
        router.push(`/races/${raceId}`);
        // Forceer een refresh om de cache te legen
        window.location.href = `/races/${raceId}`;
      }, 1200);
      
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Fout: ${err.message || "Database error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6" key={predictType}>
      <div className="max-w-md mx-auto">
        <Link 
          href={`/races/${raceId}`} 
          className="text-slate-500 text-[10px] font-black uppercase mb-8 inline-block hover:text-white transition-colors tracking-widest"
        >
          &larr; Annuleren
        </Link>

        <h1 className="text-3xl font-black italic uppercase text-red-600 leading-none mb-1">
          {titles[predictType] || "Voorspelling"}
        </h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase mb-8 italic tracking-widest">
          Zet jouw top 3 bovenaan
        </p>

        <div className="space-y-2 mb-8">
          {drivers.map((driver, index) => (
            <div 
              key={`${predictType}-${driver.id}`}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                index < 3 
                  ? 'bg-red-600/10 border-red-600/50 shadow-lg shadow-red-900/10' 
                  : 'bg-[#161a23] border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`font-black italic w-4 text-center ${index < 3 ? 'text-red-600' : 'text-slate-600'}`}>
                  {index + 1}
                </span>
                <span className="font-bold uppercase text-xs tracking-tight">{driver.name}</span>
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
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !isLoggedIn}
          className={`w-full py-5 rounded-2xl font-black italic uppercase text-lg shadow-xl transition-all ${
            loading || !isLoggedIn
              ? "bg-slate-800 text-slate-600 cursor-not-allowed" 
              : "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-red-900/20"
          }`}
        >
          {loading ? "Verwerken..." : "Bevestig Top 3"}
        </button>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center text-[10px] font-black uppercase tracking-widest italic border ${
            message.includes('❌') || message.includes('⚠️') 
              ? 'bg-red-900/20 text-red-500 border-red-500/20' 
              : 'bg-green-900/20 text-green-400 border-green-500/20'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}