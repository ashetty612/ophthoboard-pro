/**
 * Pick a clean display label for a case header.
 *
 * ~45 cases in the database have malformed `diagnosisTitle` fields —
 * sentence fragments like "is bacterial keratitis, most likely…" or
 * "the majority of patients…" that come from imperfect parsing of
 * the source PDF. Those would render as "Diagnosis: is bacterial
 * keratitis…" which reads broken. This helper detects fragment-style
 * titles and falls back to the (always clean) clinical-vignette title.
 *
 * Heuristic: a real diagnosis title always starts with a capital
 * letter and the first word is NOT a verb / function word that would
 * indicate the string was sliced from mid-sentence.
 */
export function cleanCaseLabel(diagnosisTitle?: string, fallbackTitle?: string): string {
  const dt = (diagnosisTitle || '').trim();
  const fb = (fallbackTitle || '').trim();
  if (!dt) return fb;
  const firstChar = dt[0];
  const firstWord = dt.split(/\s+/)[0]?.toLowerCase() || '';
  const fragmentStarters = new Set([
    'is', 'was', 'were', 'are', 'be', 'been',
    'the', 'a', 'an', 'this', 'that', 'these', 'those',
    'and', 'or', 'but', 'if', 'when', 'while',
    'it', 'they', 'we', 'i',
    'has', 'have', 'had', 'do', 'does', 'did',
    'in', 'on', 'at', 'of', 'for', 'with', 'by', 'from', 'to',
  ]);
  if (firstChar !== firstChar.toUpperCase() || fragmentStarters.has(firstWord)) {
    return fb || dt;
  }
  return dt;
}
