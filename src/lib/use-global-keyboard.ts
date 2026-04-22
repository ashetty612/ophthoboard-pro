"use client";

import { useEffect, useRef } from "react";

export type GlobalView =
  | "home"
  | "review"
  | "exam"
  | "ai-examiner"
  | "dashboard"
  | "cram"
  | "flashcards"
  | "ppp"
  | "weakness-quiz"
  | "due-today";

const CHORD_MAP: Record<string, GlobalView> = {
  h: "home",
  r: "review",
  e: "exam",
  a: "ai-examiner",
  d: "dashboard",
  c: "cram",
  f: "flashcards",
  p: "ppp",
  w: "weakness-quiz",
  t: "due-today",
};

const CHORD_TIMEOUT_MS = 1500;

interface UseGlobalKeyboardOptions {
  onShowHelp: () => void;
  onNavigate: (view: GlobalView) => void;
  enabled?: boolean;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useGlobalKeyboard({
  onShowHelp,
  onNavigate,
  enabled = true,
}: UseGlobalKeyboardOptions): void {
  const chordActiveRef = useRef(false);
  const chordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onShowHelpRef = useRef(onShowHelp);
  const onNavigateRef = useRef(onNavigate);

  useEffect(() => {
    onShowHelpRef.current = onShowHelp;
    onNavigateRef.current = onNavigate;
  }, [onShowHelp, onNavigate]);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const clearChord = () => {
      chordActiveRef.current = false;
      if (chordTimerRef.current !== null) {
        clearTimeout(chordTimerRef.current);
        chordTimerRef.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore modifier combos — let browser/OS handle those.
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const editable = isEditableTarget(e.target);

      // Chord mode has priority: if waiting for second key, consume it.
      if (chordActiveRef.current) {
        if (e.key === "Escape") {
          clearChord();
          return;
        }
        const key = e.key.toLowerCase();
        const view = CHORD_MAP[key];
        clearChord();
        if (view) {
          e.preventDefault();
          onNavigateRef.current(view);
        }
        return;
      }

      // Don't trigger global shortcuts while typing in inputs.
      if (editable) return;

      // `?` — show help overlay. Shift+/ produces "?" on US keyboards.
      if (e.key === "?") {
        e.preventDefault();
        onShowHelpRef.current();
        return;
      }

      // `/` — focus search input.
      if (e.key === "/") {
        const searchInput =
          (document.querySelector(
            'input[placeholder*="earch"]'
          ) as HTMLInputElement | null) ||
          (document.querySelector(
            'input[type="text"]'
          ) as HTMLInputElement | null);
        if (searchInput) {
          e.preventDefault();
          searchInput.focus();
          searchInput.select?.();
        }
        return;
      }

      // `g` — start chord mode.
      if (e.key === "g") {
        e.preventDefault();
        chordActiveRef.current = true;
        chordTimerRef.current = setTimeout(clearChord, CHORD_TIMEOUT_MS);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearChord();
    };
  }, [enabled]);
}
