import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if the user has completed a stage and award certificate.
 * Call this after each chapter completion.
 */
export async function checkAndAwardCertificates(userId: string) {
  // Get all stages
  const { data: stages } = await supabase
    .from("stages")
    .select("*")
    .order("sort_order");

  if (!stages) return null;

  // Get all units with their chapters
  const { data: units } = await supabase
    .from("units")
    .select("id, sort_order");

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, unit_id");

  const { data: progress } = await supabase
    .from("user_progress")
    .select("chapter_id, status")
    .eq("user_id", userId);

  const { data: existingCerts } = await supabase
    .from("user_certificates")
    .select("certificate_type")
    .eq("user_id", userId);

  if (!units || !chapters || !progress) return null;

  const completedChapterIds = new Set(
    (progress || []).filter((p) => p.status === "complete").map((p) => p.chapter_id)
  );

  const existingCertTypes = new Set(
    (existingCerts || []).map((c) => c.certificate_type)
  );

  // Get user stats for snapshot
  const { data: stats } = await supabase
    .from("user_stats")
    .select("xp, chapters_completed")
    .eq("user_id", userId)
    .single();

  let newCertificate: string | null = null;

  // Check each stage
  const stageTypes = ["stage_1", "stage_2", "stage_3"];
  let allStagesComplete = true;

  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const certType = stageTypes[i];
    if (!certType) continue;

    // Get units in this stage
    const stageUnits = (units || []).filter(
      (u) => u.sort_order >= stage.unit_from && u.sort_order <= stage.unit_to
    );

    if (stageUnits.length === 0) {
      allStagesComplete = false;
      continue;
    }

    // Get chapters in these units
    const stageUnitIds = new Set(stageUnits.map((u) => u.id));
    const stageChapters = (chapters || []).filter((c) => stageUnitIds.has(c.unit_id));

    if (stageChapters.length === 0) {
      allStagesComplete = false;
      continue;
    }

    // Check if all chapters in this stage are complete
    const allComplete = stageChapters.every((c) => completedChapterIds.has(c.id));

    if (!allComplete) {
      allStagesComplete = false;
    }

    // Award certificate if newly completed
    if (allComplete && !existingCertTypes.has(certType)) {
      await supabase.from("user_certificates").insert({
        user_id: userId,
        certificate_type: certType,
        chapters_completed: stats?.chapters_completed || 0,
        xp_earned: stats?.xp || 0,
      });
      newCertificate = certType;
    }
  }

  // Check if all stages complete → award graduation cert
  if (allStagesComplete && !existingCertTypes.has("all_complete")) {
    await supabase.from("user_certificates").insert({
      user_id: userId,
      certificate_type: "all_complete",
      chapters_completed: stats?.chapters_completed || 0,
      xp_earned: stats?.xp || 0,
    });
    newCertificate = "all_complete";
  }

  return newCertificate;
}
