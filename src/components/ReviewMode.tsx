"use client";

import { useState } from "react";
import { CasesDatabase, CaseData } from "@/lib/types";
import { QUESTION_TYPE_INFO } from "@/lib/pearls";
import { getPearlsForCase } from "@/lib/pearls";

interface ReviewModeProps {
  database: CasesDatabase;
  onBack: () => void;
  onSelectCase: (caseData: CaseData) => void;
}

export default function ReviewMode({ database, onBack, onSelectCase }: ReviewModeProps) {
  const [selectedSpec, setSelectedSpec] = useState(0);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  const spec = database.subspecialties[selectedSpec];
  const activeCases = spec.cases.filter((c) => c.questions.length > 0);
  const currentCase = activeCases[selectedCaseIdx];

  if (!currentCase) return null;

  const pearls = getPearlsForCase(currentCase.subspecialty, currentCase.title);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Home</span>
          </button>
          <h1 className="text-lg font-bold text-white">Quick Review Mode</h1>
          <button
            onClick={() => onSelectCase(currentCase)}
            className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors"
          >
            Practice This Case
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left sidebar - Navigation */}
          <div className="w-64 shrink-0 hidden lg:block">
            {/* Subspecialty selector */}
            <div className="glass-card rounded-xl p-3 mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 px-2">Subspecialty</p>
              {database.subspecialties.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSpec(i);
                    setSelectedCaseIdx(0);
                    setExpandedQ(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                    i === selectedSpec
                      ? "bg-primary-600/20 text-primary-300 font-medium"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                  }`}
                >
                  {s.name}
                  <span className="ml-2 text-xs text-slate-500">
                    ({s.cases.filter((c) => c.questions.length > 0).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Case list */}
            <div className="glass-card rounded-xl p-3 max-h-[60vh] overflow-y-auto">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2 px-2">Cases</p>
              {activeCases.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCaseIdx(i);
                    setExpandedQ(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors mb-1 ${
                    i === selectedCaseIdx
                      ? "bg-primary-600/20 text-primary-300 font-medium"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/30"
                  }`}
                >
                  <span className="text-xs text-slate-500">#{c.caseNumber}</span>{" "}
                  <span className="truncate">{c.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile subspecialty/case selectors */}
            <div className="lg:hidden flex gap-3 mb-4">
              <select
                value={selectedSpec}
                onChange={(e) => {
                  setSelectedSpec(Number(e.target.value));
                  setSelectedCaseIdx(0);
                }}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 text-sm text-slate-300 border border-slate-700/50"
              >
                {database.subspecialties.map((s, i) => (
                  <option key={s.id} value={i}>
                    {s.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedCaseIdx}
                onChange={(e) => setSelectedCaseIdx(Number(e.target.value))}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800/50 text-sm text-slate-300 border border-slate-700/50"
              >
                {activeCases.map((c, i) => (
                  <option key={c.id} value={i}>
                    #{c.caseNumber} {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Case content */}
            <div className="glass-card rounded-2xl p-6 mb-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-xs font-medium">
                  {currentCase.subspecialty}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-700 text-slate-300 text-xs">
                  Case {currentCase.caseNumber}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">{currentCase.title}</h2>
              <p className="text-slate-400 mb-4">{currentCase.presentation}</p>

              {/* Image */}
              {currentCase.imageFile && (
                <div className="rounded-xl overflow-hidden bg-black/50 max-w-lg mb-6">
                  <img
                    src={`/images/${currentCase.imageFile}`}
                    alt="Clinical photograph"
                    className="w-full h-auto"
                  />
                </div>
              )}

              {/* Photo description */}
              {currentCase.photoDescription && (
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/30">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Photo Description
                  </p>
                  <p className="text-sm text-slate-200">{currentCase.photoDescription}</p>
                </div>
              )}
            </div>

            {/* Questions & Answers */}
            <div className="space-y-3">
              {currentCase.questions.map((q) => {
                const isExpanded = expandedQ === q.number;
                const qInfo = QUESTION_TYPE_INFO[q.number];
                return (
                  <div key={q.number} className="glass-card rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedQ(isExpanded ? null : q.number)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0">
                        <span className="text-primary-400 text-sm font-bold">{q.number}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-primary-400 font-medium">
                          {qInfo?.name || `Question ${q.number}`}
                        </p>
                        <p className="text-sm font-medium text-white">{q.question}</p>
                      </div>
                      <svg
                        className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 animate-fade-in">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 ml-11">
                          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
                            Model Answer
                          </p>
                          <div className="text-sm text-emerald-200/90 whitespace-pre-line">{q.answer}</div>

                          {/* Key Points */}
                          {q.keyPoints.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-emerald-500/20">
                              <p className="text-xs font-semibold text-emerald-400 mb-2">Key Points:</p>
                              <div className="flex flex-wrap gap-1">
                                {q.keyPoints.map((kp, i) => (
                                  <span
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300"
                                  >
                                    {kp}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Teaching Pearls */}
            {pearls.length > 0 && (
              <div className="mt-6 glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Teaching Pearls</h3>
                <div className="space-y-3">
                  {pearls.map((pearl, i) => (
                    <div
                      key={i}
                      className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4"
                    >
                      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                        {pearl.category}
                      </p>
                      <p className="text-sm text-amber-200/80">{pearl.pearl}</p>
                      {pearl.examTip && (
                        <p className="text-xs text-amber-300/60 mt-2 italic">
                          Exam Tip: {pearl.examTip}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => {
                  setSelectedCaseIdx(Math.max(0, selectedCaseIdx - 1));
                  setExpandedQ(null);
                }}
                disabled={selectedCaseIdx === 0}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white text-sm transition-colors"
              >
                Previous Case
              </button>
              <button
                onClick={() => {
                  setSelectedCaseIdx(Math.min(activeCases.length - 1, selectedCaseIdx + 1));
                  setExpandedQ(null);
                }}
                disabled={selectedCaseIdx === activeCases.length - 1}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white text-sm transition-colors"
              >
                Next Case
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
