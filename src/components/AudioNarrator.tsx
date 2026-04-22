"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

interface AudioNarratorProps {
  title: string;
  presentation: string;
  photoDescription?: string;
}

type Status = "idle" | "playing" | "paused";

/** Split a blob of text into sentence-ish chunks for highlighting. */
function splitSentences(text: string): string[] {
  if (!text) return [];
  const parts = text.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g);
  return (parts || [text]).map((s) => s.trim()).filter(Boolean);
}

export default function AudioNarrator({
  title,
  presentation,
  photoDescription,
}: AudioNarratorProps) {
  // Hooks at the top — never below an early return.
  const [supported, setSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [currentIdx, setCurrentIdx] = useState(-1);

  const sentences = useMemo(() => {
    const chunks: string[] = [];
    if (title) chunks.push(title + ".");
    const pres = splitSentences(presentation);
    chunks.push(...pres);
    if (photoDescription && photoDescription.trim()) {
      const pd = splitSentences(photoDescription);
      chunks.push(...pd);
    }
    return chunks;
  }, [title, presentation, photoDescription]);

  // Detect support on mount (client only) — avoids SSR / hydration issues.
  useEffect(() => {
    if (typeof window === "undefined") {
      setSupported(false);
      return;
    }
    setSupported(typeof window.speechSynthesis !== "undefined");
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setStatus("idle");
    setCurrentIdx(-1);
  }, []);

  // Stop narration when the component unmounts (user navigates away).
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakFrom = useCallback(
    (startIdx: number) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      const synth = window.speechSynthesis;
      synth.cancel();

      let i = startIdx;
      const speakNext = () => {
        if (i >= sentences.length) {
          setStatus("idle");
          setCurrentIdx(-1);
          return;
        }
        const u = new SpeechSynthesisUtterance(sentences[i]);
        u.rate = 1.0;
        u.pitch = 1.0;
        const idx = i;
        u.onstart = () => setCurrentIdx(idx);
        u.onend = () => {
          i += 1;
          speakNext();
        };
        u.onerror = () => {
          setStatus("idle");
          setCurrentIdx(-1);
        };
        synth.speak(u);
      };

      setStatus("playing");
      speakNext();
    },
    [sentences]
  );

  const play = useCallback(() => {
    if (status === "paused" && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setStatus("playing");
      return;
    }
    speakFrom(0);
  }, [status, speakFrom]);

  const pause = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.pause();
    setStatus("paused");
  }, []);

  if (supported === null) {
    // First render (pre-effect) — render nothing to avoid hydration mismatch
    return null;
  }

  if (!supported) {
    return (
      <p className="text-xs text-slate-500 italic">
        Audio not supported in this browser.
      </p>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base" aria-hidden>
          🔊
        </span>
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Narrate case
        </p>
        <span className="ml-auto text-[10px] text-slate-500">
          {status === "playing"
            ? `Reading ${currentIdx + 1}/${sentences.length}`
            : status === "paused"
              ? "Paused"
              : `${sentences.length} segments`}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {status !== "playing" ? (
          <button
            onClick={play}
            className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors"
          >
            {status === "paused" ? "Resume" : "Play"}
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
          >
            Pause
          </button>
        )}
        <button
          onClick={stop}
          disabled={status === "idle"}
          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
        >
          Stop
        </button>
      </div>

      <div className="max-h-32 overflow-y-auto text-xs text-slate-400 leading-relaxed bg-slate-900/40 rounded-md p-2">
        {sentences.map((s, i) => (
          <span
            key={i}
            className={
              i === currentIdx
                ? "bg-primary-500/25 text-white rounded px-0.5"
                : undefined
            }
          >
            {s}{" "}
          </span>
        ))}
      </div>
    </div>
  );
}
