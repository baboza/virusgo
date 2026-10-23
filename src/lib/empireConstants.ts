import { EmpireTile } from '@/types';

export const MAP_SIZE = 50; // 50x50 = 2,500 sectors

// Helper: 4-Rim Sanctuary Zone for New Players
export const isSanctuaryZone = (x: number, y: number): boolean => {
  return x < 4 || x >= MAP_SIZE - 4 || y < 4 || y >= MAP_SIZE - 4;
};

// Helper: Central Vault & Guardian Core Zone
export const isCentralVaultZone = (x: number, y: number): boolean => {
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
