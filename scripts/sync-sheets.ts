/**
 * Google Sheets → Supabase Sync Script
 *
 * Reads content from a Google Sheet and upserts it into Supabase.
 *
 * Google Sheet structure (4 tabs):
 *
 * Tab: "Units"
 * | id | title    | description              | emoji | sort_order |
 * |----|----------|--------------------------|-------|------------|
 * | 1  | 認識AI   | AI是什麼？...            | 🤖    | 0          |
 *
 * Tab: "Chapters"
 * | id | unit_id | title          | description      | sort_order | xp_reward |
 * |----|---------|----------------|------------------|------------|-----------|
 * | 1  | 1       | 什麼是人工智能？ | 了解AI的基本概念  | 0          | 50        |
 *
 * Tab: "Questions"
 * | id | chapter_id | type     | prompt                    | explanation          | sort_order |
 * |----|------------|----------|---------------------------|----------------------|------------|
 * | 1  | 1          | mcq      | 以下哪一個最能描述...      | AI是讓電腦模擬...     | 0          |
 *
 * Tab: "Options"
 * | id | question_id | option_text                  | is_correct | sort_order |
 * |----|-------------|------------------------------|------------|------------|
 * | 1  | 1           | 一種讓電腦模擬人類智能的技術    | TRUE       | 0          |
 *
 * Usage:
 *   npx tsx scripts/sync-sheets.ts
 *
 * Required env vars (in .env.local):
 *   GOOGLE_SHEETS_ID        — the Sheet ID from the URL
 *   GOOGLE_SERVICE_ACCOUNT  — path to service account JSON key file
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const SHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_SERVICE_ACCOUNT || "service-account.json";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SHEET_ID) {
  console.error("❌ Missing GOOGLE_SHEETS_ID in .env.local");
  process.exit(1);
}

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`❌ Service account key file not found: ${SERVICE_ACCOUNT_PATH}`);
  console.error("   Download it from Google Cloud Console → IAM → Service Accounts → Keys");
  process.exit(1);
}

// Init clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

async function readTab(sheets: ReturnType<typeof google.sheets>, tab: string): Promise<Record<string, string>[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID!,
    range: `${tab}!A:Z`,
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) {
    console.log(`  ⚠️  Tab "${tab}" is empty or has no data rows`);
    return [];
  }

  const headers = rows[0].map((h: string) => h.trim().toLowerCase());
  return rows.slice(1)
    .filter((row) => row[0] && row[0].toString().trim() !== "") // skip empty rows
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h: string, i: number) => {
        obj[h] = row[i]?.toString().trim() || "";
      });
      return obj;
    });
}

function parseBoolean(val: string): boolean {
  return val.toUpperCase() === "TRUE" || val === "1" || val === "是";
}

function parseIntSafe(val: string, fallback: number = 0): number {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

async function syncUnits(sheets: ReturnType<typeof google.sheets>) {
  console.log("\n📦 Syncing Units...");
  const rows = await readTab(sheets, "Units");
  if (rows.length === 0) return;

  for (const row of rows) {
    const unit = {
      id: parseIntSafe(row.id),
      title: row.title,
      description: row.description || null,
      emoji: row.emoji || "🤖",
      sort_order: parseIntSafe(row.sort_order),
    };

    const { error } = await supabase
      .from("units")
      .upsert(unit, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Unit ${unit.id}: ${error.message}`);
    } else {
      console.log(`  ✅ Unit ${unit.id}: ${unit.title}`);
    }
  }
}

async function syncChapters(sheets: ReturnType<typeof google.sheets>) {
  console.log("\n📖 Syncing Chapters...");
  const rows = await readTab(sheets, "Chapters");
  if (rows.length === 0) return;

  for (const row of rows) {
    const chapter = {
      id: parseIntSafe(row.id),
      unit_id: parseIntSafe(row.unit_id),
      title: row.title,
      description: row.description || null,
      sort_order: parseIntSafe(row.sort_order),
      xp_reward: parseIntSafe(row.xp_reward, 50),
    };

    const { error } = await supabase
      .from("chapters")
      .upsert(chapter, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Chapter ${chapter.id}: ${error.message}`);
    } else {
      console.log(`  ✅ Chapter ${chapter.id}: ${chapter.title}`);
    }
  }
}

async function syncQuestions(sheets: ReturnType<typeof google.sheets>) {
  console.log("\n❓ Syncing Questions...");
  const rows = await readTab(sheets, "Questions");
  if (rows.length === 0) return;

  for (const row of rows) {
    const question = {
      id: parseIntSafe(row.id),
      chapter_id: parseIntSafe(row.chapter_id),
      type: row.type,
      prompt: row.prompt,
      explanation: row.explanation || null,
      sort_order: parseIntSafe(row.sort_order),
    };

    const { error } = await supabase
      .from("questions")
      .upsert(question, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Question ${question.id}: ${error.message}`);
    } else {
      console.log(`  ✅ Question ${question.id}: ${question.prompt.substring(0, 30)}...`);
    }
  }
}

async function syncOptions(sheets: ReturnType<typeof google.sheets>) {
  console.log("\n🔘 Syncing Options...");
  const rows = await readTab(sheets, "Options");
  if (rows.length === 0) return;

  for (const row of rows) {
    const option = {
      id: parseIntSafe(row.id),
      question_id: parseIntSafe(row.question_id),
      option_text: row.option_text,
      is_correct: parseBoolean(row.is_correct),
      sort_order: parseIntSafe(row.sort_order),
    };

    const { error } = await supabase
      .from("question_options")
      .upsert(option, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Option ${option.id}: ${error.message}`);
    } else {
      console.log(`  ✅ Option ${option.id}: ${option.option_text.substring(0, 30)}...`);
    }
  }
}

async function syncStages(sheets: ReturnType<typeof google.sheets>) {
  console.log("\n🏷️  Syncing Stages...");
  const rows = await readTab(sheets, "Stages");
  if (rows.length === 0) {
    console.log("  ⚠️  No Stages tab found, skipping");
    return;
  }

  for (const row of rows) {
    const stage = {
      id: parseIntSafe(row.id),
      label: row.label,
      emoji: row.emoji || "🌱",
      color: row.color || "#FF6B35",
      unit_from: parseIntSafe(row.unit_from),
      unit_to: parseIntSafe(row.unit_to),
      sort_order: parseIntSafe(row.sort_order),
    };

    const { error } = await supabase
      .from("stages")
      .upsert(stage, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Stage ${stage.id}: ${error.message}`);
    } else {
      console.log(`  ✅ Stage ${stage.id}: ${stage.emoji} ${stage.label}`);
    }
  }
}

async function syncAnnouncements(sheets: ReturnType<typeof google.sheets>) {
  console.log("\n📢 Syncing Announcements...");
  const rows = await readTab(sheets, "Announcements");
  if (rows.length === 0) {
    console.log("  ⚠️  No Announcements tab found, skipping");
    return;
  }

  // Clear old announcements
  await supabase.from("announcements").delete().gte("id", 0);

  for (const row of rows) {
    const announcement = {
      id: parseIntSafe(row.id),
      message: row.message,
      emoji: row.emoji || "📣",
      start_date: row.start_date,
      end_date: row.end_date,
      link_text: row.link_text || null,
      link_url: row.link_url || null,
      target_page: row.target_page || "home",
      style: row.style || "info",
      sort_order: parseIntSafe(row.sort_order),
    };

    const { error } = await supabase
      .from("announcements")
      .upsert(announcement, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Announcement ${announcement.id}: ${error.message}`);
    } else {
      console.log(`  ✅ Announcement ${announcement.id}: ${announcement.emoji} ${announcement.message.substring(0, 30)}...`);
    }
  }
}

async function syncDailyChallenges(sheets: ReturnType<typeof google.sheets>) {
  console.log("\n📅 Syncing Daily Challenges...");
  const rows = await readTab(sheets, "DailyChallenges");
  if (rows.length === 0) {
    console.log("  ⚠️  No DailyChallenges tab found, skipping");
    return;
  }

  // Normalize category values to match DB constraint
  const categoryMap: Record<string, string> = {
    "ai_in": "ai_in", "AI_in": "ai_in", "AI in": "ai_in", "ai in": "ai_in", "AI In": "ai_in",
    "history": "history", "History": "history", "AI History 101": "history", "ai history 101": "history",
    "who_am_i": "who_am_i", "Who Am I": "who_am_i", "who am i": "who_am_i", "Who_Am_I": "who_am_i",
    "odd_one": "odd_one", "Odd One": "odd_one", "odd one": "odd_one", "Find the Odd One": "odd_one", "find the odd one": "odd_one",
  };

  for (const row of rows) {
    const rawCategory = (row.category || "").trim();
    const normalizedCategory = categoryMap[rawCategory] || rawCategory.toLowerCase().replace(/\s+/g, "_");

    const challenge = {
      id: parseIntSafe(row.id),
      date: row.date,
      category: normalizedCategory,
      title_zh: row.title_zh,
      description_zh: row.description_zh || null,
    };

    const { error } = await supabase
      .from("daily_challenges")
      .upsert(challenge, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ Challenge ${challenge.id}: ${error.message}`);
    } else {
      console.log(`  ✅ Challenge ${challenge.id}: ${challenge.title_zh}`);
    }
  }
}

async function syncDailyChallengeQuestions(sheets: ReturnType<typeof google.sheets>) {
  console.log("\n❓ Syncing Daily Challenge Questions...");
  const rows = await readTab(sheets, "DailyChallengeQuestions");
  if (rows.length === 0) {
    console.log("  ⚠️  No DailyChallengeQuestions tab found, skipping");
    return;
  }

  for (const row of rows) {
    const q = {
      id: parseIntSafe(row.id),
      challenge_id: parseIntSafe(row.challenge_id),
      type: row.type,
      prompt: row.prompt,
      explanation: row.explanation || null,
      sort_order: parseIntSafe(row.sort_order),
    };

    const { error } = await supabase
      .from("daily_challenge_q")
      .upsert(q, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ DC Question ${q.id}: ${error.message}`);
    } else {
      console.log(`  ✅ DC Question ${q.id}: ${q.prompt.substring(0, 30)}...`);
    }
  }
}

async function syncDailyChallengeOptions(sheets: ReturnType<typeof google.sheets>) {
  console.log("\n🔘 Syncing Daily Challenge Options...");
  const rows = await readTab(sheets, "DailyChallengeOptions");
  if (rows.length === 0) {
    console.log("  ⚠️  No DailyChallengeOptions tab found, skipping");
    return;
  }

  for (const row of rows) {
    const opt = {
      id: parseIntSafe(row.id),
      question_id: parseIntSafe(row.question_id),
      option_text: row.option_text,
      is_correct: parseBoolean(row.is_correct),
      sort_order: parseIntSafe(row.sort_order),
    };

    const { error } = await supabase
      .from("daily_challenge_opts")
      .upsert(opt, { onConflict: "id" });

    if (error) {
      console.error(`  ❌ DC Option ${opt.id}: ${error.message}`);
    } else {
      console.log(`  ✅ DC Option ${opt.id}: ${opt.option_text.substring(0, 30)}...`);
    }
  }
}

async function rebuildProgress() {
  console.log("\n🔄 Rebuilding user progress...");
  // Create progress rows for all users x all chapters
  const { error } = await supabase.rpc("rebuild_all_progress");
  if (error) {
    console.log("  ⚠️  Could not auto-rebuild progress (run rebuild_all_progress SQL manually)");
  } else {
    console.log("  ✅ Progress rebuilt");
  }
}

async function clearCoreContent() {
  console.log("\n🗑️  Clearing core content (preserving user progress)...");
  // NOTE: Do NOT delete user_progress or user_answers — preserve user data
  await supabase.from("question_options").delete().gte("id", 0);
  await supabase.from("questions").delete().gte("id", 0);
  await supabase.from("chapters").delete().gte("id", 0);
  await supabase.from("units").delete().gte("id", 0);
  await supabase.from("stages").delete().gte("id", 0);
  console.log("  ✅ Cleared");
}

async function clearDailyChallengeContent() {
  console.log("\n🗑️  Clearing daily challenge content...");
  await supabase.from("daily_challenge_records").delete().gte("id", 0);
  await supabase.from("daily_challenge_opts").delete().gte("id", 0);
  await supabase.from("daily_challenge_q").delete().gte("id", 0);
  await supabase.from("daily_challenges").delete().gte("id", 0);
  console.log("  ✅ Cleared");
}

async function main() {
  console.log("🐬 智學AI — Google Sheets Sync");
  console.log("================================");
  console.log(`Sheet ID: ${SHEET_ID}`);
  console.log(`Supabase: ${SUPABASE_URL}`);

  // Parse CLI args for selective sync
  const args = process.argv.slice(2);
  const syncCore = args.includes("core") || args.includes("all") || args.length === 0;
  const syncDaily = args.includes("daily") || args.includes("all") || args.length === 0;
  const syncStagesOnly = args.includes("stages");
  const syncAnnouncementsOnly = args.includes("announcements");

  const sheets = await getSheets();

  if (syncAnnouncementsOnly) {
    console.log("\nSyncing: announcements only");
    await syncAnnouncements(sheets);
  } else if (syncStagesOnly) {
    console.log("\nSyncing: stages only");
    await supabase.from("stages").delete().gte("id", 0);
    await syncStages(sheets);
  } else if (syncCore) {
    console.log("\nSyncing: core");
    await clearCoreContent();
    await syncStages(sheets);
    await syncUnits(sheets);
    await syncChapters(sheets);
    await syncQuestions(sheets);
    await syncOptions(sheets);
  }

  if (syncDaily) {
    await clearDailyChallengeContent();
    await syncDailyChallenges(sheets);
    await syncDailyChallengeQuestions(sheets);
    await syncDailyChallengeOptions(sheets);
  }

  // Sync announcements (always, unless only syncing stages)
  if (!syncStagesOnly) {
    await syncAnnouncements(sheets);
  }

  // Rebuild progress for all users
  await rebuildProgress();

  console.log("\n✅ Sync complete!");
}

main().catch((err) => {
  console.error("❌ Sync failed:", err.message);
  process.exit(1);
});
