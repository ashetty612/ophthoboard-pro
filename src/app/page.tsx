"use client";

import { useState, useEffect, useCallback } from "react";
import { CasesDatabase, CaseData, Subspecialty } from "@/lib/types";
import { getProgress, getBookmarks, getStudyStreak } from "@/lib/storage";
import CaseViewer from "@/components/CaseViewer";
import Dashboard from "@/components/Dashboard";
import SubspecialtyBrowser from "@/components/SubspecialtyBrowser";
import ReviewMode from "@/components/ReviewMode";
import ExamMode from "@/components/ExamMode";
import FlashcardMode from "@/components/FlashcardMode";
import AIExaminer from "@/components/AIExaminer";
import PPPBrowser from "@/components/PPPBrowser";

type View = "home" | "subspecialty" | "case" | "dashboard" | "review" | "exam" | "flashcards" | "ai-examiner" | "ppp";

// Custom SVG eye logo
function EyeLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="eyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="irisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M20 8C12 8 5.5 14 3 20c2.5 6 9 12 17 12s14.5-6 17-12c-2.5-6-9-12-17-12z" stroke="url(#eyeGrad)" strokeWidth="2" fill="none" />
      <circle cx="20" cy="20" r="7" fill="url(#irisGrad)" opacity="0.9" />
      <circle cx="20" cy="20" r="3" fill="#020a13" />
      <circle cx="17.5" cy="17.5" r="1.5" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

export default function Home() {
  const [database, setDatabase] = useState<CasesDatabase | null>(null);
  const [currentView, setCurrentView] = useState<View>("home");
  const [selectedSubspecialty, setSelectedSubspecialty] = useState<Subspecialty | null>(null);
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
              c.presentation.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.subspecialty.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      )
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-float mb-4">
            <EyeLogo size={56} />
          </div>
          <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden mx-auto">
            <div className="h-full w-1/2 bg-primary-500 rounded-full animate-pulse" />
          </div>
          <p className="text-slate-500 text-sm mt-4 tracking-wide">Loading cases...</p>
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
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
        onSelectCase={handleSelectCase}
      />
    );
  }

  if (currentView === "review") {
    return (
      <ReviewMode
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
        onSelectCase={handleSelectCase}
      />
    );
  }

  if (currentView === "exam") {
    return (
      <ExamMode
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
        onSelectCase={handleSelectCase}
      />
    );
  }

  if (currentView === "flashcards") {
    return (
      <FlashcardMode
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
        onPractice={handleSelectCase}
      />
    );
  }

  if (currentView === "ai-examiner") {
    return (
      <AIExaminer
        database={database}
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
      />
    );
  }

  if (currentView === "ppp") {
    return (
      <PPPBrowser
        onBack={() => { setCurrentView("home"); scrollToTop(); }}
      />
    );
  }

  // Home View
  const progress = getProgress();
  const bookmarks = getBookmarks();
  const streak = getStudyStreak();
  const totalActiveCases = database.subspecialties.reduce(
    (sum, s) => sum + s.cases.filter((c) => c.questions.length > 0).length,
    0
  );

  const subspecialtyMeta: { [key: string]: { icon: string; color: string; accent: string } } = {
    "anterior-segment": { icon: "🔬", color: "from-cyan-500 to-blue-600", accent: "border-l-cyan-500" },
    "posterior-segment": { icon: "👁️", color: "from-violet-500 to-purple-600", accent: "border-l-violet-500" },
    "neuro-ophthalmology-and-orbit": { icon: "🧠", color: "from-amber-500 to-orange-600", accent: "border-l-amber-500" },
    "pediatric-ophthalmology": { icon: "👶", color: "from-emerald-500 to-teal-600", accent: "border-l-emerald-500" },
    optics: { icon: "🔍", color: "from-rose-500 to-pink-600", accent: "border-l-rose-500" },
  };

  const completionPct = totalActiveCases > 0 ? Math.round((progress.totalCasesAttempted / totalActiveCases) * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/80 glass-card sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EyeLogo size={36} />
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">OphthoBoard</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] hidden sm:block">Oral Boards Mastery</p>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {[
              { label: "Review", view: "review" as View, style: "text-slate-400 hover:text-white" },
              { label: "Exam", view: "exam" as View, style: "text-amber-400/80 hover:text-amber-300" },
              { label: "AI Tutor", view: "ai-examiner" as View, style: "text-primary-400/80 hover:text-primary-300" },
              { label: "Progress", view: "dashboard" as View, style: "text-white bg-slate-800 hover:bg-slate-700" },
            ].map((item) => (
              <button
                key={item.view}
                onClick={() => setCurrentView(item.view)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${item.style}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero Section */}
        <div className="mb-14 animate-fade-in-up">
          <div className="flex flex-col items-center text-center">
            <p className="text-[11px] text-primary-400/80 uppercase tracking-[0.3em] font-medium mb-4">
              Board Preparation Platform
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
              Master Your<br />
              <span className="gradient-text">Oral Boards</span>
            </h2>
            <p className="text-slate-400 text-base max-w-lg mx-auto leading-relaxed">
              {totalActiveCases} interactive cases across 5 subspecialties.
              ABO-style scoring, AI examiner, and detailed progress tracking.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: "Completed", value: progress.totalCasesAttempted, suffix: `/${totalActiveCases}`, color: "text-primary-400" },
            { label: "Average", value: `${progress.averageScore}`, suffix: "%", color: progress.averageScore >= 70 ? "text-emerald-400" : "text-amber-400" },
            { label: "Best Score", value: `${progress.bestScore}`, suffix: "%", color: "text-emerald-400" },
            { label: "Streak", value: streak.current, suffix: streak.current === 1 ? " day" : " days", color: "text-violet-400" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
              <p className={`stat-number text-2xl font-bold ${stat.color}`}>
                {stat.value}<span className="text-sm text-slate-600">{stat.suffix}</span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Overall Progress Bar */}
        {progress.totalCasesAttempted > 0 && (
          <div className="mb-10 glass-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Overall Progress</span>
              <span className="text-xs font-medium text-primary-400">{completionPct}% complete</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400 progress-bar"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-10">
          <div className="relative max-w-lg mx-auto">
            <input
              type="text"
              placeholder="Search cases by topic, diagnosis, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3 pl-11 rounded-xl bg-slate-900/80 border border-slate-700/50 text-white placeholder-slate-500 text-sm transition-all"
            />
            <svg className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-3.5 text-slate-500 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mb-10 animate-fade-in">
            <h3 className="text-sm font-semibold text-white mb-4">
              <span className="text-slate-500">{filteredCases.length} results for</span> &quot;{searchQuery}&quot;
            </h3>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {filteredCases.slice(0, 20).map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c)}
                  className="glass-card-light rounded-lg p-3.5 text-left hover:bg-slate-700/40 transition-colors flex items-center gap-4"
                >
                  {c.imageFile && (
                    <img src={`/images/${c.imageFile}`} alt="" className="w-14 h-10 object-cover rounded-md opacity-80" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{c.title}</p>
                    <p className="text-xs text-slate-500 truncate">{c.subspecialty}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/15 text-primary-400 shrink-0">
                    {c.questions.length} Qs
                  </span>
                </button>
              ))}
              {filteredCases.length === 0 && (
                <p className="text-slate-500 text-center py-8 text-sm">No cases found.</p>
              )}
            </div>
          </div>
        )}

        {/* Subspecialty Cards */}
        {!searchQuery && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs text-slate-500 uppercase tracking-[0.2em] font-medium">Subspecialties</h3>
              <span className="text-xs text-slate-600">{totalActiveCases} total cases</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-14">
              {database.subspecialties.map((spec, i) => {
                const activeCases = spec.cases.filter((c) => c.questions.length > 0).length;
                const meta = subspecialtyMeta[spec.id] || { icon: "📚", color: "from-slate-500 to-slate-700", accent: "border-l-slate-500" };
                const specProgress = progress.bySubspecialty[spec.name];
                const pct = specProgress ? Math.round((specProgress.attempted / activeCases) * 100) : 0;
                return (
                  <button
                    key={spec.id}
                    onClick={() => handleSelectSubspecialty(spec)}
                    className={`accent-card ${meta.accent} rounded-xl p-5 text-left hover-lift transition-all group animate-fade-in-up`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-xl shadow-lg`}>
                        {meta.icon}
                      </div>
                      <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full font-medium">
                        {activeCases} cases
                      </span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-white mb-1 group-hover:text-primary-300 transition-colors">
                      {spec.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                      Clinical cases with ABO-style questions and scoring
                    </p>

                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${meta.color} progress-bar`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-slate-600">
                        {specProgress ? specProgress.attempted : 0}/{activeCases}
                      </span>
                      {specProgress && specProgress.averageScore > 0 && (
                        <span className={`text-[10px] font-medium ${specProgress.averageScore >= 70 ? "text-emerald-500" : "text-amber-500"}`}>
                          {specProgress.averageScore}% avg
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Study Modes */}
        {!searchQuery && (
          <>
            <div className="mb-3">
              <h3 className="text-xs text-slate-500 uppercase tracking-[0.2em] font-medium">Study Modes</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-14">
              {[
                {
                  label: "Random Case", desc: "Jump into a surprise case", icon: "🎲",
                  iconBg: "bg-emerald-500/10 text-emerald-400", border: "",
                  action: () => {
                    const allCases = database.subspecialties.flatMap((s) => s.cases.filter((c) => c.questions.length > 0));
                    handleSelectCase(allCases[Math.floor(Math.random() * allCases.length)]);
                  },
                },
                {
                  label: "Exam Simulation", desc: "Timed mock exam with random cases", icon: "⏱️",
                  iconBg: "bg-amber-500/10 text-amber-400", border: "border-amber-500/15",
                  action: () => setCurrentView("exam"),
                },
                {
                  label: "Quick Review", desc: "Browse answers without scoring", icon: "📋",
                  iconBg: "bg-primary-500/10 text-primary-400", border: "",
                  action: () => setCurrentView("review"),
                },
                {
                  label: "Flashcards", desc: "Rapid concept review cards", icon: "🃏",
                  iconBg: "bg-violet-500/10 text-violet-400", border: "",
                  action: () => setCurrentView("flashcards"),
                },
                {
                  label: "AI Examiner", desc: "AI tutor, mock examiner & quiz", icon: "🤖",
                  iconBg: "bg-primary-500/10 text-primary-400", border: "border-primary-500/15",
                  action: () => setCurrentView("ai-examiner"),
                },
                {
                  label: "Practice Patterns", desc: "AAO PPP guidelines & quizzes", icon: "📋",
                  iconBg: "bg-teal-500/10 text-teal-400", border: "border-teal-500/15",
                  action: () => setCurrentView("ppp"),
                },
                {
                  label: "Analytics", desc: "Performance analytics & insights", icon: "📊",
                  iconBg: "bg-purple-500/10 text-purple-400", border: "",
                  action: () => setCurrentView("dashboard"),
                },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`glass-card rounded-xl p-4 text-left hover-lift group transition-all ${item.border ? `border ${item.border}` : ""}`}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className={`w-9 h-9 rounded-lg ${item.iconBg} flex items-center justify-center text-base`}>
                      {item.icon}
                    </div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-primary-300 transition-colors">
                      {item.label}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 ml-12">{item.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ABO Exam Info */}
        {!searchQuery && (
          <div className="glass-card rounded-xl p-6 mb-10">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">About the ABO Oral Examination</h3>
            <div className="divider-glow mb-4" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm mb-5">
              <div>
                <p className="text-primary-400 font-medium text-xs uppercase tracking-wider mb-1.5">Format</p>
                <p className="text-slate-400 text-xs leading-relaxed">42 Patient Management Problems across 3 virtual rooms (50 min each). 2 examiners per room, 7 cases each. ~3.5 minutes per case.</p>
              </div>
              <div>
                <p className="text-primary-400 font-medium text-xs uppercase tracking-wider mb-1.5">Scoring</p>
                <p className="text-slate-400 text-xs leading-relaxed">3 domains scored 0-3: Data Acquisition, Diagnosis, Management. Compensatory model — strength offsets weakness. Pass/fail only.</p>
              </div>
              <div>
                <p className="text-primary-400 font-medium text-xs uppercase tracking-wider mb-1.5">Pass Rates</p>
                <p className="text-slate-400 text-xs leading-relaxed">~79-87% for first-time takers. ~63% for repeat takers. Knowledge alone is insufficient — verbal fluency and structure are critical.</p>
              </div>
              <div>
                <p className="text-primary-400 font-medium text-xs uppercase tracking-wider mb-1.5">Room Pairings</p>
                <p className="text-slate-400 text-xs leading-relaxed">Room 1: Anterior + Optics. Room 2: External + Pediatrics. Room 3: Neuro-Ophthalmology + Posterior Segment.</p>
              </div>
            </div>
            <div className="divider-glow mb-4" />
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-[10px] text-primary-400 uppercase tracking-wider font-medium mb-1">8-Element PMP Framework</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Image Description, History, Exam, DDx, Workup, Diagnosis, Management, Patient Education</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-[10px] text-amber-400 uppercase tracking-wider font-medium mb-1">Fatal Flaws</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">Missing GCA in AION, retinoblastoma in leukocoria, open globe signs, or starting oral steroids alone in optic neuritis</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-3">
                <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-medium mb-1">Key Trials</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">ONTT, CATT, DRCR.net, EVS, COMS, AREDS2, PEDIG, IIHTT, OHTS</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center py-10">
          <div className="divider-glow mb-6" />
          <div className="flex items-center justify-center gap-2 mb-2">
            <EyeLogo size={20} />
            <span className="text-xs text-slate-600 font-medium tracking-wide">OphthoBoard Pro</span>
          </div>
          <p className="text-[10px] text-slate-700 max-w-md mx-auto">
            For educational purposes only. Not affiliated with the American Board of Ophthalmology.
          </p>
        </footer>
      </main>
    </div>
  );
}
