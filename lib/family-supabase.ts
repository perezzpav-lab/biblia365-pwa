import type { SupabaseClient } from "@supabase/supabase-js";
import type { FamilyProfile } from "@/lib/family-types";

type FamilyRow = { id: string; name: string };
type MemberRow = {
  profile_key: string;
  display_name: string;
  emoji: string;
  role: "admin" | "member" | "child";
  sort_order: number;
};

export async function fetchFamilyForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ familyName: string; members: FamilyProfile[] } | null> {
  const { data: fam, error: famErr } = await supabase
    .from("families")
    .select("id, name")
    .eq("owner_user_id", userId)
    .maybeSingle<FamilyRow>();

  if (famErr || !fam) return null;

  const { data: rows, error: memErr } = await supabase
    .from("family_members")
    .select("profile_key, display_name, emoji, role, sort_order")
    .eq("family_id", fam.id)
    .order("sort_order", { ascending: true })
    .returns<MemberRow[]>();

  if (memErr || !rows?.length) return null;

  const members: FamilyProfile[] = rows.map((r) => ({
    id: r.profile_key,
    name: r.display_name,
    emoji: r.emoji,
    role: r.role,
  }));

  return { familyName: fam.name, members };
}

export async function upsertFamilyForUser(
  supabase: SupabaseClient,
  userId: string,
  familyName: string,
  members: FamilyProfile[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  const now = new Date().toISOString();

  const { data: existing, error: readErr } = await supabase
    .from("families")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle<{ id: string }>();

  if (readErr) {
    return { ok: false, message: readErr.message };
  }

  let familyId: string;

  if (existing?.id) {
    familyId = existing.id;
    const { error: upErr } = await supabase
      .from("families")
      .update({ name: familyName.trim() || "Mi familia", updated_at: now })
      .eq("id", familyId);
    if (upErr) return { ok: false, message: upErr.message };
  } else {
    const { data: inserted, error: insErr } = await supabase
      .from("families")
      .insert({ owner_user_id: userId, name: familyName.trim() || "Mi familia", updated_at: now })
      .select("id")
      .single<{ id: string }>();
    if (insErr || !inserted) return { ok: false, message: insErr?.message ?? "insert failed" };
    familyId = inserted.id;
  }

  const { error: delErr } = await supabase.from("family_members").delete().eq("family_id", familyId);
  if (delErr) return { ok: false, message: delErr.message };

  const payload = members.map((m, i) => ({
    family_id: familyId,
    profile_key: m.id,
    display_name: m.name.trim() || "Sin nombre",
    emoji: m.emoji || "👤",
    role: m.role,
    sort_order: i,
  }));

  if (payload.length > 0) {
    const { error: memIns } = await supabase.from("family_members").insert(payload);
    if (memIns) return { ok: false, message: memIns.message };
  }

  return { ok: true };
}
