"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Server, ShieldAlert, Trophy, Clock, XCircle, CheckCircle, BarChart3, HelpCircle, ArrowRight, Award, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
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
  increment,
  arrayUnion
} from 'firebase/firestore';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { ALL_15_CHAPTER_QUESTIONS } from '@/data/veterinaryVirologyContent';

const DEFAULT_QUESTIONS = ALL_15_CHAPTER_QUESTIONS.map(q => ({
  q: q.q,
  opts: q.choices,
  ans: q.choices.indexOf(q.answer) !== -1 ? q.choices.indexOf(q.answer) : 0,
  chapter: q.chapter,
  chapterTitle: q.chapterTitle,
  explanation: q.explanation || ''
}));

const TIME_PER_QUESTION_MS = 20000;
const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function ClassroomBattle() {
  const { appUser, user } = useAuth();
  const myUid = appUser?.uid || user?.uid || '';
  const myName = appUser?.displayName || 'Student';
  
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomData, setRoomData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHostMode, setIsHostMode] = useState(false);
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [questionCountChoice, setQuestionCountChoice] = useState(10);

  // Match State
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const submittingRef = useRef(false);
  const rewardSavedRef = useRef(false);

  const currentScore = roomData?.scores?.[myUid] || 0;
  useLiveTracking('classroom-battle', `สถานะ: ${roomData?.status || 'waiting'} | ห้อง: ${roomCode || '-'} | คะแนน: ${currentScore}`);

  // Fetch Questions from Firestore (if custom pool uploaded by instructor)
  useEffect(() => {
    const fetchQ = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'game_content', 'classroom_battle'));
        if (docSnap.exists() && docSnap.data().questions?.length > 0) {
          setQuestions(docSnap.data().questions);
        }
      } catch (e) {
        console.error("Failed to load custom questions", e);
      }
    };
    fetchQ();
  }, []);
  
  // Real-time Room Sync (ONLY depends on roomCode to prevent subscription churn)
  useEffect(() => {
    if (!roomCode) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomCode), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomData(data);
        
        if (data.roomQuestions && data.roomQuestions.length > 0) {
          setQuestions(data.roomQuestions);
        }
      } else {
        setError('ห้องแข่งขันถูกปิดหรือไม่มีอยู่จริง');
        setRoomCode('');
        setRoomData(null);
      }
    }, (err) => {
      console.error("Room sync error:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อห้องแข่งขัน");
    });
    return () => unsub();
  }, [roomCode]);

  // Reset selected answer whenever question index changes
  useEffect(() => {
    setSelectedAns(null);
    submittingRef.current = false;
  }, [roomData?.currentQuestionIndex]);

  // Re-hydrate selected answer if player reconnects/refreshes
  useEffect(() => {
    if (roomData?.status === 'question' && roomData?.currentQuestionIndex !== undefined) {
      const qIndex = roomData.currentQuestionIndex;
      const existing = roomData.answers?.[myUid]?.[qIndex];
      if (existing !== undefined && selectedAns === null) {
        setSelectedAns(existing.ans);
      }
    }
  }, [roomData?.status, roomData?.currentQuestionIndex, roomData?.answers, myUid]);

  useEffect(() => {
    rewardSavedRef.current = false;
  }, [roomCode]);

  // Synchronized countdown timer for BOTH Host and Students
  useEffect(() => {
    if (roomData?.status === 'question' && roomData?.questionStartTime) {
      const interval = setInterval(() => {
        const startTime = roomData.questionStartTime;
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.ceil((TIME_PER_QUESTION_MS - elapsed) / 1000));
        setTimeLeft(remaining);
        
        // Auto submit for student if time expires and hasn't answered
        if (!isHostMode && remaining === 0 && selectedAns === null && !submittingRef.current) {
          handleAnswer(-1);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [roomData?.status, roomData?.questionStartTime, isHostMode, selectedAns]);

  // ================= ADMIN CONTROLS =================

  const handleCreateRoom = async () => {
    if (!myUid) return;
    setLoading(true);
    setError('');
    const code = generateRoomCode();
    try {
      await setDoc(doc(db, 'rooms', code), {
        id: code,
        gameType: 'classroom-battle',
        status: 'lobby',
        hostId: myUid,
        players: [],
        scores: {}, // { uid: number }
        accuracy: {}, // { uid: { correct: number, total: number } }
        answers: {}, // { uid: { qIndex: { ans: number, time: number, correct: boolean } } }
        currentQuestionIndex: -1,
        questionCount: questionCountChoice,
        createdAt: serverTimestamp()
      });
      setRoomCode(code);
      setIsHostMode(true);
    } catch (e: any) {
      setError(e.message || "Failed to create room");
    }
    setLoading(false);
  };

  const handleStartNextQuestion = async () => {
    if (!roomCode || !roomData) return;
    const currentQList = roomData.roomQuestions || questions;
    const nextQ = (roomData.currentQuestionIndex ?? -1) + 1;
    
    if (nextQ >= currentQList.length) {
      await updateDoc(doc(db, 'rooms', roomCode), { status: 'finished' });
      return;
    }
    
    let updates: any = {
      status: 'question',
      currentQuestionIndex: nextQ,
      questionStartTime: Date.now()
    };
    
    if (nextQ === 0) {
      // Pick randomized pool based on question count choice
      const pool = [...questions].sort(() => Math.random() - 0.5);
      const chosen = questionCountChoice >= pool.length ? pool : pool.slice(0, questionCountChoice);
      updates.roomQuestions = chosen;
      updates.questionCount = chosen.length;
    }
    
    await updateDoc(doc(db, 'rooms', roomCode), updates);
  };

  const handleShowLeaderboard = async () => {
    if (!roomCode) return;
    try {
      await updateDoc(doc(db, 'rooms', roomCode), { status: 'leaderboard' });
    } catch (e: any) {
      console.error("Failed to show leaderboard:", e);
    }
  };

  const handleEndGameEarly = async () => {
    if (!roomCode) return;
    try {
      await updateDoc(doc(db, 'rooms', roomCode), { status: 'finished' });
    } catch (e: any) {
      console.error("Failed to end game:", e);
    }
  };

  // ================= PLAYER CONTROLS =================

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myUid || !joinCode) return;
    setLoading(true);
    setError('');
    const code = joinCode.toUpperCase().trim();
    try {
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) throw new Error('ไม่พบห้องแข่งขันนี้ (Room not found)');
      
      const data = roomSnap.data();
      if (data.gameType !== 'classroom-battle') throw new Error('ประเภทห้องไม่ถูกต้อง');
      
      // Allow reconnect
      const existingPlayer = data.players?.find((p: any) => p.uid === myUid);
      if (existingPlayer) {
        setRoomCode(code);
        setIsHostMode(data.hostId === myUid);
        setLoading(false);
        return;
      }

      if (data.status !== 'lobby') throw new Error('เกมเริ่มไปแล้ว ไม่สามารถเข้าร่วมได้ในขณะนี้');

      await updateDoc(roomRef, {
        players: arrayUnion({ uid: myUid, displayName: myName }),
        [`scores.${myUid}`]: 0,
        [`accuracy.${myUid}`]: { correct: 0, total: 0 }
      });
      setRoomCode(code);
      setIsHostMode(false);
    } catch (e: any) {
      setError(e.message || "Failed to join room");
    }
    setLoading(false);
  };

  const handleAnswer = async (optIndex: number) => {
    if (selectedAns !== null || submittingRef.current) return;
    
    const qIndex = roomData?.currentQuestionIndex;
    if (qIndex === undefined || qIndex < 0) return;
    
    const currentQList = roomData?.roomQuestions || questions;
    const q = currentQList[qIndex];
    if (!q) return;

    // Check if already recorded
    if (roomData?.answers?.[myUid]?.[qIndex] !== undefined) {
      setSelectedAns(roomData.answers[myUid][qIndex].ans);
      return;
    }

    submittingRef.current = true;
    setSelectedAns(optIndex);
    
    const isCorrect = optIndex >= 0 && optIndex === q.ans;
    const startTime = typeof roomData?.questionStartTime === 'number' ? roomData.questionStartTime : Date.now();
    const timeUsedMs = Math.max(0, Date.now() - startTime);
    const timeRatio = Math.max(0, Math.min(1, 1 - (timeUsedMs / TIME_PER_QUESTION_MS)));
    
    let points = 0;
    if (isCorrect) {
      sfx.correct();
      points = Math.round(500 + (500 * timeRatio)); // 500 to 1000 pts
    } else {
      sfx.wrong();
    }

    try {
      await updateDoc(doc(db, 'rooms', roomCode), {
        [`scores.${myUid}`]: increment(points),
        [`accuracy.${myUid}.total`]: increment(1),
        [`accuracy.${myUid}.correct`]: increment(isCorrect ? 1 : 0),
        [`answers.${myUid}.${qIndex}`]: { ans: optIndex, time: timeUsedMs, correct: isCorrect }
      });
    } catch(e) {
      console.error("Failed to update answer in Firestore:", e);
    } finally {
      submittingRef.current = false;
    }
  };

  // Give EXP on finish (Placement-based reward to prevent inflation)
  useEffect(() => {
    if (!isHostMode && roomData?.status === 'finished' && myUid) {
       if (rewardSavedRef.current) return;
       rewardSavedRef.current = true;
       sfx.levelUp();
       const save = async () => {
         try {
           const finalPoints = roomData.scores?.[myUid] || 0;
           
           // Calculate rank among all participating students
           const scoreEntries = Object.entries(roomData.scores || {}).map(([uid, score]: any) => ({ uid, score }));
           scoreEntries.sort((a, b) => b.score - a.score);
           const myRank = scoreEntries.findIndex(p => p.uid === myUid) + 1;

           // Balanced EXP rewards: 1st=150, 2nd=120, 3rd=100, Top 10=75, Participation=50
           let earnedExp = 50;
           if (myRank === 1) earnedExp = 150;
           else if (myRank === 2) earnedExp = 120;
           else if (myRank === 3) earnedExp = 100;
           else if (myRank <= 10 && myRank > 0) earnedExp = 75;

           // Bonus for 100% accuracy
           const myAccuracy = roomData.accuracy?.[myUid];
           if (myAccuracy && myAccuracy.total > 0 && myAccuracy.correct === myAccuracy.total) {
             earnedExp += 25; // Perfect accuracy bonus
           }

           await updateDoc(doc(db, 'users', myUid), { exp: increment(earnedExp) });
           const { addDoc, collection } = await import('firebase/firestore');
           await addDoc(collection(db, 'users', myUid, 'history'), {
             gameId: 'classroom-battle',
             gameName: 'Classroom Battle',
             score: finalPoints,
             expEarned: earnedExp,
             playedAt: new Date().toISOString()
           });
         } catch(e) {
           console.error("Failed to save classroom battle reward:", e);
         }
       };
       save();
    }
  }, [roomData?.status, isHostMode, myUid]);

  // ================= RENDER LOGIC =================

  // Screen 1: Join or Create Room
  if (!roomCode || !roomData) {
    return (
      <div className="max-w-4xl mx-auto mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 px-4 pb-16">
        {error && (
          <div className="col-span-1 md:col-span-2 p-4 bg-danger/20 text-danger border border-danger/40 rounded-2xl text-center text-sm font-bold flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Student Join */}
        <Card className="p-8 glass border-pink-500/30 flex flex-col items-center justify-center space-y-6 shadow-xl">
          <div className="w-20 h-20 rounded-3xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center">
            <Users className="w-10 h-10 text-pink-400 animate-pulse" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-black text-pink-400 uppercase tracking-widest text-glow">Join Battle</h2>
            <p className="text-slate-400 text-sm mt-1">สำหรับนิสิต ใส่รหัส PIN 6 หลักเพื่อเข้าร่วมประลอง</p>
          </div>
          <form onSubmit={handleJoinRoom} className="w-full space-y-4">
            <input 
              type="text" 
              placeholder="ENTER 6-CHAR PIN" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 text-center font-black tracking-widest uppercase text-2xl text-white focus:border-pink-500 outline-none transition-all shadow-inner"
              maxLength={6}
            />
            <Button type="submit" disabled={loading || joinCode.length !== 6} className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-4 uppercase tracking-widest rounded-xl text-base shadow-lg shadow-pink-600/30">
              {loading ? 'กำลังเชื่อมต่อ...' : 'เข้าร่วมห้องเรียน'}
            </Button>
          </form>
        </Card>

        {/* Teacher Host */}
        <Card className="p-8 glass border-yellow-500/30 flex flex-col items-center justify-center space-y-6 shadow-xl">
          <div className="w-20 h-20 rounded-3xl bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center">
            <ShieldAlert className="w-10 h-10 text-yellow-400" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-widest text-glow">Teacher Host</h2>
            <p className="text-slate-400 text-sm mt-1">สำหรับอาจารย์ เปิดห้องแข่งขันสดฉายขึ้นจอโปรเจกเตอร์</p>
          </div>
          
          <div className="w-full space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-center">
              จำนวนคำถามในการแข่งขัน
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setQuestionCountChoice(num)}
                  className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                    questionCountChoice === num 
                      ? 'bg-yellow-500 text-black border-yellow-400 shadow-md' 
                      : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {num} ข้อ
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleCreateRoom} disabled={loading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 uppercase tracking-widest rounded-xl text-base shadow-lg shadow-yellow-600/30">
            {loading ? 'กำลังสร้างห้อง...' : 'เปิดห้องแข่งขันใหม่'}
          </Button>
        </Card>
      </div>
    );
  }

  // Screen 2: Lobby
  if (roomData.status === 'lobby') {
    const playersCount = roomData.players?.length || 0;
    return (
      <div className="max-w-3xl mx-auto mt-10 p-8 md:p-12 glass rounded-3xl border-2 border-pink-500/50 text-center shadow-2xl">
        <h2 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-1">Classroom PIN</h2>
        <div className="text-7xl md:text-8xl font-black text-white tracking-[0.2em] mb-4 text-glow font-mono select-all">
          {roomCode}
        </div>
        <p className="text-pink-400 font-bold mb-8 text-xl flex items-center justify-center gap-2">
          <Users className="w-6 h-6" /> {playersCount} คนเข้าร่วมแล้ว
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 mb-10 max-h-56 overflow-y-auto p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
          {roomData.players?.map((p: any, i: number) => (
            <motion.div initial={{scale:0}} animate={{scale:1}} key={i} className="bg-slate-800 px-4 py-2 rounded-xl text-md font-bold text-white border border-slate-700 shadow-md">
              {p.displayName}
            </motion.div>
          ))}
          {playersCount === 0 && (
            <div className="text-slate-500 font-medium py-6">กำลังรอนิสิตเข้าร่วมด้วยรหัส PIN...</div>
          )}
        </div>

        {isHostMode ? (
          <div className="space-y-4">
            <Button 
              onClick={handleStartNextQuestion} 
              disabled={playersCount === 0} 
              className="w-full max-w-md mx-auto py-5 text-xl font-black tracking-widest uppercase bg-pink-500 hover:bg-pink-400 text-white shadow-[0_0_25px_rgba(236,72,153,0.6)] rounded-2xl transition-all"
            >
              เริ่มคำถามข้อแรก 🚀
            </Button>
            <p className="text-xs text-slate-400">แข่งขันทั้งหมด {roomData.questionCount || questionCountChoice} ข้อ</p>
          </div>
        ) : (
          <div className="text-cyan-400 font-bold animate-pulse text-xl uppercase tracking-widest py-4 flex items-center justify-center gap-2">
            <Clock className="w-6 h-6" /> รออาจารย์กดเริ่มการแข่งขัน...
          </div>
        )}
      </div>
    );
  }

  // Safe Player Leaderboard Calculation
  const sortedPlayers = [...(roomData.players || [])].sort((a, b) => (roomData.scores?.[b.uid] || 0) - (roomData.scores?.[a.uid] || 0));
  const currentQList = roomData.roomQuestions || questions;

  // Screen 3: Question View
  if (roomData.status === 'question') {
    const qIndex = roomData.currentQuestionIndex ?? 0;
    const q = currentQList[qIndex];
    
    if (!q) {
      return (
        <div className="max-w-md mx-auto mt-12 p-8 glass text-center rounded-2xl">
          <p className="text-white font-bold animate-pulse">กำลังโหลดคำถาม...</p>
        </div>
      );
    }
    
    const allAnswers = roomData.answers || {};
    const answeredCount = Object.keys(allAnswers).filter(uid => allAnswers[uid]?.[qIndex] !== undefined).length;
    const totalPlayers = roomData.players?.length || 0;
    const allAnswered = totalPlayers > 0 && answeredCount >= totalPlayers;
    const timeIsUp = timeLeft === 0;

    // Host View in Question
    if (isHostMode) {
      return (
        <div className="max-w-4xl mx-auto mt-8 space-y-6 text-center px-4 pb-16">
          {/* Top Bar */}
          <div className="flex flex-wrap justify-between items-center gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-700 shadow-lg">
             <div className="font-bold text-pink-400 uppercase tracking-widest text-lg">
               คำถามข้อที่ {qIndex + 1} / {currentQList.length}
             </div>
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
                 <Clock className={`w-6 h-6 ${timeLeft <= 5 ? 'text-danger animate-ping' : 'text-cyan-400'}`} />
                 <span className={`text-2xl font-black font-mono ${timeLeft <= 5 ? 'text-danger' : 'text-white'}`}>{timeLeft}s</span>
               </div>
               <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 font-bold text-white">
                 👥 {answeredCount} / {totalPlayers} ตอบแล้ว
               </div>
             </div>
          </div>
          
          {/* Progress Bar of answers */}
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${totalPlayers > 0 ? Math.min(100, (answeredCount / totalPlayers) * 100) : 0}%` }}
            />
          </div>

          <Card className="p-8 md:p-12 glass border-pink-500/30 min-h-[360px] flex flex-col justify-center shadow-xl">
            {(q as any)?.chapterTitle && (
              <div className="mb-4">
                <span className="text-sm font-bold px-4 py-1.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                  บทที่ {(q as any).chapter}: {(q as any).chapterTitle}
                </span>
              </div>
            )}
            <h2 className="text-3xl md:text-4xl font-black text-white mb-10 leading-snug">{q.q}</h2>
            
            {/* Action Buttons: Host is NEVER locked out! */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4">
              <Button 
                onClick={handleShowLeaderboard} 
                className={`w-full sm:w-auto px-8 py-4 font-black uppercase text-lg rounded-2xl shadow-xl transition-all ${
                  allAnswered || timeIsUp 
                    ? 'bg-yellow-500 hover:bg-yellow-400 text-black animate-pulse shadow-yellow-500/50' 
                    : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                }`}
              >
                {allAnswered ? '🎉 ทุกคนตอบครบแล้ว! เฉลยคำตอบ' : timeIsUp ? '⏰ หมดเวลา! แสดงผลและเฉลย' : `📊 เฉลยคำตอบ (${answeredCount}/${totalPlayers} คนตอบ)`}
              </Button>

              <Button
                variant="outline"
                onClick={handleEndGameEarly}
                className="w-full sm:w-auto border-red-500/50 text-red-400 hover:bg-red-500/20 py-4 px-6 font-bold rounded-2xl"
              >
                🏁 จบเกมล่วงหน้า
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    // Student View in Question
    const hasAnswered = selectedAns !== null || (roomData?.answers?.[myUid]?.[qIndex] !== undefined);
    const chosenAns = selectedAns !== null ? selectedAns : roomData?.answers?.[myUid]?.[qIndex]?.ans;

    return (
      <div className="max-w-3xl mx-auto mt-8 space-y-6 px-4 pb-16">
        <div className="flex justify-between items-center bg-slate-900/90 p-4 rounded-2xl border border-slate-700 shadow-md">
          <div className="text-pink-400 font-black uppercase tracking-widest text-lg">ข้อ {qIndex + 1} / {currentQList.length}</div>
          <div className="flex items-center gap-2">
            <Clock className={`w-6 h-6 ${timeLeft <= 5 ? 'text-danger animate-ping' : 'text-cyan-400'}`} />
            <span className={`text-2xl font-black font-mono ${timeLeft <= 5 ? 'text-danger' : 'text-white'}`}>{timeLeft}s</span>
          </div>
          <div className="text-yellow-400 font-bold bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/30">
            คะแนน: {roomData.scores?.[myUid] || 0}
          </div>
        </div>

        <Card className="p-6 md:p-8 glass border-pink-500/30 text-center min-h-[340px] shadow-xl">
          {(q as any)?.chapterTitle && (
            <div className="mb-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/40">
                บทที่ {(q as any).chapter}: {(q as any).chapterTitle}
              </span>
            </div>
          )}
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6 leading-relaxed">{q.q}</h2>

          {!hasAnswered ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.opts.map((opt: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="p-5 rounded-2xl border-2 font-bold transition-all text-lg bg-slate-800/90 hover:bg-pink-600/30 hover:border-pink-500 border-slate-700 text-white shadow-md active:scale-95 text-left flex items-center"
                >
                  <span className="inline-block w-8 h-8 rounded-lg bg-slate-700/80 mr-3 text-cyan-300 font-black text-center leading-8 flex-shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{opt}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center animate-bounce">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
                ส่งคำตอบแล้ว!
              </h2>
              {chosenAns !== undefined && chosenAns >= 0 && q.opts[chosenAns] && (
                <div className="bg-slate-800/80 px-6 py-3 rounded-2xl border border-cyan-500/30 text-cyan-300 font-bold text-base max-w-lg">
                  คำตอบที่คุณเลือก: <span className="text-white font-extrabold">{String.fromCharCode(65 + chosenAns)}. {q.opts[chosenAns]}</span>
                </div>
              )}
              {chosenAns === -1 && (
                <div className="bg-slate-800/80 px-6 py-3 rounded-2xl border border-red-500/30 text-red-300 font-bold text-base">
                  ⏰ หมดเวลาตอบคำถาม
                </div>
              )}
              <div className="flex items-center gap-2 text-slate-400 animate-pulse pt-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span>รออาจารย์เฉลยและสรุปอันดับประจำข้อ...</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Screen 4: Leaderboard / Mid-game Results
  if (roomData.status === 'leaderboard') {
    const qIndex = roomData.currentQuestionIndex ?? 0;
    const q = currentQList[qIndex];
    const isLastQuestion = qIndex + 1 >= currentQList.length;
    
    // Host Leaderboard View
    if (isHostMode) {
      return (
        <div className="max-w-4xl mx-auto mt-8 space-y-6 text-center pb-20 px-4">
          <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700 flex flex-wrap justify-between items-center gap-4 shadow-lg">
            <div className="font-bold text-pink-400 uppercase tracking-widest text-lg">สรุปผลข้อที่ {qIndex + 1} / {currentQList.length}</div>
            <div className="flex gap-3">
              <Button onClick={handleStartNextQuestion} className="bg-pink-500 hover:bg-pink-400 text-white font-black uppercase px-6 py-3 rounded-xl shadow-lg shadow-pink-500/30">
                {isLastQuestion ? '🏆 สรุปผลการแข่งขันรอบชิง' : 'คำถามข้อถัดไป ➔'}
              </Button>
              <Button variant="outline" onClick={handleEndGameEarly} className="border-red-500/50 text-red-400 hover:bg-red-500/20 font-bold rounded-xl">
                🏁 จบเกม
              </Button>
            </div>
          </div>

          <Card className="p-8 glass border-yellow-500/30 text-left shadow-xl">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 text-center">{q?.q}</h2>
            <div className="text-center mb-6">
              <span className="inline-block bg-emerald-500/20 border border-emerald-500 text-emerald-300 font-black text-lg px-6 py-2 rounded-2xl shadow-md">
                ✅ เฉลย: {q?.opts?.[q.ans]}
              </span>
            </div>

            {(q as any)?.explanation && (
              <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-700/60 mb-8 text-sm text-slate-300 leading-relaxed">
                💡 <strong className="text-yellow-400 font-bold">คำอธิบายทางวิชาการ:</strong> {(q as any).explanation}
              </div>
            )}
            
            <div className="space-y-3 mt-6">
              <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2">
                <BarChart3 className="text-yellow-400" /> ตารางอันดับ Top 5 ล่าสุด
              </h3>
              {sortedPlayers.slice(0, 5).map((p: any, i: number) => {
                const score = roomData.scores?.[p.uid] || 0;
                return (
                  <div key={p.uid} className={`flex justify-between items-center p-4 rounded-2xl transition-all ${i === 0 ? 'bg-yellow-500/20 border-2 border-yellow-500/60 shadow-lg' : 'bg-slate-800/80 border border-slate-700/50'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-black w-8 text-center ${i === 0 ? 'text-yellow-400' : 'text-slate-400'}`}>#{i + 1}</span>
                      <span className="font-bold text-white text-lg">{p.displayName}</span>
                    </div>
                    <div className="font-black text-yellow-400 text-xl font-mono">{score} pts</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      );
    }

    // Student Leaderboard View
    const myRank = sortedPlayers.findIndex((p: any) => p.uid === myUid) + 1;
    const myAnswerData = roomData.answers?.[myUid]?.[qIndex];
    const isCorrect = myAnswerData?.correct;
    const pointsEarned = isCorrect ? Math.round(500 + 500 * Math.max(0, 1 - ((myAnswerData?.time || 0) / TIME_PER_QUESTION_MS))) : 0;

    return (
      <div className="max-w-xl mx-auto mt-10 p-8 glass rounded-3xl border-2 border-slate-700 text-center space-y-6 shadow-2xl px-4">
        {isCorrect ? (
          <>
            <CheckCircle className="w-24 h-24 text-emerald-400 mx-auto animate-bounce" />
            <h1 className="text-4xl font-black text-emerald-400 uppercase tracking-widest text-glow">ถูกต้อง!</h1>
            <p className="text-emerald-300 font-bold text-xl">+{pointsEarned} คะแนน (รวมความเร็ว!)</p>
          </>
        ) : (
          <>
            <XCircle className="w-24 h-24 text-danger mx-auto animate-pulse" />
            <h1 className="text-4xl font-black text-danger uppercase tracking-widest text-glow">ตอบผิด</h1>
            <p className="text-slate-300 font-medium">คำตอบที่ถูกต้องคือ: <strong className="text-emerald-400 font-bold">{q?.opts?.[q.ans]}</strong></p>
          </>
        )}

        {(q as any)?.explanation && (
          <div className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 text-xs md:text-sm text-slate-300 text-left leading-relaxed">
            💡 <strong>คำอธิบาย:</strong> {(q as any).explanation}
          </div>
        )}
        
        <div className="mt-6 p-6 bg-slate-900/90 rounded-2xl border border-slate-700 shadow-inner">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">อันดับปัจจุบันของคุณ</div>
          <div className="text-5xl font-black text-yellow-400 mb-2 font-mono">#{myRank || '-'}</div>
          <div className="text-slate-300 font-mono text-sm">คะแนนรวมสะสม: <strong className="text-white font-bold">{roomData.scores?.[myUid] || 0} pts</strong></div>
        </div>

        <p className="text-cyan-400 animate-pulse mt-6 font-bold flex items-center justify-center gap-2">
          <Clock className="w-5 h-5" /> รออาจารย์เริ่มคำถามข้อถัดไป...
        </p>
      </div>
    );
  }

  // Screen 5: Finished (Final Olympic Podium)
  if (roomData.status === 'finished') {
    return (
      <div className="max-w-4xl mx-auto mt-8 text-center pb-24 px-4">
        <Trophy className="w-28 h-28 text-yellow-400 mx-auto mb-4 animate-bounce" />
        <h1 className="text-4xl md:text-5xl font-black text-yellow-400 uppercase tracking-widest text-glow mb-10">
          Final Results
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12">
          {/* Rank 2 */}
          {sortedPlayers[1] && (
            <div className="order-2 md:order-1 bg-slate-800/80 p-6 rounded-t-3xl border-t-4 border-slate-400 h-52 flex flex-col justify-end relative pb-4 shadow-xl">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-black text-slate-300 text-xl border-4 border-slate-800">2</div>
              <div className="font-bold text-white text-xl truncate">{sortedPlayers[1].displayName}</div>
              <div className="text-slate-400 font-black font-mono text-lg">{roomData.scores?.[sortedPlayers[1].uid] || 0} pts</div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                ความแม่นยำ: {Math.round(((roomData.accuracy?.[sortedPlayers[1].uid]?.correct || 0) / (roomData.accuracy?.[sortedPlayers[1].uid]?.total || 1)) * 100)}%
              </div>
            </div>
          )}
          {/* Rank 1 */}
          {sortedPlayers[0] && (
            <div className="order-1 md:order-2 bg-yellow-500/20 p-6 rounded-t-3xl border-t-4 border-yellow-400 h-64 flex flex-col justify-end relative pb-6 shadow-[0_0_35px_rgba(234,179,8,0.35)]">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center font-black text-black text-3xl border-4 border-slate-900 shadow-lg">1</div>
              <div className="font-bold text-white text-2xl truncate mb-1">{sortedPlayers[0].displayName}</div>
              <div className="text-yellow-400 font-black text-2xl font-mono">{roomData.scores?.[sortedPlayers[0].uid] || 0} pts</div>
              <div className="text-xs text-emerald-400 mt-2 font-mono font-bold">
                ความแม่นยำ: {Math.round(((roomData.accuracy?.[sortedPlayers[0].uid]?.correct || 0) / (roomData.accuracy?.[sortedPlayers[0].uid]?.total || 1)) * 100)}%
              </div>
            </div>
          )}
          {/* Rank 3 */}
          {sortedPlayers[2] && (
            <div className="order-3 md:order-3 bg-slate-800/80 p-6 rounded-t-3xl border-t-4 border-orange-700 h-44 flex flex-col justify-end relative pb-4 shadow-xl">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-black text-orange-400 text-xl border-4 border-slate-800">3</div>
              <div className="font-bold text-white text-xl truncate">{sortedPlayers[2].displayName}</div>
              <div className="text-slate-400 font-black font-mono text-lg">{roomData.scores?.[sortedPlayers[2].uid] || 0} pts</div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                ความแม่นยำ: {Math.round(((roomData.accuracy?.[sortedPlayers[2].uid]?.correct || 0) / (roomData.accuracy?.[sortedPlayers[2].uid]?.total || 1)) * 100)}%
              </div>
            </div>
          )}
        </div>

        <Link href="/student/play" className="inline-block mt-4">
          <Button variant="outline" className="border-slate-600 text-slate-300 py-4 px-12 font-bold uppercase tracking-widest hover:bg-slate-800 rounded-2xl shadow-lg">
            กลับสู่เมนูเกม (Exit Battle)
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}
