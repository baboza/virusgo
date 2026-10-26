"use client";

import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe2, CheckCircle2, Sparkles, ShieldCheck } from 'lucide-react';
import {
  CONTINENTS,
  detectSuggestedYearFromEmail,
  yearToContinent,
} from '@/lib/empireConstants';
import { StudentCohortYear } from '@/types';
import { sfx } from '@/utils/sound';

const COHORT_OPTIONS: {
  year: StudentCohortYear;
  continentKey: 'capsidia' | 'hemoria' | 'synapsia';
  borderActive: string;
  bgActive: string;
  desc: string;
}[] = [
  {
    year: 3,
    continentKey: 'capsidia',
    borderActive: 'border-cyan-400 ring-2 ring-cyan-400/40',
    bgActive: 'bg-cyan-950/60',
    desc: 'ดินแดนปราการผลึกโปรตีน โทนสีฟ้า-มรกต สำหรับนิสิตชั้นปีที่ 3',
  },
  {
    year: 4,
    continentKey: 'hemoria',
    borderActive: 'border-amber-400 ring-2 ring-amber-400/40',
    bgActive: 'bg-amber-950/60',
    desc: 'สมรภูมิโลหิตและภูมิคุ้มกันคลินิก โทนสีอำพัน-ทับทิม สำหรับนิสิตชั้นปีที่ 4',
  },
  {
    year: 5,
    continentKey: 'synapsia',
    borderActive: 'border-purple-400 ring-2 ring-purple-400/40',
    bgActive: 'bg-purple-950/60',
    desc: 'ยอดปราการประสาทขั้นสูง โทนสีม่วงนีออน-ทอง สำหรับพี่ใหญ่ชั้นปีที่ 5',
  },
];

export const CohortOnboardingModal: React.FC = () => {
  const { appUser } = useAuth();
  const [selectedYear, setSelectedYear] = useState<StudentCohortYear>(4);
  const [suggestedYear, setSuggestedYear] = useState<StudentCohortYear | null>(null);
  const [saving, setSaving] = useState(false);

  const lockedMsuYear = detectSuggestedYearFromEmail(appUser?.email);

  useEffect(() => {
    if (!appUser?.needsCohortSelection) return;
    if (lockedMsuYear) {
      setSuggestedYear(lockedMsuYear);
      setSelectedYear(lockedMsuYear);
    } else if (appUser.year === 3 || appUser.year === 4 || appUser.year === 5) {
      setSelectedYear(appUser.year);
    }
  }, [appUser, lockedMsuYear]);

  if (!appUser || appUser.role !== 'student' || !appUser.needsCohortSelection) {
    return null;
  }

  const handleConfirm = async () => {
    if (saving) return;
    setSaving(true);
    sfx.click?.();
    try {
      const effectiveYear = lockedMsuYear || selectedYear;
      const continentId = yearToContinent(effectiveYear);
      await updateDoc(doc(db, 'users', appUser.uid), {
        year: effectiveYear,
        continentId,
        needsCohortSelection: false,
      });
      sfx.levelUp?.();
    } catch (error) {
      console.error('Failed to save student cohort:', error);
      alert('บันทึกชั้นปีไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg rounded-3xl bg-slate-900 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] p-5 sm:p-7 space-y-5 relative overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/40 flex items-center justify-center shrink-0">
              <Globe2 className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 mb-1">
                <Sparkles className="w-3 h-3" /> ลงทะเบียนสังกัดทวีปประจำรุ่น
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                เลือกชั้นปีและทวีปเกิดของคุณ
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                แต่ละชั้นปีจะมีตารางคะแนนและแผนที่ทวีปของตนเอง และเมื่อจบภาคเรียนทั้ง 3 ทวีปจะเคลื่อนตัวรวมเป็นมหาทวีป <span className="text-yellow-300 font-bold">PANGAEA</span>!
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {COHORT_OPTIONS.map((opt) => {
              const meta = CONTINENTS[opt.continentKey];
              const isSelected = selectedYear === opt.year;
              const isSuggested = suggestedYear === opt.year;
              const isDisabledByPrefix = Boolean(lockedMsuYear && lockedMsuYear !== opt.year);

              return (
                <button
                  key={opt.year}
                  type="button"
                  disabled={isDisabledByPrefix}
                  onClick={() => {
                    if (isDisabledByPrefix) return;
                    sfx.click?.();
                    setSelectedYear(opt.year);
                  }}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                    isSelected
                      ? `${opt.bgActive} ${opt.borderActive} cursor-pointer`
                      : isDisabledByPrefix
                      ? 'bg-slate-950/40 border-slate-800/50 opacity-40 cursor-not-allowed'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-600 cursor-pointer'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl shrink-0">{meta.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm sm:text-base text-white">
                        นิสิตชั้นปีที่ {opt.year}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}>
                        ทวีป {meta.code}
                      </span>
                      {isSuggested && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          แนะนำตามรหัสนิสิต
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-snug">{opt.desc}</p>
                  </div>
                  <CheckCircle2
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isSelected ? 'text-emerald-400 scale-110' : 'text-slate-700'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>สามารถส่องดูอันดับและแผนที่ของรุ่นพี่/รุ่นน้องข้ามทวีปได้ตลอดเวลาในภายหลัง</span>
          </div>

          <button
            type="button"
            disabled={saving}
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-950/60 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {saving
              ? 'กำลังเข้าสู่ทวีปประจำรุ่น...'
              : `ยืนยันเข้าสู่ ชั้นปีที่ ${selectedYear} • ทวีป ${CONTINENTS[yearToContinent(selectedYear)].code}`}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
