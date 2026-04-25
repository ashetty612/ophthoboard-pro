"use client";

import CVBLogo from "./CVBLogo";

/**
 * Loading skeleton that mirrors the homepage layout while the
 * cases-database JSON (~6 MB) is being fetched. Replaces the older
 * "centered eye + progress bar" loader so the user sees the SHAPE
 * of the page filling in rather than a blank stretch followed by
 * a sudden full render.
 *
 * Uses pure CSS pulses (no framer-motion) so it ships in the
 * pre-hydration HTML and starts pulsing immediately. Sized to match
 * the real Hero + stats row + subspecialty grid below the fold.
 */
function Block({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-md bg-slate-800/40 animate-pulse ${className}`}
      style={style}
      aria-hidden
    />
  );
}

export default function HomeSkeleton() {
  return (
    <div className="min-h-screen" role="status" aria-label="Loading the case library">
      {/* Header skeleton */}
      <header className="border-b border-slate-800/80 sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <CVBLogo size={36} />
            <div className="min-w-0 hidden xs:block">
              <Block className="h-4 w-32 mb-1.5" />
              <Block className="h-2 w-44" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Block className="h-9 w-12 rounded-lg" />
            <Block className="h-9 w-12 rounded-lg" />
            <Block className="h-9 w-12 rounded-lg" />
            <Block className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Continue / Due Today / Weakest / Rapid-Fire row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
              <Block className="h-2.5 w-16 mb-2" />
              <Block className="h-4 w-full" />
            </div>
          ))}
        </div>

        {/* Hero */}
        <div className="flex flex-col items-center text-center pt-2 pb-12">
          <Block className="h-5 w-72 rounded-full mb-4" />
          <div className="mb-6">
            <CVBLogo size={64} />
          </div>
          <Block className="h-12 sm:h-16 w-full max-w-xl mb-4" />
          <Block className="h-4 w-full max-w-md mb-2" />
          <Block className="h-4 w-3/4 max-w-md mb-8" />
          <div className="flex gap-3">
            <Block className="h-12 w-32 rounded-xl" />
            <Block className="h-12 w-40 rounded-xl" />
          </div>
        </div>

        {/* Stats row (Cases / AI / Heatmap / Pace) */}
        <div className="flex flex-wrap justify-center gap-6 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Block className="h-8 w-12 mx-auto mb-2" />
              <Block className="h-2.5 w-20" />
            </div>
          ))}
        </div>

        {/* Subspecialty browser cards */}
        <Block className="h-3 w-32 mb-3" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4">
              <div className="flex items-start gap-3">
                <Block className="h-10 w-10 rounded-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <Block className="h-4 w-3/4 mb-2" />
                  <Block className="h-3 w-full mb-1" />
                  <Block className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Study modes grid (just a hint of structure) */}
        <Block className="h-3 w-28 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3.5 min-h-[88px]">
              <Block className="h-7 w-7 rounded-md mb-2" />
              <Block className="h-3 w-2/3 mb-1.5" />
              <Block className="h-2 w-full" />
            </div>
          ))}
        </div>
      </main>

      <span className="sr-only">Loading 432 ophthalmology cases…</span>
    </div>
  );
}
