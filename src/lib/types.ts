export interface TeachingEnhancement {
  examinerExpectations: string;
  acceptableAnswers: string[];
  perfectAnswer: string;
  incorrectResponses: string[];
  commonPitfalls: string[];
  learningPoints: string[];
}

export interface Question {
  number: number;
  question: string;
  answer: string;
  keyPoints: string[];
  scoringKeywords: string[];
  teaching?: TeachingEnhancement;
}

export interface CaseData {
  id: string;
  caseNumber: number;
  source: string;
  title: string;
  diagnosisTitle?: string;
  subspecialty: string;
  presentation: string;
  imageFile: string | null;
  imageFiles: string[];
  externalImageUrl?: string;
  imageAttribution?: string;
  photoDescription: string;
  questions: Question[];
  casePearls?: string[];
  highYieldFacts?: string[];
  relatedConditions?: string[];
}

export interface Subspecialty {
  id: string;
  name: string;
  cases: CaseData[];
}

export interface CasesDatabase {
  metadata: {
    title: string;
    editor: string;
    totalPages: number;
    extractedAt: string;
  };
  subspecialties: Subspecialty[];
}

export interface UserAnswer {
  questionNumber: number;
  answer: string;
  score: number;
  maxScore: number;
  matchedKeywords: string[];
  missedKeywords: string[];
  feedback: string;
}

export interface CaseAttempt {
  caseId: string;
  timestamp: string;
  photoDescriptionAnswer: string;
  photoDescriptionScore: number;
  answers: UserAnswer[];
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  grade: string;
  timeSpentSeconds: number;
}

export interface SrsCard {
  caseId: string;
  ease: number;
  interval: number;
  repetitions: number;
  dueDate: string;
  lastReview: string;
  lapses: number;
}

export interface StudyProgress {
  totalCasesAttempted: number;
  totalCasesAvailable: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  bySubspecialty: {
    [key: string]: {
      attempted: number;
      total: number;
      averageScore: number;
      lastAttempt: string;
    };
  };
  recentAttempts: CaseAttempt[];
  weakAreas: string[];
  strongAreas: string[];
}
