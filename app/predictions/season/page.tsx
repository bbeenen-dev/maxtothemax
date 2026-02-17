"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client'; // Let op: gebruik hier de client-versie
import { saveSeasonPrediction } from './actions';
import { useRouter } from 'next/navigation';

export default function SeasonPredictionPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // Data ophalen bij laden van de pagina
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: d } = await supabase.from('drivers').select('*').order('driver_name');
      const { data: t } = await supabase.from('teams').select('*').order('team_id');
      if (d) setDrivers(d);
      if (t) setTeams(t);
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!selectedDriver || !selectedTeam) {
      alert("Maak beide keuzes voordat je opslaat!");
      return;
    }
    setIsSaving(true);
    const res = await saveSeasonPrediction(selectedDriver, selectedTeam);
    setIsSaving(false);

    if (res.success) {
      alert("Je seizoensvoorspelling staat vast!");
      router.push('/races');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter">
            Seizoen <span className="text-red-600">2026</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Wie pakt de titels aan het eind van het jaar?</p>
        </header>

        <div className="space-y-8">
          {/* COUREUR SELECTIE */}
          <section className="bg-[#161a23] p-6 rounded-2xl border border-slate-800">
            <h2 className="text-xl font-bold italic uppercase mb-4 text-red-500">Wereldkampioen Coureurs</h2>
            <select 
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              className="w-full bg-black border border-slate-700 p-4 rounded-xl text-white focus:border-red-600 outline-none transition-all"
            >
              <option value="">Kies je kampioen...</option>
              {drivers.map(d => (
                <option key={d.driver_id} value={d.driver_id}>{d.driver_name}</option>
              ))}
            </select>
          </section>

          {/* TEAM SELECTIE */}
          <section className="bg-[#161a23] p-6 rounded-2xl border border-slate-800">
            <h2 className="text-xl font-bold italic uppercase mb-4 text-red-500">Constructeurskampioen</h2>
            <div className="grid grid-cols-2 gap-3">
              {teams.map(t => (
                <button
                  key={t.team_id}
                  onClick={() => setSelectedTeam(t.team_id)}
                  className={`p-4 rounded-xl border text-sm font-bold uppercase transition-all ${
                    selectedTeam === t.team_id 
                    ? 'border-red-600 bg-red-600/10 text-white' 
                    : 'border-slate-800 bg-black text-slate-500 hover:border-slate-600'
                  }`}
                >
                  <div className="w-full h-1 mb-2 rounded" style={{backgroundColor: t.color_code}} />
                  {t.team_id}
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-white text-black font-black italic uppercase py-5 rounded-2xl shadow-xl hover:bg-red-600 hover:text-white transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'Bezig met opslaan...' : 'Bevestig mijn Voorspellingen'}
          </button>
        </div>
      </div>
    </div>
  );
}