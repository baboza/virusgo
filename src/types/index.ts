export type UserRole = 'student' | 'instructor' | 'admin';
export type HomeContinentId = 'capsidia' | 'hemoria' | 'synapsia';
export type ContinentId = HomeContinentId | 'pangaea';
export type StudentCohortYear = 3 | 4 | 5;

export interface HeroEquipment {
  head?: string;    // e.g. 'capsomer_crown' (+HP)
  weapon?: string;  // e.g. 'glycoprotein_spike' (+ATK)
  armor?: string;   // e.g. 'lipid_envelope' (Retaliation reduction)
  scroll?: string;  // e.g. 'polymerase_scroll' (+Timer / Hint)
}

export interface HeroUnitStack {
  id: string;          // e.g. 'stack_1'
  virusId: string;     // e.g. 'cpv', 'fip', 'rabies'
  virusName: string;   // e.g. 'Parvovirus', 'Coronavirus', 'Rabies Virus'
  family: string;      // 'parvo' | 'corona' | 'rabies' | 'retro'
  count: number;       // Number of virion particles in stack
  tier: number;        // 1 (Swarm), 2 (Core), 3 (Elite)
  baseHp: number;      // HP per single virion
  baseAtk: number;     // ATK per single virion
}

export interface HeroArmyData {
  equipment?: HeroEquipment;
  stacks?: HeroUnitStack[];
  lastReplicated?: string;
  lastPassiveRegen?: string;
}

export interface VirusPetData {
  virusID: string;
  virusName: string;
  nickname?: string;
  family: string;
  hunger: number;
  happiness: number;
  energy: number;
  currentHp?: number;
  maxHp?: number;
  isInjured?: boolean;
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
  hero?: HeroArmyData;
  currentTileCoord?: string; // Current hex coordinates (e.g. "25,25") where Hero is stationed on Home Continent
  pangaeaTileCoord?: string; // Current hex coordinates on Pangaea Merged World Map
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
  continentId?: HomeContinentId;
  needsCohortSelection?: boolean;
  score: number;
  exp: number;
  level: number;
  badges: string[];
  completedLessons: string[];
  completedChapters?: number[];
  accuracy: number;
  createdAt: number;
  pet?: VirusPetData;
  guildId?: string;
  guildName?: string;
  dailyEmpireBattles?: {
    date: string;
    count: number;
  };
  displayName?: string;
  dailyScoutDrones?: {
    date: string;
    count: number;
  };
  exploredTiles?: string[];
  pangaeaExploredTiles?: string[];
  conqueredTiles?: number;
  pangaeaConqueredTiles?: number;
  sessionsCount?: number;
  lastPlayedAt?: number;
}

export interface Guild {
  id: string;
  name: string;
  tag: string; // e.g. [CORONA], [PHAGE]
  color: string;
  leaderUid: string;
  leaderName: string;
  membersCount: number;
  totalTiles: number;
  createdAt: string;
  continentId?: HomeContinentId;
  citadelCoord?: string; // Legacy single coord e.g. "20,15"
  citadelCoords?: string[]; // 4-tile block e.g. ["20,15", "21,15", "20,16", "21,16"]
  pangaeaCitadelCoord?: string;
  pangaeaCitadelCoords?: string[];
  citadelLevel?: number; // 1, 2, 3...
  citadelExp?: number;   // accumulated donated EXP for research upgrades
  citadelHp?: number;
  maxCitadelHp?: number;
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

export type TileType = 'empty' | 'player' | 'boss' | 'chest' | 'outpost';

export interface EmpireTile {
  id: string; // e.g., "5,10" for x=5, y=10
  x: number;
  y: number;
  type: TileType;
  continentId?: ContinentId;
  originContinent?: HomeContinentId;
  terrain?: 'continent' | 'bridge' | 'core' | 'ocean';
  ownerUid?: string;
  ownerName?: string;
  ownerFamily?: string; // To show pet icon
  bossHp?: number;
  maxBossHp?: number;
  color?: string; // Player's assigned color
  lastAttacked?: string;
  guildId?: string;
  guildName?: string;
  bonusExp?: number;
  isOutpost?: boolean;
  dailyExp?: number;
  lastClaimedDate?: string;
  shieldUntil?: string; // Beginner Shield expiration (ISO string)
  lastActive?: string;  // Last time owner was active / upkeep timestamp (ISO string)
  isCapital?: boolean;  // Mark player's primary / first city base
  isCitadel?: boolean;  // Mark guild citadel / capital fortress
  // ── DEFENSE STRUCTURES & WALLS (EXP SINKS) ──
  buildingType?: 'bio_wall' | 'spike_wall' | 'sentry_tower' | 'regen_depot';
  buildingName?: string;
  buildingHp?: number;
  maxBuildingHp?: number;
  buildingLevel?: number;
  builtBy?: string;
  builtByName?: string;
  // ── PERSISTENT SIEGE DAMAGE & CO-OP RALLY ──
  currentDefenderHp?: number;
  maxDefenderHp?: number;
  lastAttackedBy?: string;
  lastAttackedByName?: string;
  // ── HOMM HERO ARMY STACKS (3-STACK GARRISON) ──
  defenderStacks?: HeroUnitStack[];
  defenderEquipment?: HeroEquipment;
  heroStationedUid?: string; // UID of the player whose Virus Pet Hero is physically stationed on this sector
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
