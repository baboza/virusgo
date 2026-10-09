"use client";

import React, { useState, useEffect, Suspense } from 'react';

import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Heart, ArrowLeft, Swords, Loader2, Box } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useSearchParams, useRouter } from 'next/navigation';
import { EmpireTile, User } from '@/types';
import { familyToColor, isDecayedTile, isShieldedTile, isCentralVaultZone } from '@/app/student/empire/page';
import { getDailyEmpireInfo, DAILY_EMPIRE_ATTACK_LIMIT } from '@/lib/dailyExpCap';
import { getEffectivePetStats } from '@/lib/petBalance';

const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">Loading 3D...</div>
});

// Helper: same as empire map
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Shuffle array helper
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const FALLBACK_QUIZ = [
  { q: "ไวรัสชนิดใดที่มีรูปร่างคล้ายกระสุนปืน (Bullet-shaped)?", choices: ["Rabies Virus", "Influenza Virus", "Parvovirus", "Rotavirus"], answer: "Rabies Virus" },
  { q: "Negri bodies เป็นลักษณะเฉพาะของโรคใด?", choices: ["Canine Distemper", "Rabies", "Feline Panleukopenia", "FIV"], answer: "Rabies" },
  { q: "เชื้อ FMD เป็นเชื้อกลุ่มใด?", choices: ["DNA Virus", "RNA Virus", "Bacteria", "Fungi"], answer: "RNA Virus" },
  { q: "สัตว์ชนิดใดไม่ติดเชื้อ FMD (โรคปากและเท้าเปื่อย)?", choices: ["โค", "สุกร", "ม้า", "แพะ"], answer: "ม้า" },
  { q: "โรค PEDV ในสุกร ทำให้เกิดอาการใดเด่นชัดที่สุด?", choices: ["ไข้สูง", "ท้องเสียรุนแรง", "ไอเรื้อรัง", "แท้งลูก"], answer: "ท้องเสียรุนแรง" },
  { q: "การส่งตรวจยืนยันเชื้อ Rabies นิยมใช้วิธีใด?", choices: ["FA Test จากสมอง", "Blood smear", "ELISA serum", "PCR อุจจาระ"], answer: "FA Test จากสมอง" },
  { q: "CPV (Canine Parvovirus) มักพบในสุนัขอายุเท่าใด?", choices: ["แรกเกิด", "1-6 เดือน", "3-5 ปี", "สุนัขแก่"], answer: "1-6 เดือน" },
  { q: "พาหะนำโรค PRRS คืออะไร?", choices: ["ยุง", "เห็บ", "สุกรป่วย", "นก"], answer: "สุกรป่วย" },
  { q: "วัคซีน ASF ในปัจจุบันมีประสิทธิภาพระดับใด?", choices: ["ป้องกันได้ 100%", "ป้องกันได้ 80%", "ป้องกันได้เฉพาะบางสายพันธุ์", "ยังไม่มีวัคซีนที่สมบูรณ์"], answer: "ยังไม่มีวัคซีนที่สมบูรณ์" },
  { q: "ข้อใดคือลักษณะทางพยาธิวิทยาของโรคไข้หัดสุนัข (CDV)?", choices: ["Encephalitis", "Pneumonia", "Hyperkeratosis (Hardpad)", "ถูกทุกข้อ"], answer: "ถูกทุกข้อ" },
  { q: "Feline Leukemia Virus (FeLV) เป็นไวรัสกลุ่มใด?", choices: ["Retrovirus", "Parvovirus", "Coronavirus", "Herpesvirus"], answer: "Retrovirus" },
  { q: "การวินิจฉัย FIV ในคลินิก นิยมตรวจหาอะไร?", choices: ["Antigen", "Antibody", "DNA", "RNA"], answer: "Antibody" },
  { q: "โรคใดในแมวที่มักเกิดจากเชื้อ Feline Coronavirus กลายพันธุ์?", choices: ["FIV", "FeLV", "FIP", "FPLV"], answer: "FIP" },
  { q: "African Horse Sickness (AHS) มีพาหะนำโรคคือสัตว์ชนิดใด?", choices: ["ริ้น (Culicoides)", "ยุง (Aedes)", "แมลงวันคอก (Stomoxys)", "เห็บ (Ticks)"], answer: "ริ้น (Culicoides)" },
  { q: "ไวรัสชนิดใดเป็นสาเหตุของโรค Orf (Contagious ecthyma) ในแกะ?", choices: ["Poxvirus", "Herpesvirus", "Papillomavirus", "Parvovirus"], answer: "Poxvirus" }
];

type QuizItem = { q: string; choices: string[]; answer: string };

function BattleContent() {
  const { appUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tileId = searchParams.get('tile');

  const [loading, setLoading] = useState(true);
  const [tile, setTile] = useState<EmpireTile | null>(null);
  const [questionsBank, setQuestionsBank] = useState<QuizItem[]>(shuffle([...FALLBACK_QUIZ]));
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showDamage, setShowDamage] = useState<{ target: 'attacker' | 'defender', amount: number, isCrit: boolean } | null>(null);
  const [isHit, setIsHit] = useState(false); // Screen flash for attacker damage
  const [is3DMode, setIs3DMode] = useState(true);
  const [awardedExp, setAwardedExp] = useState<number>(15);
  const [isFirstBaseClaimed, setIsFirstBaseClaimed] = useState(false);

  // Battle Stats
  const [attackerStats, setAttackerStats] = useState({ hp: 100, maxHp: 100, atk: 20, agi: 1, dex: 1, name: 'You' });
  const [defenderStats, setDefenderStats] = useState({ hp: 50, maxHp: 50, atk: 10, name: 'Unclaimed Cell', family: 'parvo' });

  // Load questions from Firestore (same pool as Time Attack)
  useEffect(() => {
    getDoc(doc(db, 'game_content', 'quiz_general')).then((snap) => {
      if (snap.exists() && snap.data().questions?.length > 0) {
        const mapped: QuizItem[] = snap.data().questions.map((q: any) => ({
          q: q.q,
          choices: q.opts || [],
          answer: q.opts ? q.opts[q.ans] : ''
        }));
        setQuestionsBank(shuffle(mapped));
      } else {
        setQuestionsBank(shuffle([...FALLBACK_QUIZ]));
      }
    }).catch((e) => {
      console.error(e);
      setQuestionsBank(shuffle([...FALLBACK_QUIZ]));
    });
  }, []);

  // Load Data
  useEffect(() => {
    if (!appUser || !tileId) return;

    const initBattle = async () => {
      try {
        // 1. Calculate Attacker Stats with Hard Cap
        const aStats = appUser.pet?.stats || { str: 1, vit: 1, agi: 1, dex: 1, spentPoints: 0 };
        const aCombat = getEffectivePetStats(aStats, appUser.exp || 0);
        setAttackerStats({ 
          hp: aCombat.maxHp, 
          maxHp: aCombat.maxHp, 
          atk: aCombat.atk, 
          agi: aCombat.agi, 
          dex: aCombat.dex, 
          name: appUser.fullname 
        });

        // Check if user currently has any bases (exempt first base Drop Pod placement from daily limit)
        const myTilesSnap = await getDocs(query(collection(db, 'empire_tiles'), where('ownerUid', '==', appUser.uid)));
        const hasExistingBase = !myTilesSnap.empty;

        // Daily Attack Limit Check
        const empireDaily = getDailyEmpireInfo(appUser);
        if (hasExistingBase && !empireDaily.canAttack) {
          alert(`⛔ คุณใช้โควตาการบุกรุกครบ ${DAILY_EMPIRE_ATTACK_LIMIT} ครั้งสำหรับวันนี้แล้ว! (รีเซ็ตทุกเที่ยงคืน)`);
          router.push('/student/empire');
          return;
        }

        // 2. Fetch Tile & Defender Stats
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

        // Security check: Drop Pod (first base) cannot land on outposts or central vault
        if (!hasExistingBase) {
          const [tx, ty] = (currentTile.id || tileId).split(',').map(Number);
          const isVault = isCentralVaultZone(tx, ty) || currentTile.ownerName?.includes('ผู้พิทักษ์');
          if (currentTile.isOutpost || currentTile.type === 'outpost' || isVault) {
            alert('⛔ ไม่สามารถใช้สิทธิ Drop Pod สถาปนาฐานแรกในจุดฟาร์มวิจัย (Outpost) หรือเขตห้องนิรภัยใจกลางเมือง (Vault) ได้!');
            router.push('/student/empire');
            return;
          }
        }

        // Security check: cannot attack shielded tiles
        if (isShieldedTile(currentTile)) {
          alert('🛡️ เซกเตอร์นี้ได้รับการคุ้มครองด้วยบาเรียมือใหม่ ไม่สามารถโจมตีได้');
          router.push('/student/empire');
          return;
        }

        if (currentTile.type === 'empty') {
          setDefenderStats({ hp: 50, maxHp: 50, atk: 15, name: 'เซลล์ร่างกายอ่อนแอ', family: 'corona' });
        } else if (currentTile.type === 'outpost' || currentTile.isOutpost) {
          const outpHp = Math.max(currentTile.bossHp || 800, 800);
          setDefenderStats({ hp: outpHp, maxHp: outpHp, atk: 35, name: currentTile.ownerName || 'ป้อมฟาร์มวิจัย (Bio-Farm Outpost)', family: 'corona' });
        } else if (currentTile.type === 'boss') {
          // Guardian Boss: Increased HP and ATK challenge to prevent one-hit kills
          const isInnerRing = currentTile.ownerName?.includes('ชั้นใน') || currentTile.ownerName?.includes('Elite');
          const bossHp = Math.max(currentTile.bossHp || (isInnerRing ? 2000 : 1400), isInnerRing ? 2000 : 1400);
          const bossAtk = isInnerRing ? 55 : 45;
          setDefenderStats({ 
            hp: bossHp, 
            maxHp: bossHp, 
            atk: bossAtk, 
            name: currentTile.ownerName || 'ผู้พิทักษ์สมบัติ', 
            family: currentTile.ownerFamily || 'rabies' 
          });
        } else if (currentTile.type === 'player' && currentTile.ownerUid) {
          const defDoc = await getDoc(doc(db, 'users', currentTile.ownerUid));
          if (defDoc.exists()) {
            const defData = defDoc.data() as User;
            const dCombat = getEffectivePetStats(defData.pet?.stats, defData.exp || 0);
            // Territory passive guard ATK is balanced with a cap (max 115 ATK) so new players are not one-shot killed
            let dAtk = 15 + (dCombat.str * 5);
            let dHp = dCombat.maxHp;

            // Decay system: Inactive bases (>72h) have their defender HP and ATK reduced by 50%
            const isDecayed = isDecayedTile(currentTile);
            if (isDecayed) {
              dHp = Math.max(25, Math.floor(dHp * 0.5));
              dAtk = Math.max(10, Math.floor(dAtk * 0.5));
            }

            // Citadel Fortress bonus
            if (currentTile.isCitadel) {
              dHp = Math.max(dHp * 2, 2800);
              dAtk = Math.max(dAtk + 15, 45);
            }

            const citadelPrefix = currentTile.isCitadel ? `🏛️ นครหลวงกิลด์ [${currentTile.guildName || 'CITADEL'}] - ` : '';
            setDefenderStats({
              hp: dHp,
              maxHp: dHp,
              atk: dAtk,
              name: `${citadelPrefix}${defData.fullname || 'Defender'}${isDecayed ? ' ⚠️ (ฐานรกร้าง -50% HP)' : ''}`,
              family: defData.pet?.family || 'parvo'
            });
          }
        }
      } catch (e) {
        console.error('initBattle error:', e);
      } finally {
        setLoading(false);
      }
    };

    initBattle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, tileId]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing' || loading) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleWrongAnswer();
          return 15 + (attackerStats.agi * 2); // Reset time with AGI bonus
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQIndex, gameState, loading, attackerStats.agi]);

  const handleWrongAnswer = () => {
    sfx.wrong();
    const dmg = defenderStats.atk;
    setShowDamage({ target: 'attacker', amount: dmg, isCrit: false });
    
    // Screen flash
    setIsHit(true);
    setTimeout(() => setIsHit(false), 300);
    
    setAttackerStats(prev => {
      const newHp = Math.max(0, prev.hp - dmg);
      if (newHp === 0) {
        setGameState('lost');
        if (appUser?.uid && appUser.pet) {
          updateDoc(doc(db, 'users', appUser.uid), {
            'pet.isInjured': true,
            'pet.currentHp': 0,
            'pet.maxHp': prev.maxHp,
          }).catch(console.error);
        }
      }
      return { ...prev, hp: newHp };
    });
    
    nextQuestion();
  };

  const handleCorrectAnswer = () => {
    sfx.correct();
    
    // Critical calculation (DEX * 5% chance)
    const isCrit = Math.random() < (attackerStats.dex * 0.05);
    const dmg = isCrit ? attackerStats.atk * 2 : attackerStats.atk;
    
    setShowDamage({ target: 'defender', amount: dmg, isCrit });
    
    setDefenderStats(prev => {
      const newHp = Math.max(0, prev.hp - dmg);
      if (newHp === 0) {
        setGameState('won');
        claimTile();
      }
      return { ...prev, hp: newHp };
    });
    
    nextQuestion();
  };

  const nextQuestion = () => {
    const pool = questionsBank;
    setTimeout(() => {
      setShowDamage(null);
      setCurrentQIndex(Math.floor(Math.random() * pool.length));
      setTimeLeft(15 + (attackerStats.agi * 2));
    }, 1000);
  };

  const handleAnswer = (choice: string) => {
    if (gameState !== 'playing') return;
    const pool = questionsBank;
    const q = pool[currentQIndex % pool.length];
    const isCorrect = choice === q?.answer;
    if (isCorrect) {
      handleCorrectAnswer();
    } else {
      handleWrongAnswer();
    }
  };

  const claimTile = async () => {
    if (!tile || !appUser) return;
    const tileRef = doc(db, 'empire_tiles', tile.id);
    
    const isOutpostTile = tile.type === 'outpost' || tile.isOutpost;
    const todayDate = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    // Check if player had 0 bases before this claim (First Base / Drop Pod placement)
    const myTilesSnap = await getDocs(query(collection(db, 'empire_tiles'), where('ownerUid', '==', appUser.uid)));
    const isFirstBase = myTilesSnap.empty;
    if (isFirstBase) {
      setIsFirstBaseClaimed(true);
    }

    const updatedTile: Record<string, any> = {
      ...tile,
      type: 'player',
      ownerUid: appUser.uid,
      ownerName: appUser.fullname,
      ownerFamily: appUser.pet?.family || 'parvo',
      color: familyToColor(appUser.pet?.family || 'default'),
      lastAttacked: nowIso,
      lastActive: nowIso, // Upkeep tracking
    };

    if (isFirstBase) {
      updatedTile.isCapital = true;
      // 48-Hour Beginner Shield protection
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

    // Safety: remove all keys with undefined value to prevent Firestore setDoc error
    Object.keys(updatedTile).forEach((key) => {
      if (updatedTile[key] === undefined) {
        delete updatedTile[key];
      }
    });
    
    await setDoc(tileRef, updatedTile);

    // Give balanced EXP reward
    const isToday = appUser.dailyEmpireBattles?.date === todayDate;
    const currentAttackCount = isToday ? (Number(appUser.dailyEmpireBattles?.count) || 0) : 0;
    const newAttackCount = currentAttackCount + 1;

    let expReward = 15;
    if (tile.isCitadel) {
      expReward = 120; // Massive EXP reward for conquering an enemy Guild Citadel!
      if (tile.guildId) {
        try {
          const gDoc = await getDoc(doc(db, 'guilds', tile.guildId));
          if (gDoc.exists()) {
            const gData = gDoc.data() as Guild;
            const cList = gData.citadelCoords || (gData.citadelCoord ? [gData.citadelCoord] : []);
            // Clear isCitadel flag on all citadel tiles of this defeated guild
            const clearPromises = cList.map((cid) =>
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
      expReward = 100; // Outpost captured bonus!
    } else if (tile.type === 'boss') {
      expReward = 35; // บอสผู้พิทักษ์: 35 EXP
    } else if (tile.type === 'player') {
      expReward = 30;
    }

    const finalEarnedExp = expReward;
    setAwardedExp(expReward);

    const userRef = doc(db, 'users', appUser.uid);
    const userUpdates: Record<string, any> = {
      exp: increment(expReward)
    };
    // First base placement is free and doesn't consume daily quota
    if (!isFirstBase) {
      userUpdates.dailyEmpireBattles = {
        date: todayDate,
        count: newAttackCount
      };
    }
    await updateDoc(userRef, userUpdates);

    // Log match history
    try {
      const { addDoc, collection: col } = await import('firebase/firestore');
      await addDoc(col(db, 'users', appUser.uid, 'history'), {
        gameId: 'empire-battle',
        gameName: `Empire: ${tile.type === 'boss' ? 'บอสผู้พิทักษ์' : isOutpostTile ? 'ยึดป้อมวิจัย' : 'ยึดครองดินแดน'} (${tile.id})`,
        score: finalEarnedExp,
        expEarned: finalEarnedExp,
        playedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error('Failed to log empire battle history:', e);
    }

    // Update Guild totalTiles in real time
    if (appUser.guildId) {
      updateDoc(doc(db, 'guilds', appUser.guildId), {
        totalTiles: increment(1)
      }).catch(console.error);
    }
    if (tile.guildId && tile.guildId !== appUser.guildId) {
      updateDoc(doc(db, 'guilds', tile.guildId), {
        totalTiles: increment(-1)
      }).catch(console.error);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-cyan-500"/></div>;
  if (!tileId) return <div>No tile selected</div>;

  const currentQ = questionsBank[currentQIndex % questionsBank.length];

  return (
    <div className={`min-h-screen bg-slate-950 flex flex-col relative overflow-hidden transition-colors duration-100 ${isHit ? 'bg-red-950/80' : ''}`}>
      {isHit && <div className="absolute inset-0 bg-red-500/20 z-50 pointer-events-none mix-blend-overlay" />}
      {/* Header */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-slate-900 to-transparent z-10 flex justify-between items-center px-8">
        <Link href="/student/empire">
          <Button variant="secondary" className="font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retreat
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIs3DMode(!is3DMode)}
            className="text-xs font-mono tracking-wider px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-slate-900/80 text-cyan-300 hover:bg-cyan-950/60 hover:text-white transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
          >
            <Box className="w-3.5 h-3.5 text-cyan-400" />
            {is3DMode ? '3D ARENA' : '2D ARENA'}
          </button>
          <div className="text-xl font-black text-white uppercase tracking-widest text-glow flex items-center gap-2">
            <Swords className="text-cyan-400" /> Sector RAID
          </div>
        </div>
      </div>

      {/* Battle Arena */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 p-8 pt-24 z-10">
        
        {/* Attacker */}
        <motion.div 
          className="flex flex-col items-center"
          animate={isHit ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="text-xl font-black text-cyan-400 mb-2 tracking-widest">{attackerStats.name}</div>
          <div className="relative w-36 h-36 md:w-52 md:h-52 flex items-center justify-center">
            {is3DMode ? (
              <VirusViewer3D 
                type={familyToVirusType(appUser?.pet?.family || 'parvo')} 
                color={isHit ? '#ef4444' : '#06b6d4'}
                isSick={isHit}
                interactive={false}
              />
            ) : (
              <SVGVirus type={appUser?.pet?.family as any || 'parvo'} className={`w-32 h-32 md:w-48 md:h-48 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] ${isHit ? 'text-red-500' : 'text-cyan-500'}`} />
            )}
            <AnimatePresence>
              {showDamage?.target === 'attacker' && (
                <motion.div initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: 1, y: -50, scale: 1.5 }} exit={{ opacity: 0 }} className="absolute -top-10 left-1/2 -translate-x-1/2 text-5xl font-black text-red-500 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] z-50">
                  -{showDamage.amount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-4 w-48 md:w-64">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
              <span>HP</span>
              <motion.span 
                animate={isHit ? { color: ['#ef4444', '#94a3b8'] } : {}}
              >
                {attackerStats.hp} / {attackerStats.maxHp}
              </motion.span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <motion.div className="h-full bg-cyan-500" animate={{ width: `${(attackerStats.hp / attackerStats.maxHp) * 100}%`, backgroundColor: isHit ? '#ef4444' : '#06b6d4' }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        </motion.div>

        <div className="text-4xl font-black text-slate-700 italic">VS</div>

        {/* Defender */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-black text-red-400 mb-2 tracking-widest">{defenderStats.name}</div>
          <div className="relative w-36 h-36 md:w-52 md:h-52 flex items-center justify-center">
            {is3DMode ? (
              <VirusViewer3D 
                type={familyToVirusType(defenderStats.family || 'corona')} 
                color="#ef4444"
                isSick={false}
                interactive={false}
              />
            ) : (
              <SVGVirus type={defenderStats.family as any} className="w-32 h-32 md:w-48 md:h-48 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            )}
            <AnimatePresence>
              {showDamage?.target === 'defender' && (
                <motion.div initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: 1, y: -50, scale: 1.5 }} exit={{ opacity: 0 }} className={`absolute -top-10 left-1/2 -translate-x-1/2 text-4xl font-black z-50 drop-shadow-lg ${showDamage.isCrit ? 'text-yellow-400 scale-150' : 'text-white'}`}>
                  {showDamage.isCrit && "CRIT! "}-{showDamage.amount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-4 w-48 md:w-64">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
              <span>HP</span>
              <span>{defenderStats.hp} / {defenderStats.maxHp}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <motion.div className="h-full bg-red-500" animate={{ width: `${(defenderStats.hp / defenderStats.maxHp) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quiz UI */}
      <div className="h-2/5 bg-slate-900 border-t border-slate-800 rounded-t-3xl p-6 md:p-8 flex flex-col z-10 relative">
        {gameState === 'playing' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="text-xl md:text-2xl font-bold text-white max-w-3xl leading-snug">
                {currentQ.q}
              </div>
              <div className={`text-4xl font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                {timeLeft}s
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {currentQ.choices.map((choice, i) => (
                <Button 
                  key={i} 
                  onClick={() => handleAnswer(choice)}
                  disabled={showDamage !== null}
                  className="h-full text-lg md:text-xl font-bold bg-slate-800 hover:bg-cyan-900 text-slate-300 hover:text-cyan-100 border border-slate-700 hover:border-cyan-500 transition-all justify-start px-6 text-left whitespace-normal leading-tight"
                >
                  {choice}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {gameState === 'won' ? (
              <>
                {(tile?.type === 'outpost' || tile?.isOutpost) ? (
                  <>
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(16,185,129,0.5)]">
                      <Shield className="w-12 h-12 text-emerald-400 animate-pulse" />
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 uppercase tracking-widest text-glow mb-2">
                      Bio-Farm Outpost Secured!
                    </h2>
                    <p className="text-slate-300 mb-4 font-bold">
                      ยึดครองป้อมฟาร์มวิจัยสำเร็จ! คุณได้รับสิทธิ์เก็บเกี่ยวผลผลิตวันละ 100 EXP
                    </p>
                    <div className="text-2xl font-black text-emerald-300 mb-8 bg-emerald-950/60 border border-emerald-500/50 px-6 py-2 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                      🌾 +100 EXP (ยึดป้อม) & สิทธิ์เก็บเกี่ยววันละ 100 EXP!
                    </div>
                  </>
                ) : (
                  <>
                    <Shield className="w-20 h-20 text-emerald-500 mb-4" />
                    <h2 className="text-4xl font-black text-emerald-400 uppercase tracking-widest text-glow mb-2">Sector Secured!</h2>
                    <p className="text-slate-400 mb-6">คุณได้ทำการยึดครองพื้นที่นี้เรียบร้อยแล้ว</p>
                    <div className="text-2xl font-black text-yellow-400 mb-6 bg-slate-800/80 border border-yellow-500/30 px-6 py-2 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                      🎉 +{awardedExp} EXP
                    </div>
                  </>
                )}

                {isFirstBaseClaimed && (
                  <div className="mb-4 bg-cyan-950/90 border border-cyan-400 text-cyan-200 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] animate-in fade-in zoom-in-95">
                    <Shield className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>🛡️ สถาปนาฐานแรกสำเร็จ! เปิดใช้งานบาเรียมือใหม่คุ้มครอง 48 ชม. ปลอดภัยจากการถูกตี</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md pt-2">
                  <Link href="/student/empire" className="w-full">
                    <Button className="w-full py-6 text-lg font-black bg-cyan-600 hover:bg-cyan-500 text-white uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                      🗺️ กลับสู่แผนที่ (Empire Map)
                    </Button>
                  </Link>
                  <Link href="/student/virus-pet" className="w-full">
                    <Button variant="secondary" className="w-full py-6 text-lg font-bold text-slate-300 uppercase tracking-wider">
                      🧬 ดูสัตว์เลี้ยง (Virus Pet)
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Heart className="w-20 h-20 text-red-500 mb-4 animate-pulse" />
                <h2 className="text-4xl font-black text-red-500 uppercase tracking-widest mb-2">Defeated</h2>
                <p className="text-red-300 font-bold mb-2">ไวรัสของคุณได้รับบาดเจ็บสาหัสจากการรบ!</p>
                <p className="text-slate-400 mb-8 max-w-md">
                  พลังชีวิต (HP) ลดเหลือ 0 กรุณานำไวรัสกลับเข้าห้องเพาะเลี้ยงเพื่อทำหัตถการรักษาและฟื้นฟู HP ก่อนออกรบอีกครั้ง
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
                  <Link href="/student/virus-pet" className="w-full">
                    <Button className="w-full py-6 text-lg font-black bg-emerald-600 hover:bg-emerald-500 text-white uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      💉 ไปห้องพยาบาลเพาะเลี้ยง
                    </Button>
                  </Link>
                  <Link href="/student/empire" className="w-full">
                    <Button variant="secondary" className="w-full py-6 text-lg font-bold text-slate-300 uppercase tracking-wider">
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-cyan-500 animate-spin" /></div>}>
      <BattleContent />
    </Suspense>
  );
}
