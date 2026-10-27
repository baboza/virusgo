import { HeroEquipment, HeroUnitStack, HeroArmyData } from '@/types';

export interface EquipmentItem {
  id: string;
  name: string;
  slot: 'head' | 'weapon' | 'armor' | 'scroll';
  icon: string;
  bonusText: string;
  hpPercent?: number;
  atkPercent?: number;
  retaliationReduction?: number; // e.g. 0.25 (takes 25% less damage when enemy retaliates)
  timerBonusSec?: number; // e.g. +2s for question answering
  costExp: number;
  requiredExp?: number; // EXP Milestone to unlock in HoMM Blacksmith / Vault
}

export const BIO_ARTIFACTS: Record<string, EquipmentItem> = {
  capsomer_crown: {
    id: 'capsomer_crown',
    name: 'Capsomer Crown',
    slot: 'head',
    icon: '👑',
    bonusText: '+20% HP ให้กองทัพทั้งหมด',
    hpPercent: 0.20,
    costExp: 200,
    requiredExp: 1000,
  },
  glycoprotein_spike: {
    id: 'glycoprotein_spike',
    name: 'Glycoprotein Spike',
    slot: 'weapon',
    icon: '🗡️',
    bonusText: '+20% ATK ดาเมจโจมตีให้กองทัพ',
    atkPercent: 0.20,
    costExp: 200,
    requiredExp: 1500,
  },
  lipid_envelope: {
    id: 'lipid_envelope',
    name: 'Lipid Envelope',
    slot: 'armor',
    icon: '🛡️',
    bonusText: 'ลดความเสียหายจากการถูกสวนกลับ (Retaliation) ลง 30%',
    retaliationReduction: 0.30,
    costExp: 250,
    requiredExp: 2000,
  },
  polymerase_scroll: {
    id: 'polymerase_scroll',
    name: 'Polymerase Scroll',
    slot: 'scroll',
    icon: '📜',
    bonusText: '+2 วินาที สำหรับเวลาตอบคำถามทุกข้อ (ขยายเพดานสู่ 20s)',
    timerBonusSec: 2,
    costExp: 150,
    requiredExp: 2500,
  },
};

export interface VirusUnitTemplate {
  virusId: string;
  virusName: string;
  family: string;
  tier: number; // 1 (Swarm), 2 (Core), 3 (Elite)
  baseHp: number;
  baseAtk: number;
  replicateCostExp: number;
  replicateBatch: number;
  description: string;
}

export const VIRUS_UNIT_TEMPLATES: Record<string, VirusUnitTemplate> = {
  parvo: {
    virusId: 'cpv',
    virusName: 'Canine Parvovirus',
    family: 'parvo',
    tier: 1,
    baseHp: 18,
    baseAtk: 4,
    replicateCostExp: 30,
    replicateBatch: 15, // +15 virions per replication
    description: 'Naked icosahedral capsid ทนทานสูงต่อสิ่งแวดล้อม ขยายพันธุ์ได้รวดเร็ว',
  },
  corona: {
    virusId: 'fip',
    virusName: 'Feline Coronavirus',
    family: 'corona',
    tier: 2,
    baseHp: 45,
    baseAtk: 12,
    replicateCostExp: 60,
    replicateBatch: 8, // +8 virions per replication
    description: 'Enveloped virus มีหนามโปรตีนสำหรับเกาะติดเซลล์โฮสต์ มีพลังทำลายปานกลาง',
  },
  rabies: {
    virusId: 'rabies',
    virusName: 'Rabies Virus',
    family: 'rabies',
    tier: 3,
    baseHp: 110,
    baseAtk: 35,
    replicateCostExp: 120,
    replicateBatch: 3, // +3 elite virions per replication
    description: 'Rhabdovirus ทรงกระสุนปืน พิษสงทำลายระบบประสาท สวนกลับรุนแรงถึงชีวิต',
  },
};

/**
 * Returns a standardized starter army if user doesn't have one yet.
 */
export function getDefaultHeroArmy(preferredFamily?: string): HeroArmyData {
  return {
    equipment: {
      head: 'capsomer_crown',
      weapon: 'glycoprotein_spike',
    },
    stacks: [
      {
        id: 'stack_1',
        virusId: VIRUS_UNIT_TEMPLATES.parvo.virusId,
        virusName: VIRUS_UNIT_TEMPLATES.parvo.virusName,
        family: VIRUS_UNIT_TEMPLATES.parvo.family,
        tier: 1,
        count: 60, // 60x Parvo
        baseHp: VIRUS_UNIT_TEMPLATES.parvo.baseHp,
        baseAtk: VIRUS_UNIT_TEMPLATES.parvo.baseAtk,
      },
      {
        id: 'stack_2',
        virusId: VIRUS_UNIT_TEMPLATES.corona.virusId,
        virusName: VIRUS_UNIT_TEMPLATES.corona.virusName,
        family: VIRUS_UNIT_TEMPLATES.corona.family,
        tier: 2,
        count: 20, // 20x Corona
        baseHp: VIRUS_UNIT_TEMPLATES.corona.baseHp,
        baseAtk: VIRUS_UNIT_TEMPLATES.corona.baseAtk,
      },
      {
        id: 'stack_3',
        virusId: VIRUS_UNIT_TEMPLATES.rabies.virusId,
        virusName: VIRUS_UNIT_TEMPLATES.rabies.virusName,
        family: VIRUS_UNIT_TEMPLATES.rabies.family,
        tier: 3,
        count: 4, // 4x Rabies
        baseHp: VIRUS_UNIT_TEMPLATES.rabies.baseHp,
        baseAtk: VIRUS_UNIT_TEMPLATES.rabies.baseAtk,
      },
    ],
    lastReplicated: new Date().toISOString(),
    lastPassiveRegen: new Date().toISOString(),
  };
}

/**
 * Ensures user army is always viable for combat (anti-softlock).
 * 1. If troops are completely wiped out, awards an Emergency Bio-Rescue Platoon (30 Parvo, 10 Corona, 2 Rabies).
 * 2. If time elapsed >= 30 minutes, passively regenerates virions up to starter caps (Parvo: 60, Corona: 20, Rabies: 4).
 */
export function ensureViableArmy(
  userArmy?: HeroArmyData | null,
  preferredFamily?: string
): { army: HeroArmyData; wasModified: boolean; rescueGranted: boolean; regenCount: number } {
  let wasModified = false;
  let rescueGranted = false;
  let totalRegened = 0;

  if (!userArmy || !userArmy.stacks || userArmy.stacks.length === 0) {
    return {
      army: getDefaultHeroArmy(preferredFamily),
      wasModified: true,
      rescueGranted: false,
      regenCount: 0,
    };
  }

  // Clone stacks to avoid mutating in place
  const updatedStacks: HeroUnitStack[] = userArmy.stacks.map(s => ({ ...s }));

  // Ensure 3 standard stacks exist
  const hasParvo = updatedStacks.some(s => s.virusId === 'cpv' || s.family === 'parvo');
  const hasCorona = updatedStacks.some(s => s.virusId === 'fip' || s.family === 'corona');
  const hasRabies = updatedStacks.some(s => s.virusId === 'rabies' || s.family === 'rabies');

  if (!hasParvo) {
    updatedStacks.push({
      id: `stack_${updatedStacks.length + 1}`,
      virusId: VIRUS_UNIT_TEMPLATES.parvo.virusId,
      virusName: VIRUS_UNIT_TEMPLATES.parvo.virusName,
      family: VIRUS_UNIT_TEMPLATES.parvo.family,
      tier: 1,
      count: 0,
      baseHp: VIRUS_UNIT_TEMPLATES.parvo.baseHp,
      baseAtk: VIRUS_UNIT_TEMPLATES.parvo.baseAtk,
    });
    wasModified = true;
  }
  if (!hasCorona) {
    updatedStacks.push({
      id: `stack_${updatedStacks.length + 1}`,
      virusId: VIRUS_UNIT_TEMPLATES.corona.virusId,
      virusName: VIRUS_UNIT_TEMPLATES.corona.virusName,
      family: VIRUS_UNIT_TEMPLATES.corona.family,
      tier: 2,
      count: 0,
      baseHp: VIRUS_UNIT_TEMPLATES.corona.baseHp,
      baseAtk: VIRUS_UNIT_TEMPLATES.corona.baseAtk,
    });
    wasModified = true;
  }
  if (!hasRabies) {
    updatedStacks.push({
      id: `stack_${updatedStacks.length + 1}`,
      virusId: VIRUS_UNIT_TEMPLATES.rabies.virusId,
      virusName: VIRUS_UNIT_TEMPLATES.rabies.virusName,
      family: VIRUS_UNIT_TEMPLATES.rabies.family,
      tier: 3,
      count: 0,
      baseHp: VIRUS_UNIT_TEMPLATES.rabies.baseHp,
      baseAtk: VIRUS_UNIT_TEMPLATES.rabies.baseAtk,
    });
    wasModified = true;
  }

  const totalLiving = updatedStacks.reduce((sum, s) => sum + (s.count || 0), 0);

  // 1. Anti-Softlock: Emergency Bio-Rescue Platoon if wiped out
  if (totalLiving <= 0) {
    updatedStacks.forEach(s => {
      if (s.family === 'parvo' || s.virusId === 'cpv') {
        s.count = Math.max(s.count, 30); // 30 Parvo virions
      } else if (s.family === 'corona' || s.virusId === 'fip') {
        s.count = Math.max(s.count, 10); // 10 Corona virions
      } else if (s.family === 'rabies' || s.virusId === 'rabies') {
        s.count = Math.max(s.count, 2);  // 2 Rabies virions
      }
    });
    wasModified = true;
    rescueGranted = true;
  } else {
    // 2. Passive Regeneration (every 30 mins, up to starter caps: Parvo=60, Corona=20, Rabies=4)
    const now = Date.now();
    const lastTimeStr = userArmy.lastPassiveRegen || userArmy.lastReplicated;
    const lastTime = lastTimeStr ? new Date(lastTimeStr).getTime() : now;
    const diffMinutes = Math.floor((now - lastTime) / (60 * 1000));

    if (diffMinutes >= 30) {
      const cycles = Math.min(6, Math.floor(diffMinutes / 30)); // Max 6 cycles (3 hours)
      if (cycles > 0) {
        updatedStacks.forEach(s => {
          if (s.family === 'parvo' || s.virusId === 'cpv') {
            if (s.count < 60) {
              const added = Math.min(60 - s.count, cycles * 10);
              if (added > 0) {
                s.count += added;
                totalRegened += added;
                wasModified = true;
              }
            }
          } else if (s.family === 'corona' || s.virusId === 'fip') {
            if (s.count < 20) {
              const added = Math.min(20 - s.count, cycles * 3);
              if (added > 0) {
                s.count += added;
                totalRegened += added;
                wasModified = true;
              }
            }
          } else if (s.family === 'rabies' || s.virusId === 'rabies') {
            if (s.count < 4) {
              const added = Math.min(4 - s.count, cycles * 1);
              if (added > 0) {
                s.count += added;
                totalRegened += added;
                wasModified = true;
              }
            }
          }
        });
      }
    }
  }

  const resultArmy: HeroArmyData = {
    ...userArmy,
    stacks: updatedStacks,
    lastPassiveRegen: wasModified ? new Date().toISOString() : userArmy.lastPassiveRegen,
  };

  return {
    army: resultArmy,
    wasModified,
    rescueGranted,
    regenCount: totalRegened,
  };
}

/**
 * Generates an appropriate defender army for empty sectors, outposts, or boss tiles
 */
export function generateWildDefenderArmy(tileType: string, isVault = false): HeroUnitStack[] {
  if (tileType === 'boss' || isVault) {
    return [
      {
        id: 'wild_1',
        virusId: 'cpv',
        virusName: 'Guardian Parvo Swarm',
        family: 'parvo',
        tier: 1,
        count: 140,
        baseHp: 20,
        baseAtk: 5,
      },
      {
        id: 'wild_2',
        virusId: 'corona',
        virusName: 'Citadel Spike Core',
        family: 'corona',
        tier: 2,
        count: 45,
        baseHp: 50,
        baseAtk: 14,
      },
      {
        id: 'wild_3',
        virusId: 'rabies',
        virusName: 'Titan Rabies Capsid',
        family: 'rabies',
        tier: 3,
        count: 12,
        baseHp: 125,
        baseAtk: 40,
      },
    ];
  }

  if (tileType === 'outpost') {
    return [
      {
        id: 'wild_1',
        virusId: 'cpv',
        virusName: 'Lab Parvo Culture',
        family: 'parvo',
        tier: 1,
        count: 75,
        baseHp: 18,
        baseAtk: 4,
      },
      {
        id: 'wild_2',
        virusId: 'corona',
        virusName: 'Bio-Reactor Corona',
        family: 'corona',
        tier: 2,
        count: 25,
        baseHp: 45,
        baseAtk: 12,
      },
      {
        id: 'wild_3',
        virusId: 'rabies',
        virusName: 'Sentinel Rabies',
        family: 'rabies',
        tier: 3,
        count: 5,
        baseHp: 110,
        baseAtk: 35,
      },
    ];
  }

  // Neutral empty territory (Wild cell colony)
  return [
    {
      id: 'wild_1',
      virusId: 'cpv',
      virusName: 'Wild Parvo Virions',
      family: 'parvo',
      tier: 1,
      count: 25,
      baseHp: 15,
      baseAtk: 3,
    },
    {
      id: 'wild_2',
      virusId: 'corona',
      virusName: 'Wild Corona Cluster',
      family: 'corona',
      tier: 2,
      count: 8,
      baseHp: 40,
      baseAtk: 9,
    },
  ];
}

/**
 * Calculates total effective attack damage dealt by a stack.
 */
export function calculateAttackDamage(
  attackerStack: HeroUnitStack,
  heroStr = 1,
  isCrit = false,
  equipment?: HeroEquipment
): number {
  let atkMult = 1 + (heroStr * 0.05);

  if (equipment?.weapon && BIO_ARTIFACTS[equipment.weapon]?.atkPercent) {
    atkMult += BIO_ARTIFACTS[equipment.weapon].atkPercent || 0.20;
  }

  const baseDmg = attackerStack.count * attackerStack.baseAtk * atkMult;
  const finalDmg = isCrit ? baseDmg * 1.5 : baseDmg;
  return Math.max(1, Math.round(finalDmg));
}

/**
 * Calculates retaliation (counter-attack) damage dealt by defender stack to attacker stack.
 * In HoMM, retaliation happens if defender stack survived the initial hit.
 */
export function calculateRetaliationDamage(
  defenderStack: HeroUnitStack,
  attackerEquipment?: HeroEquipment
): number {
  if (defenderStack.count <= 0) return 0;

  let retaliationDmg = defenderStack.count * defenderStack.baseAtk * 0.70; // 70% of standard attack

  // Lipid Envelope armor reduces retaliation damage taken by attacker
  if (attackerEquipment?.armor && BIO_ARTIFACTS[attackerEquipment.armor]?.retaliationReduction) {
    retaliationDmg *= (1 - BIO_ARTIFACTS[attackerEquipment.armor].retaliationReduction!);
  }

  return Math.max(1, Math.round(retaliationDmg));
}

/**
 * Applies damage to a stack and returns remaining count and casualties.
 */
export function applyDamageToStack(
  stack: HeroUnitStack,
  damage: number,
  equipment?: HeroEquipment
): { remainingCount: number; casualties: number; overkillDmg: number } {
  let singleHp = stack.baseHp;
  if (equipment?.head && BIO_ARTIFACTS[equipment.head]?.hpPercent) {
    singleHp *= (1 + BIO_ARTIFACTS[equipment.head].hpPercent!);
  }

  const totalCurrentHp = stack.count * singleHp;
  const remainingHp = Math.max(0, totalCurrentHp - damage);
  const remainingCount = Math.ceil(remainingHp / singleHp);
  const casualties = Math.max(0, stack.count - remainingCount);
  const overkillDmg = Math.max(0, damage - totalCurrentHp);

  return { remainingCount, casualties, overkillDmg };
}
