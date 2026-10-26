import { ContinentId, EmpireTile, Guild, HomeContinentId, StudentCohortYear, User } from '@/types';

export const MAP_SIZE = 50; // 50x50 = 2,500 sectors per home continent
export const PANGAEA_MAP_SIZE = 120; // 120x120 = 14,400 sectors for Civilization Merged World

export interface ContinentMeta {
  id: ContinentId;
  year: StudentCohortYear | 0;
  code: string;
  thaiName: string;
  shortLabel: string;
  subtitle: string;
  emoji: string;
  mapSize: number;
  accentHex: string;
  badgeClass: string;
  neutralHex: string;
  sanctuaryHex: string;
  vaultHex: string;
  fogHex: string;
  skyHex: string;
}

export const CONTINENTS: Record<ContinentId, ContinentMeta> = {
  capsidia: {
    id: 'capsidia',
    year: 3,
    code: 'CAPSIDIA',
    thaiName: 'ทวีปแคปซิเดีย',
    shortLabel: 'ปี 3 • CAPSIDIA',
    subtitle: 'ปราการผลึกโปรตีน • นิสิตชั้นปีที่ 3',
    emoji: '💎',
    mapSize: MAP_SIZE,
    accentHex: '#06b6d4',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    neutralHex: '#111c30',
    sanctuaryHex: '#16253b',
    vaultHex: '#1e293b',
    fogHex: '#0b1324',
    skyHex: '#020617',
  },
  hemoria: {
    id: 'hemoria',
    year: 4,
    code: 'HEMORIA',
    thaiName: 'ทวีปเฮโมเรีย',
    shortLabel: 'ปี 4 • HEMORIA',
    subtitle: 'สมรภูมิโลหิตคลินิก • นิสิตชั้นปีที่ 4',
    emoji: '🔥',
    mapSize: MAP_SIZE,
    accentHex: '#f59e0b',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    neutralHex: '#25141c',
    sanctuaryHex: '#331b26',
    vaultHex: '#3f1d2b',
    fogHex: '#12080d',
    skyHex: '#090306',
  },
  synapsia: {
    id: 'synapsia',
    year: 5,
    code: 'SYNAPSIA',
    thaiName: 'ทวีปไซแนปเซีย',
    shortLabel: 'ปี 5 • SYNAPSIA',
    subtitle: 'ยอดปราการประสาท • นิสิตชั้นปีที่ 5',
    emoji: '👑',
    mapSize: MAP_SIZE,
    accentHex: '#a855f7',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    neutralHex: '#1c1532',
    sanctuaryHex: '#261d45',
    vaultHex: '#312359',
    fogHex: '#0d0919',
    skyHex: '#05020c',
  },
  pangaea: {
    id: 'pangaea',
    year: 0,
    code: 'PANGAEA',
    thaiName: 'มหาทวีปแพนเจีย',
    shortLabel: '🌍 PANGAEA (ศึกไตรภูมิ)',
    subtitle: 'ศึกมหาทวีปรวมแผ่นดิน • ปี 3 × ปี 4 × ปี 5',
    emoji: '🌍',
    mapSize: PANGAEA_MAP_SIZE,
    accentHex: '#eab308',
    badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    neutralHex: '#1b2434',
    sanctuaryHex: '#243146',
    vaultHex: '#422006',
    fogHex: '#070e1a',
    skyHex: '#020813',
  },
};

export const HOME_CONTINENT_ORDER: HomeContinentId[] = ['capsidia', 'hemoria', 'synapsia'];
export const ALL_CONTINENT_ORDER: ContinentId[] = ['capsidia', 'hemoria', 'synapsia', 'pangaea'];

export const yearToContinent = (year?: number | null): HomeContinentId => {
  if (year === 4) return 'hemoria';
  if (year === 5) return 'synapsia';
  return 'capsidia';
};

export const continentToYear = (continentId: HomeContinentId): StudentCohortYear => {
  if (continentId === 'hemoria') return 4;
  if (continentId === 'synapsia') return 5;
  return 3;
};

export const resolveUserYear = (user?: Partial<User> | null): StudentCohortYear => {
  if (user?.year === 4) return 4;
  if (user?.year === 5) return 5;
  if (user?.continentId === 'hemoria') return 4;
  if (user?.continentId === 'synapsia') return 5;
  return 3; // Default legacy cohort = Year 3 (CAPSIDIA)
};

export const resolveUserContinent = (user?: Partial<User> | null): HomeContinentId => {
  if (user?.continentId === 'hemoria' || user?.continentId === 'synapsia' || user?.continentId === 'capsidia') {
    return user.continentId;
  }
  return yearToContinent(user?.year);
};

export const resolveGuildContinent = (guild?: Partial<Guild> | null): HomeContinentId => {
  if (guild?.continentId === 'hemoria' || guild?.continentId === 'synapsia' || guild?.continentId === 'capsidia') {
    return guild.continentId;
  }
  return 'capsidia';
};

export const GM_ALLOWED_GMAIL = 'never.away@gmail.com';
export const INSTRUCTOR_SUPER_EMAIL = 'jirawat.s@msu.ac.th';
export const EXEMPT_STUDENT_TESTER_EMAILS = [
  'never.away@gmail.com',
  'wilasinee.c@msu.ac.th',
] as const;

export const isExemptStudentTesterEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (EXEMPT_STUDENT_TESTER_EMAILS as readonly string[]).includes(normalized);
};

/**
 * Resolves MSU student cohort year from explicit Student ID prefix:
 * - 65xxxxxxxxx@msu.ac.th -> Year 5 (SYNAPSIA)
 * - 66xxxxxxxxx@msu.ac.th -> Year 4 (HEMORIA)
 * - 67xxxxxxxxx@msu.ac.th -> Year 3 (CAPSIDIA)
 */
export const detectSuggestedYearFromEmail = (email?: string | null): StudentCohortYear | null => {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  const match = normalized.match(/^(\d{2})\d{5,12}@msu\.ac\.th$/);
  if (!match) return null;
  const prefix = match[1];
  if (prefix === '65') return 5;
  if (prefix === '66') return 4;
  if (prefix === '67') return 3;
  return null;
};

export type NewRegistrationValidationResult =
  | {
      allowed: true;
      role: 'instructor' | 'student';
      year: StudentCohortYear;
      continentId: HomeContinentId;
      studentID?: string;
      needsCohortSelection: boolean;
    }
  | {
      allowed: false;
      errorTitle: string;
      errorMessage: string;
    };

/**
 * Strict registration gate for brand-new sign-ups (!userDoc.exists()):
 * - Existing Year 3 accounts already stored in Firestore bypass this check completely.
 * - Allows GM `never.away@gmail.com` and Instructor `jirawat.s@msu.ac.th`.
 * - Rejects all other `@gmail.com` / external domains.
 * - Requires `65...@msu.ac.th` (Year 5 -> SYNAPSIA) or `66...@msu.ac.th` (Year 4 -> HEMORIA).
 */
export const validateNewUserRegistration = (email?: string | null): NewRegistrationValidationResult => {
  const normalized = (email || '').trim().toLowerCase();

  if (!normalized) {
    return {
      allowed: false,
      errorTitle: 'ไม่พบข้อมูลอีเมล',
      errorMessage: 'ไม่สามารถตรวจสอบที่อยู่อีเมลจากบัญชี Google ได้ กรุณาลองใหม่อีกครั้ง',
    };
  }

  // 1. Super Instructor
  if (normalized === INSTRUCTOR_SUPER_EMAIL) {
    return {
      allowed: true,
      role: 'instructor',
      year: 3,
      continentId: 'capsidia',
      needsCohortSelection: false,
    };
  }

  // 2. Authorized GM & Instructor Student-Tester Exceptions (`never.away@gmail.com`, `wilasinee.c@msu.ac.th`)
  if (isExemptStudentTesterEmail(normalized)) {
    return {
      allowed: true,
      role: 'student',
      year: 4,
      continentId: 'hemoria',
      needsCohortSelection: true,
    };
  }

  // 3. Reject all @gmail.com and non-@msu.ac.th domains for new registrations
  if (!normalized.endsWith('@msu.ac.th')) {
    return {
      allowed: false,
      errorTitle: 'ไม่อนุญาตให้ใช้อีเมล @gmail.com หรืออีเมลภายนอก',
      errorMessage:
        'การสมัครเข้าใช้งานใหม่อนุญาตเฉพาะอีเมลมหาวิทยาลัย @msu.ac.th เท่านั้น — ชั้นปีที่ 4 ใช้รหัส 66xxxxxxxxx@msu.ac.th และชั้นปีที่ 5 ใช้รหัส 65xxxxxxxxx@msu.ac.th',
    };
  }

  // 4. Enforce strict Student ID prefix for Year 4 (66...) and Year 5 (65...)
  const localPart = normalized.split('@')[0];

  if (/^65\d{5,12}$/.test(localPart)) {
    return {
      allowed: true,
      role: 'student',
      year: 5,
      continentId: 'synapsia',
      studentID: localPart,
      needsCohortSelection: false,
    };
  }

  if (/^66\d{5,12}$/.test(localPart)) {
    return {
      allowed: true,
      role: 'student',
      year: 4,
      continentId: 'hemoria',
      studentID: localPart,
      needsCohortSelection: false,
    };
  }

  return {
    allowed: false,
    errorTitle: 'รหัสนิสิตไม่ตรงตามเงื่อนไขชั้นปีที่เปิดรับสมัคร',
    errorMessage:
      `บัญชี ${normalized} ไม่ได้ขึ้นต้นด้วยรหัส 66 (ชั้นปีที่ 4) หรือ 65 (ชั้นปีที่ 5) — กรุณาใช้อีเมลรหัสนิสิต 66xxxxxxxxx@msu.ac.th หรือ 65xxxxxxxxx@msu.ac.th เท่านั้น`,
  };
};

export const getMapSizeForContinent = (continentId: ContinentId = 'capsidia'): number => {
  return continentId === 'pangaea' ? PANGAEA_MAP_SIZE : MAP_SIZE;
};

export const stripTileDocPrefix = (docId: string): string => {
  return docId.replace(/^(capsidia|hemoria|synapsia|pangaea)_/, '');
};

export const toTileDocId = (continentId: ContinentId, coordOrDocId: string): string => {
  const cleanCoord = stripTileDocPrefix(coordOrDocId);
  if (continentId === 'capsidia') return cleanCoord; // Preserve 100% of existing Year 3 tile documents ("x,y")
  return `${continentId}_${cleanCoord}`;
};

// ── Tectonic World Merge (PANGAEA 120x120 Tri-Continent Offsets & Terrain) ──
export const PANGAEA_OFFSETS: Record<HomeContinentId, { offsetX: number; offsetY: number }> = {
  synapsia: { offsetX: 35, offsetY: 2 },  // North Continent (Year 5): x=35..84, y=2..51
  capsidia: { offsetX: 2, offsetY: 68 },  // Southwest Continent (Year 3): x=2..51, y=68..117
  hemoria: { offsetX: 68, offsetY: 68 },  // Southeast Continent (Year 4): x=68..117, y=68..117
};

export const translateHomeCoordToPangaea = (continentId: HomeContinentId, coord: string): string => {
  const clean = stripTileDocPrefix(coord);
  const [x, y] = clean.split(',').map(Number);
  const off = PANGAEA_OFFSETS[continentId];
  return `${x + off.offsetX},${y + off.offsetY}`;
};

export interface PangaeaTerrainInfo {
  terrain: 'continent' | 'bridge' | 'core' | 'ocean';
  homeland?: HomeContinentId;
}

export const getPangaeaTerrain = (x: number, y: number): PangaeaTerrainInfo => {
  // 1. Central Heartland Island (Pangaea World Core: 14x14 at 53..66, 53..66)
  if (x >= 53 && x <= 66 && y >= 53 && y <= 66) {
    return { terrain: 'core' };
  }

  // 2. Three Merged 50x50 Homeland Continents
  if (x >= 35 && x <= 84 && y >= 2 && y <= 51) {
    return { terrain: 'continent', homeland: 'synapsia' };
  }
  if (x >= 2 && x <= 51 && y >= 68 && y <= 117) {
    return { terrain: 'continent', homeland: 'capsidia' };
  }
  if (x >= 68 && x <= 117 && y >= 68 && y <= 117) {
    return { terrain: 'continent', homeland: 'hemoria' };
  }

  // 3. Three Chokepoint Land Bridges (Bio-Isthmus Causeways connecting all 3 Continents -> World Core)
  // North Bridge (Synapsia y=51 <-> Core y=53)
  if (y === 52 && x >= 57 && x <= 62) {
    return { terrain: 'bridge', homeland: 'synapsia' };
  }
  // Southwest Bridge (Capsidia NE corner <-> Core SW corner)
  if (
    (y === 67 && x >= 49 && x <= 55) ||
    (y === 66 && x >= 50 && x <= 52) ||
    (y === 65 && x >= 51 && x <= 52)
  ) {
    return { terrain: 'bridge', homeland: 'capsidia' };
  }
  // Southeast Bridge (Hemoria NW corner <-> Core SE corner)
  if (
    (y === 67 && x >= 64 && x <= 70) ||
    (y === 66 && x >= 67 && x <= 69) ||
    (y === 65 && x >= 67 && x <= 68)
  ) {
    return { terrain: 'bridge', homeland: 'hemoria' };
  }

  // 4. Everything else is Impassable Deep Bio-Ocean
  return { terrain: 'ocean' };
};

export const isPangaeaOceanTile = (x: number, y: number): boolean => {
  return getPangaeaTerrain(x, y).terrain === 'ocean';
};

// Helper: 4-Rim Sanctuary Zone for New Players
export const isSanctuaryZone = (x: number, y: number, continentId: ContinentId = 'capsidia'): boolean => {
  if (continentId === 'pangaea') {
    const info = getPangaeaTerrain(x, y);
    if (info.terrain !== 'continent' || !info.homeland) return false;
    const off = PANGAEA_OFFSETS[info.homeland];
    const lx = x - off.offsetX;
    const ly = y - off.offsetY;
    return lx < 4 || lx >= MAP_SIZE - 4 || ly < 4 || ly >= MAP_SIZE - 4;
  }
  return x < 4 || x >= MAP_SIZE - 4 || y < 4 || y >= MAP_SIZE - 4;
};

// Helper: Central Vault & Guardian Core Zone
export const isCentralVaultZone = (x: number, y: number, continentId: ContinentId = 'capsidia'): boolean => {
  if (continentId === 'pangaea') {
    // Central World Wonder Core on Pangaea (6x6 heart inside the 14x14 Core Island)
    return x >= 57 && x <= 62 && y >= 57 && y <= 62;
  }
  return x >= 22 && x <= 27 && y >= 22 && y <= 27;
};

// Helper: Check if tile has active beginner shield
export const isShieldedTile = (tile?: EmpireTile | null): boolean => {
  if (!tile?.shieldUntil) return false;
  return new Date(tile.shieldUntil).getTime() > Date.now();
};

// Helper: Calculate the 4-tile 2x2 cluster coordinates for a given top-left anchor (x,y)
export const getCitadel2x2Coords = (x: number, y: number): string[] => {
  return [
    `${x},${y}`,
    `${x + 1},${y}`,
    `${x},${y + 1}`,
    `${x + 1},${y + 1}`
  ];
};

// Helper: Check if tile is within 2 tiles of any cell in a Guild Citadel (Zone of Influence)
export const isCitadelInfluenceZone = (
  x: number, 
  y: number, 
  citadelCoord?: string | null, 
  citadelCoords?: string[] | null
): boolean => {
  const coords: string[] = [];
  if (Array.isArray(citadelCoords) && citadelCoords.length > 0) {
    coords.push(...citadelCoords);
  } else if (citadelCoord) {
    coords.push(citadelCoord);
  }
  if (coords.length === 0) return false;

  return coords.some((c) => {
    const [cx, cy] = c.split(',').map(Number);
    return Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2;
  });
};

// Helper: Check if territory is decayed (>72 hours inactive, immune if inside Citadel Influence Zone)
export const isDecayedTile = (
  tile?: EmpireTile | null, 
  guildCitadelCoord?: string | null,
  guildCitadelCoords?: string[] | null
): boolean => {
  if (!tile || tile.type !== 'player' || tile.isOutpost || tile.isCitadel) return false;
  if (isCitadelInfluenceZone(tile.x, tile.y, guildCitadelCoord, guildCitadelCoords)) return false;
  const lastActiveTime = tile.lastActive 
    ? new Date(tile.lastActive).getTime() 
    : tile.lastAttacked 
    ? new Date(tile.lastAttacked).getTime() 
    : 0;
  if (!lastActiveTime) return false;
  return Date.now() - lastActiveTime > 72 * 3600 * 1000;
};

// Map virus family to color
export const familyToColor = (family: string) => {
  const f = family.toLowerCase();
  if (f.includes('rabies')) return '#ef4444';
  if (f.includes('parvo')) return '#3b82f6';
  if (f.includes('corona')) return '#10b981';
  if (f.includes('retro')) return '#a855f7';
  if (f.includes('paramyxo')) return '#f97316';
  if (f.includes('arteri')) return '#ec4899';
  if (f.includes('picorna')) return '#eab308';
  if (f.includes('asfar')) return '#6366f1';
  if (f.includes('flavi')) return '#84cc16';
  if (f.includes('orthomyxo')) return '#14b8a6';
  return '#06b6d4';
};

// 12 Distinct Neon/Vibrant Tactical Colors for Students
export const PLAYER_PALETTE = [
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#d946ef', // Fuchsia
];

export const getPlayerUniqueColor = (uid: string, isCurrentPlayer: boolean) => {
  if (isCurrentPlayer) return '#06b6d4';
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PLAYER_PALETTE.length;
  return PLAYER_PALETTE[index];
};

export const getOwnerMonogram = (name?: string): string => {
  if (!name) return '?';
  const trimmed = name.trim();
  if (!trimmed) return '?';

  if (/^[A-Za-z]/.test(trimmed)) {
    const words = trimmed.split(/[\s_-]+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return trimmed.slice(0, 2).toUpperCase();
  }

  if (/^[\u0E40-\u0E44]/.test(trimmed)) {
    return trimmed.slice(0, 3);
  }

  if (trimmed.length >= 3 && /[\u0E30-\u0E39]/.test(trimmed[1])) {
    return trimmed.slice(0, 3);
  }

  return trimmed.slice(0, 2);
};

export const getVaultGuardianCoords = (): string[] => {
  const coords: string[] = [];
  for (let gx = 22; gx <= 27; gx++) {
    for (let gy = 22; gy <= 27; gy++) {
      if ((gx === 24 || gx === 25) && (gy === 24 || gy === 25)) continue;
      coords.push(`${gx},${gy}`);
    }
  }
  return coords;
};

export interface DefenseStructureConfig {
  id: 'bio_wall' | 'spike_wall' | 'sentry_tower' | 'regen_depot';
  name: string;
  icon: string;
  costExp: number;
  repairCostExp: number;
  bonusHp: number;
  bonusAtk: number;
  desc: string;
  badge: string;
  badgeColor: string;
}

export const DEFENSE_STRUCTURES: Record<string, DefenseStructureConfig> = {
  bio_wall: {
    id: 'bio_wall',
    name: 'กำแพงชีวภาพคัดหลั่ง (Bio-Wall)',
    icon: '🛡️',
    costExp: 250,
    repairCostExp: 50,
    bonusHp: 1500,
    bonusAtk: 15,
    desc: 'กำแพงด่านหน้า เพิ่ม HP ป้องกัน +1,500 และสะท้อน ATK +15 ป้องกันเมืองหลวงและเส้นทาง',
    badge: 'กำแพง Lv.1',
    badgeColor: 'border-cyan-400 text-cyan-300 bg-cyan-950/80',
  },
  spike_wall: {
    id: 'spike_wall',
    name: 'กำแพงหนามไกลโคโปรตีน (Spike Wall)',
    icon: '🧱',
    costExp: 600,
    repairCostExp: 100,
    bonusHp: 3500,
    bonusAtk: 30,
    desc: 'กำแพงหนาพิเศษชั้นใน เพิ่ม HP ป้องกัน +3,500 และสะท้อน ATK +30 ทนทานต่อการโจมตีสูงมาก',
    badge: 'กำแพงหนา Lv.2',
    badgeColor: 'border-amber-400 text-amber-300 bg-amber-950/80',
  },
  sentry_tower: {
    id: 'sentry_tower',
    name: 'ป้อมแอนติบอดีคอยยิงสวน (Antibody Sentry)',
    icon: '🏹',
    costExp: 450,
    repairCostExp: 75,
    bonusHp: 1800,
    bonusAtk: 45,
    desc: 'ป้อมชีวภาพยิงสวน เพิ่ม HP +1,800 และมี ATK สวนกลับสูง +45 ช่วยหยุดยั้งศัตรู',
    badge: 'ป้อมยิงโจมตี',
    badgeColor: 'border-rose-400 text-rose-300 bg-rose-950/80',
  },
  regen_depot: {
    id: 'regen_depot',
    name: 'สถานีฟื้นฟูชีวะ (Regen Bio-Depot)',
    icon: '💚',
    costExp: 350,
    repairCostExp: 60,
    bonusHp: 1200,
    bonusAtk: 10,
    desc: 'สถานีฟื้นฟูแนวรบ เพิ่ม HP +1,200 และช่วยเพิ่มขวัญกำลังใจให้กองกำลังในกิลด์',
    badge: 'สถานีฟื้นฟู',
    badgeColor: 'border-emerald-400 text-emerald-300 bg-emerald-950/80',
  },
};

export const SCOUT_FALLBACK_QUIZ = [
  {
    q: "ไวรัสที่มีสารพันธุกรรมเป็น RNA สายเดี่ยว แบบบวก (ssRNA(+)) สามารถทำหน้าที่ใดได้โดยตรงเมื่อเข้าสู่เซลล์โฮสต์?",
    options: [
      "ทำหน้าที่เป็น mRNA ให้ไรโบโซมสังเคราะห์โปรตีนได้ทันที",
      "ต้องสังเคราะห์เป็น DNA สายคู่ก่อนด้วย Reverse Transcriptase",
      "ต้องถูกถอดรหัสเป็น RNA สายลบก่อนจึงจะเริ่มกระบวนการแปลรหัสได้",
      "แทรกตัวเข้าสู่โครโมโซมในนิวเคลียสของโฮสต์ก่อนเริ่มสร้างโปรตีน"
    ],
    answer: 0,
    explanation: "ssRNA(+) มี polarity เดียวกับ mRNA ของสิ่งมีชีวิต จึงสามารถจับกับไรโบโซมของโฮสต์และแปลรหัส (translation) เป็นโปรตีนไวรัสได้ทันที"
  },
  {
    q: "การติดเชื้อ African Swine Fever Virus (ASFV) ในสุกร มีลักษณะสำคัญอย่างไร?",
    options: [
      "เป็นไวรัส RNA ไม่มีเปลือกหุ้มที่ก่อโรคทางเดินหายใจเฉียบพลันและรักษาหายได้ง่าย",
      "เป็นไวรัส DNA ขนาดใหญ่ที่มีเปลือกหุ้ม ก่อไข้สูง เลือดออกใต้ผิวหนัง และตายเกือบ 100%",
      "มีวัคซีนเชื้อตายมาตรฐานที่มีประสิทธิภาพสูงใช้ป้องกันและกำจัดโรคได้อย่างแพร่หลาย",
      "ติดต่อเฉพาะทางการหายใจในฤดูหนาวเท่านั้น ไม่สามารถติดต่อผ่านเศษเนื้อหรือพาหะนำโรค"
    ],
    answer: 1,
    explanation: "ASFV เป็นไวรัส DNA ในวงศ์ Asfarviridae มีเปลือกหุ้ม ก่อให้เกิดไข้เลือดออกรุนแรงในสุกร อัตราป่วยตายสูงถึง 100%"
  },
  {
    q: "โครงสร้างใดของไวรัสที่มีผลต่อความทนทานต่อสารฆ่าเชื้อและสภาพแวดล้อมภายนอกมากที่สุด?",
    options: [
      "จำนวนยีนและขนาดความยาวของโมเลกุลกรดนิวคลีอิกจีโนม",
      "ขนาดความกว้างและความสูงของแคปซิด (Capsid size nm)",
      "การมีหรือไม่มีเปลือกหุ้มไขมัน (Viral Lipid Envelope)",
      "ชนิดของเอนไซม์และโปรตีนเมทริกซ์ภายในอนุภาคไวรัส"
    ],
    answer: 2,
    explanation: "ไวรัสที่มีเปลือกหุ้ม (Enveloped virus) จะถูกทำลายได้ง่ายด้วยสบู่ แอลกอฮอล์ และน้ำยาฆ่าเชื้อเนื่องจากไขมันสลายตัวได้ง่าย ในขณะที่ Naked virus (ไม่มีเปลือกหุ้ม) จะทนทานต่อสารเคมีและสิ่งแวดล้อมมากกว่ามาก"
  },
  {
    q: "Hemagglutinin (HA) และ Neuraminidase (NA) บนอนุภาคของไวรัสไข้หวัดใหญ่ (Influenza A) ทำหน้าที่หลักใดตามลำดับ?",
    options: [
      "HA ช่วยให้ไวรัสจำลองตัวในนิวเคลียส / NA ช่วยให้ไวรัสหลบหลีกการตรวจจับของแอนติบอดีในกระแสเลือด",
      "HA ย่อยสลายเยื่อหุ้มเซลล์ของโฮสต์ / NA จับกับตัวรับไกลโคโปรตีนเพื่อเหนี่ยวนำให้เกิดการดูดซึมอาหาร",
      "ทั้งสองทำหน้าที่เดียวกันคือสังเคราะห์โปรตีนโครงสร้างและสร้างพลังงานพันธะฟอสเฟตสูงภายในอนุภาค",
      "HA จับกับ Sialic acid receptor เพื่อเข้าเซลล์ / NA ตัด Sialic acid เพื่อปลดปล่อยอนุภาคไวรัสใหม่ออกจากเซลล์"
    ],
    answer: 3,
    explanation: "HA (Hemagglutinin) ทำหน้าที่ยึดจับกับ Sialic acid บนผิวเซลล์โฮสต์เพื่อเหนี่ยวนำให้เกิด Endocytosis ส่วน NA (Neuraminidase) ช่วยตัดพันธะกรดไซอะลิกเพื่อให้ไวรัสรุ่นลูกหลุดออกจากผิวเซลล์ไปติดเซลล์ข้างเคียง"
  }
];
