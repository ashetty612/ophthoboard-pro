#!/usr/bin/env node
// OphthoBoard Pro — Content Validator
// Blocks production builds if cases_database.json or ppp_database.json contain bad data.
// Usage: node scripts/validate-content.mjs
// Exit code: 0 if no ERRORs (warnings OK), 1 if any ERROR-severity check fails.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const repoRoot   = path.resolve(__dirname, '..');

const CASES_PATH  = path.join(repoRoot, 'public', 'data', 'cases_database.json');
const PPP_PATH    = path.join(repoRoot, 'public', 'data', 'ppp_database.json');
const IMAGES_DIR  = path.join(repoRoot, 'public', 'images');

const ALLOWED_HOSTS = new Set([
  'upload.wikimedia.org',
  'live.staticflickr.com',
  'iiif.wellcomecollection.org',
]);

// Optics-theory question detector: scoringKeywords may be empty for these.
const OPTICS_THEORY_PATTERNS = [
  /\btranspose\b/i,
  /\bcalculate\b/i,
  /\blens power\b/i,
  /\bretinoscopy technique\b/i,
  /\bprismatic effect\b/i,
];

// OCR-artifact patterns for diagnosisTitle / photoDescription.
const OCR_ARTIFACT_PATTERNS = [
  /©/,
  /\u0001/,
  /See discussion/i,
  /Figure \d+-\d+/,
  /lip it helium/i,
  /\b[a-z]+-[a-z]{2,}\b/i,   // mid-sentence hyphenation like "n-iinal"
  /veiiis/i,
];

// Narrower hyphen detector: only flag when the hyphenated fragment contains
// a nonsense glyph cluster (ii, iii, rn that looks like m, etc.). We want
// "n-iinal" but not "cross-sectional" or "follow-up".
const GARBLED_HYPHEN = /\b[a-z]*(?:ii+|rn)[a-z]*-[a-z]+\b|\b[a-z]+-(?:ii+|rn)[a-z]*\b/i;

// --- collect findings -----------------------------------------------------
const errors   = [];
const warnings = [];
const report   = []; // lines to print in order

function err(msg)  { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

function loadJson(p) {
  if (!existsSync(p)) {
    err(`Missing file: ${p}`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    err(`Invalid JSON in ${p}: ${e.message}`);
    return null;
  }
}

function hasOcrArtifact(str) {
  if (typeof str !== 'string') return false;
  if (OCR_ARTIFACT_PATTERNS.some(p => p.test(str))) return true;
  if (GARBLED_HYPHEN.test(str)) return true;
  return false;
}

function isOpticsTheoryQuestion(q) {
  const text = (q.question || '') + ' ' + (q.answer || '');
  return OPTICS_THEORY_PATTERNS.some(p => p.test(text));
}

// --- run ------------------------------------------------------------------
const cases = loadJson(CASES_PATH);
const ppp   = loadJson(PPP_PATH);

report.push('OphthoBoard Pro — Content Validator');
report.push('================================================');
report.push('CASES DATABASE');

if (cases) {
  const subs = Array.isArray(cases.subspecialties) ? cases.subspecialties : [];
  const allCases = subs.flatMap(s => Array.isArray(s.cases) ? s.cases : []);
  report.push(`  Total cases: ${allCases.length}`);

  // Required fields on every case
  const missingFields = [];
  for (const c of allCases) {
    const miss = [];
    if (!c.id)            miss.push('id');
    if (!c.title)         miss.push('title');
    if (!c.subspecialty)  miss.push('subspecialty');
    if (!Array.isArray(c.questions) || c.questions.length < 1) miss.push('questions[]');
    if (miss.length) missingFields.push(`${c.id || '(no id)'}: ${miss.join(', ')}`);
  }
  if (missingFields.length === 0) {
    report.push('  ✓ All cases have required fields');
  } else {
    err(`${missingFields.length} cases missing required fields`);
    report.push(`  ✗ ${missingFields.length} cases missing required fields`);
    for (const m of missingFields.slice(0, 5)) report.push(`      - ${m}`);
    if (missingFields.length > 5) report.push(`      … and ${missingFields.length - 5} more`);
  }

  // Unique IDs
  const seenIds = new Map();
  const dupIds  = [];
  for (const c of allCases) {
    if (!c.id) continue;
    if (seenIds.has(c.id)) dupIds.push(c.id);
    else seenIds.set(c.id, true);
  }
  if (dupIds.length === 0) {
    report.push('  ✓ All case IDs unique');
  } else {
    err(`${dupIds.length} duplicate case IDs`);
    report.push(`  ✗ ${dupIds.length} duplicate case IDs: ${[...new Set(dupIds)].slice(0, 5).join(', ')}`);
  }

  // Question-level required fields + scoringKeywords
  const badQuestions = [];
  const emptyKeywordsBad = [];
  for (const c of allCases) {
    const qs = Array.isArray(c.questions) ? c.questions : [];
    for (const q of qs) {
      const miss = [];
      if (q.number === undefined || q.number === null) miss.push('number');
      if (!q.question) miss.push('question');
      if (!q.answer)   miss.push('answer');
      if (!('scoringKeywords' in q)) miss.push('scoringKeywords');
      if (miss.length) {
        badQuestions.push(`${c.id} Q${q.number ?? '?'}: ${miss.join(', ')}`);
        continue;
      }
      // scoringKeywords must be a non-empty array — unless optics-theory question.
      if (!Array.isArray(q.scoringKeywords) || q.scoringKeywords.length === 0) {
        if (!isOpticsTheoryQuestion(q)) {
          emptyKeywordsBad.push(`${c.id} Q${q.number}`);
        }
      }
    }
  }
  if (badQuestions.length === 0) {
    report.push('  ✓ All questions have required fields');
  } else {
    err(`${badQuestions.length} questions missing required fields`);
    report.push(`  ✗ ${badQuestions.length} questions missing required fields`);
    for (const m of badQuestions.slice(0, 5)) report.push(`      - ${m}`);
    if (badQuestions.length > 5) report.push(`      … and ${badQuestions.length - 5} more`);
  }
  if (emptyKeywordsBad.length === 0) {
    report.push('  ✓ All non-optics questions have scoringKeywords');
  } else {
    err(`${emptyKeywordsBad.length} questions have empty scoringKeywords (non-optics)`);
    report.push(`  ✗ ${emptyKeywordsBad.length} questions have empty scoringKeywords`);
    for (const m of emptyKeywordsBad.slice(0, 5)) report.push(`      - ${m}`);
    if (emptyKeywordsBad.length > 5) report.push(`      … and ${emptyKeywordsBad.length - 5} more`);
  }

  // externalImageUrl allow-list
  const badUrls = [];
  for (const c of allCases) {
    const url = c.externalImageUrl;
    if (!url) continue;
    if (!url.startsWith('https://')) {
      badUrls.push(`${c.id}: not https — ${url}`);
      continue;
    }
    let host;
    try { host = new URL(url).host; } catch { badUrls.push(`${c.id}: unparseable URL`); continue; }
    if (!ALLOWED_HOSTS.has(host)) badUrls.push(`${c.id}: host ${host} not allow-listed`);
  }
  if (badUrls.length === 0) {
    report.push('  ✓ All images use allow-listed hosts');
  } else {
    err(`${badUrls.length} externalImageUrl entries violate allow-list`);
    report.push(`  ✗ ${badUrls.length} externalImageUrl entries violate allow-list`);
    for (const m of badUrls.slice(0, 5)) report.push(`      - ${m}`);
    if (badUrls.length > 5) report.push(`      … and ${badUrls.length - 5} more`);
  }

  // --- WARNINGS ---
  // diagnosisTitle empty / OCR-garbled
  let badDiag = 0;
  for (const c of allCases) {
    if (!('diagnosisTitle' in c)) continue;
    const d = c.diagnosisTitle;
    if (!d || (typeof d === 'string' && d.trim() === '') || hasOcrArtifact(d)) badDiag++;
  }
  if (badDiag > 0) {
    warn(`${badDiag} cases have empty/garbled diagnosisTitle`);
    report.push(`  ⚠ ${badDiag} cases have empty/garbled diagnosisTitle`);
  }

  // photoDescription OCR artifacts
  let badPhoto = 0;
  for (const c of allCases) {
    if (hasOcrArtifact(c.photoDescription)) badPhoto++;
  }
  if (badPhoto > 0) {
    warn(`${badPhoto} cases have OCR artifacts in photoDescription`);
    report.push(`  ⚠ ${badPhoto} cases have OCR artifacts in photoDescription`);
  }

  // imageFile missing from public/images/
  let missingImg = 0;
  const missingImgSamples = [];
  for (const c of allCases) {
    if (!c.imageFile) continue;
    const p = path.join(IMAGES_DIR, c.imageFile);
    if (!existsSync(p)) {
      missingImg++;
      if (missingImgSamples.length < 5) missingImgSamples.push(`${c.id} → ${c.imageFile}`);
    }
  }
  if (missingImg > 0) {
    warn(`${missingImg} cases reference missing imageFile`);
    report.push(`  ⚠ ${missingImg} cases reference missing imageFile`);
    for (const m of missingImgSamples) report.push(`      - ${m}`);
  }

  // Unusual question count — tightened to catch genuine outliers only.
  // Optics subspecialty legitimately has 1-Q theoretical cases; skip those.
  // For clinical cases: flag <3 or >12 as unusual.
  let unusualQ = 0;
  const unusualSamples = [];
  for (const c of allCases) {
    const n = Array.isArray(c.questions) ? c.questions.length : 0;
    const isOptics = (c.subspecialty || '').toLowerCase().includes('optic') ||
                     (c.id || '').startsWith('opt-');
    const minOk = isOptics ? 1 : 3;
    const maxOk = 12;
    if (n < minOk || n > maxOk) {
      unusualQ++;
      if (unusualSamples.length < 5) unusualSamples.push(`${c.id} (${n} questions)`);
    }
  }
  if (unusualQ > 0) {
    warn(`${unusualQ} cases have unusual question count (<3 clinical / <1 optics, or >12)`);
    report.push(`  ⚠ ${unusualQ} cases have unusual question count`);
    for (const s of unusualSamples) report.push(`      - ${s}`);
  }
} else {
  report.push('  ✗ cases_database.json could not be loaded');
}

report.push('');
report.push('PPP DATABASE');
if (ppp) {
  const subs = Array.isArray(ppp.subspecialties) ? ppp.subspecialties : [];
  const sum  = subs.reduce((acc, s) => acc + (Array.isArray(s.ppps) ? s.ppps.length : 0), 0);
  const meta = ppp.metadata?.totalPPPs;
  report.push(`  Total PPPs: ${sum}`);
  if (meta === sum) {
    report.push('  ✓ Metadata count matches');
  } else {
    err(`PPP metadata.totalPPPs (${meta}) does not match sum (${sum})`);
    report.push(`  ✗ metadata.totalPPPs=${meta} but sum across subspecialties=${sum}`);
  }
} else {
  report.push('  ✗ ppp_database.json could not be loaded');
}

report.push('');
report.push('================================================');
report.push(`Summary: ${errors.length} errors, ${warnings.length} warnings`);
if (errors.length === 0) {
  report.push('Status: PASS (build can proceed)');
} else {
  report.push('Status: FAIL (build blocked)');
}

for (const line of report) console.log(line);

process.exit(errors.length === 0 ? 0 : 1);
