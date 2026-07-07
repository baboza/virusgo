export type UserRole = 'student' | 'instructor' | 'admin';

export interface VirusPetData {
  virusID: string;
  virusName: string;
  family: string;
  hunger: number;
  happiness: number;
  energy: number;
  stage: number;
  careCount: number;
  lastUpdate: string;
  stats?: {
    str: number;
    vit: number;
    agi: number;
    dex: number;
    spentPoints: number;
  };
}

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
  badges: string[];
  completedLessons: string[];
  accuracy: number;
  createdAt: number;
  pet?: VirusPetData;
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

export type TileType = 'empty' | 'player' | 'boss';

export interface EmpireTile {
  id: string; // e.g., "5,10" for x=5, y=10
  x: number;
  y: number;
  type: TileType;
  ownerUid?: string;
  ownerName?: string;
  ownerFamily?: string; // To show pet icon
  bossHp?: number;
  maxBossHp?: number;
  color?: string; // Player's assigned color
  lastAttacked?: string;
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
