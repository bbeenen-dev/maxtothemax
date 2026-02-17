"use server";

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function saveSeasonPrediction(driverId: string, teamId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Niet ingelogd" };

  // We slaan twee rijen op: één voor de coureur en één voor het team
  const predictions = [
    {
      user_id: user.id,
      race_id: null,
      type: 'season_driver',
      prediction_data: { driver_id: driverId },
    },
    {
      user_id: user.id,
      race_id: null,
      type: 'season_team',
      prediction_data: { team_id: teamId },
    }
  ];

  const { error } = await supabase
    .from('predictions')
    .upsert(predictions, { onConflict: 'user_id, race_id, type' });

  if (error) return { success: false, message: error.message };

  revalidatePath('/predictions/season');
  return { success: true };
}