import { supabase } from "@/integrations/supabase/client";

export type PeriodEntry = {
  id: string;
  user_id: string;
  start_date: string; // yyyy-mm-dd
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DailyLog = {
  id: string;
  user_id: string;
  log_date: string;
  mood: string | null;
  symptoms: string[];
  notes: string | null;
};

export async function listPeriods(userId: string): Promise<PeriodEntry[]> {
  const { data, error } = await supabase
    .from("period_history")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });
  if (error) {
    console.error("listPeriods:", error.message);
    return [];
  }
  return (data ?? []) as PeriodEntry[];
}

export async function addPeriod(
  userId: string,
  start_date: string,
  end_date: string | null,
  notes: string | null = null
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("period_history").upsert(
    {
      user_id: userId,
      start_date,
      end_date,
      notes,
    },
    { onConflict: "user_id,start_date" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deletePeriod(id: string): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("period_history").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getDailyLog(
  userId: string,
  date: string
): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", date)
    .maybeSingle();
  if (error) {
    console.error("getDailyLog:", error.message);
    return null;
  }
  return (data as DailyLog | null) ?? null;
}

export async function upsertDailyLog(
  userId: string,
  log: { log_date: string; mood?: string | null; symptoms?: string[]; notes?: string | null }
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.from("daily_logs").upsert(
    {
      user_id: userId,
      log_date: log.log_date,
      mood: log.mood ?? null,
      symptoms: log.symptoms ?? [],
      notes: log.notes ?? null,
    },
    { onConflict: "user_id,log_date" }
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
