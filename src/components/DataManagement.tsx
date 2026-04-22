"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { exportUserData, importUserData, clearAllUserData, type ExportBundle } from "@/lib/export";
import { logError } from "@/lib/telemetry";

interface Stats {
  attempts: number;
  bookmarks: number;
  srsCards: number;
  streakDays: number;
}

interface Props {
  onBack: () => void;
}

function getStats(): Stats {
  const bundle = exportUserData();
  return {
    attempts: bundle.attempts.length,
    bookmarks: bundle.bookmarks.length,
    srsCards: Object.keys(bundle.srs).length,
    streakDays: bundle.streak.current,
  };
}

export default function DataManagement({ onBack }: Props) {
  const [stats, setStats] = useState<Stats>({ attempts: 0, bookmarks: 0, srsCards: 0, streakDays: 0 });
  const [banner, setBanner] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingImport, setPendingImport] = useState<ExportBundle | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshStats = useCallback(() => {
    try {
      setStats(getStats());
    } catch (err) {
      logError(err, { where: "DataManagement.refreshStats" });
    }
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleExport = () => {
    try {
      const bundle = exportUserData();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `ophthoboard-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setBanner({ kind: "ok", text: "Progress exported." });
    } catch (err) {
      logError(err, { where: "DataManagement.handleExport" });
      setBanner({ kind: "err", text: "Export failed." });
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        setPendingImport(parsed as ExportBundle);
        setBanner(null);
      } catch (err) {
        logError(err, { where: "DataManagement.parseImport" });
        setBanner({ kind: "err", text: "That file isn't valid JSON." });
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    const result = importUserData(pendingImport);
    if (result.success) {
      setBanner({ kind: "ok", text: result.message });
      refreshStats();
    } else {
      setBanner({ kind: "err", text: result.message });
    }
    setPendingImport(null);
  };

  const handleReset = () => {
    clearAllUserData();
    setConfirmReset(false);
    setBanner({ kind: "ok", text: "All local data cleared." });
    refreshStats();
  };

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="text-sm text-slate-400 hover:text-white mb-6 inline-flex items-center gap-1"
      >
        <span aria-hidden>&larr;</span> Back
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">Settings &amp; Data</h1>
      <p className="text-sm text-slate-400 mb-8">
        Back up your progress, restore from a previous export, or reset the app.
      </p>

      {banner && (
        <div
          role="status"
          className={`mb-6 text-sm rounded-xl px-4 py-3 border ${
            banner.kind === "ok"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {banner.text}
        </div>
      )}

      <section className="glass-card rounded-xl p-5 mb-6">
        <h2 className="text-xs uppercase tracking-[0.2em] text-slate-500 font-medium mb-4">Your data</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Attempts", value: stats.attempts },
            { label: "Bookmarks", value: stats.bookmarks },
            { label: "SRS cards", value: stats.srsCards },
            { label: "Streak (days)", value: stats.streakDays },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800/40 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-1">Export</h2>
        <p className="text-xs text-slate-400 mb-3">
          Download a JSON backup of all attempts, bookmarks, SRS scheduling, and streak.
        </p>
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
        >
          Export my progress
        </button>
      </section>

      <section className="glass-card rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-1">Import</h2>
        <p className="text-xs text-slate-400 mb-3">
          Restore from a previously exported backup. This replaces your current data.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFileSelected}
          className="block text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 file:cursor-pointer"
        />
        {pendingImport && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-xs text-amber-300 mb-2">
              Ready to import {pendingImport.attempts?.length ?? 0} attempts,{" "}
              {pendingImport.bookmarks?.length ?? 0} bookmarks,{" "}
              {pendingImport.srs ? Object.keys(pendingImport.srs).length : 0} SRS cards.
              This will replace your current progress.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmImport}
                className="px-3 py-1.5 text-xs rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium"
              >
                Replace my data
              </button>
              <button
                onClick={() => setPendingImport(null)}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="glass-card rounded-xl p-5 mb-6 border border-rose-500/20">
        <h2 className="text-sm font-semibold text-white mb-1">Reset all data</h2>
        <p className="text-xs text-slate-400 mb-3">
          Permanently clears attempts, bookmarks, streak, and SRS scheduling. This cannot be undone.
        </p>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-sm font-medium transition-colors"
          >
            Reset all data
          </button>
        ) : (
          <div className="flex gap-2 items-center">
            <span className="text-xs text-rose-300">Are you sure?</span>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium"
            >
              Yes, delete everything
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
