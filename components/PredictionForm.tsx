'use client'
import { createClient } from '@/lib/supabase/client' // Check even of dit pad klopt
import { useState } from 'react'

export default function PredictionForm() {
  const [driver, setDriver] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // We proberen een test-rij in je tabel te schieten
    const { data, error } = await supabase
      .from('predictions') 
      .insert([{ driver_name: driver }])

    if (error) {
      console.error('Fout:', error.message)
      alert('Error: ' + error.message)
    } else {
      alert('Voorspelling opgeslagen! 🏎️')
      setDriver('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={driver}
        onChange={(e) => setDriver(e.target.value)}
        placeholder="Naam van de winnaar..."
        className="w-full p-2 rounded bg-slate-700 border border-slate-600 text-white"
      />
      <button 
        type="submit" 
        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
      >
        Verstuur Voorspelling
      </button>
    </form>
  )
}