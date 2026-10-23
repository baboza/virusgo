"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Heart, ArrowLeft, Swords, Loader2, Box, 
  Crosshair, Sparkles, Layers, Crown, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useSearchParams, useRouter } from 'next/navigation';
import { EmpireTile, User, Guild, HeroUnitStack, HeroEquipment, HeroArmyData } from '@/types';
import { familyToColor, isDecayedTile, isShieldedTile, isCentralVaultZone } from '@/app/student/empire/page';
import { getDailyEmpireInfo, DAILY_EMPIRE_ATTACK_LIMIT, getTodayDateString } from '@/lib/dailyExpCap';
import { getEffectivePetStats } from '@/lib/petBalance';
import { 
  BIO_ARTIFACTS, 
  getDefaultHeroArmy, 
  generateWildDefenderArmy, 
  calculateAttackDamage, 
  calculateRetaliationDamage, 
  applyDamageToStack 
} from '@/lib/heroArmy';
import { ALL_15_CHAPTER_QUESTIONS } from '@/data/veterinaryVirologyContent';

const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">Loading 3D...</div>
});

// Shuffle array helper
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

type QuizItem = { q: string; choices: string[]; answer: string };

// Generate 150 balanced curriculum questions with randomized choices (0ms delay, 0 Firestore reads)
function getInitialBattleQuestions(): QuizItem[] {
  if (ALL_15_CHAPTER_QUESTIONS && ALL_15_CHAPTER_QUESTIONS.length > 0) {
    return shuffle(
      ALL_15_CHAPTER_QUESTIONS.map(q => ({
        q: q.q,
        choices: shuffle([...q.choices]),
        answer: q.answer
      }))
    );
  }
  return [
    { q: "ไวรัสชนิดใดที่มีรูปร่างคล้ายกระสุนปืน (Bullet-shaped)?", choices: shuffle(["Rabies Virus", "Influenza Virus", "Parvovirus", "Rotavirus"]), answer: "Rabies Virus" },
    { q: "Negri bodies เป็นลักษณะเฉพาะของโรคใด?", choices: shuffle(["Rabies", "Canine Distemper", "Feline Panleukopenia", "FIV"]), answer: "Rabies" }
  ];
}

function BattleContent() {
  const { appUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tileId = searchParams.get('tile');

  const [loading, setLoading] = useState(false);
  const [tile, setTile] = useState<EmpireTile | null>(null);
  const [questionsBank, setQuestionsBank] = useState<QuizItem[]>(() => getInitialBattleQuestions());
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [isHit, setIsHit] = useState(false);
  const [is3DMode, setIs3DMode] = useState(true);
  const [awardedExp, setAwardedExp] = useState<number>(15);
  const [isFirstBaseClaimed, setIsFirstBaseClaimed] = useState(false);
  const [isHeroDuel, setIsHeroDuel] = useState(false);

  // ── HoMM System State: Synchronously Pre-populated (0ms delay) ──
  const initialArmy = useMemo(() => getDefaultHeroArmy(appUser?.pet?.family || 'parvo'), [appUser?.pet?.family]);
  const initialStacks = useMemo<HeroUnitStack[]>(() => {
    if (appUser?.pet?.hero?.stacks && appUser.pet.hero.stacks.length > 0) {
      return appUser.pet.hero.stacks;
    }
    return initialArmy.stacks || [];
  }, [appUser?.pet?.hero?.stacks, initialArmy.stacks]);
  const [attackerHero, setAttackerHero] = useState<HeroArmyData>(appUser?.pet?.hero || initialArmy);
  const [attackerStacks, setAttackerStacks] = useState<HeroUnitStack[]>(initialStacks);
  const [selectedAttackerId, setSelectedAttackerId] = useState<string>(initialStacks[0]?.id || 'stack_1');

  const initialWild = useMemo(() => generateWildDefenderArmy('empty'), []);
  const [defenderStacks, setDefenderStacks] = useState<HeroUnitStack[]>(initialWild);
  const [selectedDefenderId, setSelectedDefenderId] = useState<string>(initialWild[0]?.id || 'wild_1');
  const [defenderEquipment, setDefenderEquipment] = useState<HeroEquipment | undefined>();
  const [defenderInfo, setDefenderInfo] = useState({
    name: 'เซลล์ร่างกายอ่อนแอ (Wild Virions)',
    family: 'corona',
    isBoss: false,
    isOutpost: false,
    isPlayer: false,
  });

  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [showDamageAnim, setShowDamageAnim] = useState<{
    targetStackId: string;
    amount: number;
    casualties: number;
    isCrit?: boolean;
    isRetaliation?: boolean;
  } | null>(null);

  const hasInitializedRef = useRef(false);

  // ── Quiz System: 150 Balanced Questions Synchronously Pre-populated (0ms delay, 0 Firestore reads) ──
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('virusgo_empire_quiz');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQuestionsBank(shuffle(parsed));
          }
        } catch (_) {}
      }
    }
  }, []);

  // Initialize Battle Background Data
  useEffect(() => {
    if (!tileId) return;
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Synchronously cache current sector in localStorage for instant hero persistence
    if (typeof window !== 'undefined' && tileId) {
      localStorage.setItem('virusgo_hero_coord', tileId);
    }

    const initBattle = async () => {
      try {
        const currentUid = appUser?.uid || auth.currentUser?.uid;
        const petFamily = appUser?.pet?.family || 'parvo';
        const userArmy = appUser?.pet?.hero || getDefaultHeroArmy(petFamily);
        const validAttackerStacks = (userArmy.stacks || []).map(s => ({ ...s }));
        
        // Ensure at least 1 stack exists
        if (validAttackerStacks.length === 0) {
          const starter = getDefaultHeroArmy(petFamily);
          validAttackerStacks.push(...(starter.stacks || []));
        }

        setAttackerHero(userArmy);
        setAttackerStacks(validAttackerStacks);
        setSelectedAttackerId(validAttackerStacks[0]?.id || 'stack_1');

        // Check if user currently has any bases (exempt first base Drop Pod placement from daily limit)
        const hasExistingBase = Boolean((appUser?.conqueredTiles && appUser.conqueredTiles > 0) || appUser?.pet?.currentTileCoord);

        // Daily Attack Limit Check using real-time auth user state (0 extra network latency!)
        if (appUser) {
          const empireDaily = getDailyEmpireInfo(appUser);
          if (hasExistingBase && !empireDaily.canAttack) {
            alert(`⛔ คุณใช้โควตาการบุกรุกครบ ${DAILY_EMPIRE_ATTACK_LIMIT} ครั้งสำหรับวันนี้แล้ว! (รีเซ็ตทุกเที่ยงคืน)`);
            router.push('/student/empire');
            return;
          }

          if (currentUid) {
            const userRef = doc(db, 'users', currentUid);
            const userUpdates: Record<string, any> = {
              'pet.currentTileCoord': tileId,
            };
            if (hasExistingBase) {
              const todayDate = getTodayDateString();
              const isTodayRecord = appUser?.dailyEmpireBattles?.date === todayDate;
              const currentCount = isTodayRecord ? (Number(appUser?.dailyEmpireBattles?.count) || 0) : 0;
              userUpdates.dailyEmpireBattles = {
                date: todayDate,
                count: currentCount + 1,
              };
            }
            updateDoc(userRef, userUpdates).catch(console.error);
          }
        }

        // 2. Fetch Tile & Setup Defender Army (HoMM 3-Stack) - Single Doc Direct Lookup
        const tileRef = doc(db, 'empire_tiles', tileId);
        const tileSnap = await getDoc(tileRef);

        let currentTile: EmpireTile;
        if (tileSnap.exists()) {
          currentTile = tileSnap.data() as EmpireTile;
        } else {
          const [x, y] = tileId.split(',').map(Number);
          currentTile = { id: tileId, x, y, type: 'empty' };
        }
        setTile(currentTile);

        // Security check: Drop Pod (first base) restrictions
        if (!hasExistingBase) {
          const [tx, ty] = (currentTile.id || tileId).split(',').map(Number);
          const isVault = isCentralVaultZone(tx, ty) || currentTile.ownerName?.includes('ผู้พิทักษ์');
          if (currentTile.isOutpost || currentTile.type === 'outpost' || isVault) {
            alert('⛔ ไม่สามารถใช้สิทธิ Drop Pod สถาปนาฐานแรกในจุดฟาร์มวิจัย (Outpost) หรือเขตห้องนิรภัยใจกลางเมือง (Vault) ได้!');
            router.push('/student/empire');
            return;
          }
        }

        // Security check: Shielded tile
        if (isShieldedTile(currentTile)) {
          alert('🛡️ เซกเตอร์นี้ได้รับการคุ้มครองด้วยบาเรียมือใหม่ ไม่สามารถโจมตีได้');
          router.push('/student/empire');
          return;
        }

        // Setup Defender 3-Stack Armies
        let defStacks: HeroUnitStack[] = [];
        let defEquip: HeroEquipment | undefined = currentTile.defenderEquipment;
        let defName = 'เซลล์สิ่งแวดล้อม';
        let defFamily = 'corona';

        if (currentTile.defenderStacks && currentTile.defenderStacks.length > 0) {
          // Use persisted defender stacks if available
          defStacks = currentTile.defenderStacks.map(s => ({ ...s }));
          defName = currentTile.ownerName || 'กองทัพพิทักษ์ดินแดน';
          defFamily = currentTile.ownerFamily || 'parvo';
        } else if (currentTile.type === 'empty') {
          defStacks = generateWildDefenderArmy('empty');
          defName = 'เซลล์ร่างกายอ่อนแอ (Wild Virions)';
          defFamily = 'corona';
        } else if (currentTile.type === 'outpost' || currentTile.isOutpost) {
          defStacks = generateWildDefenderArmy('outpost');
          defName = currentTile.ownerName || 'ป้อมฟาร์มวิจัย (Bio-Farm Outpost)';
          defFamily = 'corona';
        } else if (currentTile.type === 'boss') {
          const [tx, ty] = (currentTile.id || tileId).split(',').map(Number);
          const isVault = isCentralVaultZone(tx, ty);
          defStacks = generateWildDefenderArmy('boss', isVault);
          defName = currentTile.ownerName || 'บอสผู้พิทักษ์สมบัติ';
          defFamily = currentTile.ownerFamily || 'rabies';
        } else if (currentTile.type === 'player' && currentTile.ownerUid) {
          const defDoc = await getDoc(doc(db, 'users', currentTile.ownerUid));
          if (defDoc.exists()) {
            const defData = defDoc.data() as User;
            defFamily = defData.pet?.family || currentTile.ownerFamily || 'parvo';

            // Check if Defender's Hero is stationed on this specific tile
            const isHeroStationedHere = Boolean(
              defData.pet?.currentTileCoord === tileId || 
              (currentTile.heroStationedUid === currentTile.ownerUid && (!defData.pet?.currentTileCoord || defData.pet.currentTileCoord === tileId))
            );

            setIsHeroDuel(isHeroStationedHere);

            if (isHeroStationedHere) {
              // ── 1. HERO DUEL: Direct Clash with Enemy Virus Pet Hero! ──
              defName = `👑 จอมทัพ ${defData.fullname || 'Defender'} (${defData.pet?.nickname || defData.pet?.virusName || 'Hero'})`;
              
              if (defData.pet?.hero?.stacks && defData.pet.hero.stacks.length > 0) {
                defStacks = defData.pet.hero.stacks.map(s => ({ ...s }));
                defEquip = defData.pet.hero.equipment;
              } else {
                defStacks = getDefaultHeroArmy(defFamily).stacks || [];
              }
            } else {
              // ── 2. GARRISON SIEGE: Garrison Troops on a normal sector ──
              defName = `🛡️ กองรักษาการ [${currentTile.ownerName || defData.fullname || 'Defender'}]`;
              defEquip = undefined; // No Hero artifacts on unmanned territory!

              if (currentTile.defenderStacks && currentTile.defenderStacks.length > 0) {
                defStacks = currentTile.defenderStacks.map(s => ({ ...s }));
              } else {
                // Default garrison virions
                defStacks = [
                  {
                    id: 'garrison_1',
                    virusId: 'garrison',
                    tier: 1,
                    virusName: `${currentTile.ownerFamily || 'Parvo'} Virions เฝ้าป้อม`,
                    family: (currentTile.ownerFamily as any) || 'parvo',
                    count: 60,
                    baseHp: 35,
                    baseAtk: 18,
                  }
                ];
              }

              // Apply fortification bonuses from defense structures if present
              if (currentTile.buildingType === 'bio_wall') {
                defStacks = defStacks.map(s => ({ ...s, baseHp: Math.round(s.baseHp * 1.5) }));
                defName += ' 🧱 (กำแพงชีวภาพ +50% HP)';
              } else if (currentTile.buildingType === 'sentry_tower') {
                defStacks = defStacks.map(s => ({ ...s, baseAtk: Math.round(s.baseAtk * 1.3) }));
                defName += ' 🏹 (ป้อมตรวจการณ์ +30% ATK)';
              }
            }

            // Inactive base decay (-50% virion counts if inactive >72h)
            if (isDecayedTile(currentTile)) {
              defStacks = defStacks.map(s => ({
                ...s,
                count: Math.max(1, Math.floor(s.count * 0.5)),
              }));
              defName += ' ⚠️ (ฐานรกร้าง)';
            }
          } else {
            defStacks = getDefaultHeroArmy('parvo').stacks || [];
          }
        }

        setDefenderStacks(defStacks);
        setSelectedDefenderId(defStacks[0]?.id || 'wild_1');
        setDefenderEquipment(defEquip);
        setDefenderInfo({
          name: defName,
          family: defFamily,
          isBoss: currentTile.type === 'boss',
          isOutpost: Boolean(currentTile.type === 'outpost' || currentTile.isOutpost),
          isPlayer: currentTile.type === 'player',
        });

        // Initialize question timer with Polymerase scroll equipment bonus
        const timerBonus = attackerHero.equipment?.scroll === 'polymerase_scroll' 
          ? (BIO_ARTIFACTS.polymerase_scroll.timerBonusSec || 4) 
          : 0;
        const aCombat = getEffectivePetStats(appUser?.pet?.stats, appUser?.exp || 0);
        setTimeLeft(15 + (aCombat.agi * 2) + timerBonus);

      } catch (e) {
        console.error('initBattle error:', e);
      } finally {
        setLoading(false);
      }
    };

    initBattle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser?.uid, tileId]);

  // Timer loop
  useEffect(() => {
    if (gameState !== 'playing' || loading) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleWrongAnswer('หมดเวลา!');
          const aCombat = getEffectivePetStats(appUser?.pet?.stats, appUser?.exp || 0);
          const scrollBonus = attackerHero.equipment?.scroll === 'polymerase_scroll' ? 4 : 0;
          return 15 + (aCombat.agi * 2) + scrollBonus;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQIndex, gameState, loading, attackerHero.equipment]);

  // Turn Resolution: Handle Wrong Answer / Timeout
  const handleWrongAnswer = (reason = 'ตอบผิด!') => {
    sfx.wrong();

    // Select active attacker and defender stacks
    const activeAttacker = attackerStacks.find(s => s.id === selectedAttackerId && s.count > 0) || attackerStacks.find(s => s.count > 0);
    const activeDefender = defenderStacks.find(s => s.id === selectedDefenderId && s.count > 0) || defenderStacks.find(s => s.count > 0);

    if (!activeAttacker || !activeDefender) return;

    // Enemy free attack: Deals regular damage to active attacker stack
    const enemyDmg = calculateAttackDamage(activeDefender, 1, false, defenderEquipment);
    const atkResult = applyDamageToStack(activeAttacker, enemyDmg, attackerHero.equipment);

    // Visual feedback
    setIsHit(true);
    setTimeout(() => setIsHit(false), 300);

    setShowDamageAnim({
      targetStackId: activeAttacker.id,
      amount: enemyDmg,
      casualties: atkResult.casualties,
      isRetaliation: true,
    });

    const newLog = `❌ ${reason} ${activeDefender.virusName} โจมตีกองทัพของคุณฟรี สร้างความเสียหาย ${enemyDmg} (-${atkResult.casualties} อนุภาค)!`;
    setCombatLog(prev => [newLog, ...prev.slice(0, 2)]);

    // Update attacker stacks
    const nextAttackerStacks = attackerStacks.map(s => {
      if (s.id === activeAttacker.id) {
        return { ...s, count: atkResult.remainingCount };
      }
      return s;
    });
    setAttackerStacks(nextAttackerStacks);

    // Check Defeat condition
    const isWipedOut = nextAttackerStacks.every(s => s.count <= 0);
    if (isWipedOut) {
      handleDefeat(nextAttackerStacks);
    } else {
      // Re-target to next living stack if current died
      if (atkResult.remainingCount <= 0) {
        const nextLiving = nextAttackerStacks.find(s => s.count > 0);
        if (nextLiving) setSelectedAttackerId(nextLiving.id);
      }
      nextQuestion();
    }
  };

  // Turn Resolution: Handle Correct Answer (Attack + HoMM Retaliation)
  const handleCorrectAnswer = () => {
    sfx.correct();

    const activeAttacker = attackerStacks.find(s => s.id === selectedAttackerId && s.count > 0) || attackerStacks.find(s => s.count > 0);
    const activeDefender = defenderStacks.find(s => s.id === selectedDefenderId && s.count > 0) || defenderStacks.find(s => s.count > 0);

    if (!activeAttacker || !activeDefender) return;

    // 1. Calculate Forward Damage (Knowledge-boosted attack)
    const aCombat = getEffectivePetStats(appUser?.pet?.stats, appUser?.exp || 0);
    const isCrit = Math.random() < (aCombat.dex * 0.05);
    const forwardDmg = calculateAttackDamage(activeAttacker, aCombat.str, isCrit, attackerHero.equipment);
    
    // Apply damage to defender stack
    const defResult = applyDamageToStack(activeDefender, forwardDmg, defenderEquipment);

    // 2. HoMM Auto-Retaliation (If defender survivors remain)
    let retaliationDmg = 0;
    let atkCasualties = 0;
    let nextAttackerCount = activeAttacker.count;

    if (defResult.remainingCount > 0) {
      // Surviving virions retaliate immediately!
      const survivingDefender = { ...activeDefender, count: defResult.remainingCount };
      retaliationDmg = calculateRetaliationDamage(survivingDefender, attackerHero.equipment);
      const atkResult = applyDamageToStack(activeAttacker, retaliationDmg, attackerHero.equipment);
      atkCasualties = atkResult.casualties;
      nextAttackerCount = atkResult.remainingCount;
      
      if (atkCasualties > 0) {
        setIsHit(true);
        setTimeout(() => setIsHit(false), 300);
      }
    }

    // Display damage animations
    setShowDamageAnim({
      targetStackId: activeDefender.id,
      amount: forwardDmg,
      casualties: defResult.casualties,
      isCrit,
    });

    // Update Logs
    let logMsg = `⚔️ ${activeAttacker.virusName} โจมตี ${activeDefender.virusName} ${forwardDmg} DMG (-${defResult.casualties} อนุภาค)${isCrit ? ' [CRIT!]' : ''}`;
    if (retaliationDmg > 0) {
      logMsg += ` | ศัตรูสวนกลับ (-${atkCasualties} อนุภาค)!`;
    } else {
      logMsg += ` | ศัตรูถูกทำลายสิ้นซาก!`;
    }
    setCombatLog(prev => [logMsg, ...prev.slice(0, 2)]);

    // Update Defender stacks
    const nextDefenderStacks = defenderStacks.map(s => {
      if (s.id === activeDefender.id) {
        return { ...s, count: defResult.remainingCount };
      }
      return s;
    });
    setDefenderStacks(nextDefenderStacks);

    // Update Attacker stacks
    const nextAttackerStacks = attackerStacks.map(s => {
      if (s.id === activeAttacker.id) {
        return { ...s, count: nextAttackerCount };
      }
      return s;
    });
    setAttackerStacks(nextAttackerStacks);

    // 3. Check Victory / Defeat Conditions
    const allDefendersDead = nextDefenderStacks.every(s => s.count <= 0);
    const allAttackersDead = nextAttackerStacks.every(s => s.count <= 0);

    if (allDefendersDead) {
      setGameState('won');
      claimTile(nextAttackerStacks);
    } else if (allAttackersDead) {
      handleDefeat(nextAttackerStacks);
    } else {
      // Re-target if current target was destroyed
      if (defResult.remainingCount <= 0) {
        const nextLivingDef = nextDefenderStacks.find(s => s.count > 0);
        if (nextLivingDef) setSelectedDefenderId(nextLivingDef.id);
      }
      if (nextAttackerCount <= 0) {
        const nextLivingAtk = nextAttackerStacks.find(s => s.count > 0);
        if (nextLivingAtk) setSelectedAttackerId(nextLivingAtk.id);
      }
      nextQuestion();
    }
  };

  const handleDefeat = (remainingAttackerStacks: HeroUnitStack[]) => {
    setGameState('lost');
    if (appUser?.uid && appUser.pet) {
      updateDoc(doc(db, 'users', appUser.uid), {
        'pet.isInjured': true,
        'pet.currentHp': 0,
        'pet.hero.stacks': remainingAttackerStacks,
      }).catch(console.error);
    }

    // Persist remaining defender stacks on tile for persistent siege damage
    if (tile?.id) {
      updateDoc(doc(db, 'empire_tiles', tile.id), {
        defenderStacks: defenderStacks,
        lastAttacked: new Date().toISOString(),
        lastAttackedBy: appUser?.uid,
        lastAttackedByName: appUser?.fullname || 'Attacker',
      }).catch(console.error);
    }
  };

  const nextQuestion = () => {
    const pool = questionsBank;
    setTimeout(() => {
      setShowDamageAnim(null);
      setCurrentQIndex(Math.floor(Math.random() * pool.length));
      const aCombat = getEffectivePetStats(appUser?.pet?.stats, appUser?.exp || 0);
      const scrollBonus = attackerHero.equipment?.scroll === 'polymerase_scroll' ? 4 : 0;
      setTimeLeft(15 + (aCombat.agi * 2) + scrollBonus);
    }, 1200);
  };

  const handleAnswer = (choice: string) => {
    if (gameState !== 'playing') return;
    const pool = questionsBank;
    const q = pool[currentQIndex % pool.length];
    const isCorrect = choice === q?.answer;
    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer('ตอบไม่ถูกต้อง!');
    }
  };

  const claimTile = async (survivingTroops: HeroUnitStack[]) => {
    if (!tile || !appUser) return;
    const tileRef = doc(db, 'empire_tiles', tile.id);

    const isOutpostTile = tile.type === 'outpost' || tile.isOutpost;
    const todayDate = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const isFirstBase = !appUser.conqueredTiles || appUser.conqueredTiles <= 0;
    if (isFirstBase) {
      setIsFirstBaseClaimed(true);
    }

    // Establish new garrison on the conquered tile (HoMM Garrisons)
    const garrisonArmy: HeroUnitStack[] = survivingTroops.map((s, idx) => ({
      ...s,
      id: `garrison_${idx + 1}`,
      count: Math.max(1, Math.floor(s.count * 0.3)), // Station 30% of surviving units as defensive guard
    }));

    const updatedTile: Record<string, any> = {
      ...tile,
      type: 'player',
      ownerUid: appUser.uid,
      ownerName: appUser.fullname,
      ownerFamily: appUser.pet?.family || 'parvo',
      color: familyToColor(appUser.pet?.family || 'default'),
      defenderStacks: garrisonArmy,
      defenderEquipment: attackerHero.equipment,
      heroStationedUid: appUser.uid, // Attacker's Hero is now stationed here!
      lastAttacked: nowIso,
      lastActive: nowIso,
    };

    // Clear heroStationedUid from previous sector in Firestore so heroes never duplicate on the map
    const prevHeroCoord = appUser.pet?.currentTileCoord;
    if (prevHeroCoord && prevHeroCoord !== tile.id) {
      updateDoc(doc(db, 'empire_tiles', prevHeroCoord), {
        heroStationedUid: null,
      }).catch(console.error);
    }

    if (isFirstBase) {
      updatedTile.isCapital = true;
      updatedTile.shieldUntil = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
    }

    if (isOutpostTile) {
      updatedTile.isOutpost = true;
      updatedTile.dailyExp = 100;
      updatedTile.lastClaimedDate = todayDate;
    }
    if (appUser.guildId) {
      updatedTile.guildId = appUser.guildId;
    }
    if (appUser.guildName) {
      updatedTile.guildName = appUser.guildName;
    }

    // Reset old siege damage keys
    delete updatedTile.buildingType;
    delete updatedTile.buildingName;
    delete updatedTile.buildingHp;
    delete updatedTile.maxBuildingHp;
    delete updatedTile.currentDefenderHp;
    delete updatedTile.maxDefenderHp;
    delete updatedTile.lastAttackedBy;
    delete updatedTile.lastAttackedByName;

    Object.keys(updatedTile).forEach((key) => {
      if (updatedTile[key] === undefined) {
        delete updatedTile[key];
      }
    });

    await setDoc(tileRef, updatedTile);

    // Calculate EXP rewards
    let expReward = 15;
    if (tile.isCitadel) {
      expReward = 120;
      if (tile.guildId) {
        try {
          const gDoc = await getDoc(doc(db, 'guilds', tile.guildId));
          if (gDoc.exists()) {
            const gData = gDoc.data() as Guild;
            const cList = gData.citadelCoords || (gData.citadelCoord ? [gData.citadelCoord] : []);
            const clearPromises = cList.map((cid: string) =>
              updateDoc(doc(db, 'empire_tiles', cid), { isCitadel: false }).catch(() => {})
            );
            await Promise.all(clearPromises);
          }
          await updateDoc(doc(db, 'guilds', tile.guildId), {
            citadelCoord: null,
            citadelCoords: null,
          });
        } catch (e) {
          console.error('Error clearing defeated guild citadel:', e);
        }
      }
      updatedTile.isCitadel = false;
    } else if (isOutpostTile) {
      expReward = 100;
    } else if (tile.type === 'boss') {
      expReward = 35;
    } else if (tile.type === 'player') {
      // 65 EXP for defeating a Hero Commander in a duel, 25 EXP for Garrison siege!
      expReward = isHeroDuel ? 65 : 25;
    }

    setAwardedExp(expReward);

    // Persist user army survival, hero new location & EXP reward in 1 atomic write
    const userRef = doc(db, 'users', appUser.uid);
    await updateDoc(userRef, {
      exp: increment(expReward),
      conqueredTiles: increment(1),
      'pet.hero.stacks': survivingTroops,
      'pet.currentTileCoord': tile.id,
    });

    if (typeof window !== 'undefined' && tile.id) {
      localStorage.setItem('virusgo_hero_coord', tile.id);
    }

    // If tile was previously owned by another student
    if (tile.type === 'player' && tile.ownerUid && tile.ownerUid !== appUser.uid) {
      const defUid = tile.ownerUid;
      if (isHeroDuel) {
        // Hero Duel Victory: Enemy Hero is severely wounded and retreats to Capital HQ!
        updateDoc(doc(db, 'users', defUid), {
          conqueredTiles: increment(-1),
          'pet.isInjured': true,
          'pet.currentHp': 0,
          'pet.currentTileCoord': '25,25',
        }).catch(console.error);
      } else {
        // Regular Garrison Siege: Defender only loses this tile, their hero is safe elsewhere!
        updateDoc(doc(db, 'users', defUid), {
          conqueredTiles: increment(-1),
        }).catch(console.error);
      }
    }

    // Match history
    try {
      const { addDoc, collection: col } = await import('firebase/firestore');
      await addDoc(col(db, 'users', appUser.uid, 'history'), {
        gameId: 'empire-battle',
        gameName: isHeroDuel 
          ? `⚔️ HoMM Hero Duel: พิชิตจอมทัพ ${defenderInfo.name} (${tile.id})`
          : `🏰 HoMM Siege: ยึดครองเซกเตอร์ (${tile.id})`,
        score: expReward,
        expEarned: expReward,
        playedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to log empire battle history:', e);
    }

    if (appUser.guildId) {
      updateDoc(doc(db, 'guilds', appUser.guildId), {
        totalTiles: increment(1)
      }).catch(console.error);
    }
  };



  if (!tileId) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">ไม่พบพิกัดสมรภูมิที่ระบุ</div>;

  const currentQ = questionsBank[currentQIndex % questionsBank.length];

  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col relative overflow-hidden transition-colors duration-100 ${isHit ? 'bg-red-950/80' : ''}`}>
      {isHit && <div className="absolute inset-0 bg-red-500/20 z-50 pointer-events-none mix-blend-overlay" />}

      {/* Header Bar */}
      <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-slate-900 to-transparent z-10 flex justify-between items-center px-4 sm:px-8 border-b border-slate-800/40">
        <Link href="/student/empire">
          <Button variant="secondary" className="font-bold text-xs sm:text-sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> ถอยทัพ (Retreat)
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIs3DMode(!is3DMode)}
            className="text-xs font-mono tracking-wider px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-slate-900/80 text-cyan-300 hover:bg-cyan-950/60 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
          >
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            {is3DMode ? '3D ARENA' : '2D ARENA'}
          </button>
          {isHeroDuel ? (
            <div className="text-xs sm:text-sm font-black text-amber-300 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse">
              <Crown className="text-amber-400 w-4 h-4" /> HERO DUEL (ดวลจอมทัพ)
            </div>
          ) : tile?.type === 'player' ? (
            <div className="text-xs sm:text-sm font-black text-cyan-300 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/40">
              <Shield className="text-cyan-400 w-4 h-4" /> GARRISON SIEGE (ตีกองรักษาการ)
            </div>
          ) : tile?.type === 'boss' ? (
            <div className="text-xs sm:text-sm font-black text-rose-300 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <Swords className="text-rose-400 w-4 h-4" /> BOSS RAID
            </div>
          ) : (
            <div className="text-xs sm:text-sm font-black text-white uppercase tracking-widest text-glow flex items-center gap-1.5">
              <Swords className="text-cyan-400 w-4 h-4 sm:w-5 sm:h-5" /> TACTICAL BATTLE
            </div>
          )}
        </div>
      </div>

      {/* Battle Arena Field (HoMM 3-Stack Armies) */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 p-4 sm:p-6 pt-24 z-10 max-w-7xl mx-auto w-full">
        
        {/* Attacker Hero & 3 Stacks (Player Left Side) */}
        <div className="w-full lg:w-[45%] flex flex-col items-center">
          {/* Hero Avatar & Equipment Badges */}
          <div className="flex items-center gap-4 mb-3 w-full justify-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
              {is3DMode ? (
                <VirusViewer3D 
                  type={familyToVirusType(appUser?.pet?.family || 'parvo')} 
                  color={isHit ? '#ef4444' : '#06b6d4'}
                  isSick={isHit}
                  interactive={false}
                />
              ) : (
                <SVGVirus type={appUser?.pet?.family as any || 'parvo'} className={`w-full h-full drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] ${isHit ? 'text-red-500' : 'text-cyan-400'}`} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-black text-cyan-300 uppercase tracking-wider">{appUser?.fullname || 'You'}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">HERO COMMANDER</div>
              {/* Equipped Artifacts mini bar */}
              <div className="flex items-center gap-1.5 mt-1">
                {Object.entries(attackerHero.equipment || {}).map(([slot, itemId]) => {
                  const item = BIO_ARTIFACTS[itemId];
                  if (!item) return null;
                  return (
                    <span key={slot} title={`${item.name} (${item.bonusText})`} className="w-6 h-6 rounded-lg bg-amber-950/60 border border-amber-500/40 text-xs flex items-center justify-center cursor-help">
                      {item.icon}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Attacker 3 Army Stacks Cards */}
          <div className="w-full space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-cyan-400 flex items-center justify-between px-1">
              <span>กองกำลังฮีโร่ (คลิกเลือกออกคำสั่ง):</span>
              <span className="font-mono text-[10px] text-slate-400">
                {attackerStacks.reduce((acc, s) => acc + s.count, 0)} virions รวม
              </span>
            </div>

            {attackerStacks.map((stack) => {
              const isSelected = selectedAttackerId === stack.id;
              const isDead = stack.count <= 0;
              const totalStackHp = stack.count * stack.baseHp;
              const totalStackAtk = stack.count * stack.baseAtk;

              return (
                <div
                  key={stack.id}
                  onClick={() => !isDead && setSelectedAttackerId(stack.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between ${
                    isDead
                      ? 'bg-slate-950/40 border-slate-900 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-cyan-950/40 border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shrink-0">
                      <SVGVirus type={familyToVirusType(stack.family)} className="w-full h-full" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-white">{stack.virusName}</span>
                        {isSelected && !isDead && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950">
                            ⚔️ ACTIVE
                          </span>
                        )}
                        {isDead && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-red-950 text-red-400 border border-red-800">
                            💀 สูญสิ้น
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-red-300">HP: {totalStackHp.toLocaleString()}</span>
                        <span className="text-orange-300">ATK: {totalStackAtk.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stack Virion Count Badge */}
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-cyan-300">
                      {stack.count.toLocaleString()}
                    </span>
                    <span className="block text-[9px] font-mono text-slate-400">อนุภาค</span>
                  </div>

                  {/* Floating Damage Animation for this stack */}
                  <AnimatePresence>
                    {showDamageAnim?.targetStackId === stack.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 0, scale: 0.6 }}
                        animate={{ opacity: 1, y: -30, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-red-950/80 flex items-center justify-center text-red-400 font-black text-sm z-20 pointer-events-none"
                      >
                        ⚔️ -{showDamageAnim.casualties} อนุภาค (-{showDamageAnim.amount} HP)
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center VS Indicator & Action Log */}
        <div className="w-full lg:w-[10%] flex flex-col items-center justify-center my-2 lg:my-0">
          <div className="text-2xl font-black text-slate-700 italic tracking-widest">VS</div>
          {combatLog.length > 0 && (
            <div className="w-full max-w-sm mt-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1 text-center">
              <div className="text-cyan-400 font-bold truncate">{combatLog[0]}</div>
            </div>
          )}
        </div>

        {/* Defender Hero & 3 Stacks (Enemy Right Side) */}
        <div className="w-full lg:w-[45%] flex flex-col items-center">
          {/* Enemy Hero Info */}
          <div className="flex items-center gap-4 mb-3 w-full justify-center">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
              {is3DMode ? (
                <VirusViewer3D 
                  type={familyToVirusType(defenderInfo.family || 'corona')} 
                  color="#ef4444"
                  isSick={false}
                  interactive={false}
                />
              ) : (
                <SVGVirus type={defenderInfo.family as any || 'corona'} className="w-full h-full text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <span className="text-sm font-black text-red-400 uppercase tracking-wider">{defenderInfo.name}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {defenderInfo.isBoss ? 'GUARDIAN BOSS' : defenderInfo.isOutpost ? 'BIO-OUTPOST GARRISON' : 'TERRITORY DEFENDER'}
              </div>
            </div>
          </div>

          {/* Defender 3 Army Stacks Cards */}
          <div className="w-full space-y-2">
            <div className="text-[11px] font-black uppercase tracking-wider text-red-400 flex items-center justify-between px-1">
              <span>กองกำลังศัตรู (คลิกเลือกเป้าหมาย):</span>
              <span className="font-mono text-[10px] text-slate-400">
                {defenderStacks.reduce((acc, s) => acc + s.count, 0)} virions รวม
              </span>
            </div>

            {defenderStacks.map((stack) => {
              const isSelected = selectedDefenderId === stack.id;
              const isDead = stack.count <= 0;
              const totalStackHp = stack.count * stack.baseHp;
              const totalStackAtk = stack.count * stack.baseAtk;

              return (
                <div
                  key={stack.id}
                  onClick={() => !isDead && setSelectedDefenderId(stack.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex items-center justify-between ${
                    isDead
                      ? 'bg-slate-950/40 border-slate-900 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-red-950/40 border-red-500 ring-2 ring-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-1 shrink-0">
                      <SVGVirus type={familyToVirusType(stack.family)} className="w-full h-full text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-white">{stack.virusName}</span>
                        {isSelected && !isDead && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-red-600 text-white flex items-center gap-1">
                            <Crosshair className="w-2.5 h-2.5" /> TARGET
                          </span>
                        )}
                        {isDead && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-500 border border-slate-800">
                            💀 แตกพ่าย
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="text-red-400">HP: {totalStackHp.toLocaleString()}</span>
                        <span className="text-orange-400">ATK: {totalStackAtk.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stack Virion Count Badge */}
                  <div className="text-right">
                    <span className="text-lg font-black font-mono text-red-400">
                      {stack.count.toLocaleString()}
                    </span>
                    <span className="block text-[9px] font-mono text-slate-400">อนุภาค</span>
                  </div>

                  {/* Floating Damage Animation for this enemy stack */}
                  <AnimatePresence>
                    {showDamageAnim?.targetStackId === stack.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 0, scale: 0.6 }}
                        animate={{ opacity: 1, y: -30, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-red-950/80 flex items-center justify-center text-amber-300 font-black text-sm z-20 pointer-events-none"
                      >
                        💥 -{showDamageAnim.casualties} อนุภาค (-{showDamageAnim.amount} HP){showDamageAnim.isCrit ? ' [CRIT!]' : ''}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quiz UI / Victory / Defeat Panel */}
      <div className="bg-slate-900/95 border-t border-slate-800 rounded-t-3xl p-5 sm:p-7 flex flex-col z-10 relative backdrop-blur-md">
        {gameState === 'playing' ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <div className="text-base sm:text-xl font-bold text-white max-w-3xl leading-snug">
                {currentQ.q}
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <div className={`text-3xl sm:text-4xl font-black font-mono ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                  {timeLeft}s
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
              {currentQ.choices.map((choice, i) => (
                <Button 
                  key={i} 
                  onClick={() => handleAnswer(choice)}
                  disabled={showDamageAnim !== null}
                  className="py-4 sm:py-5 text-sm sm:text-base font-bold bg-slate-800/90 hover:bg-cyan-900/80 text-slate-200 hover:text-white border border-slate-700 hover:border-cyan-500 transition-all justify-start px-5 text-left whitespace-normal leading-snug rounded-xl active:scale-[0.99]"
                >
                  <span className="font-mono text-cyan-400 mr-2.5 font-black">{String.fromCharCode(65 + i)}.</span>
                  <span>{choice}</span>
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
            {gameState === 'won' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mb-3 shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-pulse" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-400 uppercase tracking-widest text-glow mb-1">
                  Tactical Victory! ยึดครองเซกเตอร์สำเร็จ!
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm mb-3 font-medium max-w-lg">
                  กองทัพไวรัสของคุณได้รับชัยชนะ! ได้ทำการจัดตั้งกองกำลังพิทักษ์พื้นที่ (30% ของกองทัพที่รอดชีวิต) ไว้ประจำการเรียบร้อยแล้ว
                </p>
                <div className="text-xl font-black text-yellow-400 mb-5 bg-slate-800/80 border border-yellow-500/30 px-6 py-2 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                  🎉 +{awardedExp} EXP
                </div>

                {isFirstBaseClaimed && (
                  <div className="mb-4 bg-cyan-950/90 border border-cyan-400 text-cyan-200 px-5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                    <Shield className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>🛡️ สถาปนาฐานแรกสำเร็จ! เปิดใช้งานบาเรียคุ้มครอง 48 ชม.</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
                  <Link href="/student/empire" className="w-full">
                    <Button className="w-full py-5 text-base font-black bg-cyan-600 hover:bg-cyan-500 text-white uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                      🗺️ กลับสู่แผนที่ (Empire Map)
                    </Button>
                  </Link>
                  <Link href="/student/virus-pet" className="w-full">
                    <Button variant="secondary" className="w-full py-5 text-base font-bold text-slate-300 uppercase tracking-wider">
                      🧬 จัดทัพ & สัตว์เลี้ยง (Hero Army)
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Heart className="w-16 h-16 text-red-500 mb-3 animate-pulse" />
                <h2 className="text-2xl sm:text-3xl font-black text-red-500 uppercase tracking-widest mb-1">Army Defeated!</h2>
                <p className="text-red-300 font-bold text-xs sm:text-sm mb-1">กองทัพไวรัสของคุณแตกพ่ายในการรบ!</p>
                <p className="text-slate-400 text-xs mb-5 max-w-md">
                  อนุภาคไวรัสสูญสิ้น กรุณานำไวรัสกลับห้องเพาะเลี้ยงเพื่อทำหัตถการฟื้นฟู HP และเพาะเลี้ยงอนุภาคใหม่ก่อนออกรบ
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
                  <Link href="/student/virus-pet" className="w-full">
                    <Button className="w-full py-5 text-base font-black bg-emerald-600 hover:bg-emerald-500 text-white uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      💉 ไปห้องพยาบาลเพาะเลี้ยง
                    </Button>
                  </Link>
                  <Link href="/student/empire" className="w-full">
                    <Button variant="secondary" className="w-full py-5 text-base font-bold text-slate-300 uppercase tracking-wider">
                      กลับแผนที่
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EmpireBattle() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950"><Loader2 className="w-12 h-12 text-cyan-500 animate-spin" /></div>}>
      <BattleContent />
    </Suspense>
  );
}
