"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Save, Plus, Trash2, ArrowLeft, Gamepad2, FileJson, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

type Question = { q: string; opts: string[]; ans: number };

const INITIAL_KHOOT = [
  { q: "สัตว์ชนิดใดไม่ติดเชื้อ FMD?", opts: ["โค", "สุกร", "ม้า", "แพะ"], ans: 2 },
  { q: "เชื้อ FMD เป็นเชื้อกลุ่มใด?", opts: ["DNA Virus", "RNA Virus", "Bacteria", "Fungi"], ans: 1 },
  { q: "โรค PEDV ในสุกร ทำให้เกิดอาการใดเด่นชัดที่สุด?", opts: ["ไข้สูง", "ท้องเสียรุนแรง", "ไอเรื้อรัง", "แท้งลูก"], ans: 1 },
  { q: "โรคพิษสุนัขบ้า (Rabies) ติดต่อทางใดเป็นหลัก?", opts: ["ทางอากาศ", "น้ำลายผ่านแผล", "กินอาหารปนเปื้อน", "ยุงกัด"], ans: 1 },
  { q: "CPV (Canine Parvovirus) มักพบในสุนัขอายุเท่าใด?", opts: ["แรกเกิด", "1-6 เดือน", "3-5 ปี", "สุนัขแก่"], ans: 1 }
];

const INITIAL_GENERAL = [
  { q: "ไวรัสชนิดใดที่มีรูปร่างคล้ายกระสุนปืน (Bullet-shaped)?", opts: ["Rabies Virus", "Influenza Virus", "Parvovirus", "Rotavirus"], ans: 0 },
  { q: "Negri bodies เป็นลักษณะเฉพาะของโรคใด?", opts: ["Canine Distemper", "Rabies", "Feline Panleukopenia", "FIV"], ans: 1 },
  { q: "ไวรัสชนิดใดทำให้เกิด Blue Ear Disease ในสุกร?", opts: ["ASFV", "CSFV", "PRRSV", "FMD"], ans: 2 },
  { q: "Hard pad disease เป็นอาการของโรคอะไร?", opts: ["Parvovirus", "Canine Distemper", "Rabies", "Leptospirosis"], ans: 1 },
  { q: "FMD ย่อมาจากอะไร?", opts: ["Feline Mouth Disease", "Foot and Mouth Disease", "Fatal Myocardial Disease", "Feline Mucosal Disease"], ans: 1 },
  { q: "ไวรัส Parvovirus ในสุนัข (CPV-2) ทำอันตรายต่ออวัยวะใดมากที่สุด?", opts: ["ปอด", "ตับ", "เยื่อบุลำไส้", "ไต"], ans: 2 },
  { q: "โรคไข้หัดสุนัข (Canine Distemper) เกิดจากไวรัสในสกุลใด?", opts: ["Morbillivirus", "Lyssavirus", "Parvovirus", "Herpesvirus"], ans: 0 },
  { q: "ไวรัสชนิดใดที่มี RNA เป็น Genetic material แบบ Single-stranded Negative-sense?", opts: ["Parvovirus", "Rotavirus", "Rabies Virus", "Adenovirus"], ans: 2 },
  { q: "African Swine Fever Virus (ASFV) แพร่กระจายผ่านพาหะชนิดใดเป็นหลัก?", opts: ["ยุง", "เห็บ Ornithodoros", "แมลงวัน", "หมัด"], ans: 1 },
  { q: "ไวรัส Avian Influenza (H5N1) สามารถแพร่สู่คนได้จากเส้นทางใด?", opts: ["การสัมผัสหรือสูดดมสารคัดหลั่งสัตว์ป่วย", "การกัดของสัตว์เท่านั้น", "น้ำประปาปนเปื้อน", "ยุงลาย"], ans: 0 },
  { q: "ไวรัสชนิดใดไม่มีเปลือกหุ้ม (Non-enveloped)?", opts: ["Rabies Virus", "Influenza Virus", "Canine Parvovirus", "HIV"], ans: 2 },
  { q: "วัคซีนป้องกันโรคพิษสุนัขบ้าในสัตว์ ควรฉีดครั้งแรกเมื่ออายุกี่เดือน?", opts: ["1 เดือน", "3 เดือน", "6 เดือน", "12 เดือน"], ans: 1 },
  { q: "PRRSV ย่อมาจากอะไร?", opts: ["Porcine Respiratory and Renal Syndrome Virus", "Porcine Reproductive and Respiratory Syndrome Virus", "Porcine Rotavirus and Reovirus Syndrome Virus", "Porcine Rabies and Rhabdovirus Syndrome Virus"], ans: 1 },
  { q: "ไวรัส Rotavirus ก่อให้เกิดโรคอะไรในสัตว์?", opts: ["โรคหัด", "โรคท้องร่วง", "โรคปอดบวม", "โรคสมองอักเสบ"], ans: 1 },
  { q: "ไวรัส Herpes ใดที่ทำให้เกิดโรคในแมว (FHV-1) เป็นหลัก?", opts: ["Feline Leukemia Virus", "Feline Herpesvirus Type 1", "Feline Immunodeficiency Virus", "Feline Calicivirus"], ans: 1 }
];

const INITIAL_CASES = [
  {
    id: 1,
    title: "Case 01: The Drooling Cow",
    symptoms: ["โคเนื้อ อายุ 2 ปี", "มีไข้สูง 40.5 °C", "น้ำลายไหลยืด", "มีแผลหลุดลอกที่ริมฝีปากและเหงือก", "กีบแตก เดินกะเผลก"],
    correct: { diag: "FMD", lab: "PCR_EPITHELIUM", treat: "SUPPORTIVE", prev: "VACCINE_BIOSECURITY" }
  },
  {
    id: 2,
    title: "Case 02: The Lethargic Puppy",
    symptoms: ["ลูกสุนัข อายุ 3 เดือน (ยังไม่เคยทำวัคซีน)", "ซึม เบื่ออาหาร", "อาเจียนอย่างหนัก", "ท้องเสียมีเลือดปน กลิ่นเหม็นคาว", "ภาวะขาดน้ำรุนแรง"],
    correct: { diag: "CPV", lab: "SNAP_TEST_FECES", treat: "FLUID_ANTIBIOTIC", prev: "VACCINE_PROTOCOL" }
  }
];

const INITIAL_MATCHING = [
  { id: 'v1', text: 'Rabies Virus', matchId: 'm1' },
  { id: 'd1', text: 'รูปกระสุนปืน พิษสุนัขบ้า (Bullet shape)', matchId: 'm1' },
  { id: 'v2', text: 'Canine Parvovirus', matchId: 'm2' },
  { id: 'd2', text: 'ลำไส้อักเสบติดต่อ ท้องเสียเป็นเลือด', matchId: 'm2' },
  { id: 'v3', text: 'Feline Leukemia Virus', matchId: 'm3' },
  { id: 'd3', text: 'มะเร็งเม็ดเลือดขาวในแมว (Retrovirus)', matchId: 'm3' },
  { id: 'v4', text: 'Porcine Epidemic Diarrhea (PEDV)', matchId: 'm4' },
  { id: 'd4', text: 'ท้องเสียระบาดในสุกร (Coronavirus)', matchId: 'm4' },
  { id: 'v5', text: 'Foot and Mouth Disease (FMD)', matchId: 'm5' },
  { id: 'd5', text: 'โรคปากและเท้าเปื่อย (Picornaviridae)', matchId: 'm5' }
];

const INITIAL_LAB_DETECTIVE = [
  {
    id: "c1",
    title: "เคสที่ 01: หมูไอเป็นเลือด",
    species: "สุกร (Porcine)",
    history: "ฟาร์มสุกรขุนพบลูกสุกรมีอาการไอ หายใจลำบาก หูม่วงคล้ำ อัตราการตายสูงถึง 20% ในคอกอนุบาล",
    symptoms: ["ไข้สูง (41°C)", "หูและหน้าท้องมีสีม่วงคล้ำ (Cyanosis)", "แท้งในแม่สุกรช่วงท้ายของการตั้งท้อง", "ลูกสุกรแคระแกร็น"],
    laboratoryResults: "ผลตรวจทางซีรั่มวิทยาพบระดับ Antibody ต่อไวรัสสูงมากในกลุ่มสุกรป่วย ผ่าซากพบปอดอักเสบแบบ Interstitial pneumonia และต่อมน้ำเหลืองขยายใหญ่",
    choices: [
      "Porcine Reproductive and Respiratory Syndrome Virus (PRRSV)",
      "African Swine Fever Virus (ASFV)",
      "Classical Swine Fever Virus (CSFV)",
      "Foot and Mouth Disease Virus (FMDV)"
    ],
    answer: "Porcine Reproductive and Respiratory Syndrome Virus (PRRSV)",
    explanation: "อาการหูม่วง (Blue ear disease), ปัญหาการสืบพันธุ์ในแม่สุกร (แท้ง) และปัญหาทางเดินหายใจในลูกสุกร ร่วมกับ Interstitial pneumonia เป็นลักษณะสำคัญของโรค PRRS"
  }
];

const INITIAL_OUTBREAK = [
  {
    id: 1,
    text: "สัปดาห์ที่ 1: คุณเดินทางมาถึงฟาร์มสุกรแห่งหนึ่ง พบสุกรหลายตัวมีไข้สูง ซึม และมีรอยโรคที่ผิวหนังเป็นรูปสี่เหลี่ยมขนมเปียกปูน (Diamond-shaped skin lesions) สิ่งแรกที่คุณควรทำคืออะไร?",
    options: [
      { text: "ฉีดวัคซีนให้สุกรทุกตัวทันที", hpMod: -20, exp: 0, next: 2, feedback: "การฉีดวัคซีนให้สัตว์ที่กำลังป่วยเป็นอันตราย พวกเขาต้องการการรักษาก่อน" },
      { text: "กักบริเวณสุกรป่วยและเก็บตัวอย่างส่งตรวจ", hpMod: 10, exp: 20, next: 2, feedback: "ยอดเยี่ยมมาก การกักกันโรคช่วยป้องกันการแพร่กระจายระหว่างรอผลวินิจฉัย" }
    ]
  },
  {
    id: 2,
    text: "สัปดาห์ที่ 2: ผลแล็บยืนยันว่าเป็นโรค Swine Erysipelas (ไฟลามทุ่งในสุกร) เจ้าของฟาร์มตื่นตระหนกมากเพราะกลัวว่าจะติดต่อไปสู่คน คุณจะจัดการอย่างไร?",
    options: [
      { text: "บอกให้เขาสบายใจว่าโรคนี้ไม่ติดคน", hpMod: -30, exp: 0, next: 3, feedback: "ผิด! เชื้อ Erysipelothrix rhusiopathiae สามารถติดต่อสู่คนได้ (Zoonotic)" },
      { text: "ฉีด Penicillin ให้สุกรป่วย และให้คนงานสวมถุงมือป้องกัน", hpMod: 20, exp: 20, next: 3, feedback: "ถูกต้อง! ยา Penicillin ได้ผลดีมาก และอุปกรณ์ป้องกัน (PPE) จะช่วยปกป้องคนงาน" }
    ]
  }
];

const INITIAL_FARM_DEFENSE = [
  { month: 1, title: "Threat Detected", text: "ฟาร์มข้างเคียงพบสุกรมีอาการซึมและไข้สูง ความเสี่ยงการติดเชื้อเริ่มก่อตัว", risk: 20 },
  { month: 2, title: "Vector Warning", text: "ช่วงฤดูฝน พาหะนำโรคอย่างนกและหนูเพิ่มจำนวนมากในพื้นที่", risk: 40 },
  { month: 3, title: "Regional Outbreak", text: "เกิดการระบาดของ PRRS อย่างหนักในรัศมี 10 กิโลเมตรจากฟาร์มคุณ!", risk: 70 },
  { month: 4, title: "Market Crash", text: "ข่าวโรคระบาดทำให้ราคาหมูตกต่ำ (รายได้เดือนนี้ลดลงครึ่งหนึ่ง)", risk: 30 },
  { month: 5, title: "Mutated Strain", text: "เชื้อไวรัสกลายพันธุ์และแพร่กระจายทางอากาศ (Airborne) อย่างรุนแรง!", risk: 90 }
];

const INITIAL_IDENTIFICATION = [
  {
    id: 1,
    question: "ลูกสุนัขวัย 3 เดือน มาด้วยอาการท้องเสียเป็นเลือดอย่างรุนแรง อาเจียน และซึม ผลเลือดพบภาวะเม็ดเลือดขาวต่ำอย่างรุนแรง (Severe leukopenia) ไวรัสชนิดใดที่เป็นสาเหตุที่เป็นไปได้มากที่สุด?",
    choices: ["Canine Distemper Virus", "Canine Parvovirus", "Rabies Virus", "Canine Adenovirus-1"],
    answer: "Canine Parvovirus",
    explanation: "Canine Parvovirus มุ่งเป้าทำลายเซลล์ที่มีการแบ่งตัวอย่างรวดเร็ว เช่น เซลล์เยื่อบุลำไส้ (ทำให้ท้องเสียเป็นเลือด) และเซลล์ไขกระดูก (ทำให้เม็ดเลือดขาวต่ำ)",
    virusType: 'parvo'
  },
  {
    id: 2,
    question: "ไวรัสชนิดนี้มีเปลือกหุ้ม (Enveloped) รูปร่างคล้ายกระสุนปืน (Bullet-shaped) และทำให้เกิดภาวะสมองอักเสบถึงแก่ชีวิตในสัตว์เลี้ยงลูกด้วยนมเกือบทุกชนิด",
    choices: ["Rabies Virus", "Feline Leukemia Virus", "Equine Infectious Anemia", "Bovine Viral Diarrhea Virus"],
    answer: "Rabies Virus",
    explanation: "โรคพิษสุนัขบ้าเกิดจาก Rhabdovirus ซึ่งมีลักษณะเด่นคือรูปร่างคล้ายกระสุนปืนเมื่อดูผ่านกล้องจุลทรรศน์อิเล็กตรอน",
    virusType: 'rabies'
  }
];

export default function GameContentManager() {
  const { appUser, loading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'classroom_battle' | 'quiz_general' | 'diagnosis_duel' | 'matching' | 'lab_detective' | 'outbreak' | 'farm_defense' | 'identification'>('classroom_battle');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // State for standard quizzes
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // State for complex data
  const [rawJson, setRawJson] = useState('');

  const fetchContent = async (tab: string) => {
    setLoading(true);
    setMessage('');
    try {
      const docRef = doc(db, 'game_content', tab);
      const docSnap = await getDoc(docRef);
      
      const isComplexTab = ['diagnosis_duel', 'matching', 'lab_detective', 'outbreak', 'farm_defense', 'identification'].includes(tab);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (isComplexTab) {
          setRawJson(JSON.stringify(data.data || [], null, 2));
        } else {
          setQuestions(data.questions || []);
        }
      } else {
        // Init with original hardcoded defaults if missing
        if (tab === 'diagnosis_duel') {
          setRawJson(JSON.stringify(INITIAL_CASES, null, 2));
        } else if (tab === 'matching') {
          setRawJson(JSON.stringify(INITIAL_MATCHING, null, 2));
        } else if (tab === 'lab_detective') {
          setRawJson(JSON.stringify(INITIAL_LAB_DETECTIVE, null, 2));
        } else if (tab === 'outbreak') {
          setRawJson(JSON.stringify(INITIAL_OUTBREAK, null, 2));
        } else if (tab === 'farm_defense') {
          setRawJson(JSON.stringify(INITIAL_FARM_DEFENSE, null, 2));
        } else if (tab === 'identification') {
          setRawJson(JSON.stringify(INITIAL_IDENTIFICATION, null, 2));
        } else if (tab === 'classroom_battle') {
          setQuestions(INITIAL_KHOOT);
        } else if (tab === 'quiz_general') {
          setQuestions(INITIAL_GENERAL);
        }
      }
    } catch (e) {
      console.error(e);
      setMessage("Error fetching data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContent(activeTab);
  }, [activeTab]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const isComplexTab = ['diagnosis_duel', 'matching', 'lab_detective', 'outbreak', 'farm_defense', 'identification'].includes(activeTab);
      if (isComplexTab) {
        const parsed = JSON.parse(rawJson);
        await setDoc(doc(db, 'game_content', activeTab), { data: parsed });
      } else {
        await setDoc(doc(db, 'game_content', activeTab), { questions });
      }
      setMessage("บันทึกข้อมูลสำเร็จ!");
      setTimeout(() => setMessage(''), 3000);
    } catch (e: any) {
      console.error(e);
      setMessage("Error: " + e.message);
    }
    setSaving(false);
  };

  // UI Helpers for Quizzes
  const addQuestion = () => setQuestions([...questions, { q: "", opts: ["", "", "", ""], ans: 0 }]);
  const removeQuestion = (index: number) => setQuestions(questions.filter((_, i) => i !== index));
  const updateQuestion = (index: number, field: string, value: any) => {
    const newQ = [...questions];
    if (field === 'q') newQ[index].q = value;
    else if (field === 'ans') newQ[index].ans = Number(value);
    else if (field.startsWith('opt_')) {
      const optIdx = parseInt(field.split('_')[1]);
      newQ[index].opts[optIdx] = value;
    }
    setQuestions(newQ);
  };

  if (authLoading) return <div className="p-8 text-center text-white">Loading...</div>;
  if (appUser?.role !== 'instructor') return <div className="p-8 text-center text-danger">Access Denied</div>;

  const isComplexTab = ['diagnosis_duel', 'matching', 'lab_detective', 'outbreak', 'farm_defense', 'identification'].includes(activeTab);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/instructor" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Gamepad2 className="w-8 h-8 text-primary" /> Game Content Manager
            </h1>
          </div>
          <p className="text-slate-500">แก้ไขชุดคำถามและเนื้อหาสำหรับแต่ละโหมดเกม ข้อมูลจะอัปเดตแบบ Real-time</p>
        </div>
        <Button onClick={handleSave} disabled={saving || loading} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8">
          <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl font-bold flex items-center gap-2 ${message.includes('Error') ? 'bg-danger/20 text-danger border border-danger' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'}`}>
          <AlertCircle className="w-5 h-5" /> {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-800">
        {[
          { id: 'classroom_battle', label: 'Classroom Battle (Kahoot)' },
          { id: 'quiz_general', label: 'General Quiz (Boss / Time Attack)' },
          { id: 'diagnosis_duel', label: 'Diagnosis Duel (Cases)' },
          { id: 'matching', label: 'Matching (Cards)' },
          { id: 'lab_detective', label: 'Lab Detective (Cases)' },
          { id: 'outbreak', label: 'Outbreak (Sim)' },
          { id: 'farm_defense', label: 'Farm Defense (Events)' },
          { id: 'identification', label: 'Virus Identification' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === t.id ? 'bg-primary text-white shadow-lg shadow-primary/30 border border-primary' : 'bg-slate-800/60 text-slate-400 border border-slate-700 hover:border-primary/50 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Editor Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono animate-pulse">Loading data from Firestore...</div>
      ) : isComplexTab ? (
        <Card className="p-6 bg-slate-900 border-slate-700">
          <div className="flex items-center gap-2 mb-4 text-yellow-400 font-bold">
            <FileJson className="w-5 h-5" /> Advanced JSON Editor (For complex case structures)
          </div>
          <textarea
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            className="w-full h-[600px] bg-slate-950 text-emerald-400 font-mono p-4 rounded-xl border border-slate-800 focus:border-primary outline-none resize-none"
            spellCheck={false}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <Card key={idx} className="p-6 bg-slate-900/50 border-slate-700 relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => removeQuestion(idx)} className="text-danger hover:text-red-400 p-2 bg-danger/10 rounded-lg">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4 max-w-4xl">
                <div>
                  <label className="text-sm font-bold text-slate-400 uppercase">Question {idx + 1}</label>
                  <input 
                    type="text" 
                    value={q.q}
                    onChange={(e) => updateQuestion(idx, 'q', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:border-primary outline-none mt-1"
                    placeholder="Enter question here..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.opts.map((opt, optIdx) => (
                    <div key={optIdx} className="flex gap-2">
                      <div className="shrink-0 flex items-center justify-center">
                        <input 
                          type="radio" 
                          name={`ans_${idx}`} 
                          checked={q.ans === optIdx}
                          onChange={() => updateQuestion(idx, 'ans', optIdx)}
                          className="w-5 h-5 accent-primary cursor-pointer"
                        />
                      </div>
                      <input 
                        type="text" 
                        value={opt}
                        onChange={(e) => updateQuestion(idx, `opt_${optIdx}`, e.target.value)}
                        className={`w-full bg-slate-950 border ${q.ans === optIdx ? 'border-emerald-500/50' : 'border-slate-800'} rounded-lg p-3 text-sm text-slate-300 focus:border-primary outline-none`}
                        placeholder={`Option ${optIdx + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))}
          
          <Button onClick={addQuestion} variant="outline" className="w-full py-6 border-dashed border-2 border-slate-700 text-slate-400 hover:text-white hover:border-primary bg-transparent hover:bg-primary/10">
            <Plus className="w-6 h-6 mr-2" /> Add New Question
          </Button>
        </div>
      )}
    </div>
  );
}
