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
  const resolvedParams = use(params);
  const raceId = resolvedParams.id;
  const predictType = resolvedParams.type;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // De volledige lijst met coureurs
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
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkUser();
  }, [supabase]);

  // Eenvoudige omhoog/omlaag logica voor mobiel (werkt beter dan drag-n-drop op sommige telefoons)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Log eerst even in.");

      const tableName = {
        qualy: "predictions_qualifying",
        sprint: "predictions_sprint",
        race: "predictions_race"
      }[predictType] || "predictions_race";

      // We pakken de bovenste 3 uit de lijst
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

      if (dbError) throw dbError;

      setMessage("✅ Top 3 opgeslagen!");
      setTimeout(() => {
        router.push(`/races/${raceId}`);
        router.refresh();
      }, 1200);
      
    } catch (err: any) {
      console.error(err);
      setMessage(`❌ Fout: ${err.message || "Controleer of je database kolommen driver_id_1, _2 en _3 heeft."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      <div className="max-w-md mx-auto">
        <Link href={`/races/${raceId}`} className="text-slate-500 text-[10px] font-black uppercase mb-8 inline-block">
          &larr; Terug
        </Link>

        <h1 className="text-3xl font-black italic uppercase text-red-600 leading-none mb-1">
          {predictType === 'qualy' ? 'Qualy Top 3' : 'Race Top 3'}
        </h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase mb-8 italic">
          Zet jouw top 3 bovenaan
        </p>

        <div className="space-y-2 mb-8">
          {drivers.map((driver, index) => (
            <div 
              key={driver.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                index < 3 ? 'bg-red-600/10 border-red-600/50 shadow-lg shadow-red-900/10' : 'bg-[#161a23] border-slate-800'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`font-black italic ${index < 3 ? 'text-red-600' : 'text-slate-600'}`}>
                  {index + 1}
                </span>
                <span className="font-bold uppercase text-sm tracking-tight">{driver.name}</span>
              </div>
              
              <div className="flex gap-1">
                <button onClick={() => move(index, 'up')} className="p-2 bg-slate-800 rounded-lg text-xs">▲</button>
                <button onClick={() => move(index, 'down')} className="p-2 bg-slate-800 rounded-lg text-xs">▼</button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !isLoggedIn}
          className="w-full py-5 bg-red-600 rounded-xl font-black italic uppercase text-lg shadow-xl shadow-red-900/20 disabled:opacity-50"
        >
          {loading ? "Opslaan..." : "Bevestig Top 3"}
        </button>

        {message && (
          <div className="mt-6 p-4 rounded-lg text-center text-[10px] font-black uppercase border border-white/10">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}