import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Timer, AlertTriangle, ChevronLeft } from 'lucide-react'; 

export default async function RaceDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 1. Veilig de params afwachten (Essentieel voor Next.js 15)
  const { id } = await params;
  
  // 2. Database client initialiseren
  const supabase = await createClient();
  
  // 3. Data ophalen met .maybeSingle() om fatal errors te voorkomen
  const { data: race, error } = await supabase
    .from('races')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  // 4. ERROR DIAGNOSE: Als er geen race is, tonen we een veilige error-state i.p.v. een wit scherm
  if (error || !race) {
    console.error("Race Detail Fetch Error:", error);
    return (
      <div className="min-h-screen bg-[#0b0e14] flex items-center justify-center p-6 text-white">
        <div className="text-center bg-[#161a23] p-10 rounded-3xl border border-red-600/30 shadow-2xl max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-xl font-black uppercase italic">Pagina niet bereikbaar</h1>
          <p className="text-slate-500 text-sm mt-2">
            We konden de gegevens voor deze race niet laden. Dit kan komen door een ongeldige link of een databaseverbinding.
          </p>
          <Link href="/races" className="inline-flex items-center mt-6 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-xl text-white font-bold uppercase text-xs transition-all">
            <ChevronLeft className="w-4 h-4 mr-2" /> Terug naar kalender
          </Link>
        </div>
      </div>
    );
  }

  // 5. Veilig datums parsen (voorkomt crashes bij lege velden)
  const nu = new Date();
  const isQualyLocked = race.qualifying_start ? nu > new Date(race.qualifying_start) : true;
  const isSprintLocked = race.has_sprint && race.sprint_race_start ? nu > new Date(race.sprint_race_start) : true;
  const isRaceLocked = race.race_start ? nu > new Date(race.race_start) : true;

  return (
    <div className="min-h-screen bg-[#0b0e14] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Navigatie terug */}
        <Link href="/races" className="inline-flex items-center text-slate-500 hover:text-white mb-6 transition-colors uppercase text-[10px] font-bold tracking-[0.2em]">
          <ChevronLeft className="w-4 h-4 mr-1" /> Terug naar kalender
        </Link>
                
        {/* Race Header Kaart */}
        <div className="bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden mb-8">
          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
              {race.race_name}
            </h1>
            <div className="flex gap-4 mt-4 items-center">
              <span className="bg-black/40 backdrop-blur-md text-white px-3 py-1 text-sm font-bold rounded">
                {race.year}
              </span>
              <span className="text-red-100 font-medium uppercase tracking-widest text-sm">
                Round {race.round} | {race.location_code}
              </span>
            </div>
          </div>
          {/* Decoratieve achtergrond letters */}
          <div className="absolute -right-6 -bottom-8 text-[10rem] font-black italic text-white/5 select-none uppercase pointer-events-none leading-none">
             {race.location_code}
          </div>
        </div>

        {/* Winnaars Sectie */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="bg-[#161a23] border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-red-600/10 p-3 rounded-xl"><Trophy className="w-6 h-6 text-red-600" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Winner 2025</p>
              <h3 className="text-lg font-black italic uppercase text-white leading-none">
                {race.past_winners || "Nog onbekend"}
              </h3>
            </div>
          </div>

          <div className="bg-[#161a23] border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="bg-blue-600/10 p-3 rounded-xl"><Timer className="w-6 h-6 text-blue-600" /></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Pole 2025</p>
              <h3 className="text-lg font-black italic uppercase text-white leading-none">
                {race.past_qualiwinner || "Nog onbekend"}
              </h3>
            </div>
          </div>
        </div>

        {/* Voorspelling Knoppen */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black italic uppercase tracking-tight border-l-4 border-red-600 pl-4">
            Plaats je voorspelling
          </h2>

          <div className="grid gap-4">
            <PredictionCard 
              title="Kwalificatie" 
              time={race.qualifying_start} 
              isLocked={isQualyLocked} 
              href={`/races/${id}/predict/qualy`}
            />

            {race.has_sprint && (
              <PredictionCard 
                title="Sprint Race" 
                time={race.sprint_race_start} 
                isLocked={isSprintLocked} 
                href={`/races/${id}/predict/sprint`}
              />
            )}

            <PredictionCard 
              title="Hoofdrace" 
              time={race.race_start} 
              isLocked={isRaceLocked} 
              href={`/races/${id}/predict/race`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component voor de knoppen
function PredictionCard({ title, time, isLocked, href }: { title: string, time: string, isLocked: boolean, href: string }) {
  const dateObj = new Date(time);
  const formattedTime = isNaN(dateObj.getTime()) 
    ? "Tijd onbekend" 
    : dateObj.toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (isLocked) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex justify-between items-center opacity-50 grayscale">
        <div>
          <h3 className="text-xl font-black italic uppercase text-slate-400">{title}</h3>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic italic">
            Gesloten — {formattedTime}
          </p>
        </div>
        <div className="bg-slate-800 text-slate-500 px-4 py-2 rounded-lg font-black text-[10px] uppercase italic border border-slate-700">
          Locked
        </div>
      </div>
    );
  }

  return (
    <Link href={href} className="group bg-[#1c232e] border border-slate-800 p-6 rounded-2xl flex justify-between items-center hover:border-red-600 transition-all hover:shadow-[0_0_30px_rgba(220,38,38,0.1)]">
      <div>
        <h3 className="text-xl font-black italic uppercase group-hover:text-red-500 transition-colors">{title}</h3>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Deadline: {formattedTime}</p>
      </div>
      <div className="bg-red-600 text-white px-5 py-2.5 rounded-lg font-black text-[10px] uppercase italic group-hover:bg-red-500 transition-all shadow-lg active:scale-95">
        Voorspel nu
      </div>
    </Link>
  );
}