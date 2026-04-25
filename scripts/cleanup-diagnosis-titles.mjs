#!/usr/bin/env node
/**
 * One-shot data cleanup: extract clean noun-phrase diagnoses for cases
 * whose `diagnosisTitle` came out as a sentence fragment from the
 * source-PDF parse (e.g., "is bacterial keratitis, most likely…",
 * "the majority of patients treated with laser first…").
 *
 * Strategy:
 *   1. Load cases_database.json + back it up.
 *   2. Identify fragmenty rows via the same heuristic as cleanCaseLabel().
 *   3. Try a rules-based fix first (lowercase noun phrase → just
 *      capitalize; "This is X" → strip "This is"; etc).
 *   4. If still ambiguous, send to Gemini 3 Flash with the case
 *      title + presentation + Q1 answer and ask it to extract a
 *      clean 3-8 word noun-phrase diagnosis (or return the title if
 *      there's no clear diagnosis).
 *   5. Write back. Print a unified diff so the change is auditable.
 *
 * Usage:
 *   GOOGLE_API_KEY=... node scripts/cleanup-diagnosis-titles.mjs
 *   GOOGLE_API_KEY=... DRY_RUN=1 node scripts/cleanup-diagnosis-titles.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath() decodes %20 in paths (handles dirs with spaces).
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES_PATH = path.join(ROOT, "public/data/cases_database.json");
const BACKUP_PATH = path.join(ROOT, "public/data/cases_database.backup.json");
const DRY = !!process.env.DRY_RUN;

// Same fragment heuristic the renderer uses
const FRAGMENT_STARTERS = new Set([
  "is","was","were","are","be","been",
  "the","a","an","this","that","these","those",
  "and","or","but","if","when","while",
  "it","they","we","i",
  "has","have","had","do","does","did",
  "in","on","at","of","for","with","by","from","to",
]);

function isFragment(dt) {
  const s = (dt || "").trim();
  if (!s) return false;
  const fc = s[0];
  const fw = s.split(/\s+/)[0]?.toLowerCase() || "";
  return fc !== fc.toUpperCase() || FRAGMENT_STARTERS.has(fw);
}

/** Rule-based fix attempt. Returns a cleaned string OR null if it
 *  couldn't decide. */
function ruleBasedFix(dt) {
  let s = (dt || "").trim();
  if (!s) return null;

  // Strip common leading filler phrases
  s = s.replace(/^(This is (an? )?|These are (an? )?|It is (an? )?|That is (an? )?|The most likely diagnosis is (an? )?|The diagnosis is (an? )?)/i, "");
  s = s.trim();

  // If now empty, can't help
  if (!s) return null;

  // Trim at first sentence break (., ;, ", and that's", ...)
  s = s.split(/[.;]|\s(and\s+is\s+commonly|and\s+is|and\s+causes)\b/i)[0].trim();

  // Drop trailing fragmentary commas/parens that have no closer
  s = s.replace(/[,(]\s*$/, "").trim();

  // Heuristic: a clean noun-phrase diagnosis is 1-10 words,
  // <= 80 chars, and does NOT start with a verb / function word.
  const words = s.split(/\s+/);
  if (words.length === 0 || words.length > 10) return null;
  if (s.length > 80) return null;
  const fw = words[0].toLowerCase();
  if (FRAGMENT_STARTERS.has(fw)) return null;

  // OCR garbage detector — common artifacts from the source PDF parse.
  // Don't trust the rule-based fix if any are present; let AI re-extract.
  const ocrChars = /[\[\]\|<>]/.test(s);
  const ocrDigit = /[a-z]\d|\d[a-z]/i.test(s); // letters mixed with digits mid-word
  const ocrSlash = /\b[a-z]+\/[a-z]+/i.test(s); // mid-word slash like "cela/olin"
  if (ocrChars || ocrDigit || ocrSlash) return null;

  // Capitalize first letter for display.
  return s[0].toUpperCase() + s.slice(1);
}

/** Send a single case to Gemini for diagnosis extraction. */
async function aiExtract(c, apiKey) {
  const stem = (c.questions?.[0]?.question || "").slice(0, 240);
  const ans = (c.questions?.[0]?.answer || "").slice(0, 600);
  const prompt = `Extract a clean, concise diagnosis (a noun phrase, 1–8 words) for this ophthalmology case.

CASE TITLE: ${c.title || "(none)"}
PRESENTATION: ${(c.presentation || "(none)").slice(0, 400)}
Q1 STEM: ${stem}
Q1 MODEL ANSWER (excerpt): ${ans}
EXISTING (BROKEN) DIAGNOSIS LABEL: ${c.diagnosisTitle || "(none)"}

Output ONLY the diagnosis as a noun phrase. No "Diagnosis:" prefix, no period at the end, no quotes, no explanation.

If the case is a knowledge question (EXCEPT/LEAST/multiple-choice format) where there's no single diagnosis, output the most relevant *topic* (e.g., "Glaucoma laser trials", "Posterior vitreous detachment", "ROP screening").

If you cannot determine a diagnosis or topic, output exactly: SKIP`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      // 200 was still getting truncated for outputs that printed only
      // 2-3 words — thinking budget was consuming the rest. Disable
      // thinking entirely (the task is pure extraction, no reasoning
      // needed) and give plenty of output room.
      maxOutputTokens: 600,
      responseModalities: ["TEXT"],
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`Gemini ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const txt = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim() || "";
  return txt;
}

async function main() {
  const apiKey = process.env.GOOGLE_API_KEY || "";
  if (!apiKey) {
    console.error("Missing GOOGLE_API_KEY");
    process.exit(1);
  }

  const raw = fs.readFileSync(CASES_PATH, "utf8");
  const db = JSON.parse(raw);

  // Back up before any change
  if (!DRY && !fs.existsSync(BACKUP_PATH)) {
    fs.writeFileSync(BACKUP_PATH, raw);
    console.log(`Backup written: ${path.relative(ROOT, BACKUP_PATH)}`);
  }

  const fragmenty = [];
  for (const sub of db.subspecialties || []) {
    for (const c of sub.cases || []) {
      if (isFragment(c.diagnosisTitle)) fragmenty.push(c);
    }
  }
  console.log(`Found ${fragmenty.length} fragmenty cases.`);

  let ruleFixed = 0;
  let aiFixed = 0;
  let aiSkipped = 0;
  let unchanged = 0;
  const changes = [];

  for (let i = 0; i < fragmenty.length; i++) {
    const c = fragmenty[i];
    const before = c.diagnosisTitle;

    // Rule-based first
    const ruled = ruleBasedFix(before);
    if (ruled && !isFragment(ruled)) {
      c.diagnosisTitle = ruled;
      ruleFixed++;
      changes.push({ id: c.id, before, after: ruled, via: "rule" });
      continue;
    }

    // AI fallback
    process.stdout.write(`  [${i + 1}/${fragmenty.length}] ${c.id}: AI...`);
    try {
      const out = await aiExtract(c, apiKey);
      let cleaned = (out || "").split(/\r?\n/)[0].trim()
        .replace(/^["'`]|["'`]$/g, "")
        .replace(/[.,;]+$/, "")
        .trim();
      // Strip trailing "(N words)" etc. that Gemini sometimes appends
      cleaned = cleaned.replace(/\s*\(\d+\s*words?\s*\)?$/i, "").trim();
      // Dedup repeated phrases (Gemini occasionally echoes itself,
      // e.g. "Left superior oblique palsyLeft superior")
      const dedupMatch = cleaned.match(/^(.+?)\1+$/);
      if (dedupMatch) cleaned = dedupMatch[1].trim();
      // Strip trailing partial-word fragments after the last complete
      // word boundary — usually safer to leave as-is, but we drop
      // strings that end with an obvious mid-word truncation.
      if (/[a-z]{2,}\s+[a-z]{1,3}$/i.test(cleaned)) {
        // last token is suspiciously short (1-3 chars) — likely a
        // truncation. Drop the last token.
        cleaned = cleaned.replace(/\s+\S+$/, "").trim();
      }
      if (!cleaned || cleaned === "SKIP" || isFragment(cleaned) || cleaned.length > 90) {
        unchanged++;
        aiSkipped++;
        process.stdout.write(` skipped\n`);
      } else {
        c.diagnosisTitle = cleaned;
        aiFixed++;
        changes.push({ id: c.id, before, after: cleaned, via: "ai" });
        process.stdout.write(` -> ${cleaned}\n`);
      }
    } catch (e) {
      unchanged++;
      process.stdout.write(` ERR: ${e.message}\n`);
    }
    // Polite throttle to avoid rate limits
    await new Promise(r => setTimeout(r, 250));
  }

  console.log();
  console.log(`Rule-based: ${ruleFixed}`);
  console.log(`AI-extracted: ${aiFixed}`);
  console.log(`Skipped: ${unchanged} (rendered uses cleanCaseLabel fallback)`);
  console.log();
  console.log("Sample changes:");
  for (const c of changes.slice(0, 12)) {
    console.log(`  ${c.id} (${c.via}): ${c.before.slice(0, 50)} -> ${c.after}`);
  }
  if (changes.length > 12) console.log(`  ... +${changes.length - 12} more`);

  if (DRY) {
    console.log("\nDRY_RUN — not writing.");
    return;
  }
  fs.writeFileSync(CASES_PATH, JSON.stringify(db, null, 2));
  console.log(`\nWrote ${path.relative(ROOT, CASES_PATH)} (${(fs.statSync(CASES_PATH).size / 1024).toFixed(1)} KB)`);
}

main().catch(e => {
  console.error(e);
  process.exit(2);
});
