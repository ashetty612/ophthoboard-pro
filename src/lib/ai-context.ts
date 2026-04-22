/**
 * AI Context Retrieval
 * --------------------
 * Keyword-scored retrieval over curated, static board-relevant content
 * (fatal flaws, landmark trials, AAO PPPs, cases database, cram sheet).
 *
 * Given the user's most-recent message, returns a compact "RELEVANT
 * REFERENCE MATERIAL" block that `src/app/api/chat/route.ts` injects as
 * an extra system message — grounding the examiner in authoritative
 * data rather than free-form recall.
 *
 * Everything is statically imported at build time. No file I/O at
 * request time. SSR-safe (no window/DOM references).
 */

import casesDb from '../../public/data/cases_database.json';
import pppDb from '../../public/data/ppp_database.json';
import { FATAL_FLAWS } from './fatal-flaws';
import { LANDMARK_TRIALS } from './landmark-trials';
import { CRAM_CONTENT } from './cram-content';

// -----------------------------------------------------------------------------
// Types for the imported JSON (kept intentionally loose — we only read a few
// fields and tolerate extras).
// -----------------------------------------------------------------------------
interface RawCase {
  diagnosisTitle?: string;
  title?: string;
  subspecialty?: string;
  presentation?: string;
}
interface RawCaseSubspec {
  name?: string;
  cases?: RawCase[];
}
interface RawPPP {
  title?: string;
  keyRecommendations?: Array<{ text?: string }>;
}
interface RawPPPSubspec {
  name?: string;
  ppps?: RawPPP[];
}
interface RawCasesDb { subspecialties?: RawCaseSubspec[] }
interface RawPPPDb { subspecialties?: RawPPPSubspec[] }

// -----------------------------------------------------------------------------
// Snippet index — flatten all sources into a single scoreable list once.
// -----------------------------------------------------------------------------
interface Snippet {
  source: 'fatal-flaw' | 'trial' | 'ppp' | 'case' | 'cram';
  text: string;
  /** Searchable haystack (lowercased, keywords + title + body). */
  haystack: string;
  /** Distinct dedup key so we never ship the same snippet twice. */
  key: string;
}

const SNIPPETS: Snippet[] = [];

// Fatal flaws ------------------------------------------------------------------
for (const f of FATAL_FLAWS) {
  const kw = f.triggerKeywords.join(' ');
  const text =
    `FATAL-FLAW (${f.subspecialty}) — ${f.mustNotMiss}. ` +
    `Trigger: ${f.scenario}. Action: ${f.immediateAction}`;
  SNIPPETS.push({
    source: 'fatal-flaw',
    text,
    haystack: `${kw} ${f.scenario} ${f.mustNotMiss}`.toLowerCase(),
    key: `ff:${f.id}`,
  });
}

// Landmark trials --------------------------------------------------------------
for (const t of LANDMARK_TRIALS) {
  const kw = t.triggerKeywords.join(' ');
  const text =
    `TRIAL — ${t.acronym} (${t.fullName}, ${t.subspecialty}): ` +
    `${t.keyFinding} Impact: ${t.clinicalImpact}`;
  SNIPPETS.push({
    source: 'trial',
    text,
    haystack: `${kw} ${t.acronym} ${t.fullName} ${t.population}`.toLowerCase(),
    key: `tr:${t.acronym}`,
  });
}

// PPPs -------------------------------------------------------------------------
const pppTyped = pppDb as RawPPPDb;
for (const sub of pppTyped.subspecialties ?? []) {
  for (const ppp of sub.ppps ?? []) {
    const title = ppp.title ?? '';
    const recs = (ppp.keyRecommendations ?? [])
      .map((r) => r.text ?? '')
      .filter(Boolean)
      .slice(0, 3); // top 3 recommendations per PPP
    if (!title || recs.length === 0) continue;
    const text = `AAO PPP — ${title} (${sub.name}): ${recs.join(' | ')}`;
    SNIPPETS.push({
      source: 'ppp',
      text,
      haystack: `${title} ${recs.join(' ')} ${sub.name ?? ''}`.toLowerCase(),
      key: `ppp:${sub.name}:${title}`,
    });
  }
}

// Cases DB — diagnosisTitle only (lightweight index) --------------------------
const casesTyped = casesDb as RawCasesDb;
const seenDx = new Set<string>();
for (const sub of casesTyped.subspecialties ?? []) {
  for (const c of sub.cases ?? []) {
    const dx = (c.diagnosisTitle ?? '').trim();
    if (!dx || seenDx.has(dx.toLowerCase())) continue;
    seenDx.add(dx.toLowerCase());
    const text = `CASE DX — ${dx} (${sub.name ?? c.subspecialty ?? ''})${c.presentation ? `: ${c.presentation}` : ''}`;
    SNIPPETS.push({
      source: 'case',
      text,
      haystack: `${dx} ${c.title ?? ''} ${c.presentation ?? ''} ${sub.name ?? ''}`.toLowerCase(),
      key: `case:${dx.toLowerCase()}`,
    });
  }
}

// Cram sheet — pearls, trials, classic presentations --------------------------
for (const c of CRAM_CONTENT) {
  const sections = [c.classicPresentations, c.keyTrials, c.pearls];
  for (const s of sections) {
    for (const item of s.items) {
      const label = item.label ? `${item.label}: ` : '';
      const text = `${c.name.toUpperCase()} — ${label}${item.content}${item.subtext ? ` (${item.subtext})` : ''}`;
      SNIPPETS.push({
        source: 'cram',
        text,
        haystack: `${label}${item.content} ${item.subtext ?? ''} ${c.name}`.toLowerCase(),
        key: `cram:${c.id}:${(item.label ?? item.content).slice(0, 40)}`,
      });
    }
  }
}

// -----------------------------------------------------------------------------
// Scoring.
// -----------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'to', 'for', 'with',
  'is', 'are', 'was', 'were', 'be', 'been', 'at', 'by', 'as', 'it',
  'this', 'that', 'these', 'those', 'from', 'what', 'how', 'why', 'when',
  'where', 'patient', 'year', 'old', 'has', 'have', 'had',
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

/**
 * Score a snippet by counting how many distinct query tokens appear as
 * substrings in the snippet's haystack. Source type gives a small bias
 * (fatal flaws > trials > ppp > case > cram) to prefer high-signal
 * curated content over raw case titles when relevance is similar.
 */
function scoreSnippet(s: Snippet, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  let hits = 0;
  for (const tok of tokens) {
    if (s.haystack.includes(tok)) hits++;
  }
  if (hits === 0) return 0;
  const bias = s.source === 'fatal-flaw' ? 0.6
    : s.source === 'trial' ? 0.5
    : s.source === 'ppp' ? 0.3
    : s.source === 'cram' ? 0.15
    : 0;
  return hits + bias;
}

// -----------------------------------------------------------------------------
// Public API.
// -----------------------------------------------------------------------------

/**
 * Given a user message (and optional subspecialty hint), return a compact
 * context block to inject before the AI answers. Returns empty string if
 * nothing relevant was found — do NOT inject noise.
 */
export function buildRelevantContext(
  userMessage: string,
  subspecialtyHint?: string
): string {
  const combined = `${userMessage ?? ''} ${subspecialtyHint ?? ''}`.trim();
  if (!combined) return '';

  const tokens = Array.from(new Set(tokenize(combined)));
  if (tokens.length === 0) return '';

  // Score all snippets.
  type Scored = { s: Snippet; score: number };
  const scored: Scored[] = [];
  for (const s of SNIPPETS) {
    const score = scoreSnippet(s, tokens);
    if (score > 0) scored.push({ s, score });
  }
  if (scored.length === 0) return '';

  scored.sort((a, b) => b.score - a.score);

  // Take top N, respecting a soft word-budget (~200 words).
  const MAX_SNIPPETS = 8;
  const WORD_BUDGET = 220;
  const picked: Snippet[] = [];
  const seenKeys = new Set<string>();
  let words = 0;

  for (const { s } of scored) {
    if (picked.length >= MAX_SNIPPETS) break;
    if (seenKeys.has(s.key)) continue;
    const w = s.text.split(/\s+/).length;
    if (words + w > WORD_BUDGET && picked.length >= 5) break;
    picked.push(s);
    seenKeys.add(s.key);
    words += w;
  }

  if (picked.length === 0) return '';

  return picked.map((p) => `- ${p.text}`).join('\n');
}
