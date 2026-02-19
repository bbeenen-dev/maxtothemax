"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function savePrediction(raceId: string, type: string, orderedDriverIds: string[]) {
  const supabase = await createClient();

  // 1. Haal de huidige gebruiker op
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Je moet ingelogd zijn om te voorspellen" };

  // 2. Bepaal de juiste tabel en kolom op basis van het type
  let tableName = '';
  let dataColumn = '';
  let finalData = [];

  if (type === 'qualy') {
    tableName = 'predictions_qualifying';
    dataColumn = 'top_3_drivers';
    finalData = orderedDriverIds.slice(0, 3); // Pak alleen de top 3
  } else if (type === 'sprint') {
    tableName = 'predictions_sprint';
    dataColumn = 'top_8_drivers';
    finalData = orderedDriverIds.slice(0, 8); // Pak de top 8
  } else if (type === 'race') {
    tableName = 'predictions_race';
    dataColumn = 'top_10_drivers';
    finalData = orderedDriverIds.slice(0, 10); // Pak de top 10
  } else {
    return { success: false, message: "Onbekend voorspellingstype" };
  }

  // 3. Sla de voorspelling op in de specifieke tabel
  const { error } = await supabase
    .from(tableName)
    .upsert({
      user_id: user.id,
      race_id: parseInt(raceId), // Zorg dat dit een nummer is
      [dataColumn]: finalData,
      created_at: new Date().toISOString() // created_at of updated_at afhankelijk van je tabel
    }, {
      onConflict: 'user_id, race_id'
    });

  if (error) {
    console.error("Fout bij opslaan in " + tableName + ":", error);
    return { success: false, message: error.message };
  }

  // 4. Cache verversen
  revalidatePath(`/races/${raceId}`);
  return { success: true };
}