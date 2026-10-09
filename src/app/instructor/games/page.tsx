"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Plus, Trash2, ArrowLeft, Gamepad2, FileJson, AlertCircle, 
  Search, RefreshCw, CheckCircle2, Eye, Code, BookOpen, Layers, 
  Shield, Sparkles, HelpCircle, Stethoscope, ChevronRight, Copy, Check,
  Activity, Zap, Info, Filter
} from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { 
  ALL_15_CHAPTER_QUESTIONS, 
  ALL_15_LAB_CASES, 
  ALL_15_MATCHING_PAIRS,
  MASTER_CLASSROOM_BATTLE_QUESTIONS,
  MASTER_QUIZ_GENERAL_QUESTIONS,
  MASTER_IDENTIFICATION_QUESTIONS,
  MASTER_MATCHING_CARDS,
  MASTER_DIAGNOSIS_DUEL_CASES,
  MASTER_OUTBREAK_SCENARIOS,
  MASTER_FARM_DEFENSE_EVENTS
} from '@/data/veterinaryVirologyContent';

type TabType = 
  | 'classroom_battle' 
  | 'quiz_general' 
  | 'diagnosis_duel' 
  | 'matching' 
  | 'lab_detective' 
  | 'outbreak' 
  | 'farm_defense' 
  | 'identification';

type Question = { q: string; opts: string[]; ans: number; chapter?: number; chapterTitle?: string; explanation?: string };

const INITIAL_KHOOT: Question[] = MASTER_CLASSROOM_BATTLE_QUESTIONS;
const INITIAL_GENERAL: Question[] = MASTER_QUIZ_GENERAL_QUESTIONS;
const INITIAL_CASES = MASTER_DIAGNOSIS_DUEL_CASES;
const INITIAL_MATCHING = MASTER_MATCHING_CARDS;
const INITIAL_LAB_DETECTIVE = ALL_15_LAB_CASES;
const INITIAL_OUTBREAK = MASTER_OUTBREAK_SCENARIOS;
const INITIAL_FARM_DEFENSE = MASTER_FARM_DEFENSE_EVENTS;
const INITIAL_IDENTIFICATION = MASTER_IDENTIFICATION_QUESTIONS;

export default function GameContentManager() {
  const { appUser, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>('classroom_battle');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // View Mode: 'visual' (Form UI) vs 'json' (Raw JSON)
  const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual');

  // Search filter inside current tab
  const [searchQuery, setSearchQuery] = useState('');

  // Tab Data States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [complexData, setComplexData] = useState<any[]>([]);
  const [rawJson, setRawJson] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const isComplexTab = useMemo(() => {
    return ['diagnosis_duel', 'matching', 'lab_detective', 'outbreak', 'farm_defense', 'identification'].includes(activeTab);
  }, [activeTab]);

  // Load Content from Firestore or Defaults
  const fetchContent = async (tab: TabType) => {
    setLoading(true);
    setMessage(null);
    setJsonError(null);
    setSearchQuery('');

    try {
      const docRef = doc(db, 'game_content', tab);
      const docSnap = await getDoc(docRef);
      
      const complex = ['diagnosis_duel', 'matching', 'lab_detective', 'outbreak', 'farm_defense', 'identification'].includes(tab);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (complex) {
          const list = Array.isArray(data.data) ? data.data : [];
          setComplexData(list);
          setRawJson(JSON.stringify(list, null, 2));
        } else {
          const list = Array.isArray(data.questions) ? data.questions : [];
          setQuestions(list);
          setRawJson(JSON.stringify(list, null, 2));
        }
      } else {
        // Fallback to initial course data
        let initialList: any[] = [];
        if (tab === 'diagnosis_duel') initialList = INITIAL_CASES;
        else if (tab === 'matching') initialList = INITIAL_MATCHING;
        else if (tab === 'lab_detective') initialList = INITIAL_LAB_DETECTIVE;
        else if (tab === 'outbreak') initialList = INITIAL_OUTBREAK;
        else if (tab === 'farm_defense') initialList = INITIAL_FARM_DEFENSE;
        else if (tab === 'identification') initialList = INITIAL_IDENTIFICATION;
        else if (tab === 'classroom_battle') initialList = INITIAL_KHOOT;
        else if (tab === 'quiz_general') initialList = INITIAL_GENERAL;

        if (complex) {
          setComplexData(initialList);
        } else {
          setQuestions(initialList);
        }
        setRawJson(JSON.stringify(initialList, null, 2));
      }
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: `เกิดข้อผิดพลาดในการโหลดข้อมูล: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent(activeTab);
  }, [activeTab]);

  // Sync complexData or questions whenever rawJson is edited in JSON mode
  const handleRawJsonChange = (val: string) => {
    setRawJson(val);
    try {
      const parsed = JSON.parse(val);
      setJsonError(null);
      if (isComplexTab) {
        setComplexData(parsed);
      } else {
        setQuestions(parsed);
      }
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  // Switch between Visual & JSON mode and keep data synced
  const handleModeChange = (mode: 'visual' | 'json') => {
    if (mode === 'json') {
      const current = isComplexTab ? complexData : questions;
      setRawJson(JSON.stringify(current, null, 2));
      setJsonError(null);
    }
    setEditorMode(mode);
  };

  // Save to Firestore
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      if (editorMode === 'json' && jsonError) {
        throw new Error("รูปแบบ JSON ยังไม่ถูกต้อง กรุณาแก้ไขก่อนบันทึก: " + jsonError);
      }

      if (isComplexTab) {
        let payload = complexData;
        if (editorMode === 'json') {
          payload = JSON.parse(rawJson);
        }
        await setDoc(doc(db, 'game_content', activeTab), { 
          data: payload,
          count: payload.length,
          updatedAt: new Date().toISOString()
        });
      } else {
        let payload = questions;
        if (editorMode === 'json') {
          payload = JSON.parse(rawJson);
        }
        await setDoc(doc(db, 'game_content', activeTab), { 
          questions: payload,
          count: payload.length,
          updatedAt: new Date().toISOString()
        });
      }

      setMessage({ type: 'success', text: "บันทึกเนื้อหาเกมสำเร็จเรียบร้อยแล้ว!" });
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: "เกิดข้อผิดพลาด: " + e.message });
    } finally {
      setSaving(false);
    }
  };

  // One-Click Master Curriculum Import
  const handleLoadMasterBank = () => {
    if (!window.confirm(`ยืนยันการนำเข้าข้อมูล Master Bank (15 บทเรียน) สำหรับโหมดนี้?`)) return;

    if (activeTab === 'lab_detective') {
      setComplexData(ALL_15_LAB_CASES);
      setRawJson(JSON.stringify(ALL_15_LAB_CASES, null, 2));
      setMessage({ type: 'success', text: `นำเข้า Lab Cases ทั้งหมด ${ALL_15_LAB_CASES.length} เคสเรียบร้อย! กด บันทึกการเปลี่ยนแปลง เพื่ออัพเดท` });
    } else if (activeTab === 'identification') {
      setComplexData(MASTER_IDENTIFICATION_QUESTIONS);
      setRawJson(JSON.stringify(MASTER_IDENTIFICATION_QUESTIONS, null, 2));
      setMessage({ type: 'success', text: `นำเข้าข้อสอบจาก 15 บทเรียน (${MASTER_IDENTIFICATION_QUESTIONS.length} ข้อ) เรียบร้อย! กด บันทึกการเปลี่ยนแปลง เพื่ออัพเดท` });
    } else if (activeTab === 'matching') {
      setComplexData(MASTER_MATCHING_CARDS);
      setRawJson(JSON.stringify(MASTER_MATCHING_CARDS, null, 2));
      setMessage({ type: 'success', text: `นำเข้าการ์ดจับคู่ ${MASTER_MATCHING_CARDS.length} ใบ (${ALL_15_MATCHING_PAIRS.length} คู่) เรียบร้อย! กด บันทึกการเปลี่ยนแปลง เพื่ออัพเดท` });
    } else if (activeTab === 'classroom_battle') {
      setQuestions(MASTER_CLASSROOM_BATTLE_QUESTIONS);
      setRawJson(JSON.stringify(MASTER_CLASSROOM_BATTLE_QUESTIONS, null, 2));
      setMessage({ type: 'success', text: `นำเข้าข้อสอบห้องเรียน 15 บทเรียน (${MASTER_CLASSROOM_BATTLE_QUESTIONS.length} ข้อ) เรียบร้อย! กด บันทึกการเปลี่ยนแปลง เพื่ออัพเดท` });
    } else if (activeTab === 'quiz_general') {
      setQuestions(MASTER_QUIZ_GENERAL_QUESTIONS);
      setRawJson(JSON.stringify(MASTER_QUIZ_GENERAL_QUESTIONS, null, 2));
      setMessage({ type: 'success', text: `นำเข้าข้อสอบ 15 บทเรียน (${MASTER_QUIZ_GENERAL_QUESTIONS.length} ข้อ) เรียบร้อย! กด บันทึกการเปลี่ยนแปลง เพื่ออัพเดท` });
    } else if (activeTab === 'diagnosis_duel') {
      setComplexData(MASTER_DIAGNOSIS_DUEL_CASES);
      setRawJson(JSON.stringify(MASTER_DIAGNOSIS_DUEL_CASES, null, 2));
      setMessage({ type: 'success', text: `นำเข้าเคสคลินิก Diagnosis Duel (${MASTER_DIAGNOSIS_DUEL_CASES.length} เคส) เรียบร้อย! กด บันทึกการเปลี่ยนแปลง เพื่ออัพเดท` });
    } else if (activeTab === 'outbreak') {
      setComplexData(MASTER_OUTBREAK_SCENARIOS);
      setRawJson(JSON.stringify(MASTER_OUTBREAK_SCENARIOS, null, 2));
      setMessage({ type: 'success', text: `นำเข้าสถานการณ์ Outbreak (${MASTER_OUTBREAK_SCENARIOS.length} สเต็ป) เรียบร้อย! กด บันทึกการเปลี่ยนแปลง เพื่ออัพเดท` });
    } else if (activeTab === 'farm_defense') {
      setComplexData(MASTER_FARM_DEFENSE_EVENTS);
      setRawJson(JSON.stringify(MASTER_FARM_DEFENSE_EVENTS, null, 2));
      setMessage({ type: 'success', text: `นำเข้าสถานการณ์ Farm Defense (${MASTER_FARM_DEFENSE_EVENTS.length} เดือน) เรียบร้อย! กด บันทึกการเปลี่ยนแปลง เพื่ออัพเดท` });
    }
  };

  // Sync ALL 8 Game Modes to Firestore simultaneously
  const handleSyncAllGamesToFirestore = async () => {
    if (!window.confirm("ยืนยันการซิงค์เนื้อหาหลักสูตร 15 บทเรียน เข้าสู่มินิเกมทั้ง 8 โหมดบน Firestore พร้อมกันทันที?")) return;
    setSaving(true);
    setMessage(null);

    try {
      const now = new Date().toISOString();

      // 1. Classroom Battle
      await setDoc(doc(db, 'game_content', 'classroom_battle'), {
        questions: MASTER_CLASSROOM_BATTLE_QUESTIONS,
        count: MASTER_CLASSROOM_BATTLE_QUESTIONS.length,
        updatedAt: now
      });

      // 2. Quiz General
      await setDoc(doc(db, 'game_content', 'quiz_general'), {
        questions: MASTER_QUIZ_GENERAL_QUESTIONS,
        count: MASTER_QUIZ_GENERAL_QUESTIONS.length,
        updatedAt: now
      });

      // 3. Virus Identification
      await setDoc(doc(db, 'game_content', 'identification'), {
        data: MASTER_IDENTIFICATION_QUESTIONS,
        count: MASTER_IDENTIFICATION_QUESTIONS.length,
        updatedAt: now
      });

      // 4. Matching Cards
      await setDoc(doc(db, 'game_content', 'matching'), {
        data: MASTER_MATCHING_CARDS,
        count: MASTER_MATCHING_CARDS.length,
        pairsCount: ALL_15_MATCHING_PAIRS.length,
        updatedAt: now
      });

      // 5. Lab Detective
      await setDoc(doc(db, 'game_content', 'lab_detective'), {
        data: ALL_15_LAB_CASES,
        count: ALL_15_LAB_CASES.length,
        updatedAt: now
      });

      // 6. Diagnosis Duel
      await setDoc(doc(db, 'game_content', 'diagnosis_duel'), {
        data: MASTER_DIAGNOSIS_DUEL_CASES,
        count: MASTER_DIAGNOSIS_DUEL_CASES.length,
        updatedAt: now
      });

      // 7. Outbreak
      await setDoc(doc(db, 'game_content', 'outbreak'), {
        data: MASTER_OUTBREAK_SCENARIOS,
        count: MASTER_OUTBREAK_SCENARIOS.length,
        updatedAt: now
      });

      // 8. Farm Defense
      await setDoc(doc(db, 'game_content', 'farm_defense'), {
        data: MASTER_FARM_DEFENSE_EVENTS,
        count: MASTER_FARM_DEFENSE_EVENTS.length,
        updatedAt: now
      });

      // Master banks
      await setDoc(doc(db, 'game_content', 'questions_bank'), {
        questions: ALL_15_CHAPTER_QUESTIONS,
        totalQuestions: ALL_15_CHAPTER_QUESTIONS.length,
        updatedAt: now
      }, { merge: true });

      await setDoc(doc(db, 'game_content', 'matching_bank'), {
        pairs: ALL_15_MATCHING_PAIRS,
        updatedAt: now
      }, { merge: true });

      await setDoc(doc(db, 'game_content', 'lab_cases_bank'), {
        cases: ALL_15_LAB_CASES,
        updatedAt: now
      }, { merge: true });

      setMessage({ 
        type: 'success', 
        text: `ซิงค์มินิเกมทั้ง 8 โหมดเข้าสู่ Firestore สำเร็จแล้ว! (ข้อสอบ 151 ข้อ, เคสแล็บ 31 เคส, การ์ดจับคู่ 46 คู่)` 
      });

      await fetchContent(activeTab);
    } catch (e: any) {
      console.error("Sync all error:", e);
      setMessage({ type: 'error', text: `เกิดข้อผิดพลาดในการซิงค์: ${e.message}` });
    } finally {
      setSaving(false);
    }
  };

  // UI Helpers for Questions (classroom_battle / quiz_general)
  const addQuestion = () => {
    const updated = [...questions, { q: "", opts: ["ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3", "ตัวเลือก 4"], ans: 0 }];
    setQuestions(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const removeQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const updateQuestion = (idx: number, field: string, value: any) => {
    const updated = [...questions];
    if (field === 'q') updated[idx].q = value;
    else if (field === 'ans') updated[idx].ans = Number(value);
    else if (field.startsWith('opt_')) {
      const optIdx = parseInt(field.split('_')[1]);
      updated[idx].opts[optIdx] = value;
    }
    setQuestions(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  // UI Helpers for Complex Types
  const addComplexItem = () => {
    let newItem: any = {};
    if (activeTab === 'identification') {
      newItem = {
        id: `id_${Date.now()}`,
        chapter: 1,
        question: "ระบุข้อความคำถามระบุเชื้อไวรัส...",
        choices: ["ตัวเลือก A", "ตัวเลือก B", "ตัวเลือก C", "ตัวเลือก D"],
        answer: "ตัวเลือก A",
        explanation: "คำอธิบายเหตุผลเฉลย...",
        virusType: "parvo"
      };
    } else if (activeTab === 'lab_detective') {
      newItem = {
        id: `c_${Date.now()}`,
        title: "เคสใหม่: ระบุชื่อเคส",
        species: "สุกร / สุนัข / โค",
        history: "ประวัติสัตว์ป่วย...",
        symptoms: ["มีไข้", "เบื่ออาหาร"],
        laboratoryResults: "ผลตรวจแล็บ...",
        choices: ["ช้อยส์ 1", "ช้อยส์ 2", "ช้อยส์ 3", "ช้อยส์ 4"],
        answer: "ช้อยส์ 1",
        explanation: "คำอธิบายการวินิจฉัย..."
      };
    } else if (activeTab === 'matching') {
      newItem = {
        id: `m_${Date.now()}`,
        chapter: 1,
        virus: "ชื่อไวรัส",
        feature: "ลักษณะเด่น / อาการสำคัญ"
      };
    } else if (activeTab === 'diagnosis_duel') {
      newItem = {
        id: Date.now(),
        title: "Case ใหม่: ชื่อเคส",
        symptoms: ["อาการ 1", "อาการ 2"],
        correct: { diag: "FMD", lab: "PCR", treat: "SUPPORTIVE", prev: "VACCINE" }
      };
    } else {
      newItem = { id: Date.now(), title: "รายการใหม่", text: "รายละเอียด..." };
    }

    const updated = [...complexData, newItem];
    setComplexData(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const removeComplexItem = (idx: number) => {
    const updated = complexData.filter((_, i) => i !== idx);
    setComplexData(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  const updateComplexItem = (idx: number, key: string, value: any) => {
    const updated = [...complexData];
    updated[idx] = { ...updated[idx], [key]: value };
    setComplexData(updated);
    setRawJson(JSON.stringify(updated, null, 2));
  };

  // Filtered Items for rendering
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const q = searchQuery.toLowerCase();
    return questions.filter(item => 
      item.q.toLowerCase().includes(q) || 
      item.opts.some(o => o.toLowerCase().includes(q))
    );
  }, [questions, searchQuery]);

  const filteredComplex = useMemo(() => {
    if (!searchQuery.trim()) return complexData;
    const q = searchQuery.toLowerCase();
    return complexData.filter(item => {
      const str = JSON.stringify(item).toLowerCase();
      return str.includes(q);
    });
  }, [complexData, searchQuery]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="text-slate-400 font-mono text-xs">Loading Game Content...</div>
      </div>
    );
  }

  if (appUser?.role !== 'instructor') {
    return <div className="p-8 text-center text-danger font-mono">Access Denied</div>;
  }

  const tabList = [
    { id: 'classroom_battle', label: 'Classroom Battle (Kahoot)', desc: 'ตอบสดในห้องเรียน' },
    { id: 'quiz_general', label: 'General Quiz (Boss / Time Attack)', desc: 'สู้บอส & จับเวลา' },
    { id: 'identification', label: 'Virus Identification', desc: '15 บทเรียน วินิจฉัยเชื้อ' },
    { id: 'lab_detective', label: 'Lab Detective (Cases)', desc: 'กรณีศึกษาชันสูตรแล็บ' },
    { id: 'matching', label: 'Matching (Cards)', desc: 'การจับคู่ไวรัส & คุณสมบัติ' },
    { id: 'diagnosis_duel', label: 'Diagnosis Duel', desc: 'แข่งตอบคำถามเคสคลินิก' },
    { id: 'outbreak', label: 'Outbreak (Sim)', desc: 'จำลองการระบาด & การคุมโรค' },
    { id: 'farm_defense', label: 'Farm Defense', desc: 'จำลองการปกป้องฟาร์ม' },
  ];

  const totalItemCount = isComplexTab ? complexData.length : questions.length;

  return (
    <div className="space-y-6 pb-24">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & GLOBAL ACTIONS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link href="/instructor" className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Gamepad2 className="w-8 h-8 text-primary" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-cyan-400 to-secondary">
                จัดการเนื้อหาและคำถามเกม (Game Content)
              </span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            แก้ไขข้อสอบ กรณีศึกษาจำลอง และคำถามในแต่ละมินิเกม ปรับแต่งได้ทั้งแบบฟอร์มและการนำเข้าข้อมูลหลักสูตร
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Button
            variant="outline"
            onClick={handleLoadMasterBank}
            leftIcon={<BookOpen className="w-4 h-4 text-cyan-400" />}
            className="bg-slate-900 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs"
          >
            ดึงจากคลัง 15 บท
          </Button>

          <Button
            onClick={handleSyncAllGamesToFirestore}
            disabled={saving || loading}
            leftIcon={<RefreshCw className={`w-4 h-4 text-purple-300 ${saving ? 'animate-spin' : ''}`} />}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/25"
          >
            ซิงค์ 8 เกมเข้า Firestore ทันที
          </Button>

          <Button 
            onClick={handleSave} 
            disabled={saving || loading} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 text-xs shadow-lg shadow-emerald-600/25"
          >
            <Save className={`w-4 h-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
            {saving ? "กำลังบันทึก..." : "บันทึกแท็บนี้"}
          </Button>
        </div>
      </div>

      {/* Alert Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl font-bold flex items-center gap-2 text-xs border ${
              message.type === 'error' 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {message.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          2. GAME MODE TABS
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {tabList.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`p-3 rounded-2xl text-left transition-all border flex flex-col justify-between ${
                isActive 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25 scale-[1.02]' 
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div>
                <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                  {t.label.split(' (')[0]}
                </p>
                <p className={`text-[10px] mt-0.5 truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                  {t.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. EDITOR CONTROLS TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800">
            โหมด: <strong className="text-primary">{activeTab}</strong> ({totalItemCount} รายการ)
          </span>

          {/* Mode Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleModeChange('visual')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                editorMode === 'visual' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              การแสดงผลฟอร์ม (Visual)
            </button>
            <button
              onClick={() => handleModeChange('json')}
              className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                editorMode === 'json' ? 'bg-primary text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              JSON โค้ด (Raw)
            </button>
          </div>
        </div>

        {/* Search inside editor */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาข้อสอบ / เคสในโหมดนี้..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. CONTENT EDITOR AREA
      ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-mono animate-pulse text-xs">
          กำลังโหลดข้อมูลจาก Firestore...
        </div>
      ) : editorMode === 'json' ? (
        /* Advanced JSON Editor */
        <Card className="p-5 bg-slate-900 border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="flex items-center gap-2 text-amber-400 font-mono font-bold">
              <FileJson className="w-4 h-4" /> Advanced Raw JSON Editor
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              แก้ไขข้อมูลโครงสร้างอาร์เรย์โดยตรง
            </span>
          </div>

          {jsonError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
              ⚠️ JSON Syntax Error: {jsonError}
            </div>
          )}

          <textarea
            value={rawJson}
            onChange={(e) => handleRawJsonChange(e.target.value)}
            className="w-full h-[550px] bg-slate-950 text-emerald-400 font-mono p-4 rounded-xl border border-slate-800 focus:border-primary outline-none resize-none text-xs leading-relaxed"
            spellCheck={false}
          />
        </Card>
      ) : !isComplexTab ? (
        /* Visual Editor: Standard Quiz (Classroom Battle & General Quiz) */
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <Card key={idx} className="p-5 bg-slate-900/60 border-slate-800 relative group hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start gap-4 mb-3">
                <span className="px-2.5 py-0.5 rounded-lg bg-primary/20 text-primary font-mono text-xs font-bold border border-primary/30">
                  คำถามข้อที่ #{idx + 1}
                </span>
                <button 
                  onClick={() => removeQuestion(idx)} 
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                  title="ลบคำถามข้อนี้"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1">โจทย์คำถาม</label>
                  <input 
                    type="text" 
                    value={q.q}
                    onChange={(e) => updateQuestion(idx, 'q', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-primary outline-none"
                    placeholder="พิมพ์โจทย์คำถามที่นี่..."
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400 block mb-1.5">
                    ตัวเลือก 4 ช้อยส์ (คลิกปุ่มวิทยุเพื่อเลือกข้อที่ถูกต้อง)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.opts.map((opt, optIdx) => {
                      const isCorrect = q.ans === optIdx;
                      return (
                        <div 
                          key={optIdx} 
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                            isCorrect 
                              ? 'bg-emerald-500/10 border-emerald-500/50' 
                              : 'bg-slate-950 border-slate-800'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name={`ans_${idx}`} 
                            checked={isCorrect}
                            onChange={() => updateQuestion(idx, 'ans', optIdx)}
                            className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0 ml-1"
                          />
                          <input 
                            type="text" 
                            value={opt}
                            onChange={(e) => updateQuestion(idx, `opt_${optIdx}`, e.target.value)}
                            className="w-full bg-transparent border-none text-xs text-slate-200 focus:outline-none"
                            placeholder={`ตัวเลือกที่ ${optIdx + 1}`}
                          />
                          {isCorrect && (
                            <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0 pr-2">
                              ✓ คำตอบที่ถูกต้อง
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <Button 
            onClick={addQuestion} 
            variant="outline" 
            className="w-full py-5 border-dashed border-2 border-slate-800 text-slate-400 hover:text-white hover:border-primary bg-transparent text-xs"
          >
            <Plus className="w-4 h-4 mr-2" /> เพิ่มคำถามใหม่ (Add Question)
          </Button>
        </div>
      ) : activeTab === 'lab_detective' ? (
        /* Visual Editor: Lab Detective Cases */
        <div className="space-y-4">
          {filteredComplex.map((c, idx) => (
            <Card key={idx} className="p-5 bg-slate-900/60 border-slate-800 space-y-4 relative hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
                    เคสชันสูตร #{idx + 1}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ชนิดสัตว์: {c.species || 'ไม่ระบุ'}
                  </span>
                </div>
                <button 
                  onClick={() => removeComplexItem(idx)} 
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">ชื่อเคส / หัวข้อ</label>
                  <input
                    type="text"
                    value={c.title || ''}
                    onChange={(e) => updateComplexItem(idx, 'title', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">ชนิดสัตว์ (Species)</label>
                  <input
                    type="text"
                    value={c.species || ''}
                    onChange={(e) => updateComplexItem(idx, 'species', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">ประวัติสัตว์ป่วย (History)</label>
                <textarea
                  rows={2}
                  value={c.history || ''}
                  onChange={(e) => updateComplexItem(idx, 'history', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">ผลตรวจทางห้องปฏิบัติการ (Lab Findings)</label>
                <textarea
                  rows={2}
                  value={c.laboratoryResults || ''}
                  onChange={(e) => updateComplexItem(idx, 'laboratoryResults', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-emerald-400 font-bold block mb-1">เฉลยโรคที่เป็นคำตอบ (Correct Answer)</label>
                  <input
                    type="text"
                    value={c.answer || ''}
                    onChange={(e) => updateComplexItem(idx, 'answer', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">คำอธิบายเหตุผล (Explanation)</label>
                  <input
                    type="text"
                    value={c.explanation || ''}
                    onChange={(e) => updateComplexItem(idx, 'explanation', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                  />
                </div>
              </div>
            </Card>
          ))}

          <Button 
            onClick={addComplexItem} 
            variant="outline" 
            className="w-full py-5 border-dashed border-2 border-slate-800 text-slate-400 hover:text-white hover:border-primary bg-transparent text-xs"
          >
            <Plus className="w-4 h-4 mr-2" /> เพิ่มเคสแล็บใหม่ (Add Lab Case)
          </Button>
        </div>
      ) : activeTab === 'identification' ? (
        /* Visual Editor: Virus Identification */
        <div className="space-y-4">
          {filteredComplex.map((q, idx) => (
            <Card key={idx} className="p-5 bg-slate-900/60 border-slate-800 space-y-3 relative hover:border-slate-700 transition-all">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                    ข้อ #{idx + 1}
                  </span>
                  {q.chapter && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      บทที่ {q.chapter} ({q.chapterTitle || ''})
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => removeComplexItem(idx)} 
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">คำถาม / ลักษณะทางคลินิกเพื่อระบุเชื้อ</label>
                <textarea
                  rows={2}
                  value={q.question || q.q || ''}
                  onChange={(e) => updateComplexItem(idx, 'question', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-emerald-400 font-bold block mb-1">คำตอบที่ถูกต้อง (Answer)</label>
                  <input
                    type="text"
                    value={q.answer || ''}
                    onChange={(e) => updateComplexItem(idx, 'answer', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">กลุ่มไวรัส (Virus Type / Family)</label>
                  <input
                    type="text"
                    value={q.virusType || ''}
                    onChange={(e) => updateComplexItem(idx, 'virusType', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">คำอธิบายเฉลย (Explanation)</label>
                <input
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => updateComplexItem(idx, 'explanation', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 focus:outline-none"
                />
              </div>
            </Card>
          ))}

          <Button 
            onClick={addComplexItem} 
            variant="outline" 
            className="w-full py-5 border-dashed border-2 border-slate-800 text-slate-400 hover:text-white hover:border-primary bg-transparent text-xs"
          >
            <Plus className="w-4 h-4 mr-2" /> เพิ่มข้อสอบระบุไวรัส (Add Virus ID Question)
          </Button>
        </div>
      ) : activeTab === 'matching' ? (
        /* Visual Editor: Matching Pairs */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredComplex.map((m, idx) => (
              <Card key={idx} className="p-4 bg-slate-900/60 border-slate-800 space-y-3 relative hover:border-slate-700 transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono text-cyan-400 font-bold">
                    คู่ที่ #{idx + 1}
                  </span>
                  <button 
                    onClick={() => removeComplexItem(idx)} 
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1 font-mono uppercase">การ์ดฝั่ง A (เชื้อไวรัส)</label>
                  <input
                    type="text"
                    value={m.virus || m.text || ''}
                    onChange={(e) => updateComplexItem(idx, 'virus', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-emerald-400 block mb-1 font-mono uppercase">การ์ดฝั่ง B (ลักษณะ / อาการเด่น)</label>
                  <input
                    type="text"
                    value={m.feature || m.matchText || ''}
                    onChange={(e) => updateComplexItem(idx, 'feature', e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </Card>
            ))}
          </div>

          <Button 
            onClick={addComplexItem} 
            variant="outline" 
            className="w-full py-5 border-dashed border-2 border-slate-800 text-slate-400 hover:text-white hover:border-primary bg-transparent text-xs"
          >
            <Plus className="w-4 h-4 mr-2" /> เพิ่มคู่จับคู่ใหม่ (Add Matching Pair)
          </Button>
        </div>
      ) : (
        /* Fallback Visual Editor for other modes (diagnosis_duel, outbreak, farm_defense) */
        <div className="space-y-4">
          {filteredComplex.map((item, idx) => (
            <Card key={idx} className="p-4 bg-slate-900/60 border-slate-800 space-y-3 relative hover:border-slate-700 transition-all">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-primary font-bold">
                  ลำดับ #{idx + 1} {item.title ? `- ${item.title}` : ''}
                </span>
                <button 
                  onClick={() => removeComplexItem(idx)} 
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {Object.keys(item).map((k) => {
                  if (k === 'id') return null;
                  const val = item[k];
                  const isObj = typeof val === 'object';
                  return (
                    <div key={k}>
                      <label className="text-[11px] text-slate-400 block mb-1 font-mono">{k}</label>
                      {isObj ? (
                        <textarea
                          rows={2}
                          value={JSON.stringify(val)}
                          onChange={(e) => {
                            try {
                              updateComplexItem(idx, k, JSON.parse(e.target.value));
                            } catch (_) {}
                          }}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 font-mono focus:outline-none"
                        />
                      ) : (
                        <input
                          type="text"
                          value={val || ''}
                          onChange={(e) => updateComplexItem(idx, k, e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}

          <Button 
            onClick={addComplexItem} 
            variant="outline" 
            className="w-full py-5 border-dashed border-2 border-slate-800 text-slate-400 hover:text-white hover:border-primary bg-transparent text-xs"
          >
            <Plus className="w-4 h-4 mr-2" /> เพิ่มรายการใหม่
          </Button>
        </div>
      )}
    </div>
  );
}
