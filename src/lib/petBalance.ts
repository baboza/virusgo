// Pet Balance System: Approach 1 (Stat Soft Cap / Hard Cap)
// Ensures fair play between veteran students and new students

export const MAX_PET_STAT_POINTS = 50; // Max points earnable from EXP (at 5,000 EXP)
export const MAX_PER_STAT = 20;        // Hard cap per individual stat (STR, VIT, AGI, DEX)
export const EXP_PER_STAT_POINT = 100; // 1 Stat point per 100 EXP

export interface PetCombatStats {
  str: number;
  vit: number;
  agi: number;
  dex: number;
  spentPoints: number;
  availablePoints: number;
  totalEarnedPoints: number;
  maxPointsCap: number;
  maxPerStatCap: number;
  maxHp: number;
  atk: number;
  def: number;
  attack: number;
  defense: number;
  quizTime: number;
  critRate: number;
  combatPower: number;
  rankTitle: string;
  rankTier: string;
  rankBadgeColor: string;
  isMaxed: boolean;
}

/**
 * Calculates effective combat stats with hard caps to protect game balance.
 * Clamps stats so veteran players don't one-shot new players.
 */
export function getEffectivePetStats(
  rawStats?: { str?: number; vit?: number; agi?: number; dex?: number; spentPoints?: number },
  userExp: number = 0
): PetCombatStats {
  // 1. Clamp individual stats to [1..MAX_PER_STAT]
  const str = Math.min(MAX_PER_STAT, Math.max(1, Number(rawStats?.str || 1)));
  const vit = Math.min(MAX_PER_STAT, Math.max(1, Number(rawStats?.vit || 1)));
  const agi = Math.min(MAX_PER_STAT, Math.max(1, Number(rawStats?.agi || 1)));
  const dex = Math.min(MAX_PER_STAT, Math.max(1, Number(rawStats?.dex || 1)));

  // Total points earned from EXP, capped at MAX_PET_STAT_POINTS
  const rawEarnedPoints = Math.floor(Math.max(0, userExp) / EXP_PER_STAT_POINT);
  const totalEarnedPoints = Math.min(MAX_PET_STAT_POINTS, rawEarnedPoints);

  // Spent points clamped to cap
  const spentPoints = Math.min(MAX_PET_STAT_POINTS, Math.max(0, Number(rawStats?.spentPoints || 0)));
  const availablePoints = Math.max(0, totalEarnedPoints - spentPoints);

  // 2. Combat Formulas
  const maxHp = 100 + (vit * 20);
  const atk = 20 + (str * 10);
  const def = Math.floor(vit * 5);
  const quizTime = 15 + (agi * 2);
  const critRate = Math.min(75, dex * 5);
  const combatPower = Math.floor((maxHp * 1.2) + (atk * 2.5) + (def * 2) + (critRate * 10) + (quizTime * 5));

  // 3. Prestige Rank Titles based on user EXP (Honoring veteran dedication beyond stat cap)
  let rankTitle = 'ผู้พิทักษ์ฝึกหัด (Cadet)';
  let rankTier = 'Cadet';
  let rankBadgeColor = '#94a3b8'; // Slate

  if (userExp >= 10000) {
    rankTitle = '🌟 มหาปรมาจารย์ไวรัสวิทยา (Grandmaster Virologist)';
    rankTier = 'Grandmaster';
    rankBadgeColor = '#fbbf24'; // Amber Gold
  } else if (userExp >= 7500) {
    rankTitle = '👑 ปรมาจารย์โรคระบาด (Pathogen Master)';
    rankTier = 'Master';
    rankBadgeColor = '#ec4899'; // Pink Rose
  } else if (userExp >= 5000) {
    rankTitle = '🛡️ นักล่าไวรัสระดับสูง (Elite Hunter)';
    rankTier = 'Elite';
    rankBadgeColor = '#a855f7'; // Purple
  } else if (userExp >= 3000) {
    rankTitle = '🔬 ผู้เชี่ยวชาญไวรัสวิทยา (Virology Specialist)';
    rankTier = 'Specialist';
    rankBadgeColor = '#06b6d4'; // Cyan
  } else if (userExp >= 1000) {
    rankTitle = '🧪 นักวิจัยไวรัส (Junior Virologist)';
    rankTier = 'Junior';
    rankBadgeColor = '#10b981'; // Emerald
  }

  return {
    str,
    vit,
    agi,
    dex,
    spentPoints,
    availablePoints,
    totalEarnedPoints,
    maxPointsCap: MAX_PET_STAT_POINTS,
    maxPerStatCap: MAX_PER_STAT,
    maxHp,
    atk,
    def,
    attack: atk,
    defense: def,
    quizTime,
    critRate,
    combatPower,
    rankTitle,
    rankTier,
    rankBadgeColor,
    isMaxed: spentPoints >= MAX_PET_STAT_POINTS,
  };
}
