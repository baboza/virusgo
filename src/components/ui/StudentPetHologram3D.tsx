"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Sparkles, Heart, ChevronRight, Box, Stethoscope, RotateCcw } from 'lucide-react';
import { VirusPetData } from '@/types';
import { familyToVirusType, SVGVirus } from '@/components/ui/SVGVirus';
import { familyToColor } from '@/app/student/empire/page';

// Dynamically import VirusViewer3D with SSR disabled to ensure smooth client-only rendering
const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-cyan-400 font-mono text-xs">
      <div className="w-7 h-7 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      <span className="text-[10px] tracking-widest uppercase">Loading 3D Hologram...</span>
    </div>
  ),
});

interface StudentPetHologram3DProps {
  pet?: VirusPetData | null;
  currentExp?: number;
  className?: string;
}

export default function StudentPetHologram3D({
  pet,
  currentExp = 0,
  className = '',
}: StudentPetHologram3DProps) {
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const isUnlocked = currentExp >= 1000;

  // Determine pet viral attributes
  const petFamily = pet?.family || 'parvoviridae';
  const virusType = familyToVirusType(petFamily);
  const themeColor = familyToColor(petFamily);
  const isInjured = Boolean(pet?.isInjured);

  return (
    <div
      className={`relative rounded-3xl bg-slate-900/85 border border-primary/30 p-4 md:p-5 flex flex-col justify-between shadow-[0_0_30px_rgba(59,130,246,0.12)] backdrop-blur-md overflow-hidden group hover:border-cyan-400/50 transition-all duration-300 ${className}`}
    >
      {/* Background Holographic Ring Glow */}
      <div 
        className="absolute -top-16 -right-16 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-30 transition-all group-hover:opacity-50"
        style={{ backgroundColor: themeColor }}
      />
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent pointer-events-none" />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span className="text-[11px] font-mono font-black text-cyan-300 uppercase tracking-wider">
            {pet ? 'Bio-Hologram Chamber' : 'Specimen Incubator'}
          </span>
        </div>

        {/* 3D / 2D Toggle */}
        <button
          type="button"
          onClick={() => setViewMode((prev) => (prev === '3d' ? '2d' : '3d'))}
          className="text-[10px] font-mono px-2 py-0.5 rounded-lg border border-slate-700 bg-slate-950/80 hover:border-cyan-500/50 text-slate-300 hover:text-white transition-all flex items-center gap-1 active:scale-95"
          title="สลับโหมดมุมมอง 3D Interactive / 2D Vector"
        >
          <Box className="w-3 h-3 text-cyan-400" />
          <span>{viewMode.toUpperCase()}</span>
        </button>
      </div>

      {/* Center Hologram Canvas (3D or 2D) */}
      <div className="relative w-full h-44 sm:h-48 my-2 flex items-center justify-center z-10">
        {/* Hologram Scanner Grid Base */}
        <div className="absolute bottom-1 w-32 h-10 rounded-full bg-cyan-500/10 border border-cyan-400/20 blur-[1px] pointer-events-none" />

        {viewMode === '3d' ? (
          <div className="w-full h-full">
            <VirusViewer3D
              type={virusType}
              color={themeColor}
              isSick={isInjured}
              interactive={true}
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="w-32 h-32 flex items-center justify-center relative">
            <SVGVirus
              type={virusType}
              className="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.6)] animate-pulse"
            />
          </div>
        )}
      </div>

      {/* Footer Details & Action Link */}
      <div className="pt-3 border-t border-slate-800/80 relative z-10 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="font-black text-white text-sm flex items-center gap-1.5 truncate">
              <span>{pet?.virusName || (isUnlocked ? 'พร้อมเลือกสายพันธุ์' : 'ตัวอย่างทดลอง (Prototype)')}</span>
              {isInjured && (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                  <Stethoscope className="w-2.5 h-2.5 text-rose-400" /> บาดเจ็บ
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5">
              {pet ? (
                <span>แฟมิลี: <strong className="text-cyan-300">{petFamily}</strong> • ขั้นที่ {pet.stage || 1}</span>
              ) : (
                <span>ปลดล็อกระบบเพาะเลี้ยงไวรัสประจำตัว (EXP ≥ 1,000)</span>
              )}
            </div>
          </div>

          <Link
            href="/student/virus-pet"
            className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition-all flex items-center gap-1"
          >
            <span>{pet ? 'เข้าห้องแล็บ' : 'ไปฟักตัว'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
