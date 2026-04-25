#!/usr/bin/env node
/**
 * One-shot OCR-artifact cleanup for case body text (presentation,
 * photoDescription, question, answer fields).
 *
 * Strategy: targeted regex substitutions for OCR garbage that's
 * unambiguously wrong (i.e., not a legitimate word/abbreviation in
 * any context). Each substitution is paired with a comment explaining
 * what the original text was.
 *
 * NOT in this script: AI-based rewrite. Body text contains legitimate
 * medical abbreviations and dosing notations that an LLM might
 * "correct" away. Rule-based is safer for a one-shot data fix.
 *
 * Usage:
 *   node scripts/cleanup-ocr-artifacts.mjs           # writes changes
 *   DRY_RUN=1 node scripts/cleanup-ocr-artifacts.mjs # just print diff
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES_PATH = path.join(ROOT, "public/data/cases_database.json");
const BACKUP_PATH = path.join(ROOT, "public/data/cases_database.ocrbackup.json");
const DRY = !!process.env.DRY_RUN;

// Each rule is [regex, replacement, label]. The label is shown in
// the change log so reviewers can see WHY each fix happened.
//
// Discipline: every pattern here must be a string that has zero
// chance of appearing legitimately in medical text. Add a `\b` word
// boundary if the word part is short enough to collide.
const RULES = [
  // OCR confusing "th" → "tli" / "tl" (italic-h→l confusion)
  [/\bwiili\b/g, "with", "wiili → with"],
  [/\bwilh\b/g, "with", "wilh → with"],
  [/\bwitli\b/g, "with", "witli → with"],
  [/\bWitli\b/g, "With", "Witli → With"],
  [/\biliis\b/g, "this", "iliis → this"],
  [/\bIliis\b/g, "This", "Iliis → This"],
  [/\btliis\b/g, "this", "tliis → this"],
  [/\btlie\b/g, "the", "tlie → the"],
  [/\bTlie\b/g, "The", "Tlie → The"],
  [/\biliit\b/g, "that", "iliit → that"],
  [/\biiii\b/g, "this", "iiii → this"],
  [/\bilif\b/g, "the", "ilif → the"],
  [/\bIlif\b/g, "The", "Ilif → The"],
  [/\biliii\b/g, "this", "iliii → this"],
  [/\biliif\b/g, "the", "iliif → the"],
  [/\bliave\b/g, "have", "liave → have"],
  [/\bliis\b/g, "his", "liis → his"],
  [/\baml\b/g, "and", "aml → and"],
  // OCR i/m/n confusion
  [/\bmosi\b/g, "most", "mosi → most"],
  [/\btreatmeni\b/g, "treatment", "treatmeni → treatment"],
  [/\bappropriaie\b/g, "appropriate", "appropriaie → appropriate"],
  [/\bIromn\b/g, "from", "Iromn → from"],
  // 1-as-I and l confusion
  [/\b1 Ie\b/g, "He", "1 Ie → He"],
  [/\b1 le\b/g, "he", "1 le → he"],
  [/\b1 lis\b/g, "His", "1 lis → His"],
  [/\bMe presents\b/g, "He presents", "Me presents → He presents"],
  // Semicolon-then-letter (";i" used instead of "a")
  [/\s;i\s/g, " a ", "';i ' → ' a '"],
  [/\s;is\s/g, " is ", "';is ' → ' is '"],
  [/\s:i\s/g, " a ", "':i ' → ' a '"],
  // Garbled words that are obviously broken
  [/\bElorid\b/g, "florid", "Elorid → florid"],
  [/\bElorida\b/g, "Florida", "Elorida → Florida"],
  [/\bg-\.ir\.igi-/g, "garage", "g-.ir.igi- → garage"],
  [/\bpai\s+eye\b/g, "painful eye", "pai eye → painful eye"],
  [/\bpaitfent\b/g, "patient", "paitfent → patient"],
  [/\bcrysials\b/g, "crystals", "crysials → crystals"],
  [/\bcyslinosis\b/gi, "cystinosis", "cyslinosis → cystinosis"],
  [/\bcela\/olin\b/g, "cefazolin", "cela/olin → cefazolin"],
  [/\bMedronidazole\b/g, "metronidazole", "Medronidazole → metronidazole"],
  // Punctuation OCR errors in body text
  [/\(\.T\b/g, "CT", "(.T → CT"],
  [/\(\.t\b/g, "CT", "(.t → CT"],
  [/\bu>\s/g, "to ", "u> → to"],
  // Lonely brackets / leftover OCR markers
  [/\s+\^\s+/g, " ", "stray ^ removed"],
  [/\s+~\s+/g, " ", "stray ~ removed"],
  // Common single-character drop (',') after specific medical words
  [/\bcornea aud\b/g, "cornea and", "cornea aud → cornea and"],
  // Double-space cleanup at the end
  [/  +/g, " ", "double-space cleanup"],
];

const raw = fs.readFileSync(CASES_PATH, "utf8");
const db = JSON.parse(raw);

if (!DRY && !fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, raw);
  console.log(`Backup written: ${path.relative(ROOT, BACKUP_PATH)}`);
}

const changes = [];

function fixField(caseId, fieldName, before) {
  if (typeof before !== "string" || !before) return before;
  let after = before;
  const localChanges = [];
  for (const [re, repl, label] of RULES) {
    const matches = after.match(re);
    if (matches) {
      after = after.replace(re, repl);
      localChanges.push({ label, count: matches.length });
    }
  }
  if (after !== before) {
    changes.push({ caseId, fieldName, fixes: localChanges, sample: before.slice(0, 80) + " → " + after.slice(0, 80) });
  }
  return after;
}

let totalFixes = 0;
for (const sub of db.subspecialties || []) {
  for (const c of sub.cases || []) {
    if (c.presentation) c.presentation = fixField(c.id, "presentation", c.presentation);
    if (c.photoDescription) c.photoDescription = fixField(c.id, "photoDescription", c.photoDescription);
    for (const q of (c.questions || [])) {
      if (q.question) q.question = fixField(c.id, `q${q.number}.question`, q.question);
      if (q.answer) q.answer = fixField(c.id, `q${q.number}.answer`, q.answer);
    }
  }
}

for (const c of changes) totalFixes += c.fixes.reduce((s, f) => s + f.count, 0);

console.log();
console.log(`Cases touched: ${new Set(changes.map(c => c.caseId)).size}`);
console.log(`Field-instances changed: ${changes.length}`);
console.log(`Total substitutions: ${totalFixes}`);
console.log();
console.log("Sample changes (first 14):");
for (const c of changes.slice(0, 14)) {
  console.log(`  ${c.caseId} (${c.fieldName})`);
  for (const f of c.fixes.slice(0, 4)) console.log(`    × ${f.count} — ${f.label}`);
}

if (DRY) {
  console.log("\nDRY_RUN — not writing.");
} else {
  fs.writeFileSync(CASES_PATH, JSON.stringify(db, null, 2));
  console.log(`\nWrote ${path.relative(ROOT, CASES_PATH)} (${(fs.statSync(CASES_PATH).size / 1024).toFixed(1)} KB)`);
}
