"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, ArrowLeft, Loader2, Trophy, Clock, Copy, Check, 
  ShieldAlert, Sparkles, User, Box, Play, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp, 
  increment 
} from 'firebase/firestore';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import { ALL_15_CHAPTER_QUESTIONS } from '@/data/veterinaryVirologyContent';
import { getEffectivePetStats } from '@/lib/petBalance';
import { awardDailyCappedExp, getDailyExpInfo, DailyExpInfo } from '@/lib/dailyExpCap';

const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">Loading 3D...</div>
});

const DEFAULT_QUESTIONS = ALL_15_CHAPTER_QUESTIONS.map(q => ({
  q: q.q,
  opts: q.choices,
  ans: q.choices.indexOf(q.answer) !== -1 ? q.choices.indexOf(q.answer) : 0,
}));

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

interface PlayerState {
  id?: string;
  uid: string;
  name: string;
  nickname: string;
  family: string;
  hp: number;
  maxHp: number;
  atk: number;
  agi: number;
  dex: number;
  score: number;
  answeredQuestion: number;
  selectedAns: number | null;
  lastAnsTime: number;
  isReady: boolean;
}

interface RoomData {
  roomCode: string;
  hostUid: string;
  hostPlayerId?: string;
  status: 'waiting' | 'in_game' | 'finished';
  currentQuestionIndex: number;
  totalQuestions: number;
  questions: { q: string; opts: string[]; ans: number }[];
  players: Record<string, PlayerState>;
  winnerUid?: string | null;
  roundStartTime?: number;
  createdAt: any;
}

export default function PvpDuel() {
  const { appUser, user } = useAuth();
  const myUid = appUser?.uid || user?.uid || '';
  const myName = appUser?.fullname || appUser?.studentID || 'Virus Hunter';

  // Unique session key per browser tab to allow testing in multiple tabs
  const [myPlayerKey] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const existing = sessionStorage.getItem('pvp_player_session');
      if (existing) return existing;
      const created = 'p_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('pvp_player_session', created);
      return created;
    }
    return 'p_' + Math.random().toString(36).substring(2, 9);
  });

  // Lobby States
  const [roomCode, setRoomCode] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isHostMode, setIsHostMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [is3DMode, setIs3DMode] = useState(true);

  // In-Game States
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [showDmgEffect, setShowDmgEffect] = useState<{ target: string; amount: number; isCrit: boolean } | null>(null);
  const rewardClaimedRef = useRef(false);
  const [dailyInfo, setDailyInfo] = useState<DailyExpInfo | null>(null);
  const [awardedExpState, setAwardedExpState] = useState<number | null>(null);

  useEffect(() => {
    if (myUid) {
      getDailyExpInfo(myUid, 'pvp').then(setDailyInfo).catch(console.error);
    }
  }, [myUid]);

  // Calculate my pet combat stats with Hard Cap & Balance System (Approach 1)
  const pet = appUser?.pet;
  const combatStats = getEffectivePetStats(pet?.stats, appUser?.exp || 0);
  const myMaxHp = combatStats.maxHp;
  const myAtk = combatStats.atk;
  const myAgi = combatStats.agi;
  const myDex = combatStats.dex;
  const myFamily = pet?.family || 'corona';
  const myNickname = pet?.nickname || pet?.virusName || 'Virus Fighter';

  // 1. Real-time Room Sync
  useEffect(() => {
    if (!roomCode) return;
    const roomRef = doc(db, 'pvp_rooms', roomCode);
    const unsub = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as RoomData;
        setRoomData(data);

        // Reset selected choice on question change
        if (data.status === 'in_game') {
          const myPlayer = data.players[myPlayerKey] || Object.values(data.players).find(p => p.uid === myUid);
          if (myPlayer && myPlayer.answeredQuestion < data.currentQuestionIndex) {
            setSelectedChoice(null);
          }
        }
      } else {
        setErrorMsg('ห้องดวลนี้ถูกปิดแล้ว');
        setRoomCode('');
        setRoomData(null);
      }
    });

    return () => unsub();
  }, [roomCode, myUid, myPlayerKey]);

  // 2. Round Timer & Next Round Transition (Host Driver)
  useEffect(() => {
    if (!roomData || roomData.status !== 'in_game') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up for this round
          if (roomData.hostUid === myUid) {
            handleNextRoundOrEnd(roomData);
          }
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData?.status, roomData?.currentQuestionIndex, roomData?.hostUid, myUid]);

  // Host moves to next round or finishes match
  const handleNextRoundOrEnd = async (currentRoom: RoomData) => {
    const nextQ = currentRoom.currentQuestionIndex + 1;
    const playerEntries = Object.values(currentRoom.players);

    // Check if any player's HP <= 0 or finished all 5 questions
    const hasDeadPlayer = playerEntries.some((p) => p.hp <= 0);
    const isFinished = nextQ >= currentRoom.totalQuestions || hasDeadPlayer;

    if (isFinished) {
      // Determine winner
      let winner = playerEntries[0];
      if (playerEntries.length === 2) {
        const [p1, p2] = playerEntries;
        if (p1.hp <= 0 && p2.hp > 0) winner = p2;
        else if (p2.hp <= 0 && p1.hp > 0) winner = p1;
        else if (p1.score > p2.score) winner = p1;
        else if (p2.score > p1.score) winner = p2;
      }

      await updateDoc(doc(db, 'pvp_rooms', currentRoom.roomCode), {
        status: 'finished',
        winnerUid: winner ? winner.uid : null,
      });
    } else {
      await updateDoc(doc(db, 'pvp_rooms', currentRoom.roomCode), {
        currentQuestionIndex: nextQ,
      });
      setTimeLeft(15);
    }
  };

  // 3. Create Room Action
  const handleCreateRoom = async () => {
    if (!appUser || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      sfx.click();
      const code = generateRoomCode();
      const chosenQuestions = shuffle(DEFAULT_QUESTIONS).slice(0, 5);

      const hostPlayer: PlayerState = {
        id: myPlayerKey,
        uid: myUid,
        name: myName,
        nickname: myNickname,
        family: myFamily,
        hp: myMaxHp,
        maxHp: myMaxHp,
        atk: myAtk,
        agi: myAgi,
        dex: myDex,
        score: 0,
        answeredQuestion: -1,
        selectedAns: null,
        lastAnsTime: 0,
        isReady: true,
      };

      const newRoom: RoomData = {
        roomCode: code,
        hostUid: myUid,
        hostPlayerId: myPlayerKey,
        status: 'waiting',
        currentQuestionIndex: 0,
        totalQuestions: 5,
        questions: chosenQuestions,
        players: {
          [myPlayerKey]: hostPlayer,
        },
        winnerUid: null,
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'pvp_rooms', code), newRoom);
      setRoomCode(code);
      setIsHostMode(true);
    } catch (err: any) {
      console.error('Failed to create room:', err);
      setErrorMsg(err.message || 'ไม่สามารถสร้างห้องได้');
    } finally {
      setLoading(false);
    }
  };

  // 4. Join Room Action
  const handleJoinRoom = async () => {
    const targetCode = joinCodeInput.trim().toUpperCase();
    if (!targetCode || !appUser || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      sfx.click();
      const roomRef = doc(db, 'pvp_rooms', targetCode);
      const snap = await getDoc(roomRef);

      if (!snap.exists()) {
        setErrorMsg('ไม่พบรหัสห้องดวลนี้ กรุณาตรวจสอบอีกครั้ง');
        return;
      }

      const rData = snap.data() as RoomData;
      if (rData.status !== 'waiting') {
        setErrorMsg('ห้องดวลนี้เริ่มการแข่งขันไปแล้ว หรือจบลงแล้ว');
        return;
      }

      const existingPlayerCount = Object.keys(rData.players || {}).length;
      if (existingPlayerCount >= 2 && !rData.players[myPlayerKey] && !Object.values(rData.players).some(p => p.uid === myUid)) {
        setErrorMsg('ห้องดวลนี้เต็มแล้ว (จำกัด 2 คน 1v1)');
        return;
      }

      const joinerPlayer: PlayerState = {
        id: myPlayerKey,
        uid: myUid,
        name: myName,
        nickname: myNickname,
        family: myFamily,
        hp: myMaxHp,
        maxHp: myMaxHp,
        atk: myAtk,
        agi: myAgi,
        dex: myDex,
        score: 0,
        answeredQuestion: -1,
        selectedAns: null,
        lastAnsTime: 0,
        isReady: true,
      };

      await updateDoc(roomRef, {
        [`players.${myPlayerKey}`]: joinerPlayer,
      });

      setRoomCode(targetCode);
      setIsHostMode(false);
    } catch (err: any) {
      console.error('Failed to join room:', err);
      setErrorMsg(err.message || 'ไม่สามารถเข้าร่วมห้องได้');
    } finally {
      setLoading(false);
    }
  };

  // Player Pair Helper
  const playerList = roomData?.players ? Object.values(roomData.players) : [];
  const myPlayerState = roomData?.players?.[myPlayerKey] || playerList.find((p) => p.uid === myUid);
  const hostPlayer = roomData?.players
    ? (roomData.players[roomData.hostPlayerId || ''] || roomData.players[roomData.hostUid] || playerList.find(p => p.id === roomData.hostPlayerId || p.uid === roomData.hostUid) || playerList[0])
    : undefined;
  const opponent = playerList.find((p) => (p.id || p.uid) !== (myPlayerState?.id || myPlayerKey || myUid)) || (playerList.length >= 2 ? playerList.find(p => p !== myPlayerState) : undefined);
  const isHost = isHostMode || (roomData?.hostPlayerId === myPlayerKey) || (roomData?.hostUid === myUid);

  // 5. Start Game Action (Host only)
  const handleStartGame = async () => {
    if (!roomData) return;
    if (!isHost) {
      setErrorMsg('เฉพาะโฮสต์เท่านั้นที่สามารถเริ่มการแข่งขันได้');
      return;
    }
    const pCount = Object.keys(roomData.players || {}).length;
    if (pCount < 2) {
      setErrorMsg('กรุณารอผู้เล่นคนที่ 2 เข้าร่วมห้องก่อนเริ่มการดวล');
      return;
    }

    try {
      setIsStarting(true);
      setErrorMsg(null);
      sfx.countdown();
      await updateDoc(doc(db, 'pvp_rooms', roomData.roomCode), {
        status: 'in_game',
        currentQuestionIndex: 0,
        roundStartTime: Date.now(),
      });
      setTimeLeft(15);
    } catch (err: any) {
      console.error('Failed to start game:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเริ่มเกม กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsStarting(false);
    }
  };

  // 6. Handle Answer Choice
  const handleSelectChoice = async (idx: number) => {
    if (!roomData || roomData.status !== 'in_game' || selectedChoice !== null) return;
    setSelectedChoice(idx);

    const qIdx = roomData.currentQuestionIndex;
    const currentQ = roomData.questions[qIdx];
    const isCorrect = idx === currentQ.ans;

    // Identify current player key & opponent key
    const myKey = myPlayerState?.id || myPlayerKey;
    const opponentKey = opponent?.id || Object.keys(roomData.players).find((k) => k !== myKey);

    if (isCorrect) {
      sfx.correct();
      // Calculate Damage (ATK with Dex-based Crit)
      const isCrit = Math.random() < (myDex * 0.05);
      const dmg = isCrit ? myAtk * 2 : myAtk;
      const speedBonus = timeLeft * 10;
      const roundScore = 100 + speedBonus;

      setShowDmgEffect({ target: opponent?.uid || opponentKey || '', amount: dmg, isCrit });
      setTimeout(() => setShowDmgEffect(null), 1200);

      // Apply damage to opponent & increment my score
      const updates: any = {
        [`players.${myKey}.score`]: increment(roundScore),
        [`players.${myKey}.answeredQuestion`]: qIdx,
        [`players.${myKey}.selectedAns`]: idx,
      };

      if (opponentKey && roomData.players[opponentKey]) {
        const opp = roomData.players[opponentKey];
        const newOppHp = Math.max(0, opp.hp - dmg);
        updates[`players.${opponentKey}.hp`] = newOppHp;
      }

      await updateDoc(doc(db, 'pvp_rooms', roomData.roomCode), updates);
    } else {
      sfx.wrong();
      // Wrong answer: mark as answered, 0 score
      await updateDoc(doc(db, 'pvp_rooms', roomData.roomCode), {
        [`players.${myKey}.answeredQuestion`]: qIdx,
        [`players.${myKey}.selectedAns`]: idx,
      });
    }

    // If both players have answered, host immediately triggers next round
    setTimeout(async () => {
      const snap = await getDoc(doc(db, 'pvp_rooms', roomData.roomCode));
      if (snap.exists()) {
        const freshData = snap.data() as RoomData;
        const allAnswered = Object.values(freshData.players).every((p) => p.answeredQuestion === qIdx);
        if (allAnswered && isHost && freshData.status === 'in_game') {
          handleNextRoundOrEnd(freshData);
        }
      }
    }, 1000);
  };

  // 7. Reward Distribution on Finish
  useEffect(() => {
    if (!roomData || roomData.status !== 'finished' || rewardClaimedRef.current) return;
    rewardClaimedRef.current = true;

    const isWinner = roomData.winnerUid === myUid;
    const expBonus = isWinner ? 50 : 15;

    // Use awardDailyCappedExp to enforce daily cap for PVP
    const processRewards = async () => {
      try {
        const res = await awardDailyCappedExp(
          myUid,
          'pvp',
          '1v1 Virus Duel (PvP)',
          isWinner ? 100 : 30,
          expBonus
        );
        setAwardedExpState(res.awardedExp);
        const freshDaily = await getDailyExpInfo(myUid, 'pvp');
        setDailyInfo(freshDaily);
      } catch (err) {
        console.error('Failed to award capped EXP for PvP:', err);
      }
    };

    processRewards();

    if (isWinner) sfx.levelUp();
    else sfx.wrong();
  }, [roomData?.status, roomData?.winnerUid, myUid]);

  // Copy Room Code Helper
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 z-10 relative pb-12">
      
      {/* ── Top Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        <Link href="/student/play">
          <Button variant="secondary" className="font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> กลับหน้ารวมด่าน
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIs3DMode(!is3DMode)}
            className="text-xs font-mono tracking-wider px-3 py-1.5 rounded-xl border border-rose-500/40 bg-slate-950/60 text-rose-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Box className="w-3.5 h-3.5 text-rose-400" />
            <span>{is3DMode ? '3D ARENA' : '2D ARENA'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/80 text-red-200 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Screen 1: Lobby Selection (No Room Selected) ───────── */}
      {!roomData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Create Match */}
          <Card className="p-6 glass border-rose-500/40 bg-slate-900/80 shadow-[0_0_30px_rgba(244,63,94,0.15)] flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center">
                <Swords className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                สร้างห้องดวลใหม่ (Host Match)
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                สร้างรหัสห้องดวล 1v1 แล้วส่งให้เพื่อนเข้าร่วม แข่งตอบคำถามไวรัสวิทยา 5 ข้อเพื่อชิง EXP +50!
              </p>
            </div>

            <Button
              disabled={loading}
              onClick={handleCreateRoom}
              className="w-full py-6 text-base font-black bg-rose-600 hover:bg-rose-500 text-white uppercase tracking-widest shadow-[0_0_20px_rgba(244,63,94,0.4)] active:scale-95"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'สร้างห้องท้าดวล (Create Room)'}
            </Button>
          </Card>

          {/* Card 2: Join Match */}
          <Card className="p-6 glass border-cyan-500/40 bg-slate-900/80 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                เข้าร่วมห้องเพื่อน (Join Match)
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                ใส่รหัสห้อง 6 หลักที่เพื่อนส่งให้เพื่อเข้าสู่สังเวียนประลอง
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="กรอกรหัสห้อง เช่น AB12CD"
                className="w-full bg-slate-950/80 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-center text-lg font-mono font-black tracking-widest text-cyan-300 placeholder:text-slate-600 focus:outline-none uppercase"
              />
              <Button
                disabled={loading || joinCodeInput.trim().length === 0}
                onClick={handleJoinRoom}
                className="w-full py-6 text-base font-black bg-cyan-600 hover:bg-cyan-500 text-white uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'เข้าสู่ห้องดวล (Join Room)'}
              </Button>
            </div>
          </Card>

        </div>
      )}

      {/* ── Screen 2: Waiting Room (Lobby) ────────────────────── */}
      {roomData && roomData.status === 'waiting' && (
        <Card className="p-6 md:p-8 glass border-rose-500/40 bg-slate-900/80 shadow-2xl space-y-6 text-center">
          
          <div className="space-y-2">
            <div className="text-xs font-mono text-rose-400 font-bold uppercase tracking-widest">
              LOBBY CODE
            </div>
            <div className="inline-flex items-center gap-3 bg-slate-950/90 border-2 border-rose-500/60 px-6 py-3 rounded-2xl shadow-inner">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white text-glow">
                {roomData.roomCode}
              </span>
              <button
                type="button"
                onClick={copyRoomCode}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 transition-colors"
                title="คัดลอกรหัสห้อง"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              ส่งรหัสนี้ให้เพื่อนเพื่อเข้ามาดวล 1v1
            </p>
          </div>

          {/* Versus Display */}
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto py-4">
            
            {/* Player 1 (Host) */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/40 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 p-2 flex items-center justify-center">
                <SVGVirus type={familyToVirusType(hostPlayer?.family || 'corona')} className="w-full h-full text-cyan-400" />
              </div>
              <div className="font-black text-sm text-white truncate max-w-full">
                {hostPlayer?.nickname || 'Host'}
              </div>
              <div className="text-[10px] text-cyan-300 font-mono">
                HP: {hostPlayer?.maxHp || 100} | ATK: {hostPlayer?.atk || 20}
              </div>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                👑 โฮสต์ (Ready)
              </span>
            </div>

            {/* Player 2 (Challenger) */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-rose-500/40 flex flex-col items-center gap-2">
              {opponent ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/30 p-2 flex items-center justify-center">
                    <SVGVirus type={familyToVirusType(opponent.family)} className="w-full h-full text-rose-400" />
                  </div>
                  <div className="font-black text-sm text-white truncate max-w-full">
                    {opponent.nickname}
                  </div>
                  <div className="text-[10px] text-rose-300 font-mono">
                    HP: {opponent.maxHp} | ATK: {opponent.atk}
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                    ✅ พร้อมดวล
                  </span>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 py-4">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-500/60" />
                  <span className="text-xs font-mono">กำลังรอคู่ต่อสู้...</span>
                </div>
              )}
            </div>

          </div>

          {/* Start Button (Host only) */}
          {isHost ? (
            <Button
              disabled={!opponent || isStarting}
              onClick={handleStartGame}
              className={`w-full max-w-md py-6 text-lg font-black uppercase tracking-widest ${
                opponent && !isStarting
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_25px_rgba(244,63,94,0.5)] active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isStarting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> กำลังเริ่มการดวล...
                </span>
              ) : opponent ? (
                '⚔️ เริ่มการดวล (Start Battle!)'
              ) : (
                'รอผู้เล่นคนที่ 2 เข้าร่วม...'
              )}
            </Button>
          ) : (
            <div className="text-sm text-rose-300 font-bold animate-pulse">
              🎮 รอโฮสต์กดเริ่มการแข่งขัน...
            </div>
          )}

        </Card>
      )}

      {/* ── Screen 3: In-Game Battle Arena (1v1) ───────────────── */}
      {roomData && roomData.status === 'in_game' && (
        <div className="space-y-5">
          
          {/* Top Arena Health Bars */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            
            {/* My Health Bar */}
            <div className="bg-slate-900/90 border border-cyan-500/40 p-3 sm:p-4 rounded-2xl relative overflow-hidden shadow-lg">
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-cyan-300 truncate max-w-[70%]">
                  {myPlayerState?.nickname} (คุณ)
                </span>
                <span className="font-mono text-white text-[11px]">
                  {myPlayerState?.hp} / {myPlayerState?.maxHp} HP
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.max(0, ((myPlayerState?.hp || 0) / (myPlayerState?.maxHp || 1)) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] font-mono text-cyan-400/80 mt-1 flex justify-between">
                <span>คะแนน: {myPlayerState?.score || 0}</span>
                <span>ATK: {myPlayerState?.atk}</span>
              </div>
            </div>

            {/* Opponent Health Bar */}
            <div className="bg-slate-900/90 border border-rose-500/40 p-3 sm:p-4 rounded-2xl relative overflow-hidden shadow-lg">
              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                <span className="text-rose-300 truncate max-w-[70%]">
                  {opponent?.nickname || 'Opponent'}
                </span>
                <span className="font-mono text-white text-[11px]">
                  {opponent?.hp} / {opponent?.maxHp} HP
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-300"
                  style={{ width: `${Math.max(0, ((opponent?.hp || 0) / (opponent?.maxHp || 1)) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] font-mono text-rose-400/80 mt-1 flex justify-between">
                <span>คะแนน: {opponent?.score || 0}</span>
                <span>ATK: {opponent?.atk}</span>
              </div>
            </div>

          </div>

          {/* Central 3D / 2D Battle Stage */}
          <Card className="p-4 glass border-slate-800 bg-slate-950/80 min-h-[220px] flex items-center justify-around relative overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-radial-vignette opacity-40 pointer-events-none" />

            {/* Left Virus (Me) */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 relative flex items-center justify-center">
              {is3DMode ? (
                <VirusViewer3D type={familyToVirusType(myPlayerState?.family || myFamily)} color="#06b6d4" interactive={false} className="w-full h-full scale-125" />
              ) : (
                <SVGVirus type={familyToVirusType(myPlayerState?.family || myFamily)} className="w-24 h-24 text-cyan-400" />
              )}
            </div>

            {/* Center VS & Round Indicator */}
            <div className="text-center z-10 space-y-1">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                ข้อที่ {roomData.currentQuestionIndex + 1} / {roomData.totalQuestions}
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-500 italic drop-shadow-[0_0_10px_rgba(244,63,94,0.6)]">
                VS
              </div>
              <div className={`text-3xl font-black font-mono ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                {timeLeft}s
              </div>
            </div>

            {/* Right Virus (Opponent) */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 relative flex items-center justify-center">
              {is3DMode ? (
                <VirusViewer3D type={familyToVirusType(opponent?.family || 'rabies')} color="#f43f5e" interactive={false} className="w-full h-full scale-125" />
              ) : (
                <SVGVirus type={familyToVirusType(opponent?.family || 'rabies')} className="w-24 h-24 text-rose-400" />
              )}
            </div>

            {/* Floating Damage Popup */}
            {showDmgEffect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1.4, y: -40 }}
                exit={{ opacity: 0 }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 font-black text-2xl sm:text-3xl z-30 drop-shadow-lg ${
                  showDmgEffect.isCrit ? 'text-yellow-300' : 'text-red-400'
                }`}
              >
                {showDmgEffect.isCrit ? `💥 CRIT! -${showDmgEffect.amount}` : `⚔️ -${showDmgEffect.amount}`}
              </motion.div>
            )}
          </Card>

          {/* Current Question & Multiple Choice Buttons */}
          {(() => {
            const currentQ = roomData.questions[roomData.currentQuestionIndex];
            if (!currentQ) return null;

            return (
              <Card className="p-5 sm:p-6 glass border-slate-700 bg-slate-900/90 space-y-4">
                <div className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {currentQ.q}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQ.opts.map((opt, i) => {
                    const isChosen = selectedChoice === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={selectedChoice !== null}
                        onClick={() => handleSelectChoice(i)}
                        className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-bold transition-all ${
                          isChosen
                            ? 'bg-rose-500/30 border-rose-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                            : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500 hover:bg-slate-800 text-slate-300 hover:text-white'
                        } ${selectedChoice !== null && !isChosen ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className="font-mono text-slate-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {selectedChoice !== null && (
                  <div className="text-center text-xs font-mono text-cyan-300 animate-pulse pt-1">
                    ส่งคำตอบแล้ว! รอผลรอบถัดไป...
                  </div>
                )}
              </Card>
            );
          })()}

        </div>
      )}

      {/* ── Screen 4: Match Finished (Victory / Defeat) ────────── */}
      {roomData && roomData.status === 'finished' && (
        <Card className="p-8 glass border-slate-700 bg-slate-900/90 text-center space-y-6 shadow-2xl max-w-lg mx-auto">
          {roomData.winnerUid === myUid ? (
            <>
              <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.5)]">
                <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-amber-400 uppercase tracking-widest text-glow">
                VICTORY!
              </h2>
              <p className="text-slate-300 font-bold">
                คุณเอาชนะคู่ต่อสู้ในการดวลไวรัส 1v1 ได้สำเร็จ!
              </p>
              <div className="space-y-2">
                <div className="text-xl font-black text-yellow-300 bg-amber-950/60 border border-amber-500/50 py-2.5 px-6 rounded-2xl shadow-inner inline-block">
                  🎉 {awardedExpState !== null ? (awardedExpState > 0 ? `+${awardedExpState} EXP` : 'เข้าสู่โหมดฝึกฝน (+0 EXP)') : '+50 EXP'} และคะแนนเกียรติยศ PvP!
                </div>
                {dailyInfo && (
                  <div className="text-xs text-slate-400 font-mono">
                    โควตา PvP วันนี้: <span className="text-cyan-400 font-bold">{dailyInfo.earnedToday}</span> / {dailyInfo.cap} EXP
                    {dailyInfo.isCapped && <span className="text-amber-400 ml-2">(รับครบโควตาวันนี้แล้ว)</span>}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
                <Swords className="w-10 h-10 text-slate-500" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-rose-500 uppercase tracking-widest">
                DEFEATED
              </h2>
              <p className="text-slate-400">
                คุณพ่ายแพ้ในการดวลรอบนี้ พัฒนาสเตตัสในห้องเพาะเลี้ยงแล้วลองใหม่อีกครั้ง!
              </p>
              <div className="space-y-2">
                <div className="text-sm font-bold text-slate-400 bg-slate-950 py-2 px-4 rounded-xl border border-slate-800 inline-block">
                  {awardedExpState !== null ? (awardedExpState > 0 ? `+${awardedExpState} EXP` : 'โหมดฝึกฝน (+0 EXP)') : '+15 EXP'} (รางวัลการเข้าร่วม)
                </div>
                {dailyInfo && (
                  <div className="text-xs text-slate-400 font-mono">
                    โควตา PvP วันนี้: <span className="text-cyan-400 font-bold">{dailyInfo.earnedToday}</span> / {dailyInfo.cap} EXP
                  </div>
                )}
              </div>
            </>
          )}

          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                setRoomCode('');
                setRoomData(null);
                rewardClaimedRef.current = false;
              }}
              className="py-5 font-black bg-rose-600 hover:bg-rose-500 text-white uppercase tracking-wider"
            >
              เล่นอีกรอบ (Play Again)
            </Button>
            <Link href="/student/play">
              <Button variant="secondary" className="py-5 font-bold uppercase tracking-wider w-full">
                กลับหน้ารวมด่าน
              </Button>
            </Link>
          </div>
        </Card>
      )}

    </div>
  );
}
