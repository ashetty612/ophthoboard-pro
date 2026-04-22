"use client";

import { useEffect } from "react";

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

const GROUPS: ShortcutGroup[] = [
  {
    title: "Global",
    shortcuts: [
      { keys: ["?"], description: "Show this help overlay" },
      { keys: ["Esc"], description: "Close / back" },
      { keys: ["/"], description: "Focus search" },
      { keys: ["g", "h"], description: "Go home" },
      { keys: ["g", "r"], description: "Go to Review" },
      { keys: ["g", "e"], description: "Go to Exam" },
      { keys: ["g", "a"], description: "Go to AI Examiner" },
      { keys: ["g", "d"], description: "Go to Dashboard" },
      { keys: ["g", "c"], description: "Go to Cram Sheet" },
      { keys: ["g", "f"], description: "Go to Flashcards" },
      { keys: ["g", "p"], description: "Go to Practice Patterns" },
      { keys: ["g", "w"], description: "Go to Weakness Quiz" },
      { keys: ["g", "t"], description: "Go to Due Today" },
    ],
  },
  {
    title: "Case Viewer",
    shortcuts: [
      { keys: ["→"], description: "Submit / next" },
      { keys: ["Enter"], description: "Submit / next" },
      { keys: ["b"], description: "Bookmark" },
      { keys: ["t"], description: "Toggle teaching" },
      { keys: ["p"], description: "Toggle pitfalls" },
    ],
  },
  {
    title: "Flashcards",
    shortcuts: [
      { keys: ["Space"], description: "Flip card" },
      { keys: ["→"], description: "Next" },
      { keys: ["←"], description: "Previous" },
      { keys: ["1"], description: "Hard" },
      { keys: ["2"], description: "Medium" },
      { keys: ["3"], description: "Easy" },
    ],
  },
  {
    title: "Rapid Fire",
    shortcuts: [
      { keys: ["Space"], description: "Reveal answer" },
      { keys: ["←"], description: "Previous" },
      { keys: ["1"], description: "Rate hard" },
      { keys: ["2"], description: "Rate medium" },
      { keys: ["3"], description: "Rate easy" },
    ],
  },
  {
    title: "Cram Sheet",
    shortcuts: [
      { keys: ["p"], description: "Print" },
      { keys: ["1"], description: "Tab 1" },
      { keys: ["2"], description: "Tab 2" },
      { keys: ["3"], description: "Tab 3" },
      { keys: ["4"], description: "Tab 4" },
      { keys: ["5"], description: "Tab 5" },
      { keys: ["6"], description: "Tab 6" },
    ],
  },
  {
    title: "Exam Mode",
    shortcuts: [{ keys: ["Esc"], description: "Pause" }],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-xs font-mono text-slate-200 shadow-sm">
      {children}
    </kbd>
  );
}

export default function KeyboardShortcutsOverlay({
  open,
  onClose,
}: KeyboardShortcutsOverlayProps) {
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="glass-card rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-slate-700/60 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm">
          <div>
            <h2 className="text-base font-semibold text-white">
              Keyboard Shortcuts
            </h2>
            <p className="text-[11px] text-slate-500 uppercase tracking-[0.2em] mt-0.5">
              Press <span className="text-slate-300">?</span> anytime
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800/60"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 grid sm:grid-cols-2 gap-x-8 gap-y-6">
          {GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="text-[11px] text-primary-400/80 uppercase tracking-[0.2em] font-medium mb-3">
                {group.title}
              </h3>
              <ul className="space-y-2">
                {group.shortcuts.map((sc, i) => (
                  <li
                    key={`${group.title}-${i}`}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span className="text-slate-400">{sc.description}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      {sc.keys.map((k, j) => (
                        <span key={j} className="flex items-center gap-1">
                          {j > 0 && (
                            <span className="text-slate-600 text-xs">then</span>
                          )}
                          <Kbd>{k}</Kbd>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="px-6 py-3 border-t border-slate-800/80 text-[11px] text-slate-600">
          Tip: press <Kbd>g</Kbd> then a letter within 1.5s to navigate.
        </div>
      </div>
    </div>
  );
}
