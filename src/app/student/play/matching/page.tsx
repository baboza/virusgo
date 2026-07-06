"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, GitMerge, Trophy } from 'lucide-react';
import Link from 'next/link';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useLiveTracking } from '@/hooks/useLiveTracking';

// 10 virus pairs. We'll pick 6 random pairs per game session.
const DEFAULT_MATCH_DATA = [
  { id: 'v1', text: 'Rabies Virus', matchId: 'm1' },
  { id: 'd1', text: 'รูปกระสุนปืน พิษสุนัขบ้า (Bullet shape)', matchId: 'm1' },
  { id: 'v2', text: 'Canine Parvovirus', matchId: 'm2' },
  { id: 'd2', text: 'ลำไส้อักเสบติดต่อ ท้องเสียเป็นเลือด', matchId: 'm2' },
  { id: 'v3', text: 'Feline Leukemia Virus', matchId: 'm3' },
  { id: 'd3', text: 'มะเร็งเม็ดเลือดขาวในแมว (Retrovirus)', matchId: 'm3' },
  { id: 'v4', text: 'Porcine Epidemic Diarrhea (PEDV)', matchId: 'm4' },
  { id: 'd4', text: 'ท้องเสียระบาดในสุกร (Coronavirus)', matchId: 'm4' },
  { id: 'v5', text: 'Foot and Mouth Disease (FMD)', matchId: 'm5' },
  { id: 'd5', text: 'โรคปากและเท้าเปื่อย (Picornaviridae)', matchId: 'm5' },
  { id: 'v6', text: 'Avian Influenza', matchId: 'm6' },
  { id: 'd6', text: 'ไข้หวัดนก (Orthomyxoviridae)', matchId: 'm6' },
  { id: 'v7', text: 'Canine Distemper Virus', matchId: 'm7' },
  { id: 'd7', text: 'ไข้หัดสุนัข (Paramyxoviridae)', matchId: 'm7' },
  { id: 'v8', text: 'Swine Erysipelas', matchId: 'm8' },
  { id: 'd8', text: 'ไฟลามทุ่ง รอยแดงสี่เหลี่ยมขนมเปียกปูน', matchId: 'm8' },
  { id: 'v9', text: 'Marek\'s Disease Virus', matchId: 'm9' },
  { id: 'd9', text: 'อัมพาตในไก่ (Herpesviridae)', matchId: 'm9' },
  { id: 'v10', text: 'Newcastle Disease Virus', matchId: 'm10' },
  { id: 'd10', text: 'คอมิด คอบิดเบี้ยวในไก่ (Paramyxoviridae)', matchId: 'm10' },
];

const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);

export default function MatchingGame() {
  const { user, appUser } = useAuth();
  
  const [matchData, setMatchData] = useState<any[]>(DEFAULT_MATCH_DATA);
  const [viruses, setViruses] = useState<any[]>([]);
  const [descriptions, setDescriptions] = useState<any[]>([]);
  
  const [selectedVirus, setSelectedVirus] = useState<string | null>(null);
  const [selectedDesc, setSelectedDesc] = useState<string | null>(null);
  const [matches, setMatches] = useState<string[]>([]);
  
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useLiveTracking('matching', gameOver ? `จับคู่สำเร็จ! | คะแนน: ${score}` : `จับคู่ได้: ${matches.length}/${matchData.length} | คะแนน: ${score}`);


  useEffect(() => {
    import('firebase/firestore').then(({ getDoc, doc }) => {
      getDoc(doc(db, 'game_content', 'matching')).then(docSnap => {
        if (docSnap.exists() && docSnap.data().data?.length > 0) {
          setMatchData(docSnap.data().data);
        }
      }).catch(console.error);
    });
  }, []);

  useEffect(() => {
    if (matchData.length === 0) return;
    // Extract unique matchIds
    const allMatchIds = Array.from(new Set(matchData.map(d => d.matchId)));
    const selectedMatchIds = shuffle(allMatchIds).slice(0, 6);
    
    // Filter data
    const activeData = matchData.filter(d => selectedMatchIds.includes(d.matchId));
    
    const vList = activeData.filter(d => d.id.startsWith('v'));
    const dList = activeData.filter(d => d.id.startsWith('d'));

    setViruses(shuffle(vList));
    setDescriptions(shuffle(dList));
  }, [matchData]);

  useEffect(() => {
    if (selectedVirus && selectedDesc) {
      const v = viruses.find(v => v.id === selectedVirus);
      const d = descriptions.find(d => d.id === selectedDesc);

      if (v.matchId === d.matchId) {
        // Correct
        sfx.correct();
        setMatches(prev => [...prev, v.matchId]);
        setScore(prev => prev + 10);
        setSelectedVirus(null);
        setSelectedDesc(null);
        
        // Check game over
        if (matches.length + 1 === viruses.length) {
          handleGameOver();
        }
      } else {
        // Wrong
        sfx.wrong();
        // Reset selections quickly
        setTimeout(() => {
          setSelectedVirus(null);
          setSelectedDesc(null);
        }, 500);
      }
    }
  }, [selectedVirus, selectedDesc, viruses, descriptions, matches.length]);

  const handleGameOver = async () => {
    setTimeout(() => setGameOver(true), 1000);
    
    if (user && appUser && !isSaving) {
      setIsSaving(true);
      try {
        const myUid = appUser.uid || user.uid;
        await updateDoc(doc(db, 'users', myUid), {
          exp: increment(60) // 10 exp * 6 pairs
        });
        
        const { addDoc, collection } = await import('firebase/firestore');
        await addDoc(collection(db, 'users', myUid, 'history'), {
          gameId: 'matching',
          gameName: 'Virus Matching',
          score: 60,
          expEarned: 60,
          playedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to save EXP:", e);
      }
    }
  };

  const handleSelect = (id: string, type: 'virus' | 'desc') => {
    sfx.click();
    if (type === 'virus') {
      // Toggle off if already selected
      setSelectedVirus(prev => prev === id ? null : id);
    } else {
      setSelectedDesc(prev => prev === id ? null : id);
    }
  };

  if (gameOver) {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-20 px-2">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-32 h-32 mx-auto bg-secondary/20 text-secondary border border-secondary rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
        >
          <Trophy className="w-16 h-16" />
        </motion.div>
        <h1 className="text-4xl font-black text-glow uppercase">เชื่อมต่อข้อมูลสำเร็จ</h1>
        <p className="text-xl text-slate-400 font-mono">ซิงโครไนซ์ฐานข้อมูลเสร็จสิ้น ได้รับ 60 EXP</p>
        <div className="flex justify-center gap-4 pt-8">
          <Button onClick={() => window.location.reload()} size="lg" className="font-bold uppercase tracking-widest bg-secondary text-black hover:bg-secondary/80">
            เล่นอีกครั้ง
          </Button>
          <Link href="/student/play">
            <Button variant="outline" size="lg" className="font-bold uppercase tracking-widest text-white border-slate-700 hover:bg-slate-800">
              กลับสู่ฐาน
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-32 pt-4 px-2">
      <div className="flex items-center justify-between">
        <Link href="/student/play" onClick={() => sfx.click()}>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </Link>
        <div className="font-bold text-secondary text-glow flex items-center gap-2 uppercase tracking-widest">
          <GitMerge className="w-5 h-5 animate-pulse" /> Matching Algorithm
        </div>
        <div className="font-black text-accent text-xl">{score} / 60</div>
      </div>

      <div className="text-center mb-8">
        <p className="text-slate-400 font-mono text-sm tracking-widest uppercase">
          จับคู่ชื่อไวรัสและอาการให้ถูกต้อง
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:gap-8 relative">
        {/* Left Column: Viruses */}
        <div className="space-y-4">
          <h3 className="text-center text-slate-500 font-black uppercase tracking-widest mb-4">Virus List</h3>
          {viruses.map((v) => {
            const isMatched = matches.includes(v.matchId);
            const isSelected = selectedVirus === v.id;
            
            return (
              <motion.div 
                key={v.id}
                layout
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: isMatched ? 0.2 : 1, x: 0 }}
                className={isMatched ? 'pointer-events-none' : ''}
              >
                <div 
                  onClick={() => !isMatched && handleSelect(v.id, 'virus')}
                  className={`p-4 md:p-6 rounded-2xl cursor-pointer transition-all duration-300 font-black text-sm md:text-lg flex items-center justify-center text-center border-2 shadow-lg
                    ${isSelected ? 'glass-neon scale-[1.02] border-secondary text-white' : 'glass border-slate-700 text-slate-300 hover:border-secondary/50'}
                    ${isMatched ? 'opacity-20 grayscale scale-95' : 'opacity-100'}
                  `}
                >
                  {v.text}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Right Column: Descriptions */}
        <div className="space-y-4">
          <h3 className="text-center text-slate-500 font-black uppercase tracking-widest mb-4">Characteristics</h3>
          {descriptions.map((d) => {
            const isMatched = matches.includes(d.matchId);
            const isSelected = selectedDesc === d.id;
            
            return (
              <motion.div 
                key={d.id}
                layout
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: isMatched ? 0.2 : 1, x: 0 }}
                className={isMatched ? 'pointer-events-none' : ''}
              >
                <div 
                  onClick={() => !isMatched && handleSelect(d.id, 'desc')}
                  className={`p-4 md:p-6 rounded-2xl cursor-pointer transition-all duration-300 font-bold text-xs md:text-sm flex items-center justify-center text-center border-2 shadow-lg
                    ${isSelected ? 'glass-neon scale-[1.02] border-primary text-white' : 'glass border-slate-700 text-slate-300 hover:border-primary/50'}
                    ${isMatched ? 'opacity-20 grayscale scale-95' : 'opacity-100'}
                  `}
                >
                  {d.text}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
