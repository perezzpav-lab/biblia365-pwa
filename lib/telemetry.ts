import { supabase } from "@/lib/supabase";

export type AppEventName = "start_reading" | "complete_day" | "quiz_correct" | "set_reminder";

export async function logAppEvent(
  eventName: AppEventName,
  options: {
    userId?: string | null;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  const { userId = null, metadata = {} } = options;
  const { error } = await supabase.from("app_events").insert({
    user_id: userId,
    event_name: eventName,
    metadata,
    created_at: new Date().toISOString(),
  });

  if (error) {
    // Telemetry should never break UX.
    return;
  }
}
