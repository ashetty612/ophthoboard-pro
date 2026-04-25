"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { GlobalView } from "@/lib/use-global-keyboard";

/**
 * Command palette — Cmd/Ctrl+K opens, fuzzy-search across:
 *   - global navigation routes (Home, Review, Exam, AI Examiner, Cram, etc.)
 *   - all 432 cases by title / diagnosis / subspecialty
 *
 * Each entry has a single action (navigate or open-case) and is
 * keyboard-driven (↑↓, Enter, Esc). Designed to feel like Linear /
 * Raycast / Vercel — small, fast, focused.
 *
 * Listens at the window level so it works from any view.
 */

export interface CommandCase {
  id: string;
  title: string;
  subspecialty?: string;
  diagnosisTitle?: string;
}

interface Props {
  cases: CommandCase[];
  onNavigate: (view: GlobalView) => void;
  onOpenCase: (caseId: string) => void;
}

interface NavCommand {
  type: "nav";
  id: string;
  label: string;
  hint: string;
  view: GlobalView;
  keywords: string;
  icon: string;
}

interface CaseCommand {
  type: "case";
  id: string;
  label: string;
  hint: string;
  caseId: string;
  keywords: string;
  icon: string;
}

type Command = NavCommand | CaseCommand;

const NAV_COMMANDS: NavCommand[] = [
  { type: "nav", id: "nav-home", label: "Home", hint: "Hub + recommendations", view: "home", keywords: "home dashboard start landing", icon: "⌂" },
  { type: "nav", id: "nav-review", label: "Review Cases", hint: "Browse + study answers", view: "review", keywords: "review study browse cases", icon: "📋" },
  { type: "nav", id: "nav-exam", label: "Exam Mode", hint: "Timed mock exam", view: "exam", keywords: "exam test simulation timed", icon: "⏱" },
  { type: "nav", id: "nav-ai", label: "AI Examiner", hint: "Lensley + Eyesaac chat", view: "ai-examiner", keywords: "ai examiner lensley eyesaac chat tutor", icon: "🎓" },
  { type: "nav", id: "nav-dash", label: "Performance Dashboard", hint: "Stats + heatmap + recent", view: "dashboard", keywords: "dashboard progress stats analytics", icon: "📊" },
  { type: "nav", id: "nav-cram", label: "Cram Sheet", hint: "High-yield reference", view: "cram", keywords: "cram sheet reference high-yield pearls", icon: "📝" },
  { type: "nav", id: "nav-due", label: "Due Today", hint: "SRS-due cards", view: "due-today", keywords: "due today srs spaced repetition review", icon: "📅" },
  { type: "nav", id: "nav-weak", label: "Weakness Drill", hint: "Cases on your weak areas", view: "weakness-quiz", keywords: "weakness drill weakest gaps", icon: "🎯" },
  { type: "nav", id: "nav-flash", label: "Flashcards", hint: "SRS-style flashcards", view: "flashcards", keywords: "flashcards cards srs", icon: "🃏" },
  { type: "nav", id: "nav-ppp", label: "AAO PPPs", hint: "Practice patterns reference", view: "ppp", keywords: "ppp aao practice patterns reference", icon: "📚" },
];

/**
 * Lightweight fuzzy scorer: substring match in label > keywords > id.
 * Hits at the start of a word score higher. Returns -1 on no match.
 */
function score(query: string, c: Command): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const label = c.label.toLowerCase();
  const kw = c.keywords.toLowerCase();
  if (label === q) return 1000;
  if (label.startsWith(q)) return 800;
  // Word-start match in label
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(label)) return 600;
  if (label.includes(q)) return 400;
  if (kw.includes(q)) return 200;
  // Char-by-char subseq fuzzy (linear scan)
  let pi = 0;
  for (let i = 0; i < label.length && pi < q.length; i++) {
    if (label[i] === q[pi]) pi++;
  }
  return pi === q.length ? 50 : -1;
}

export default function CommandPalette({ cases, onNavigate, onOpenCase }: Props) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build the case-command list lazily — 432 cases × 4 fields is small
  // enough to score on every keystroke without virtualization.
  const caseCommands: CaseCommand[] = useMemo(
    () =>
      cases.map((c) => ({
        type: "case" as const,
        id: `case-${c.id}`,
        label: c.diagnosisTitle || c.title,
        hint: c.subspecialty || "Case",
        caseId: c.id,
        keywords: `${c.title} ${c.subspecialty || ""} ${c.diagnosisTitle || ""}`,
        icon: "🩺",
      })),
    [cases]
  );

  const allCommands = useMemo<Command[]>(
    () => [...NAV_COMMANDS, ...caseCommands],
    [caseCommands]
  );

  const results = useMemo(() => {
    if (!query.trim()) {
      // Default: nav commands only when no query (cases would dominate)
      return NAV_COMMANDS.slice(0, 10);
    }
    return allCommands
      .map((c) => ({ c, s: score(query, c) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 25)
      .map((x) => x.c);
  }, [query, allCommands]);

  // Global Cmd/Ctrl+K to open. Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Focus input + reset state when the palette opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Reset highlight on new query
  useEffect(() => {
    setHighlight(0);
  }, [query]);

  // Keep the highlighted row in view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-idx="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const run = (c: Command) => {
    setOpen(false);
    if (c.type === "nav") onNavigate(c.view);
    else onOpenCase(c.caseId);
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const c = results[highlight];
      if (c) run(c);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[18vh] sm:pt-[14vh]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={() => setOpen(false)}
        >
          {/* Backdrop */}
          <div
            aria-hidden
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
          />

          {/* Palette */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="relative w-full max-w-xl rounded-2xl border border-slate-700/60 bg-slate-900/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden"
            initial={reduce ? false : { opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-slate-700/50 px-4 py-3">
              <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onListKey}
                placeholder="Search cases or jump to a section…"
                className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                aria-label="Command palette search"
              />
              <kbd className="hidden sm:inline rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                Esc
              </kbd>
            </div>

            <div
              ref={listRef}
              className="max-h-[55vh] overflow-y-auto py-1.5"
              role="listbox"
            >
              {results.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-500">
                  No matches for <span className="text-slate-300">&ldquo;{query}&rdquo;</span>
                </div>
              ) : (
                results.map((c, i) => {
                  const active = i === highlight;
                  return (
                    <button
                      key={c.id}
                      data-cmd-idx={i}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => run(c)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        active ? "bg-primary-500/15 text-white" : "text-slate-300 hover:bg-slate-800/50"
                      }`}
                    >
                      <span className="text-base shrink-0" aria-hidden>{c.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm truncate">{c.label}</div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {c.type === "nav" ? c.hint : `${c.hint} · ${c.caseId}`}
                        </div>
                      </div>
                      {active && (
                        <kbd className="hidden sm:inline rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-slate-700/50 px-4 py-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-3">
                <span><kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono">↑↓</kbd> navigate</span>
                <span className="hidden sm:inline"><kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono">↵</kbd> open</span>
              </div>
              <span>{results.length} match{results.length === 1 ? "" : "es"}</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
