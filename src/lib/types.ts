export interface Question {
  number: number;
  question: string;
  answer: string;
  keyPoints: string[];
  scoringKeywords: string[];
}

export interface CaseData {
  id: string;
  caseNumber: number;
  source: string;
  title: string;
  subspecialty: string;
  presentation: string;
  imageFile: string | null;
  imageFiles: string[];
  photoDescription: string;
  questions: Question[];
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
