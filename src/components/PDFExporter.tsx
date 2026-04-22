"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CRAM_CONTENT, CramSection, CramItem } from "@/lib/cram-content";
import { FATAL_FLAWS, FatalFlawSubspecialty } from "@/lib/fatal-flaws";

interface ExportToPdfButtonProps {
  subspecialtyId: string;
  label?: string;
  className?: string;
  title?: string;
}

const FATAL_FLAW_SUBSPECIALTY_MAP: Record<string, FatalFlawSubspecialty[]> = {
  anterior: ["Anterior Segment"],
  posterior: ["Posterior Segment"],
  neuro: ["Neuro-Ophthalmology and Orbit"],
  pediatric: ["Pediatric Ophthalmology"],
  optics: ["Optics"],
  general: [
    "General",
    "Anterior Segment",
    "Posterior Segment",
    "Neuro-Ophthalmology and Orbit",
    "Pediatric Ophthalmology",
    "Optics",
  ],
};

function Section({ section }: { section: CramSection }) {
  if (!section.items.length) return null;
  return (
    <section className="pdf-section">
      <h2>{section.title}</h2>
      <ul>
        {section.items.map((item: CramItem, i) => (
          <li key={i}>
            {item.label && <span className="pdf-label">{item.label} → </span>}
            <span className="pdf-content">{item.content}</span>
            {item.subtext && <span className="pdf-subtext"> ({item.subtext})</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ExportToPdfButton({
  subspecialtyId,
  label = "Export PDF",
  className,
  title,
}: ExportToPdfButtonProps) {
  const [printing, setPrinting] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);

  const spec = CRAM_CONTENT.find((s) => s.id === subspecialtyId);

  // Flaws for this subspecialty
  const targets = FATAL_FLAW_SUBSPECIALTY_MAP[subspecialtyId] || [];
  const flaws = FATAL_FLAWS.filter((f) => targets.includes(f.subspecialty));

  // Restore state after the browser's print dialog closes.
  useEffect(() => {
    if (!printing) return;
    if (typeof window === "undefined") return;

    let cancelled = false;
    const handleAfterPrint = () => {
      if (!cancelled) setPrinting(false);
    };
    window.addEventListener("afterprint", handleAfterPrint);

    // Fire print on next tick so the hidden DOM is laid out first.
    const t = window.setTimeout(() => {
      try {
        window.print();
      } catch {
        setPrinting(false);
      }
    }, 50);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printing]);

  const handleClick = useCallback(() => {
    if (!spec) return;
    setPrinting(true);
  }, [spec]);

  if (!spec) return null;

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        title={title || `Export ${spec.name} cram sheet as PDF`}
        aria-label={`Export ${spec.name} cram sheet as PDF`}
        className={
          className ||
          "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800/70 hover:bg-slate-700/80 text-slate-200 text-xs font-medium transition-colors"
        }
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3M4 6h16M6 6v12a2 2 0 002 2h8a2 2 0 002-2V6"
          />
        </svg>
        <span>{label}</span>
      </button>

      {/* Hidden printable view — only rendered while printing, and made
          the sole visible element via @media print rules below. */}
      {printing && (
        <div
          ref={frameRef}
          className="pdf-export-root"
          aria-hidden="true"
          role="document"
        >
          <style jsx global>{`
            @media print {
              @page {
                margin: 0.5in;
                size: letter;
              }
              body > *:not(.pdf-export-root) {
                display: none !important;
              }
              .pdf-export-root {
                display: block !important;
                background: white !important;
                color: black !important;
                position: static !important;
                font-family:
                  "Times New Roman", "Liberation Serif", Georgia, serif;
                font-size: 9.5pt;
                line-height: 1.3;
              }
              .pdf-export-root h1 {
                font-size: 16pt;
                margin: 0 0 4pt;
                color: black;
              }
              .pdf-export-root h2 {
                font-size: 11pt;
                margin: 8pt 0 3pt;
                border-bottom: 1px solid #222;
                padding-bottom: 1pt;
                color: black;
                page-break-after: avoid;
              }
              .pdf-export-root .pdf-meta {
                font-size: 8pt;
                color: #444;
                margin-bottom: 6pt;
              }
              .pdf-export-root ul {
                list-style: none;
                padding: 0;
                margin: 0 0 4pt;
              }
              .pdf-export-root li {
                padding: 1.5pt 0;
                border-bottom: 0.5pt dotted #bbb;
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .pdf-export-root .pdf-label {
                font-weight: 600;
              }
              .pdf-export-root .pdf-content {
                font-weight: 600;
              }
              .pdf-export-root .pdf-subtext {
                font-style: italic;
                color: #333;
              }
              .pdf-export-root .pdf-flaw {
                padding: 2pt 0;
                border-bottom: 0.5pt dotted #bbb;
              }
              .pdf-export-root .pdf-flaw strong {
                text-transform: uppercase;
                font-size: 8.5pt;
              }
              .pdf-section {
                break-inside: avoid-page;
              }
            }
            /* Keep hidden while NOT printing */
            @media screen {
              .pdf-export-root {
                position: fixed;
                left: -99999px;
                top: 0;
                width: 1px;
                height: 1px;
                overflow: hidden;
              }
            }
          `}</style>

          <h1>Ophthalmology Cram Sheet — {spec.name}</h1>
          <p className="pdf-meta">
            Board-focused high-yield reference · Generated{" "}
            {new Date().toLocaleDateString()} · Educational use only
          </p>

          <Section section={spec.classicPresentations} />

          {flaws.length > 0 && (
            <section className="pdf-section">
              <h2>Fatal Flaws (Must Not Miss)</h2>
              <ul>
                {flaws.map((f) => (
                  <li key={f.id} className="pdf-flaw">
                    <strong>{f.mustNotMiss}</strong>
                    <span> — {f.scenario} </span>
                    <span className="pdf-subtext">Action: {f.immediateAction}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Section section={spec.killerDiagnoses} />
          <Section section={spec.keyTrials} />
          <Section section={spec.pearls} />
          <Section section={spec.pharmacology} />
        </div>
      )}
    </>
  );
}
