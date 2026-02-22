"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

interface Driver {
  driver_id: string;
  driver_name: string;
}

interface Race {
  id: number;
  race_name: string;
  sprint_race_start: string | null;
}

export default function AdminResultsPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- State ---
  const [races, setRaces] = useState<Race[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string>("");
  const [predictType, setPredictType] = useState<string>("race");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // --- Fetch Data (Races & Drivers) ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. Haal races op
      const { data: raceData } = await supabase
        .from('races')
        .select('id, race_name, sprint_race_start')
        .order('race_start', { ascending: true });
      if (raceData) setRaces(raceData);

      // 2. Haal coureurs op uit de database (Seizoen 2026 Line-up)
      const { data: driverData } = await supabase
        .from('drivers')
        .select('driver_id, driver_name')
        .eq('active', true);
      if (driverData) setDrivers(driverData);
    };

    fetchData();
  }, [supabase]);

  // --- Helpers ---
  const move = (index: number, direction: 'up' | 'down') => {
    const newDrivers = [...drivers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newDrivers.length) return;
    [newDrivers[index], newDrivers[targetIndex]] = [newDrivers[targetIndex], newDrivers[index]];
    setDrivers(newDrivers);
  };

  const currentRace = races.find(r => r.id.toString() === selectedRaceId);

  const handleSaveResult = async () => {
    if (!selectedRaceId) {
      setMessage("❌ Selecteer eerst een race.");
      return;
    }

    setLoading(true);
    setSaveStatus('idle');
    setMessage("⏳ Resultaat opslaan en punten berekenen...");

    try {
      const tableName = {
        qualy: "results_qualifying",
        sprint: "results_sprint",
        race: "results_race"
      }[predictType] || "results_race";

      const targetColumn = {
        qualy: "top_3_drivers",
        sprint: "top_8_drivers",
        race: "top_10_drivers"
      }[predictType] || "top_10_drivers";

      const limit = predictType === 'qualy' ? 3 : predictType === 'sprint' ? 8 : 10;
      const topIds = drivers.slice(0, limit).map(d => d.driver_id);

      const payload: any = {
        race_id: selectedRaceId,
        [targetColumn]: topIds
      };

      // 1. Sla officiële uitslag op
      const { error: dbError } = await supabase
        .from(tableName)
        .upsert(payload, { onConflict: 'race_id' });

      if (dbError) throw dbError;

      // 2. Trigger de puntentelling functie (RPC)
      const rpcName = `calc_points_${predictType}`;
      const { error: rpcError } = await supabase.rpc(rpcName, { p_race_id: parseInt(selectedRaceId) });

      if (rpcError) console.error("Punten berekening fout:", rpcError);

      setSaveStatus('success');
      setMessage(`✅ Resultaat voor ${predictType} opgeslagen! Punten zijn bijgewerkt.`);
    } catch (err: any) {
      setSaveStatus('error');
      setMessage(`❌ Fout: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6">
      <div className="max-w-md mx-auto">
        <Link href="/admin" className="text-slate-500 text-[10px] font-black uppercase mb-8 inline-block tracking-widest">
          &lt; Terug naar Admin
        </Link>

        <h1 className="text-3xl font-black italic uppercase text-blue-500 mb-6">Uitslagen Invoeren</h1>

        {/* SELECTIE RACE EN TYPE */}
        <div className="space-y-4 mb-10 bg-[#161a23] p-4 rounded-2xl border border-slate-800">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Kies Race</label>
            <select 
              value={selectedRaceId} 
              onChange={(e) => setSelectedRaceId(e.target.value)}
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-xl p-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
            >
              <option value="">Selecteer een weekend...</option>
              {races.map(r => (
                <option key={r.id} value={r.id}>{r.race_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block">Sessie Type</label>
            <div className="flex gap-2">
              {['qualy', 'race', ...(currentRace?.sprint_race_start ? ['sprint'] : [])].map((t) => (
                <button
                  key={t}
                  onClick={() => setPredictType(t)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter border transition-all ${
                    predictType === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#0b0e14] border-slate-700 text-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* DRIVER LIST */}
        <div className="space-y-2 mb-8">
          {drivers.map((driver, index) => {
            const limit = predictType === 'qualy' ? 3 : predictType === 'sprint' ? 8 : 10;
            const isTopZone = index < limit;

            return (
              <div 
                key={driver.driver_id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isTopZone ? 'bg-blue-600/10 border-blue-600/40' : 'bg-[#161a23] border-slate-800 opacity-40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-black italic w-4 text-center ${isTopZone ? 'text-blue-500' : 'text-slate-600'}`}>
                    {index + 1}
                  </span>
                  <span className="font-bold uppercase text-[11px] tracking-tight">{driver.driver_name}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => move(index, 'up')} disabled={index === 0} className="p-2 bg-slate-800 rounded text-[10px] disabled:opacity-0">▲</button>
                  <button onClick={() => move(index, 'down')} disabled={index === drivers.length - 1} className="p-2 bg-slate-800 rounded text-[10px] disabled:opacity-0">▼</button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSaveResult}
          disabled={loading || !selectedRaceId}
          className={`w-full py-5 rounded-2xl font-black italic uppercase text-lg transition-all ${
            loading ? "bg-slate-800 text-slate-600" : "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-900/20"
          }`}
        >
          {loading ? "Opslaan..." : `Sla ${predictType} Uitslag Op`}
        </button>

        {message && (
          <div className={`mt-6 p-4 rounded-xl text-center text-[10px] font-black uppercase tracking-widest border ${
            message.includes('✅') ? 'bg-green-600/10 text-green-400 border-green-500/50' : 'bg-red-900/20 text-red-500 border-red-500/20'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}