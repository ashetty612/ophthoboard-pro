"use client";

import { useState, useEffect, useCallback } from "react";
import { CasesDatabase, CaseData, Subspecialty } from "@/lib/types";
import { getProgress, getBookmarks } from "@/lib/storage";
import CaseViewer from "@/components/CaseViewer";
import Dashboard from "@/components/Dashboard";
import SubspecialtyBrowser from "@/components/SubspecialtyBrowser";
import ReviewMode from "@/components/ReviewMode";
import ExamMode from "@/components/ExamMode";
import FlashcardMode from "@/components/FlashcardMode";
import AIExaminer from "@/components/AIExaminer";

type View = "home" | "subspecialty" | "case" | "dashboard" | "review" | "exam" | "flashcards" | "ai-examiner";

export default function Home() {
  const [database, setDatabase] = useState<CasesDatabase | null>(null);
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedSubspecialty, setSelectedSubspecialty] =
    useState<Subspecialty | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [cameFromHome, setCameFromHome] = useState(false);

  useEffect(() => {
    fetch("/data/cases_database.json")
      .then((res) => res.json())
      .then((data: CasesDatabase) => {
        setDatabase(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load cases:", err);
        setLoading(false);
      });
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleSelectSubspecialty = (spec: Subspecialty) => {
    setSelectedSubspecialty(spec);
    setCurrentView("subspecialty");
    setCameFromHome(false);
    scrollToTop();
  };

  const handleSelectCase = (caseData: CaseData) => {
    setSelectedCase(caseData);
    if (currentView === "home") setCameFromHome(true);
    setCurrentView("case");
    scrollToTop();
  };

  const handleBack = () => {
    if (currentView === "case") {
      if (cameFromHome || !selectedSubspecialty) {
        setCurrentView("home");
        setSelectedCase(null);
        setCameFromHome(false);
      } else {
        setCurrentView("subspecialty");
        setSelectedCase(null);
      }
    } else {
      setCurrentView("home");
      setSelectedSubspecialty(null);
    }
    scrollToTop();
  };

  const filteredCases = database
    ? database.subspecialties.flatMap((s) =>
        s.cases.filter(
          (c) =>
            c.questions.length > 0 &&
            (c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.presentation
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              c.subspecialty
                .toLowerCase()
                .includes(searchQuery.toLowerCase()))
        )
      )
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Loading OphthoBoard Pro...</p>
        </div>
      </div>
    );
  }

  if (!database) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-rose-400 text-lg">Failed to load case database.</p>
      </div>
    );
  }

  if (currentView === "case" && selectedCase) {
    return <CaseViewer caseData={selectedCase} onBack={handleBack} />;
  }

  if (currentView === "subspecialty" && selectedSubspecialty) {
    return (
      <SubspecialtyBrowser
        subspecialty={selectedSubspecialty}
        onSelectCase={handleSelectCase}
        onBack={handleBack}
      />
    );
  }

  if (currentView === "dashboard") {
    return (
      <Dashboard
        database={database}
        onBack={() => {
          setCurrentView("home");
          scrollToTop();
        }}
        onSelectCase={handleSelectCase}
      />
    );
  }

  if (currentView === "review") {
    return (
      <ReviewMode
        database={database}
        onBack={() => {
          setCurrentView("home");
          scrollToTop();
        }}
        onSelectCase={handleSelectCase}
      />
    );
  }

  if (currentView === "exam") {
    return (
      <ExamMode
        database={database}
        onBack={() => {
          setCurrentView("home");
          scrollToTop();
        }}
        onSelectCase={handleSelectCase}
      />
    );
  }

  if (currentView === "flashcards") {
    return (
      <FlashcardMode
        database={database}
        onBack={() => {
          setCurrentView("home");
          scrollToTop();
        }}
        onPractice={handleSelectCase}
      />
    );
  }

  if (currentView === "ai-examiner") {
    return (
      <AIExaminer
        database={database}
        onBack={() => {
          setCurrentView("home");
          scrollToTop();
        }}
      />
    );
  }

  // Home View
  const progress = getProgress();
  const bookmarks = getBookmarks();
  const totalActiveCases = database.subspecialties.reduce(
    (sum, s) => sum + s.cases.filter((c) => c.questions.length > 0).length,
    0
  );

  const subspecialtyIcons: { [key: string]: string } = {
    "anterior-segment": "🔬",
    "posterior-segment": "👁️",
    "neuro-ophthalmology-and-orbit": "🧠",
    "pediatric-ophthalmology": "👶",
    optics: "🔍",
  };

  const subspecialtyColors: { [key: string]: string } = {
    "anterior-segment": "from-blue-500 to-cyan-500",
    "posterior-segment": "from-purple-500 to-pink-500",
    "neuro-ophthalmology-and-orbit": "from-amber-500 to-orange-500",
    "pediatric-ophthalmology": "from-emerald-500 to-teal-500",
    optics: "from-rose-500 to-red-500",
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-700/50 glass-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
              O
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">OphthoBoard Pro</h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Ophthalmology Oral Boards Mastery
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setCurrentView("review")}
              className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              Review
            </button>
            <button
              onClick={() => setCurrentView("exam")}
              className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-amber-300 hover:text-amber-200 hover:bg-amber-500/10 transition-colors"
            >
              Exam Sim
            </button>
            <button
              onClick={() => setCurrentView("ai-examiner")}
              className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-cyan-300 hover:text-cyan-200 hover:bg-cyan-500/10 transition-colors"
            >
              AI Tutor
            </button>
            <button
              onClick={() => setCurrentView("dashboard")}
              className="px-3 sm:px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              Progress
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Master Your <span className="gradient-text">Oral Boards</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto">
            {totalActiveCases} interactive cases across 5 subspecialties with
            ABO-style scoring, teaching pearls, and progress tracking.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {[
            {
              label: "Cases Completed",
              value: progress.totalCasesAttempted,
              total: totalActiveCases,
              color: "text-primary-400",
            },
            {
              label: "Average Score",
              value: `${progress.averageScore}%`,
              total: null,
              color:
                progress.averageScore >= 70
                  ? "text-emerald-400"
                  : "text-amber-400",
            },
            {
              label: "Best Score",
              value: `${progress.bestScore}%`,
              total: null,
              color: "text-emerald-400",
            },
            {
              label: "Bookmarked",
              value: bookmarks.length,
              total: null,
              color: "text-amber-400",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="glass-card rounded-xl p-4 text-center hover-lift"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
                {stat.total !== null && (
                  <span className="text-sm text-slate-500">/{stat.total}</span>
                )}
              </p>
              <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search cases by topic, diagnosis, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 pl-12 rounded-xl glass-card text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-8 animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4">
              {filteredCases.length} results for &quot;{searchQuery}&quot;
            </h3>
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {filteredCases.slice(0, 20).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c)}
                  className="glass-card-light rounded-lg p-4 text-left hover:bg-slate-600/40 transition-colors flex items-center gap-4"
                >
                  {c.imageFile && (
                    <img
                      src={`/images/${c.imageFile}`}
                      alt=""
                      className="w-16 h-12 object-cover rounded-md"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{c.title}</p>
                    <p className="text-xs text-slate-400">
                      {c.subspecialty} &bull; {c.presentation}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary-500/20 text-primary-300 shrink-0">
                    {c.questions.length} Qs
                  </span>
                </button>
              ))}
              {filteredCases.length === 0 && (
                <p className="text-slate-400 text-center py-8">
                  No cases found matching your search.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Subspecialty Cards */}
        {!searchQuery && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {database.subspecialties.map((spec, i) => {
              const activeCases = spec.cases.filter(
                (c) => c.questions.length > 0
              ).length;
              const specProgress = progress.bySubspecialty[spec.name];
              return (
                <button
                  key={spec.id}
                  onClick={() => handleSelectSubspecialty(spec)}
                  className="glass-card rounded-2xl p-6 text-left hover-lift transition-all group animate-fade-in-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                        subspecialtyColors[spec.id] ||
                        "from-slate-500 to-slate-700"
                      } flex items-center justify-center text-2xl shadow-lg`}
                    >
                      {subspecialtyIcons[spec.id] || "📚"}
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-700/50 px-2 py-1 rounded-full">
                      {activeCases} cases
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary-300 transition-colors">
                    {spec.name}
                  </h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {activeCases} practice cases with clinical images and
                    ABO-style questions
                  </p>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        subspecialtyColors[spec.id] ||
                        "from-slate-500 to-slate-700"
                      } progress-bar`}
                      style={{
                        width: `${
                          specProgress
                            ? Math.round(
                                (specProgress.attempted / activeCases) * 100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-slate-500">
                      {specProgress ? specProgress.attempted : 0}/{activeCases}{" "}
                      completed
                    </span>
                    {specProgress && (
                      <span className="text-xs text-slate-400">
                        Avg: {specProgress.averageScore}%
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        {!searchQuery && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            <button
              onClick={() => {
                const allCases = database.subspecialties.flatMap((s) =>
                  s.cases.filter((c) => c.questions.length > 0)
                );
                const randomCase =
                  allCases[Math.floor(Math.random() * allCases.length)];
                handleSelectCase(randomCase);
              }}
              className="glass-card rounded-xl p-5 text-left hover-lift group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
                  🎲
                </div>
                <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  Random Case
                </h3>
              </div>
              <p className="text-sm text-slate-400">
                Surprise case from any subspecialty
              </p>
            </button>

            <button
              onClick={() => setCurrentView("exam")}
              className="glass-card rounded-xl p-5 text-left hover-lift group border border-amber-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-lg">
                  ⏱️
                </div>
                <h3 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                  Exam Simulation
                </h3>
              </div>
              <p className="text-sm text-slate-400">
                Timed mock exam with random cases
              </p>
            </button>

            <button
              onClick={() => setCurrentView("review")}
              className="glass-card rounded-xl p-5 text-left hover-lift group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-400 text-lg">
                  📋
                </div>
                <h3 className="font-semibold text-white group-hover:text-primary-300 transition-colors">
                  Quick Review
                </h3>
              </div>
              <p className="text-sm text-slate-400">
                Browse answers without scoring
              </p>
            </button>

            <button
              onClick={() => setCurrentView("flashcards")}
              className="glass-card rounded-xl p-5 text-left hover-lift group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-lg">
                  🃏
                </div>
                <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                  Flashcards
                </h3>
              </div>
              <p className="text-sm text-slate-400">
                Quick-fire concept review cards
              </p>
            </button>

            <button
              onClick={() => setCurrentView("ai-examiner")}
              className="glass-card rounded-xl p-5 text-left hover-lift group border border-cyan-500/20"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-lg">
                  🤖
                </div>
                <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                  AI Examiner
                </h3>
              </div>
              <p className="text-sm text-slate-400">
                AI tutor, mock examiner & quiz
              </p>
            </button>

            <button
              onClick={() => setCurrentView("dashboard")}
              className="glass-card rounded-xl p-5 text-left hover-lift group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 text-lg">
                  📊
                </div>
                <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                  Analytics
                </h3>
              </div>
              <p className="text-sm text-slate-400">
                Performance analytics & weak areas
              </p>
            </button>
          </div>
        )}

        {/* ABO Exam Info */}
        {!searchQuery && (
          <div className="glass-card rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-white mb-3">About the ABO Oral Examination</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-400">
              <div>
                <p className="text-slate-300 font-medium mb-1">Format</p>
                <p>Two 60-minute sessions, each with 2 examiners. You rotate through clinical scenarios covering all subspecialties.</p>
              </div>
              <div>
                <p className="text-slate-300 font-medium mb-1">Scoring</p>
                <p>Competency-based scoring across: diagnosis, workup, management, and patient communication. Each area scored independently.</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-500 py-8 border-t border-slate-800">
          <p>
            Ophthalmology Oral Boards Preparation Platform
          </p>
          <p className="mt-1">
            For educational purposes only. Not affiliated with the American
            Board of Ophthalmology. Based on published study resources.
          </p>
        </footer>
      </main>
    </div>
  );
}
