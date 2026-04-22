"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { CRAM_CONTENT, SUBSPECIALTY_TABS, CramSection, CramItem } from "@/lib/cram-content";
import { FATAL_FLAWS, FatalFlaw, FatalFlawSubspecialty } from "@/lib/fatal-flaws";
import ExportToPdfButton from "@/components/PDFExporter";

interface CramSheetProps {
  onBack: () => void;
}

const FATAL_FLAW_SUBSPECIALTY_MAP: Record<string, FatalFlawSubspecialty[]> = {
  anterior: ["Anterior Segment"],
  posterior: ["Posterior Segment"],
  neuro: ["Neuro-Ophthalmology and Orbit"],
  pediatric: ["Pediatric Ophthalmology"],
  optics: ["Optics"],
  general: ["General", "Anterior Segment", "Posterior Segment", "Neuro-Ophthalmology and Orbit", "Pediatric Ophthalmology", "Optics"],
};

// Tailwind accent colors per subspecialty (keeps design consistent with home cards)
const TAB_ACCENT: Record<string, { dot: string; ring: string; text: string }> = {
  anterior: { dot: "bg-cyan-400", ring: "ring-cyan-500/40", text: "text-cyan-300" },
  posterior: { dot: "bg-violet-400", ring: "ring-violet-500/40", text: "text-violet-300" },
  neuro: { dot: "bg-amber-400", ring: "ring-amber-500/40", text: "text-amber-300" },
  pediatric: { dot: "bg-emerald-400", ring: "ring-emerald-500/40", text: "text-emerald-300" },
  optics: { dot: "bg-rose-400", ring: "ring-rose-500/40", text: "text-rose-300" },
  general: { dot: "bg-fuchsia-400", ring: "ring-fuchsia-500/40", text: "text-fuchsia-300" },
};

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  try {
    const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
    const parts = text.split(re);
    return parts.map((part, i) =>
      re.test(part) ? (
        <mark key={i} className="bg-amber-400/30 text-amber-100 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  } catch {
    return text;
  }
}

function itemMatches(item: CramItem, q: string): boolean {
  if (!q.trim()) return true;
  const hay = `${item.label || ""} ${item.content} ${item.subtext || ""}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

function flawMatches(flaw: FatalFlaw, q: string): boolean {
  if (!q.trim()) return true;
  const hay = `${flaw.scenario} ${flaw.mustNotMiss} ${flaw.whyCritical} ${flaw.immediateAction}`.toLowerCase();
  return hay.includes(q.toLowerCase());
}

type SectionKey = "presentations" | "fatal" | "killer" | "trials" | "pearls" | "pharm";

function SectionCard({
  id,
  title,
  accentText,
  count,
  children,
  expanded,
  onToggle,
}: {
  id: string;
  title: string;
  accentText: string;
  count: number;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <section id={id} className="glass-card rounded-xl mb-4 overflow-hidden cram-section">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-800/40 transition-colors cram-section-header"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <h3 className={`text-sm font-semibold ${accentText} uppercase tracking-wider`}>{title}</h3>
          <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && <div className="border-t border-slate-800/80 px-4 py-4 cram-section-body">{children}</div>}
    </section>
  );
}

function ItemRow({ item, query }: { item: CramItem; query: string }) {
  return (
    <div className="py-2 border-b border-slate-800/50 last:border-0 text-sm">
      {item.label && (
        <p className="text-slate-400 leading-snug mb-0.5">{highlight(item.label, query)}</p>
      )}
      <p className="text-white font-medium leading-snug">
        {item.label ? "→ " : ""}
        {highlight(item.content, query)}
      </p>
      {item.subtext && (
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{highlight(item.subtext, query)}</p>
      )}
    </div>
  );
}

function FatalFlawRow({ flaw, query }: { flaw: FatalFlaw; query: string }) {
  return (
    <div className="py-2 border-b border-slate-800/50 last:border-0 text-sm">
      <p className="text-amber-300 font-semibold text-xs uppercase tracking-wide mb-0.5">
        {highlight(flaw.mustNotMiss, query)}
      </p>
      <p className="text-slate-400 text-xs leading-snug">
        <span className="text-slate-500">Scenario: </span>
        {highlight(flaw.scenario, query)}
      </p>
      <p className="text-white text-xs leading-snug mt-1">
        <span className="text-slate-500">Action: </span>
        {highlight(flaw.immediateAction, query)}
      </p>
    </div>
  );
}

export default function CramSheet({ onBack }: CramSheetProps) {
  const [activeTab, setActiveTab] = useState<string>("anterior");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    presentations: true,
    fatal: true,
    killer: true,
    trials: true,
    pearls: true,
    pharm: true,
  });
  const [tocOpen, setTocOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const activeSpec = useMemo(
    () => CRAM_CONTENT.find((s) => s.id === activeTab) || CRAM_CONTENT[0],
    [activeTab]
  );

  const fatalFlaws = useMemo(() => {
    const targets = FATAL_FLAW_SUBSPECIALTY_MAP[activeTab] || [];
    return FATAL_FLAWS.filter((f) => targets.includes(f.subspecialty));
  }, [activeTab]);

  const filtered = useMemo(() => {
    const q = query.trim();
    const filterSection = (s: CramSection): CramSection => ({
      ...s,
      items: s.items.filter((i) => itemMatches(i, q)),
    });
    return {
      presentations: filterSection(activeSpec.classicPresentations),
      killer: filterSection(activeSpec.killerDiagnoses),
      trials: filterSection(activeSpec.keyTrials),
      pearls: filterSection(activeSpec.pearls),
      pharm: filterSection(activeSpec.pharmacology),
      fatal: fatalFlaws.filter((f) => flawMatches(f, q)),
    };
  }, [activeSpec, fatalFlaws, query]);

  const handlePrint = useCallback(() => {
    if (typeof window !== "undefined") window.print();
  }, []);

  const toggleSection = useCallback((k: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [k]: !prev[k] }));
  }, []);

  const expandAll = useCallback(() => {
    setExpanded({
      presentations: true,
      fatal: true,
      killer: true,
      trials: true,
      pearls: true,
      pharm: true,
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isTyping) return;
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        handlePrint();
        return;
      }
      const num = parseInt(e.key, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= SUBSPECIALTY_TABS.length) {
        setActiveTab(SUBSPECIALTY_TABS[num - 1].id);
        if (contentRef.current) contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlePrint]);

  const accent = TAB_ACCENT[activeSpec.id] || TAB_ACCENT.general;

  return (
    <div className="min-h-screen cram-root">
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5in;
            size: letter;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .cram-no-print,
          header,
          nav {
            display: none !important;
          }
          .cram-root {
            background: white !important;
            color: black !important;
          }
          .cram-section,
          .glass-card {
            background: white !important;
            box-shadow: none !important;
            border: 1px solid #d4d4d8 !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .cram-section-body {
            display: block !important;
          }
          .cram-print-all .cram-section-body {
            display: block !important;
          }
          h1, h2, h3, h4, p, span, mark {
            color: black !important;
          }
          mark {
            background: #fef08a !important;
          }
          .cram-tab-bar {
            display: none !important;
          }
          .cram-print-block {
            display: block !important;
          }
          .cram-print-block + .cram-print-block {
            page-break-before: auto;
          }
        }
      `}</style>

      {/* Header */}
      <header className="cram-no-print glass-card sticky top-0 z-50 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Home</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>📝</span>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">Cram Sheet</h1>
            <span className="hidden sm:inline text-[10px] text-slate-500 uppercase tracking-[0.2em]">
              2am Reference
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-xs font-medium transition-colors"
              title="Expand all sections"
            >
              Expand all
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              title="Print (P)"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zM9 9V5a2 2 0 012-2h2a2 2 0 012 2v4" />
              </svg>
              Print
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="cram-tab-bar border-t border-slate-800/80 bg-slate-900/60">
          <div className="max-w-7xl mx-auto px-2 py-2 flex gap-1 overflow-x-auto">
            {SUBSPECIALTY_TABS.map((t, i) => {
              const acc = TAB_ACCENT[t.id] || TAB_ACCENT.general;
              const active = t.id === activeTab;
              return (
                <div key={t.id} className="shrink-0 flex items-center gap-1">
                  <button
                    onClick={() => setActiveTab(t.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-2 ${
                      active
                        ? `bg-slate-800 text-white ring-1 ${acc.ring}`
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${acc.dot}`} />
                    <span>{t.name}</span>
                    <span className="text-[10px] text-slate-500">{i + 1}</span>
                  </button>
                  {active && (
                    <ExportToPdfButton subspecialtyId={t.id} label="PDF" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main body */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-5 flex gap-5">
        {/* TOC sidebar */}
        <aside className="cram-no-print hidden lg:block w-56 shrink-0">
          <div className="sticky top-32">
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-medium mb-3 px-2">
              On this page
            </p>
            <nav className="flex flex-col gap-0.5 text-sm">
              {[
                { k: "presentations" as SectionKey, label: "Classic Presentations", id: "presentations" },
                { k: "fatal" as SectionKey, label: "Fatal Flaws", id: "fatal" },
                { k: "killer" as SectionKey, label: "Killer Diagnoses", id: "killer" },
                { k: "trials" as SectionKey, label: "Key Trials", id: "trials" },
                { k: "pearls" as SectionKey, label: "High-Yield Pearls", id: "pearls" },
                { k: "pharm" as SectionKey, label: "Pharmacology", id: "pharm" },
              ].map((link) => (
                <a
                  key={link.id}
                  href={`#${link.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById(link.id);
                    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    setExpanded((prev) => ({ ...prev, [link.k]: true }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ${accent.text}`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-6 px-3 py-3 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-500 leading-relaxed">
              <p className="font-semibold text-slate-400 mb-1">Shortcuts</p>
              <p>
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">1–6</kbd> switch tab
              </p>
              <p className="mt-0.5">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">P</kbd> print
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile TOC toggle */}
        <div className="cram-no-print lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setTocOpen((v) => !v)}
            className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 text-white shadow-lg flex items-center justify-center"
            aria-label="Toggle table of contents"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {tocOpen && (
          <div className="cram-no-print lg:hidden fixed bottom-20 right-4 z-40 glass-card rounded-xl p-3 w-60 shadow-xl">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Jump to</p>
            <div className="flex flex-col gap-0.5 text-sm">
              {["presentations", "fatal", "killer", "trials", "pearls", "pharm"].map((id) => (
                <a
                  key={id}
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                    setTocOpen(false);
                  }}
                  className="px-2 py-1.5 rounded text-slate-300 hover:bg-slate-800"
                >
                  {id[0].toUpperCase() + id.slice(1)}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <main ref={contentRef} className="flex-1 min-w-0">
          {/* Search + subspecialty title */}
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cram-no-print">
            <h2 className={`text-xl sm:text-2xl font-bold text-white tracking-tight`}>
              <span className={`inline-block w-2 h-2 rounded-full ${accent.dot} mr-2 align-middle`} />
              {activeSpec.name}
            </h2>
            <div className="relative w-full sm:max-w-xs">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter this subspecialty..."
                className="w-full px-3.5 py-2 pl-9 rounded-lg bg-slate-900/80 border border-slate-700/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <svg
                className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-0 top-0 p-2.5 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
                  aria-label="Clear filter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Print header (only visible when printing) */}
          <div className="hidden cram-print-block mb-3">
            <h1 className="text-2xl font-bold">Ophthalmology Cram Sheet — {activeSpec.name}</h1>
            <p className="text-xs text-slate-600">Board-focused high-yield reference. For study use only.</p>
          </div>

          {/* Classic Presentations */}
          <SectionCard
            id="presentations"
            title={activeSpec.classicPresentations.title}
            accentText={accent.text}
            count={filtered.presentations.items.length}
            expanded={expanded.presentations}
            onToggle={() => toggleSection("presentations")}
          >
            {filtered.presentations.items.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No matches.</p>
            ) : (
              filtered.presentations.items.map((item, i) => <ItemRow key={i} item={item} query={query} />)
            )}
          </SectionCard>

          {/* Fatal Flaws */}
          <SectionCard
            id="fatal"
            title="Fatal Flaws (Must Not Miss)"
            accentText="text-amber-300"
            count={filtered.fatal.length}
            expanded={expanded.fatal}
            onToggle={() => toggleSection("fatal")}
          >
            {filtered.fatal.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No fatal flaws mapped for this subspecialty.</p>
            ) : (
              filtered.fatal.map((f) => <FatalFlawRow key={f.id} flaw={f} query={query} />)
            )}
          </SectionCard>

          {/* Killer Diagnoses */}
          <SectionCard
            id="killer"
            title={activeSpec.killerDiagnoses.title}
            accentText="text-rose-300"
            count={filtered.killer.items.length}
            expanded={expanded.killer}
            onToggle={() => toggleSection("killer")}
          >
            {filtered.killer.items.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No matches.</p>
            ) : (
              filtered.killer.items.map((item, i) => <ItemRow key={i} item={item} query={query} />)
            )}
          </SectionCard>

          {/* Key Trials */}
          <SectionCard
            id="trials"
            title={activeSpec.keyTrials.title}
            accentText="text-emerald-300"
            count={filtered.trials.items.length}
            expanded={expanded.trials}
            onToggle={() => toggleSection("trials")}
          >
            {filtered.trials.items.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No matches.</p>
            ) : (
              filtered.trials.items.map((item, i) => <ItemRow key={i} item={item} query={query} />)
            )}
          </SectionCard>

          {/* Pearls */}
          <SectionCard
            id="pearls"
            title={activeSpec.pearls.title}
            accentText="text-primary-300"
            count={filtered.pearls.items.length}
            expanded={expanded.pearls}
            onToggle={() => toggleSection("pearls")}
          >
            {filtered.pearls.items.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No matches.</p>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-x-6">
                {filtered.pearls.items.map((item, i) => (
                  <li key={i} className="py-1.5 text-sm text-slate-200 leading-snug border-b border-slate-800/50 sm:[&:nth-last-child(-n+2)]:border-0">
                    {highlight(item.content, query)}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Pharmacology */}
          <SectionCard
            id="pharm"
            title={activeSpec.pharmacology.title}
            accentText="text-violet-300"
            count={filtered.pharm.items.length}
            expanded={expanded.pharm}
            onToggle={() => toggleSection("pharm")}
          >
            {filtered.pharm.items.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No matches.</p>
            ) : (
              filtered.pharm.items.map((item, i) => <ItemRow key={i} item={item} query={query} />)
            )}
          </SectionCard>

          <p className="text-[11px] text-slate-600 text-center mt-6 cram-no-print">
            Educational reference only. Cross-check with current guidelines before clinical decisions.
          </p>
        </main>
      </div>
    </div>
  );
}
