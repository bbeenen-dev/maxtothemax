'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PredictionForm() {
  const [driverName, setDriverName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' })
  
  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus({ type: null, msg: '' })

    // 1. Haal de actuele gebruiker op
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setStatus({ type: 'error', msg: 'Je moet ingelogd zijn om deel te nemen.' })
      setIsSubmitting(false)
      return
    }

    // 2. Data invoegen in de 'drivers' tabel
    // Let op: driver_id wordt meestal automatisch gegenereerd (Serial/UUID), 
    // dus we sturen alleen de naam en de user_id mee.
    const { error } = await supabase
      .from('drivers')
      .insert([{ 
        driver_name: driverName, 
        user_id: user.id 
      }])

    if (error) {
      setStatus({ type: 'error', msg: `Fout: ${error.message}` })
    } else {
      setStatus({ type: 'success', msg: 'Geleverd! Je wordt doorgestuurd...' })
      setDriverName('')
      
      // Even wachten zodat de gebruiker de succesmelding ziet, dan naar dashboard
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-slate-800 p-10 rounded-3xl shadow-2xl border border-slate-700 relative overflow-hidden">
        {/* Decoratief element op de achtergrond */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <h2 className="text-3xl font-black italic mb-8 uppercase text-white tracking-tighter leading-none">
          Maak je <span className="text-red-600 font-extrabold text-4xl block">Keuze</span>
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6 relative">
          <div>
            <label className="block text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
              Naam van de coureur
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Bijv. Charles Leclerc"
              className="w-full bg-slate-900/50 border-2 border-slate-700 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-red-600 transition-all font-bold placeholder:text-slate-700"
              required
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !driverName}
            className={`w-full font-black italic py-5 rounded-xl uppercase tracking-widest transition-all shadow-xl
              ${isSubmitting 
                ? 'bg-slate-700 cursor-not-allowed text-slate-500' 
                : 'bg-red-600 hover:bg-red-500 text-white hover:shadow-red-900/40 active:scale-95'}`}
          >
            {isSubmitting ? 'VERWERKEN...' : 'VOORSPELLING OPSLAAN'}
          </button>

          {status.msg && (
            <div className={`text-center p-3 rounded-lg font-bold text-sm animate-pulse
              ${status.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {status.msg}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}