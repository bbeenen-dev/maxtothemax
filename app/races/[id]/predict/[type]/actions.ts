"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function savePrediction(raceId: string, type: string, orderedDriverIds: string[]) {
  const supabase = await createClient();

  // 1. Haal de huidige gebruiker op
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Je moet ingelogd zijn om te voorspellen");

  // 2. Sla de voorspelling op (Upsert: overschrijf als deze al bestaat)
  const { error } = await supabase
    .from('predictions')
    .upsert({
      user_id: user.id,
      race_id: raceId === 'season' ? null : raceId,
      type: type,
      prediction_data: orderedDriverIds, // De array met ID's uit je drag-and-drop
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id, race_id, type'
    });

  if (error) {
    console.error("Fout bij opslaan:", error);
    return { success: false, message: error.message };
  }

  // 3. Cache verversen zodat de gebruiker direct resultaat ziet
  revalidatePath(`/races/${raceId}`);
  return { success: true };
}