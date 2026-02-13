import { getSupabaseClient } from "@/utils/supabaseClient";

export type SupabaseAlertRow = {
  id?: number;
  predicted: number;
  timestamp: string;
  sequencer: any;
  created_at?: string;
};

export const insertAlertRow = async (
  payload: SupabaseAlertRow
): Promise<void> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase credentials are not configured.");
  }

  const { error } = await supabase.from("alerts").insert(payload);
  if (error) {
    throw error;
  }
};

export const fetchAlerts = async (
  limit = 200
): Promise<SupabaseAlertRow[]> => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase credentials are not configured.");
  }

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const subscribeAlerts = (
  callback: (payload: SupabaseAlertRow) => void
) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    console.warn("Supabase not configured; skipping realtime subscription.");
    return () => undefined;
  }

  const channel = supabase
    .channel("alerts-changes")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alerts",
      },
      (payload) => {
        if (!payload?.new) return;
        callback(payload.new as SupabaseAlertRow);
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Supabase] Listening to alerts (INSERT)");
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
};

export const deleteAlerts = async (ids: number[]) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase credentials are not configured.");
  }

  if (!ids.length) return;

  const { error } = await supabase.from("alerts").delete().in("id", ids);
  if (error) {
    throw error;
  }
};
