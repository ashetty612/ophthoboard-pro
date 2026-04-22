"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createFlashcard,
  deleteFlashcard,
  getAllFlashcards,
  srsIdFor,
  updateFlashcard,
  type UserFlashcard,
} from "@/lib/user-flashcards";
import { getSrsCard, rateCase, type Rating } from "@/lib/srs";

interface UserFlashcardsProps {
  onBack: () => void;
}

type Mode = "list" | "edit" | "study";

const SUBSPECIALTY_TAG_SUGGESTIONS = [
  "Anterior Segment",
  "Posterior Segment",
  "Neuro-Ophthalmology",
  "Pediatric",
  "Optics",
  "Uveitis",
  "Cornea",
  "Glaucoma",
  "Retina",
];

function isDue(cardId: string): boolean {
  const srs = getSrsCard(srsIdFor(cardId));
  if (!srs) return true; // Never reviewed — counts as due
  const now = new Date();
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return new Date(srs.dueDate).getTime() <= cutoff + 24 * 60 * 60 * 1000 - 1;
}

export default function UserFlashcards({ onBack }: UserFlashcardsProps) {
  const [cards, setCards] = useState<UserFlashcard[]>([]);
  const [mode, setMode] = useState<Mode>("list");
  const [editing, setEditing] = useState<UserFlashcard | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [filterTag, setFilterTag] = useState<string>("");

  // Study-mode state
  const [studyQueue, setStudyQueue] = useState<UserFlashcard[]>([]);
  const [studyIdx, setStudyIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Load cards on mount (client-only, SSR-safe).
  useEffect(() => {
    setCards(getAllFlashcards());
  }, []);

  const refresh = useCallback(() => {
    setCards(getAllFlashcards());
  }, []);

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [cards]);

  const visibleCards = useMemo(() => {
    if (!filterTag) return cards;
    return cards.filter((c) => c.tags.includes(filterTag));
  }, [cards, filterTag]);

  const dueCount = useMemo(
    () => cards.filter((c) => isDue(c.id)).length,
    [cards]
  );

  const resetForm = useCallback(() => {
    setEditing(null);
    setFront("");
    setBack("");
    setImageUrl("");
    setTagsInput("");
  }, []);

  const openNew = useCallback(() => {
    resetForm();
    setMode("edit");
  }, [resetForm]);

  const openEdit = useCallback((card: UserFlashcard) => {
    setEditing(card);
    setFront(card.front);
    setBack(card.back);
    setImageUrl(card.imageUrl || "");
    setTagsInput(card.tags.join(", "));
    setMode("edit");
  }, []);

  const handleSave = useCallback(() => {
    const trimmedFront = front.trim();
    const trimmedBack = back.trim();
    if (!trimmedFront || !trimmedBack) return;
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const imageUrlClean = imageUrl.trim() || undefined;

    if (editing) {
      updateFlashcard({
        ...editing,
        front: trimmedFront,
        back: trimmedBack,
        imageUrl: imageUrlClean,
        tags,
      });
    } else {
      createFlashcard({
        front: trimmedFront,
        back: trimmedBack,
        imageUrl: imageUrlClean,
        tags,
      });
    }
    refresh();
    resetForm();
    setMode("list");
  }, [front, back, imageUrl, tagsInput, editing, refresh, resetForm]);

  const handleDelete = useCallback(
    (id: string) => {
      if (typeof window !== "undefined" && !window.confirm("Delete this flashcard?")) return;
      deleteFlashcard(id);
      refresh();
    },
    [refresh]
  );

  const startStudy = useCallback(
    (source: UserFlashcard[]) => {
      const dueFirst = source.filter((c) => isDue(c.id));
      const queue = dueFirst.length > 0 ? dueFirst : source;
      if (queue.length === 0) return;
      setStudyQueue(queue);
      setStudyIdx(0);
      setFlipped(false);
      setMode("study");
    },
    []
  );

  const studySingle = useCallback(
    (card: UserFlashcard) => {
      startStudy([card]);
    },
    [startStudy]
  );

  const handleRate = useCallback(
    (rating: Rating) => {
      const card = studyQueue[studyIdx];
      if (!card) return;
      rateCase(srsIdFor(card), rating);
      // Move to next — when done, return to list.
      if (studyIdx + 1 >= studyQueue.length) {
        setMode("list");
        refresh();
      } else {
        setStudyIdx((i) => i + 1);
        setFlipped(false);
      }
    },
    [studyQueue, studyIdx, refresh]
  );

  // --- Render ---

  if (mode === "study") {
    const card = studyQueue[studyIdx];
    return (
      <div className="min-h-screen">
        <header className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setMode("list")}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </button>
            <h1 className="text-sm font-bold text-white">
              My Flashcards — Study
            </h1>
            <span className="text-xs text-slate-400">
              {studyIdx + 1} / {studyQueue.length}
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          {card && (
            <div
              onClick={() => setFlipped((f) => !f)}
              className="glass-card rounded-2xl p-8 min-h-[320px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-500/40 transition-colors"
            >
              {card.imageUrl && !flipped && (
                <img
                  src={card.imageUrl}
                  alt=""
                  className="max-h-40 mb-4 rounded-lg object-contain opacity-90"
                />
              )}
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-3">
                {flipped ? "Back" : "Front"}
              </p>
              <p className="text-xl text-white leading-relaxed whitespace-pre-wrap">
                {flipped ? card.back : card.front}
              </p>
              {!flipped && (
                <p className="text-xs text-slate-500 mt-6">Click to flip</p>
              )}
              {card.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {card.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {flipped && (
            <div className="grid grid-cols-4 gap-2 mt-6">
              {([
                { r: "again" as Rating, label: "Again", color: "bg-rose-600 hover:bg-rose-500" },
                { r: "hard" as Rating, label: "Hard", color: "bg-amber-600 hover:bg-amber-500" },
                { r: "good" as Rating, label: "Good", color: "bg-emerald-600 hover:bg-emerald-500" },
                { r: "easy" as Rating, label: "Easy", color: "bg-primary-600 hover:bg-primary-500" },
              ]).map((b) => (
                <button
                  key={b.r}
                  onClick={() => handleRate(b.r)}
                  className={`py-3 rounded-lg text-white text-sm font-semibold transition-colors ${b.color}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (mode === "edit") {
    return (
      <div className="min-h-screen">
        <header className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => {
                resetForm();
                setMode("list");
              }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Cancel</span>
            </button>
            <h1 className="text-base font-bold text-white">
              {editing ? "Edit Flashcard" : "New Flashcard"}
            </h1>
            <div className="w-16" />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Front
              </label>
              <textarea
                value={front}
                onChange={(e) => setFront(e.target.value)}
                rows={3}
                placeholder="e.g. Most common intraocular tumor in adults?"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Back
              </label>
              <textarea
                value={back}
                onChange={(e) => setBack(e.target.value)}
                rows={4}
                placeholder="e.g. Choroidal melanoma (not metastasis for primary)"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Image URL (optional)
              </label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                Tags (comma-separated)
              </label>
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Retina, Trials"
                className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-700/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUBSPECIALTY_TAG_SUGGESTIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      const current = tagsInput
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean);
                      if (current.includes(t)) return;
                      setTagsInput(
                        current.length === 0 ? t : `${tagsInput.replace(/,\s*$/, "")}, ${t}`
                      );
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 hover:bg-slate-600 text-slate-300"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={!front.trim() || !back.trim()}
                className="flex-1 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
              >
                {editing ? "Save Changes" : "Create Card"}
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setMode("list");
                }}
                className="px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // mode === "list"
  return (
    <div className="min-h-screen">
      <header className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
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
            <span className="text-xl" aria-hidden>📇</span>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              My Flashcards
            </h1>
          </div>
          <button
            onClick={openNew}
            className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold transition-colors"
          >
            + New Card
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {cards.length} card{cards.length === 1 ? "" : "s"}
            </span>
            {dueCount > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                {dueCount} due
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {uniqueTags.length > 0 && (
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/50 text-slate-300"
              >
                <option value="">All tags</option>
                {uniqueTags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
            <button
              onClick={() => startStudy(visibleCards)}
              disabled={visibleCards.length === 0}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
            >
              Study with SRS
            </button>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3" aria-hidden>📇</p>
            <h2 className="text-lg font-bold text-white mb-2">No flashcards yet</h2>
            <p className="text-sm text-slate-400 mb-5 max-w-md mx-auto">
              Create your own flashcards to study high-yield concepts. Your cards
              integrate with the spaced-repetition scheduler.
            </p>
            <button
              onClick={openNew}
              className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold transition-colors"
            >
              + Create your first card
            </button>
          </div>
        ) : visibleCards.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            No cards match the selected tag.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visibleCards.map((card) => {
              const due = isDue(card.id);
              return (
                <div
                  key={card.id}
                  className="glass-card rounded-xl p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white line-clamp-3">
                      {card.front}
                    </p>
                    {due && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 shrink-0">
                        Due
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-3">{card.back}</p>
                  {card.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => studySingle(card)}
                      className="flex-1 px-2 py-1.5 rounded-md bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                    >
                      Study with SRS
                    </button>
                    <button
                      onClick={() => openEdit(card)}
                      className="px-2 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-xs transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      className="px-2 py-1.5 rounded-md bg-rose-700/80 hover:bg-rose-600 text-white text-xs transition-colors"
                      aria-label="Delete flashcard"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
