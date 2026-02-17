import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  // 1. Controleer of de gebruiker is ingelogd
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Haal de data op uit de tabel 'drivers'
  const { data: predictions, error } = await supabase
    .from('drivers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-red-900/20 border border-red-900 text-red-400 p-4 rounded-lg">
          <strong>Systeemfout:</strong> {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b border-slate-800 pb-8">
          <div>
            <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
              F1 <span className="text-red-600">Leaderboard</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Ingelogd als: <span className="text-slate-300">{user.email}</span></p>
          </div>
          <a href="/" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-md transition-all transform hover:-translate-y-1 shadow-lg shadow-red-900/20 text-center">
            NIEUWE VOORSPELLING
          </a>
        </header>

        <div className="grid gap-4">
          {predictions && predictions.length > 0 ? (
            predictions.map((item) => (
              <div key={item.driver_id} className="group bg-slate-800/50 hover:bg-slate-800 p-6 rounded-xl border border-slate-700 flex justify-between items-center transition-colors">
                <div className="flex items-center gap-6">
                  <div className="h-12 w-1 bg-red-600 rounded-full group-hover:h-16 transition-all"></div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-black mb-1">Geselecteerde Rijder</p>
                    <p className="text-2xl font-black italic uppercase tracking-tight text-slate-100">
                      {item.driver_name}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  <p className="text-slate-500 text-[10px] uppercase font-bold mb-1">Datum Inzending</p>
                  <p className="text-slate-300 font-mono text-sm">
                    {new Date(item.created_at).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-800">
              <p className="text-slate-500 text-lg italic">Nog geen voorspellingen in de database...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}