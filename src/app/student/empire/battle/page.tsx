"use client";

import React, { useState, useEffect, Suspense } from 'react';

import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Heart, ArrowLeft, Swords, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { SVGVirus } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useSearchParams, useRouter } from 'next/navigation';
import { EmpireTile, User } from '@/types';

// Helper: same as empire map
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

type QuizItem = { q: string; choices: string[]; answer: string };

function BattleContent() {
  const { appUser } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tileId = searchParams.get('tile');

  const [loading, setLoading] = useState(true);
  const [tile, setTile] = useState<EmpireTile | null>(null);
  const [questionsBank, setQuestionsBank] = useState<QuizItem[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showDamage, setShowDamage] = useState<{ target: 'attacker' | 'defender', amount: number, isCrit: boolean } | null>(null);

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
        setQuestionsBank(mapped);
      }
    }).catch(console.error);
  }, []);

  // Load Data
  useEffect(() => {
    if (!appUser || !tileId) return;

    const initBattle = async () => {
      try {
        // 1. Calculate Attacker Stats
        const aStats = appUser.pet?.stats || { str: 1, vit: 1, agi: 1, dex: 1, spentPoints: 0 };
        const aMaxHp = 100 + (aStats.vit * 20);
        const aAtk = 20 + (aStats.str * 10);
        setAttackerStats({ hp: aMaxHp, maxHp: aMaxHp, atk: aAtk, agi: aStats.agi, dex: aStats.dex, name: appUser.fullname });

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

        if (currentTile.type === 'empty') {
          setDefenderStats({ hp: 50, maxHp: 50, atk: 10, name: 'เซลล์ร่างกายอ่อนแอ', family: 'corona' });
        } else if (currentTile.type === 'boss') {
          setDefenderStats({ hp: 300, maxHp: 300, atk: 40, name: 'ระบบภูมิคุ้มกัน', family: currentTile.ownerFamily || 'rabies' });
        } else if (currentTile.type === 'player' && currentTile.ownerUid) {
          const defDoc = await getDoc(doc(db, 'users', currentTile.ownerUid));
          if (defDoc.exists()) {
            const defData = defDoc.data() as User;
            const dStats = defData.pet?.stats || { str: 1, vit: 1, agi: 1, dex: 1, spentPoints: 0 };
            const dMaxHp = 100 + (dStats.vit * 20);
            const dAtk = 15 + (dStats.str * 5);
            setDefenderStats({
              hp: dMaxHp,
              maxHp: dMaxHp,
              atk: dAtk,
              name: defData.fullname || 'Defender',
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
    sfx.error();
    const dmg = defenderStats.atk;
    setShowDamage({ target: 'attacker', amount: dmg, isCrit: false });
    
    setAttackerStats(prev => {
      const newHp = Math.max(0, prev.hp - dmg);
      if (newHp === 0) setGameState('lost');
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
    const pool = questionsBank.length > 0 ? questionsBank : [{ q: '', choices: [], answer: '' }];
    setTimeout(() => {
      setShowDamage(null);
      setCurrentQIndex(Math.floor(Math.random() * pool.length));
      setTimeLeft(15 + (attackerStats.agi * 2));
    }, 1000);
  };

  const handleAnswer = (choice: string) => {
    if (gameState !== 'playing') return;
    const pool = questionsBank.length > 0 ? questionsBank : [];
    const q = pool[currentQIndex % (pool.length || 1)];
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
    
    const updatedTile: EmpireTile = {
      ...tile,
      type: 'player',
      ownerUid: appUser.uid,
      ownerName: appUser.fullname,
      ownerFamily: appUser.pet?.family || 'parvo',
      color: stringToColor(appUser.uid), // consistent color per player
      lastAttacked: new Date().toISOString()
    };
    
    await setDoc(tileRef, updatedTile);

    // Give EXP reward
    let expReward = 50;
    if (tile.type === 'boss') expReward = 500;
    else if (tile.type === 'player') expReward = 100;

    const userRef = doc(db, 'users', appUser.uid);
    await updateDoc(userRef, {
      exp: increment(expReward)
    });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-cyan-500"/></div>;
  if (!tileId) return <div>No tile selected</div>;

  const pool = questionsBank.length > 0 ? questionsBank : [
    { q: 'กำลังโหลดคำถาม...', choices: ['...'], answer: '...' }
  ];
  const currentQ = pool[currentQIndex % pool.length];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-slate-900 to-transparent z-10 flex justify-between items-center px-8">
        <Link href="/student/empire">
          <Button variant="secondary" className="font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retreat
          </Button>
        </Link>
        <div className="text-xl font-black text-white uppercase tracking-widest text-glow flex items-center gap-2">
          <Swords className="text-cyan-400" /> Sector RAID
        </div>
      </div>

      {/* Battle Arena */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 p-8 pt-24 z-10">
        
        {/* Attacker */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-black text-cyan-400 mb-4 tracking-widest">{attackerStats.name}</div>
          <div className="relative">
            <SVGVirus type="parvo" className="w-32 h-32 md:w-48 md:h-48 text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" />
            <AnimatePresence>
              {showDamage?.target === 'attacker' && (
                <motion.div initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: 1, y: -50, scale: 1.5 }} exit={{ opacity: 0 }} className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl font-black text-red-500 drop-shadow-lg z-50">
                  -{showDamage.amount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-6 w-48 md:w-64">
            <div className="flex justify-between text-xs font-bold text-slate-400 mb-1">
              <span>HP</span>
              <span>{attackerStats.hp} / {attackerStats.maxHp}</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <motion.div className="h-full bg-cyan-500" animate={{ width: `${(attackerStats.hp / attackerStats.maxHp) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        </div>

        <div className="text-4xl font-black text-slate-700 italic">VS</div>

        {/* Defender */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-black text-red-400 mb-4 tracking-widest">{defenderStats.name}</div>
          <div className="relative">
            <SVGVirus type={defenderStats.family as any} className="w-32 h-32 md:w-48 md:h-48 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
            <AnimatePresence>
              {showDamage?.target === 'defender' && (
                <motion.div initial={{ opacity: 0, y: 0, scale: 0.5 }} animate={{ opacity: 1, y: -50, scale: 1.5 }} exit={{ opacity: 0 }} className={`absolute -top-10 left-1/2 -translate-x-1/2 text-4xl font-black z-50 drop-shadow-lg ${showDamage.isCrit ? 'text-yellow-400 scale-150' : 'text-white'}`}>
                  {showDamage.isCrit && "CRIT! "}-{showDamage.amount}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="mt-6 w-48 md:w-64">
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
                <Shield className="w-20 h-20 text-emerald-500 mb-4" />
                <h2 className="text-4xl font-black text-emerald-400 uppercase tracking-widest text-glow mb-2">Sector Secured!</h2>
                <p className="text-slate-400 mb-8">You have successfully infected this sector.</p>
                <div className="text-xl font-bold text-yellow-400 mb-8">+ EXP Reward</div>
              </>
            ) : (
              <>
                <Heart className="w-20 h-20 text-slate-600 mb-4" />
                <h2 className="text-4xl font-black text-red-500 uppercase tracking-widest mb-2">Defeated</h2>
                <p className="text-slate-400 mb-8">Your virus was eradicated. Upgrade your stats and try again.</p>
              </>
            )}
            <Link href="/student/empire">
              <Button className="px-12 py-6 text-xl font-black bg-cyan-600 hover:bg-cyan-500 text-white uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                Return to Map
              </Button>
            </Link>
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
