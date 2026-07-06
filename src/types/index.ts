export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  uid: string;
  studentID?: string;
  fullname: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  faculty?: string;
  year?: number;
  score: number;
  exp: number;
  level: number;
  badges: string[]; // Array of badgeIDs
  completedLessons: string[]; // Array of lesson/virus IDs
  accuracy: number;
  createdAt: number;
}

export interface Virus {
  virusID: string;
  virusName: string;
  family: string;
  genus: string;
  genome: string;
  host: string[];
  transmission: string[];
  pathogenesis: string;
  clinicalSigns: string[];
  diagnosis: string[];
  treatment: string;
  prevention: string[];
  vaccine: boolean;
  image: string; // URL
  references: string[];
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard' | 'boss';
export type QuestionType = 'multiple_choice' | 'identification' | 'true_false';

export interface Question {
  questionID: string;
  virusID: string;
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  image?: string; // URL for identification questions
}

export interface CaseStudy {
  caseID: string;
  title: string;
  species: string;
  history: string;
  symptoms: string[];
  laboratoryResults: string;
  diagnosis: string; // Correct virusID
  explanation: string;
  score: number;
}

export interface Achievement {
  badgeID: string;
  badgeName: string;
  icon: string; // URL or icon name
  description: string;
  requiredEXP: number;
}

export interface LeaderboardEntry {
  uid: string;
  fullname: string;
  score: number;
  exp: number;
  level: number;
}
