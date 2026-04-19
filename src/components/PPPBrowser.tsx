"use client";

import { useState, useEffect, useMemo } from "react";

interface PPPRecommendation {
  text: string;
  strength: string;
  evidence: string;
}

interface AlgorithmStep {
  step: number;
  action: string;
}

interface QuizQuestion {
  question: string;
  answer: string;
  distractors: string[];
}

interface PPPEntry {
  id: string;
  title: string;
  year: number;
  keyRecommendations: PPPRecommendation[];
  diagnosticCriteria: string[];
  managementAlgorithm: AlgorithmStep[];
  followUp: string;
  boardPearls: string[];
  pitfalls: string[];
  quizQuestions: QuizQuestion[];
}

interface PPPSubspecialty {
  id: string;
  name: string;
  color: string;
  icon: string;
  ppps: PPPEntry[];
}

interface PPPDatabase {
  metadata: { title: string; totalPPPs: number };
  subspecialties: PPPSubspecialty[];
}

interface PPPBrowserProps {
  onBack: () => void;
}

type ViewMode = "browse" | "quiz";

export default function PPPBrowser({ onBack }: PPPBrowserProps) {
  const [database, setDatabase] = useState<PPPDatabase | null>(null);
  const [activeSubspecialty, setActiveSubspecialty] = useState<string>("");
  const [expandedPPP, setExpandedPPP] = useState<string>("");
  const [expandedSection, setExpandedSection] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("browse");
  const [quizState, setQuizState] = useState<{
    currentQ: number;
    selectedAnswer: string;
    showResult: boolean;
    score: number;
    total: number;
    questions: Array<QuizQuestion & { pppTitle: string }>;
  }>({ currentQ: 0, selectedAnswer: "", showResult: false, score: 0, total: 0, questions: [] });

  useEffect(() => {
    let cancelled = false;
    fetch("/data/ppp_database.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: PPPDatabase) => {
        if (cancelled) return;
        if (!data || !Array.isArray(data.subspecialties)) {
          throw new Error("Invalid PPP database shape");
        }
        setDatabase(data);
        if (data.subspecialties.length > 0) {
          setActiveSubspecialty(data.subspecialties[0].id);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load PPPs:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Shuffle answers once per question. MUST be at top of component (before any early returns)
  // to satisfy the Rules of Hooks.
  const currentQuizQuestion = quizState.questions[quizState.currentQ];
  const allAnswers = useMemo(() => {
    if (!currentQuizQuestion) return [] as string[];
    const answers = [currentQuizQuestion.answer, ...currentQuizQuestion.distractors];
    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }
    return answers;
    // Reshuffle only when the question index changes (stable per-question order).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizState.currentQ, currentQuizQuestion?.question]);

  if (!database) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading Practice Patterns...</div>
      </div>
    );
  }

  const activeSub = database.subspecialties.find((s) => s.id === activeSubspecialty);

  const startQuiz = (subspecialtyId?: string) => {
    const subs = subspecialtyId
      ? database.subspecialties.filter((s) => s.id === subspecialtyId)
      : database.subspecialties;

    const allQuestions: Array<QuizQuestion & { pppTitle: string }> = [];
    subs.forEach((sub) =>
      sub.ppps.forEach((ppp) =>
        ppp.quizQuestions.forEach((q) => allQuestions.push({ ...q, pppTitle: ppp.title }))
      )
    );

    // Shuffle
    for (let i = allQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
    }

    setQuizState({
      currentQ: 0,
      selectedAnswer: "",
      showResult: false,
      score: 0,
      total: allQuestions.length,
      questions: allQuestions,
    });
    setViewMode("quiz");
  };

  const handleQuizAnswer = (answer: string) => {
    if (quizState.showResult) return;
    const isCorrect = answer === quizState.questions[quizState.currentQ].answer;
    setQuizState((prev) => ({
      ...prev,
      selectedAnswer: answer,
      showResult: true,
      score: prev.score + (isCorrect ? 1 : 0),
    }));
  };

  const nextQuestion = () => {
    if (quizState.currentQ < quizState.questions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        currentQ: prev.currentQ + 1,
        selectedAnswer: "",
        showResult: false,
      }));
    } else {
      // Quiz complete — stay showing final score
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "Strong": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Moderate": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  // QUIZ MODE
  if (viewMode === "quiz" && quizState.questions.length > 0) {
    const isComplete = quizState.currentQ >= quizState.questions.length - 1 && quizState.showResult;
    const currentQuestion = quizState.questions[quizState.currentQ];

    if (isComplete) {
      const pct = quizState.total > 0 ? Math.round((quizState.score / quizState.total) * 100) : 0;
      return (
        <div className="min-h-screen">
          <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
            <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
              <button onClick={() => setViewMode("browse")} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span className="text-sm">Back to PPPs</span>
              </button>
              <p className="text-sm font-medium text-white">PPP Quiz Complete</p>
              <div />
            </div>
          </div>
          <div className="max-w-2xl mx-auto px-4 py-12 text-center animate-fade-in-up">
            <div className="glass-card rounded-2xl p-8">
              <div className="text-6xl mb-4">{pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "📚"}</div>
              <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
              <p className="text-5xl font-bold text-primary-400 mb-2">{quizState.score}/{quizState.total}</p>
              <p className="text-lg text-slate-400 mb-6">{pct}% correct</p>
              <div className="flex gap-4">
                <button onClick={() => startQuiz()} className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors">
                  New Quiz (All)
                </button>
                <button onClick={() => setViewMode("browse")} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors">
                  Back to Study
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // allAnswers is computed at the top of the component via useMemo.

    return (
      <div className="min-h-screen">
        <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setViewMode("browse")} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              <span className="text-sm">Exit Quiz</span>
            </button>
            <p className="text-sm font-medium text-white">
              Question {quizState.currentQ + 1} of {quizState.total}
            </p>
            <p className="text-sm text-primary-400 font-medium">Score: {quizState.score}</p>
          </div>
          <div className="h-1 bg-slate-800">
            <div className="h-full bg-gradient-to-r from-primary-500 to-primary-400 progress-bar"
              style={{ width: `${((quizState.currentQ + 1) / quizState.total) * 100}%` }} />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
          <div className="glass-card rounded-2xl p-8">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{currentQuestion.pppTitle}</p>
            <h3 className="text-xl font-bold text-white mb-6">{currentQuestion.question}</h3>

            <div className="space-y-3">
              {allAnswers.map((answer, i) => {
                let btnClass = "w-full text-left p-4 rounded-xl border transition-all ";
                if (quizState.showResult) {
                  if (answer === currentQuestion.answer) {
                    btnClass += "bg-emerald-500/15 border-emerald-500/40 text-emerald-200";
                  } else if (answer === quizState.selectedAnswer) {
                    btnClass += "bg-rose-500/15 border-rose-500/40 text-rose-200";
                  } else {
                    btnClass += "bg-slate-800/30 border-slate-700/30 text-slate-500";
                  }
                } else {
                  btnClass += "bg-slate-800/30 border-slate-700/30 text-slate-200 hover:bg-slate-700/50 hover:border-slate-600/50 cursor-pointer";
                }

                return (
                  <button key={i} className={btnClass} onClick={() => handleQuizAnswer(answer)} disabled={quizState.showResult}>
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-bold text-slate-500 mt-0.5">{String.fromCharCode(65 + i)}.</span>
                      <span className="text-sm">{answer}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {quizState.showResult && (
              <div className="mt-6 animate-fade-in">
                <div className={`p-4 rounded-xl border ${quizState.selectedAnswer === currentQuestion.answer ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"}`}>
                  <p className={`text-sm font-medium ${quizState.selectedAnswer === currentQuestion.answer ? "text-emerald-400" : "text-rose-400"}`}>
                    {quizState.selectedAnswer === currentQuestion.answer ? "Correct!" : "Incorrect"}
                  </p>
                  <p className="text-sm text-slate-300 mt-1">
                    <span className="font-medium">Answer:</span> {currentQuestion.answer}
                  </p>
                </div>
                <button onClick={nextQuestion} className="mt-4 w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors">
                  {quizState.currentQ < quizState.questions.length - 1 ? "Next Question" : "See Results"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // BROWSE MODE
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-card sticky top-0 z-50 border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="text-sm">Home</span>
          </button>
          <p className="text-sm font-medium text-white">AAO Preferred Practice Patterns</p>
          <button onClick={() => startQuiz()} className="px-4 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium transition-colors">
            Quiz All
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-white mb-2">Preferred Practice Patterns</h1>
          <p className="text-slate-400">AAO evidence-based guidelines — interactive study with board-relevant pearls and quizzes</p>
          <p className="text-xs text-slate-500 mt-1">{database.metadata.totalPPPs} guidelines across {database.subspecialties.length} subspecialties</p>
        </div>

        {/* Subspecialty Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {database.subspecialties.map((sub) => (
            <button
              key={sub.id}
              onClick={() => { setActiveSubspecialty(sub.id); setExpandedPPP(""); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeSubspecialty === sub.id
                  ? "text-white shadow-lg"
                  : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
              style={activeSubspecialty === sub.id ? { backgroundColor: sub.color + "30", color: sub.color, borderColor: sub.color + "50", border: "1px solid" } : {}}
            >
              {sub.name}
              <span className="ml-1.5 text-xs opacity-60">({sub.ppps.length})</span>
            </button>
          ))}
        </div>

        {/* Quiz button for subspecialty */}
        {activeSub && (
          <div className="flex justify-end mb-4">
            <button onClick={() => startQuiz(activeSub.id)} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700/30">
              Quiz: {activeSub.name} only
            </button>
          </div>
        )}

        {/* PPP Cards */}
        {activeSub && (
          <div className="space-y-4 animate-fade-in">
            {activeSub.ppps.map((ppp) => {
              const isExpanded = expandedPPP === ppp.id;
              return (
                <div key={ppp.id} className="glass-card rounded-2xl overflow-hidden border border-slate-700/30">
                  {/* PPP Header */}
                  <button
                    onClick={() => setExpandedPPP(isExpanded ? "" : ppp.id)}
                    className="w-full text-left p-6 hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{ppp.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">AAO PPP {ppp.year} &middot; {ppp.keyRecommendations.length} recommendations &middot; {ppp.quizQuestions.length} quiz questions</p>
                      </div>
                      <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 animate-fade-in">
                      <div className="border-t border-slate-700/30 pt-6 space-y-4">

                        {/* Key Recommendations */}
                        <SectionToggle title="Key Recommendations" count={ppp.keyRecommendations.length} sectionId={`${ppp.id}-rec`} expandedSection={expandedSection} setExpandedSection={setExpandedSection} color="emerald">
                          <div className="space-y-3">
                            {ppp.keyRecommendations.map((rec, i) => (
                              <div key={i} className="flex items-start gap-3 bg-slate-800/20 rounded-lg p-3">
                                <span className="text-emerald-400 mt-0.5 shrink-0">&#x2713;</span>
                                <div className="flex-1">
                                  <p className="text-sm text-slate-200">{rec.text}</p>
                                  <div className="flex gap-2 mt-1.5">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStrengthColor(rec.strength)}`}>
                                      {rec.strength}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30">
                                      Evidence: {rec.evidence}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </SectionToggle>

                        {/* Diagnostic Criteria */}
                        <SectionToggle title="Diagnostic Criteria" count={ppp.diagnosticCriteria.length} sectionId={`${ppp.id}-dx`} expandedSection={expandedSection} setExpandedSection={setExpandedSection} color="blue">
                          <ul className="space-y-2">
                            {ppp.diagnosticCriteria.map((criteria, i) => (
                              <li key={i} className="text-sm text-blue-200/80 flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5 shrink-0">&#x2022;</span>
                                <span>{criteria}</span>
                              </li>
                            ))}
                          </ul>
                        </SectionToggle>

                        {/* Management Algorithm */}
                        <SectionToggle title="Management Algorithm" count={ppp.managementAlgorithm.length} sectionId={`${ppp.id}-mgmt`} expandedSection={expandedSection} setExpandedSection={setExpandedSection} color="violet">
                          <div className="space-y-3">
                            {ppp.managementAlgorithm.map((step) => (
                              <div key={step.step} className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                  <span className="text-violet-400 text-xs font-bold">{step.step}</span>
                                </div>
                                <p className="text-sm text-violet-200/80">{step.action}</p>
                              </div>
                            ))}
                          </div>
                        </SectionToggle>

                        {/* Follow-up */}
                        <div className="bg-slate-800/20 rounded-xl p-4 border border-slate-700/20">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Follow-Up</p>
                          <p className="text-sm text-slate-300">{ppp.followUp}</p>
                        </div>

                        {/* Board Pearls */}
                        <SectionToggle title="Board-Relevant Pearls" count={ppp.boardPearls.length} sectionId={`${ppp.id}-pearls`} expandedSection={expandedSection} setExpandedSection={setExpandedSection} color="amber">
                          <ul className="space-y-2">
                            {ppp.boardPearls.map((pearl, i) => (
                              <li key={i} className="text-sm text-amber-200/80 flex items-start gap-2">
                                <span className="text-amber-400 mt-0.5 shrink-0">&#x25C6;</span>
                                <span>{pearl}</span>
                              </li>
                            ))}
                          </ul>
                        </SectionToggle>

                        {/* Common Pitfalls */}
                        <SectionToggle title="Common Pitfalls" count={ppp.pitfalls.length} sectionId={`${ppp.id}-pitfalls`} expandedSection={expandedSection} setExpandedSection={setExpandedSection} color="rose">
                          <ul className="space-y-2">
                            {ppp.pitfalls.map((pitfall, i) => (
                              <li key={i} className="text-sm text-rose-200/70 flex items-start gap-2">
                                <span className="text-rose-400 mt-0.5 shrink-0">&#x26A0;</span>
                                <span>{pitfall}</span>
                              </li>
                            ))}
                          </ul>
                        </SectionToggle>

                        {/* Quick Quiz CTA */}
                        <button
                          onClick={() => {
                            const questions = ppp.quizQuestions.map(q => ({ ...q, pppTitle: ppp.title }));
                            setQuizState({ currentQ: 0, selectedAnswer: "", showResult: false, score: 0, total: questions.length, questions });
                            setViewMode("quiz");
                          }}
                          className="w-full py-3 rounded-xl bg-primary-600/20 border border-primary-500/30 text-primary-400 hover:bg-primary-600/30 font-medium text-sm transition-colors"
                        >
                          Quiz: {ppp.title} ({ppp.quizQuestions.length} questions)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable expandable section component
function SectionToggle({
  title, count, sectionId, expandedSection, setExpandedSection, color, children
}: {
  title: string; count: number; sectionId: string; expandedSection: string;
  setExpandedSection: (s: string) => void; color: string; children: React.ReactNode;
}) {
  const isOpen = expandedSection === sectionId;
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 border-emerald-500/10 bg-emerald-500/5 hover:bg-emerald-500/10",
    blue: "text-blue-400 border-blue-500/10 bg-blue-500/5 hover:bg-blue-500/10",
    violet: "text-violet-400 border-violet-500/10 bg-violet-500/5 hover:bg-violet-500/10",
    amber: "text-amber-400 border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10",
    rose: "text-rose-400 border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10",
  };

  return (
    <div>
      <button
        onClick={() => setExpandedSection(isOpen ? "" : sectionId)}
        className={`w-full text-left rounded-xl p-4 border transition-colors ${colorMap[color] || colorMap.emerald}`}
      >
        <div className="flex items-center justify-between">
          <p className={`text-xs font-semibold uppercase tracking-wider ${colorMap[color]?.split(" ")[0]}`}>
            {title} ({count})
          </p>
          <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className={`mt-2 rounded-xl p-4 border animate-fade-in ${colorMap[color] || ""}`}>
          {children}
        </div>
      )}
    </div>
  );
}
