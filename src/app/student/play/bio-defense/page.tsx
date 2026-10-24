"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Shield,
  Zap,
  Heart,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Brain,
  Trophy,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  FastForward,
  FlaskConical,
  Droplets,
  Swords,
  HeartPulse,
  Wind,
  Skull,
  Crown
} from 'lucide-react';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import {
  DAILY_EXP_CAPS,
  awardDailyCappedExp,
  getTodayDateString
} from '@/lib/dailyExpCap';
import { getEffectivePetStats } from '@/lib/petBalance';
import { ALL_15_CHAPTER_QUESTIONS, MasterQuestion } from '@/data/veterinaryVirologyContent';

// ── Adaptive Logical Canvas Dimensions ──────────────────────────────────────
// Desktop (>= 768px): Wide tactical battlefield (760 x 400)
// Mobile  (<  768px): True 1:1 Portrait battlefield (380 x 490, Top-to-Bottom)
const DESKTOP_W = 760;
const DESKTOP_H = 400;
const MOBILE_W = 380;
const MOBILE_H = 490;
const MAX_TOWER_LEVEL = 5;

type TowerKey = 'alcohol' | 'bleach' | 'bcell' | 'tcell';
type VirusKind = 'enveloped' | 'naked' | 'intracellular';

interface TowerDef {
  key: TowerKey;
  name: string;
  shortName: string;
  compactTag: string;
  cost: number;
  range: number;
  dmg: number;
  fireRate: number;
  splash?: number;
  slow?: number;
  color: string;
  badgeClass: string;
  roleTh: string;
  virologyNote: string;
}

const TOWER_DEFS: Record<TowerKey, TowerDef> = {
  alcohol: {
    key: 'alcohol',
    name: '70% Ethyl Alcohol',
    shortName: 'Alcohol',
    compactTag: 'x2.5 Env',
    cost: 40,
    range: 124,
    dmg: 24,
    fireRate: 0.75,
    color: '#06b6d4',
    badgeClass: 'border-cyan-400 bg-cyan-500/15 text-cyan-300',
    roleTh: 'ละลายไขมัน (x2.5 ใส่ Enveloped)',
    virologyNote: 'ยิง Naked Virus ไม่เข้า (0 DMG) เพราะไม่มีชั้นไขมัน Envelope!'
  },
  bleach: {
    key: 'bleach',
    name: 'Bleach (NaOCl 1:30)',
    shortName: 'Bleach',
    compactTag: 'ฆ่า Naked',
    cost: 65,
    range: 118,
    dmg: 30,
    fireRate: 1.02,
    splash: 44,
    color: '#f59e0b',
    badgeClass: 'border-amber-400 bg-amber-500/15 text-amber-300',
    roleTh: 'ทำลาย Naked Capsid + กระจายวงกว้าง',
    virologyNote: 'ออกซิไดซ์โปรตีน Capsid กำจัด Naked Virus (CPV-2, FMDV, CAV-1) ได้ชะงัด!'
  },
  bcell: {
    key: 'bcell',
    name: 'B-Cell (Neutralizing IgG)',
    shortName: 'B-Cell',
    compactTag: 'ชะลอ 45%',
    cost: 55,
    range: 132,
    dmg: 16,
    fireRate: 0.54,
    slow: 0.45,
    color: '#10b981',
    badgeClass: 'border-emerald-400 bg-emerald-500/15 text-emerald-300',
    roleTh: 'ดักจับไวรัส • ลดความเร็วเคลื่อนที่ 45%',
    virologyNote: 'แอนติบอดีทรงตัว Y จับโปรตีนผิวไวรัสนอกเซลล์ ชะลอการบุกสู่อวัยวะ'
  },
  tcell: {
    key: 'tcell',
    name: 'CD8+ Cytotoxic T-Cell',
    shortName: 'T-Cell',
    compactTag: 'บอส x2.2',
    cost: 80,
    range: 148,
    dmg: 48,
    fireRate: 1.08,
    color: '#a855f7',
    badgeClass: 'border-purple-400 bg-purple-500/15 text-purple-300',
    roleTh: 'เจาะเกราะสูง • ปราบบอสในเซลล์ x2.2',
    virologyNote: 'จดจำ MHC-I ทำลายเซลล์ติดเชื้อและบอสที่ซ่อนใน Macrophage (FIPV/ASFV/PRRSV)'
  }
};

interface EnemySpawn {
  name: string;
  kind: VirusKind;
  hp: number;
  speed: number;
  reward: number;
  color: string;
  delay: number;
  isBoss?: boolean;
  isFinalBoss?: boolean;
}

interface StageWave {
  isBossWave?: boolean;
  bossTier?: 'mid' | 'final';
  hint: string;
  enemies: EnemySpawn[];
}

interface MapGeometry {
  path: { x: number; y: number }[];
  pads: { x: number; y: number }[];
}

interface StageConfig {
  id: 'crypts' | 'alveoli' | 'cns';
  shortTab: string;
  name: string;
  nameTh: string;
  organLabel: string;
  expReward: number;
  startAtp: number;
  starterPadIdx: number;
  desktopMap: MapGeometry;
  mobileMap: MapGeometry;
  waves: StageWave[];
}

// Helper to build clean staggered enemy waves
const buildPack = (
  items: {
    name: string;
    kind: VirusKind;
    hp: number;
    speed: number;
    reward: number;
    color: string;
    count: number;
    spacing?: number;
    isBoss?: boolean;
    isFinalBoss?: boolean;
  }[]
): EnemySpawn[] => {
  const result: EnemySpawn[] = [];
  let cursor = 0.25;
  for (const group of items) {
    const gap = group.spacing ?? 1.05;
    for (let i = 0; i < group.count; i++) {
      result.push({
        name: group.name,
        kind: group.kind,
        hp: group.hp,
        speed: group.speed,
        reward: group.reward,
        color: group.color,
        delay: Number(cursor.toFixed(2)),
        isBoss: group.isBoss,
        isFinalBoss: group.isFinalBoss
      });
      cursor += gap;
    }
  }
  return result;
};

// ── 3 STAGES × 10 WAVES EACH (MID-BOSS AT WAVE 5 & FINAL BOSS AT WAVE 10) ───
const STAGES: StageConfig[] = [
  {
    id: 'crypts',
    shortTab: '1. ลำไส้',
    name: 'Stage 1: Intestinal Crypts',
    nameTh: 'เยื่อบุลำไส้ (10 Waves • บอสเวฟ 5 & 10)',
    organLabel: 'Crypts',
    expReward: 80,
    startAtp: 115,
    starterPadIdx: 1,
    desktopMap: {
      path: [
        { x: 24, y: 95 },
        { x: 175, y: 95 },
        { x: 175, y: 295 },
        { x: 385, y: 295 },
        { x: 385, y: 95 },
        { x: 585, y: 95 },
        { x: 585, y: 285 },
        { x: 705, y: 285 }
      ],
      pads: [
        { x: 102, y: 190 },
        { x: 245, y: 195 },
        { x: 318, y: 195 },
        { x: 102, y: 295 },
        { x: 450, y: 195 },
        { x: 520, y: 195 },
        { x: 485, y: 325 },
        { x: 648, y: 190 }
      ]
    },
    mobileMap: {
      path: [
        { x: 65, y: 30 },
        { x: 65, y: 96 },
        { x: 315, y: 96 },
        { x: 315, y: 216 },
        { x: 65, y: 216 },
        { x: 65, y: 336 },
        { x: 315, y: 336 },
        { x: 315, y: 440 }
      ],
      pads: [
        { x: 92, y: 156 },
        { x: 172, y: 156 },
        { x: 252, y: 156 },
        { x: 130, y: 276 },
        { x: 212, y: 276 },
        { x: 292, y: 276 },
        { x: 152, y: 398 },
        { x: 245, y: 398 }
      ]
    },
    waves: [
      {
        hint: 'Wave 1/10: พบ CDV (Enveloped) และ CPV-2 (Naked — ทน Alcohol! รีบสร้าง Bleach ช่วยสกัด)',
        enemies: buildPack([
          { name: 'CDV', kind: 'enveloped', hp: 85, speed: 42, reward: 10, color: '#fb7185', count: 2, spacing: 1.2 },
          { name: 'CPV-2', kind: 'naked', hp: 100, speed: 38, reward: 12, color: '#38bdf8', count: 2, spacing: 1.3 }
        ])
      },
      {
        hint: 'Wave 2/10: PEDV (Coronavirus มีเปลือกไขมัน) บุกสลับกับ CPV-2',
        enemies: buildPack([
          { name: 'PEDV', kind: 'enveloped', hp: 105, speed: 46, reward: 10, color: '#fbbf24', count: 3, spacing: 1.0 },
          { name: 'CPV-2', kind: 'naked', hp: 118, speed: 40, reward: 12, color: '#38bdf8', count: 2, spacing: 1.2 }
        ])
      },
      {
        hint: 'Wave 3/10: Rotavirus (Naked dsRNA ทนสิ่งแวดล้อม) ผสมโรงกับ TGEV (Enveloped)',
        enemies: buildPack([
          { name: 'Rotavirus', kind: 'naked', hp: 135, speed: 42, reward: 11, color: '#60a5fa', count: 3, spacing: 1.05 },
          { name: 'TGEV', kind: 'enveloped', hp: 125, speed: 48, reward: 11, color: '#f97316', count: 3, spacing: 0.95 }
        ])
      },
      {
        hint: 'Wave 4/10: FPLV (หัดแมว Naked Parvovirus เกราะหนา) — เตรียมพร้อมก่อนบอส Wave 5!',
        enemies: buildPack([
          { name: 'FPLV', kind: 'naked', hp: 165, speed: 43, reward: 12, color: '#38bdf8', count: 3, spacing: 1.0 },
          { name: 'CDV', kind: 'enveloped', hp: 145, speed: 52, reward: 11, color: '#fb7185', count: 3, spacing: 0.9 }
        ])
      },
      {
        isBossWave: true,
        bossTier: 'mid',
        hint: 'MID-BOSS WAVE 5/10: บอส CAV-1 (Naked Adenovirus ตับอักเสบสุนัข — ทน Alcohol! ใช้ Bleach + T-Cell รุมยิง!)',
        enemies: buildPack([
          { name: 'CPV-2', kind: 'naked', hp: 165, speed: 44, reward: 12, color: '#38bdf8', count: 2, spacing: 0.95 },
          { name: 'BOSS: CAV-1', kind: 'naked', hp: 620, speed: 30, reward: 48, color: '#0ea5e9', count: 1, spacing: 1.6, isBoss: true },
          { name: 'PEDV', kind: 'enveloped', hp: 155, speed: 50, reward: 11, color: '#fbbf24', count: 3, spacing: 0.9 }
        ])
      },
      {
        hint: 'Wave 6/10: ฝูง FCV (Feline Calicivirus — Naked วิ่งไว) บุกทะลวงหลังศึกบอส!',
        enemies: buildPack([
          { name: 'FCV', kind: 'naked', hp: 160, speed: 54, reward: 11, color: '#22d3ee', count: 4, spacing: 0.85 },
          { name: 'CCoV', kind: 'enveloped', hp: 175, speed: 48, reward: 11, color: '#fbbf24', count: 3, spacing: 0.95 }
        ])
      },
      {
        hint: 'Wave 7/10: BVDV (Mucosal Disease ซ่อนในเซลล์ภูมิคุ้มกัน!) — ป้อม CD8+ T-Cell ยิงแรง x2.2',
        enemies: buildPack([
          { name: 'BVDV', kind: 'intracellular', hp: 230, speed: 40, reward: 14, color: '#c084fc', count: 3, spacing: 1.1 },
          { name: 'Rotavirus', kind: 'naked', hp: 195, speed: 45, reward: 12, color: '#60a5fa', count: 3, spacing: 0.95 }
        ])
      },
      {
        hint: 'Wave 8/10: ทัพไวรัสไร้เปลือก CPV-2c กลายพันธุ์ + FPLV ดาหน้าบุก Crypts!',
        enemies: buildPack([
          { name: 'CPV-2c', kind: 'naked', hp: 235, speed: 48, reward: 13, color: '#38bdf8', count: 4, spacing: 0.85 },
          { name: 'FPLV', kind: 'naked', hp: 250, speed: 44, reward: 13, color: '#0284c7', count: 3, spacing: 0.95 }
        ])
      },
      {
        hint: 'Wave 9/10: คลื่นผสมความเร็วสูง BVDV + PEDV + FCV — อัปเกรดป้อมรับมือไฟนอลบอส!',
        enemies: buildPack([
          { name: 'PEDV', kind: 'enveloped', hp: 230, speed: 56, reward: 12, color: '#fbbf24', count: 4, spacing: 0.75 },
          { name: 'BVDV', kind: 'intracellular', hp: 280, speed: 43, reward: 14, color: '#c084fc', count: 3, spacing: 0.95 },
          { name: 'FCV', kind: 'naked', hp: 225, speed: 56, reward: 12, color: '#22d3ee', count: 3, spacing: 0.8 }
        ])
      },
      {
        isBossWave: true,
        bossTier: 'final',
        hint: 'FINAL BOSS WAVE 10/10: มหาบอส FIPV (ซ่อนใน Macrophage) + รองบอส CPV-2c Alpha บุกพร้อมกัน!',
        enemies: buildPack([
          { name: 'CPV-2c', kind: 'naked', hp: 260, speed: 48, reward: 13, color: '#38bdf8', count: 3, spacing: 0.85 },
          { name: 'SUB-BOSS: CPV-Alpha', kind: 'naked', hp: 720, speed: 34, reward: 45, color: '#0284c7', count: 1, spacing: 1.5, isBoss: true },
          { name: 'PEDV', kind: 'enveloped', hp: 245, speed: 56, reward: 12, color: '#fbbf24', count: 3, spacing: 0.8 },
          { name: 'FINAL BOSS: FIPV', kind: 'intracellular', hp: 1150, speed: 28, reward: 95, color: '#d946ef', count: 1, spacing: 1.4, isBoss: true, isFinalBoss: true }
        ])
      }
    ]
  },
  {
    id: 'alveoli',
    shortTab: '2. ถุงลมปอด',
    name: 'Stage 2: Alveolar Airway',
    nameTh: 'ถุงลมปอดและฟาร์มปศุสัตว์ (10 Waves • บอสเวฟ 5 & 10)',
    organLabel: 'Alveoli',
    expReward: 100,
    startAtp: 125,
    starterPadIdx: 1,
    desktopMap: {
      path: [
        { x: 24, y: 295 },
        { x: 195, y: 295 },
        { x: 195, y: 100 },
        { x: 460, y: 100 },
        { x: 460, y: 295 },
        { x: 620, y: 295 },
        { x: 620, y: 145 },
        { x: 705, y: 145 }
      ],
      pads: [
        { x: 118, y: 195 },
        { x: 270, y: 198 },
        { x: 385, y: 198 },
        { x: 328, y: 305 },
        { x: 540, y: 195 },
        { x: 540, y: 95 },
        { x: 680, y: 245 },
        { x: 118, y: 100 }
      ]
    },
    mobileMap: {
      path: [
        { x: 315, y: 30 },
        { x: 315, y: 96 },
        { x: 65, y: 96 },
        { x: 65, y: 216 },
        { x: 315, y: 216 },
        { x: 315, y: 336 },
        { x: 105, y: 336 },
        { x: 105, y: 440 }
      ],
      pads: [
        { x: 132, y: 156 },
        { x: 212, y: 156 },
        { x: 292, y: 156 },
        { x: 92, y: 276 },
        { x: 172, y: 276 },
        { x: 250, y: 276 },
        { x: 178, y: 398 },
        { x: 268, y: 398 }
      ]
    },
    waves: [
      {
        hint: 'Wave 1/10: H5N1 (Enveloped วิ่งไว) บุกมาพร้อม FMDV (Naked Picornavirus)',
        enemies: buildPack([
          { name: 'H5N1', kind: 'enveloped', hp: 95, speed: 54, reward: 10, color: '#f43f5e', count: 3, spacing: 1.05 },
          { name: 'FMDV', kind: 'naked', hp: 120, speed: 45, reward: 12, color: '#f59e0b', count: 2, spacing: 1.2 }
        ])
      },
      {
        hint: 'Wave 2/10: Swine Flu H1N1 (Enveloped) ผสมกับ FCV ทางเดินหายใจแมว (Naked)',
        enemies: buildPack([
          { name: 'H1N1', kind: 'enveloped', hp: 115, speed: 54, reward: 11, color: '#fb7185', count: 3, spacing: 1.0 },
          { name: 'FCV', kind: 'naked', hp: 135, speed: 48, reward: 12, color: '#22d3ee', count: 3, spacing: 1.0 }
        ])
      },
      {
        hint: 'Wave 3/10: NDV นิวคาสเซิล (Enveloped) และฝูง FMDV ระบาดหนักในคอกสัตว์',
        enemies: buildPack([
          { name: 'NDV', kind: 'enveloped', hp: 140, speed: 54, reward: 11, color: '#f97316', count: 3, spacing: 0.95 },
          { name: 'FMDV', kind: 'naked', hp: 160, speed: 47, reward: 12, color: '#f59e0b', count: 3, spacing: 1.0 }
        ])
      },
      {
        hint: 'Wave 4/10: BoHV-1 (Herpesvirus แฝงตัวในเซลล์) เริ่มบุก — เตรียม CD8+ T-Cell ให้พร้อม!',
        enemies: buildPack([
          { name: 'BoHV-1', kind: 'intracellular', hp: 195, speed: 40, reward: 14, color: '#a855f7', count: 3, spacing: 1.1 },
          { name: 'H5N1', kind: 'enveloped', hp: 145, speed: 58, reward: 11, color: '#f43f5e', count: 3, spacing: 0.9 }
        ])
      },
      {
        isBossWave: true,
        bossTier: 'mid',
        hint: 'MID-BOSS WAVE 5/10: บอส PRRSV (โจมตี Alveolar Macrophage!) — ใช้ CD8+ T-Cell เจาะเกราะ!',
        enemies: buildPack([
          { name: 'H1N1', kind: 'enveloped', hp: 165, speed: 56, reward: 11, color: '#fb7185', count: 3, spacing: 0.85 },
          { name: 'BOSS: PRRSV', kind: 'intracellular', hp: 720, speed: 31, reward: 52, color: '#38bdf8', count: 1, spacing: 1.5, isBoss: true },
          { name: 'FMDV', kind: 'naked', hp: 185, speed: 48, reward: 12, color: '#f59e0b', count: 3, spacing: 0.95 }
        ])
      },
      {
        hint: 'Wave 6/10: IBV หลอดลมอักเสบติดต่อไก่ (Enveloped) + FMDV Type O (Naked)',
        enemies: buildPack([
          { name: 'IBV', kind: 'enveloped', hp: 190, speed: 54, reward: 11, color: '#fbbf24', count: 4, spacing: 0.85 },
          { name: 'FMDV-O', kind: 'naked', hp: 215, speed: 49, reward: 12, color: '#f59e0b', count: 3, spacing: 0.95 }
        ])
      },
      {
        hint: 'Wave 7/10: ทัพไวรัสแฝงตัว FeHV-1 & BoHV-1 บุกพร้อมกัน!',
        enemies: buildPack([
          { name: 'FeHV-1', kind: 'intracellular', hp: 250, speed: 42, reward: 14, color: '#c084fc', count: 3, spacing: 1.0 },
          { name: 'BoHV-1', kind: 'intracellular', hp: 265, speed: 40, reward: 14, color: '#a855f7', count: 3, spacing: 1.0 }
        ])
      },
      {
        hint: 'Wave 8/10: ละอองลอยความเร็วสูง H5N1 HPAI + FMDV-Asia1 (ใช้ B-Cell ชะลอความเร็ว!)',
        enemies: buildPack([
          { name: 'H5N1-HPAI', kind: 'enveloped', hp: 220, speed: 64, reward: 12, color: '#f43f5e', count: 5, spacing: 0.75 },
          { name: 'FMDV-A', kind: 'naked', hp: 255, speed: 52, reward: 13, color: '#f59e0b', count: 3, spacing: 0.9 }
        ])
      },
      {
        hint: 'Wave 9/10: PCV2 (Naked Circovirus ทนทานสูง) จับคู่กับ PRRSV (Porcine Respiratory Complex!)',
        enemies: buildPack([
          { name: 'PCV2', kind: 'naked', hp: 295, speed: 45, reward: 14, color: '#38bdf8', count: 4, spacing: 0.9 },
          { name: 'PRRSV-Strain', kind: 'intracellular', hp: 310, speed: 42, reward: 15, color: '#818cf8', count: 3, spacing: 0.95 }
        ])
      },
      {
        isBossWave: true,
        bossTier: 'final',
        hint: 'FINAL BOSS WAVE 10/10: มหาบอสอหิวาต์แอฟริกาในสุกร ASFV + รองบอส PRRSV Mutant!',
        enemies: buildPack([
          { name: 'H5N1-HPAI', kind: 'enveloped', hp: 250, speed: 64, reward: 12, color: '#f43f5e', count: 3, spacing: 0.75 },
          { name: 'SUB-BOSS: PRRSV-X', kind: 'intracellular', hp: 820, speed: 34, reward: 50, color: '#38bdf8', count: 1, spacing: 1.5, isBoss: true },
          { name: 'FMDV-O', kind: 'naked', hp: 280, speed: 52, reward: 13, color: '#f59e0b', count: 3, spacing: 0.85 },
          { name: 'FINAL BOSS: ASFV', kind: 'intracellular', hp: 1350, speed: 28, reward: 110, color: '#ef4444', count: 1, spacing: 1.4, isBoss: true, isFinalBoss: true }
        ])
      }
    ]
  },
  {
    id: 'cns',
    shortTab: '3. สมอง CNS',
    name: 'Stage 3: CNS Barrier',
    nameTh: 'ปราการระบบประสาท (10 Waves • บอสเวฟ 5 & 10)',
    organLabel: 'CNS',
    expReward: 120,
    startAtp: 135,
    starterPadIdx: 1,
    desktopMap: {
      path: [
        { x: 24, y: 200 },
        { x: 155, y: 200 },
        { x: 155, y: 85 },
        { x: 355, y: 85 },
        { x: 355, y: 315 },
        { x: 555, y: 315 },
        { x: 555, y: 110 },
        { x: 705, y: 110 }
      ],
      pads: [
        { x: 88, y: 115 },
        { x: 245, y: 185 },
        { x: 275, y: 285 },
        { x: 425, y: 205 },
        { x: 492, y: 205 },
        { x: 455, y: 105 },
        { x: 630, y: 200 },
        { x: 630, y: 295 }
      ]
    },
    mobileMap: {
      path: [
        { x: 190, y: 28 },
        { x: 190, y: 90 },
        { x: 60, y: 90 },
        { x: 60, y: 214 },
        { x: 320, y: 214 },
        { x: 320, y: 336 },
        { x: 190, y: 336 },
        { x: 190, y: 440 }
      ],
      pads: [
        { x: 275, y: 90 },
        { x: 132, y: 152 },
        { x: 228, y: 152 },
        { x: 96, y: 275 },
        { x: 176, y: 275 },
        { x: 256, y: 275 },
        { x: 116, y: 398 },
        { x: 264, y: 398 }
      ]
    },
    waves: [
      {
        hint: 'Wave 1/10: Rabies Virus (ทรงกระสุนปืน วิ่งไว!) สลับกับ PCV2 (Naked Circovirus)',
        enemies: buildPack([
          { name: 'Rabies', kind: 'enveloped', hp: 105, speed: 60, reward: 11, color: '#f43f5e', count: 3, spacing: 1.0 },
          { name: 'PCV2', kind: 'naked', hp: 145, speed: 40, reward: 12, color: '#38bdf8', count: 2, spacing: 1.2 }
        ])
      },
      {
        hint: 'Wave 2/10: JEV ไข้สมองอักเสบญี่ปุ่น (Enveloped Flavivirus) + FMDV (Naked)',
        enemies: buildPack([
          { name: 'JEV', kind: 'enveloped', hp: 130, speed: 54, reward: 11, color: '#fbbf24', count: 3, spacing: 0.95 },
          { name: 'FMDV', kind: 'naked', hp: 160, speed: 48, reward: 12, color: '#f59e0b', count: 3, spacing: 1.0 }
        ])
      },
      {
        hint: 'Wave 3/10: CDV สายพันธุ์ขึ้นสมอง (Enveloped) + IBDV กัมโบโร (Naked Birnavirus)',
        enemies: buildPack([
          { name: 'CDV-Neuro', kind: 'enveloped', hp: 155, speed: 56, reward: 11, color: '#fb7185', count: 3, spacing: 0.9 },
          { name: 'IBDV', kind: 'naked', hp: 185, speed: 44, reward: 13, color: '#38bdf8', count: 3, spacing: 1.0 }
        ])
      },
      {
        hint: 'Wave 4/10: SuHV-1 โรคพิษสุนัขบ้าเทียม (แฝงปมประสาท Trigeminal) + Rabies วิ่งด่วน!',
        enemies: buildPack([
          { name: 'SuHV-1', kind: 'intracellular', hp: 225, speed: 42, reward: 14, color: '#c084fc', count: 3, spacing: 1.05 },
          { name: 'Rabies', kind: 'enveloped', hp: 160, speed: 64, reward: 12, color: '#f43f5e', count: 3, spacing: 0.85 }
        ])
      },
      {
        isBossWave: true,
        bossTier: 'mid',
        hint: 'MID-BOSS WAVE 5/10: บอส SuHV-1 Alpha (Aujeszky Neuro-Boss แฝงเซลล์ประสาท) — ใช้ CD8+ T-Cell ยิง!',
        enemies: buildPack([
          { name: 'Rabies', kind: 'enveloped', hp: 175, speed: 64, reward: 12, color: '#f43f5e', count: 3, spacing: 0.8 },
          { name: 'BOSS: SuHV-1', kind: 'intracellular', hp: 820, speed: 33, reward: 55, color: '#a855f7', count: 1, spacing: 1.5, isBoss: true },
          { name: 'PCV2', kind: 'naked', hp: 215, speed: 43, reward: 13, color: '#38bdf8', count: 3, spacing: 0.95 }
        ])
      },
      {
        hint: 'Wave 6/10: West Nile Virus (WNV) + Teschovirus อัมพาตสุกร (Naked Picornavirus!)',
        enemies: buildPack([
          { name: 'WNV', kind: 'enveloped', hp: 210, speed: 56, reward: 12, color: '#fbbf24', count: 4, spacing: 0.85 },
          { name: 'Teschovirus', kind: 'naked', hp: 240, speed: 48, reward: 13, color: '#22d3ee', count: 3, spacing: 0.95 }
        ])
      },
      {
        hint: 'Wave 7/10: Retroviridae บุก! FeLV & FIV แทรกจีโนมในเซลล์ (ต้องใช้ CD8+ T-Cell กำจัด)',
        enemies: buildPack([
          { name: 'FeLV', kind: 'intracellular', hp: 280, speed: 44, reward: 14, color: '#e879f9', count: 3, spacing: 0.95 },
          { name: 'FIV', kind: 'intracellular', hp: 295, speed: 42, reward: 15, color: '#c084fc', count: 3, spacing: 1.0 }
        ])
      },
      {
        hint: 'Wave 8/10: Lentivirus (EIAV) ผสานทัพ Naked Capsid (IBDV + PCV2) สุดอึด!',
        enemies: buildPack([
          { name: 'EIAV', kind: 'intracellular', hp: 315, speed: 45, reward: 15, color: '#a855f7', count: 3, spacing: 0.95 },
          { name: 'IBDV', kind: 'naked', hp: 290, speed: 48, reward: 13, color: '#38bdf8', count: 4, spacing: 0.85 }
        ])
      },
      {
        hint: 'Wave 9/10: พายุไวรัสพิษสุนัขบ้า Rabies ความเร็วสูง + Teschovirus — เตรียมรับบอสคู่ Wave 10!',
        enemies: buildPack([
          { name: 'Rabies-Fury', kind: 'enveloped', hp: 255, speed: 68, reward: 13, color: '#f43f5e', count: 5, spacing: 0.72 },
          { name: 'Teschovirus', kind: 'naked', hp: 310, speed: 50, reward: 14, color: '#22d3ee', count: 3, spacing: 0.85 }
        ])
      },
      {
        isBossWave: true,
        bossTier: 'final',
        hint: 'FINAL BOSS WAVE 10/10: มหาศึกบอสคู่ TITAN RABIES (วิ่งไว) + TITAN FIPV/ASFV บุกสมอง CNS!',
        enemies: buildPack([
          { name: 'PCV2', kind: 'naked', hp: 310, speed: 46, reward: 14, color: '#38bdf8', count: 3, spacing: 0.8 },
          { name: 'BOSS: RABIES TITAN', kind: 'enveloped', hp: 980, speed: 42, reward: 65, color: '#f43f5e', count: 1, spacing: 1.6, isBoss: true },
          { name: 'SuHV-1', kind: 'intracellular', hp: 340, speed: 45, reward: 15, color: '#c084fc', count: 2, spacing: 0.9 },
          { name: 'FINAL BOSS: NEURO-FIPV', kind: 'intracellular', hp: 1550, speed: 29, reward: 120, color: '#d946ef', count: 1, spacing: 1.4, isBoss: true, isFinalBoss: true }
        ])
      }
    ]
  }
];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ── Custom Crisp Vector Icons on Canvas (Works on 100% of Mobile/Desktop OSes) ──
function drawTowerVector(
  ctx: CanvasRenderingContext2D,
  type: TowerKey,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'alcohol') {
    ctx.beginPath();
    ctx.moveTo(-3, -8);
    ctx.lineTo(3, -8);
    ctx.moveTo(-2, -8);
    ctx.lineTo(-2, -3);
    ctx.lineTo(-8, 7);
    ctx.lineTo(8, 7);
    ctx.lineTo(2, -3);
    ctx.lineTo(2, -8);
    ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.moveTo(-5.5, 2.5);
    ctx.lineTo(5.5, 2.5);
    ctx.lineTo(7.5, 6.5);
    ctx.lineTo(-7.5, 6.5);
    ctx.closePath();
    ctx.fill();
  } else if (type === 'bleach') {
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.bezierCurveTo(7, -1, 7, 4, 0, 8);
    ctx.bezierCurveTo(-7, 4, -7, -1, 0, -9);
    ctx.globalAlpha = 0.28;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-2.5, 2);
    ctx.lineTo(2.5, 2);
    ctx.moveTo(0, -0.5);
    ctx.lineTo(0, 4.5);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  } else if (type === 'bcell') {
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.lineTo(0, 0);
    ctx.lineTo(-7, -7);
    ctx.moveTo(0, 0);
    ctx.lineTo(7, -7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, -8);
    ctx.lineTo(-8, -4);
    ctx.moveTo(4, -8);
    ctx.lineTo(8, -4);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#a7f3d0';
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, 0);
    ctx.lineTo(9, 0);
    ctx.moveTo(0, -9);
    ctx.lineTo(0, 9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f5d0fe';
    ctx.fill();
  }
  ctx.restore();
}

function drawOrganVector(
  ctx: CanvasRenderingContext2D,
  stageId: 'crypts' | 'alveoli' | 'cns',
  x: number,
  y: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#5eead4';
  ctx.fillStyle = 'rgba(45, 212, 191, 0.35)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stageId === 'crypts') {
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-11, 1, -10, -8, -4, -8);
    ctx.bezierCurveTo(-1, -8, 0, -5, 0, -4);
    ctx.bezierCurveTo(0, -5, 1, -8, 4, -8);
    ctx.bezierCurveTo(10, -8, 11, 1, 0, 8);
    ctx.fill();
    ctx.stroke();
  } else if (stageId === 'alveoli') {
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(0, -2);
    ctx.moveTo(0, -3);
    ctx.lineTo(-4, 1);
    ctx.moveTo(0, -3);
    ctx.lineTo(4, 1);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-5.5, 2, 4, 6.5, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(5.5, 2, 4, 6.5, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5);
      ctx.lineTo(Math.cos(a) * 11, Math.sin(a) * 11);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function TowerLucideIcon({ type, className = 'w-4 h-4' }: { type: TowerKey; className?: string }) {
  switch (type) {
    case 'alcohol':
      return <FlaskConical className={`${className} text-cyan-400`} />;
    case 'bleach':
      return <Droplets className={`${className} text-amber-400`} />;
    case 'bcell':
      return <Shield className={`${className} text-emerald-400`} />;
    case 'tcell':
      return <Swords className={`${className} text-purple-400`} />;
  }
}

function StageLucideIcon({ id, className = 'w-4 h-4' }: { id: StageConfig['id']; className?: string }) {
  switch (id) {
    case 'crypts':
      return <HeartPulse className={`${className} text-rose-400`} />;
    case 'alveoli':
      return <Wind className={`${className} text-sky-400`} />;
    case 'cns':
      return <Brain className={`${className} text-purple-400`} />;
  }
}

interface ActiveTower {
  type: TowerKey;
  level: number;
  cooldown: number;
  pulse: number;
}

interface ActiveEnemy extends EnemySpawn {
  id: number;
  maxHp: number;
  segIndex: number;
  segT: number;
  x: number;
  y: number;
  slowTimer: number;
}

interface Projectile {
  x: number;
  y: number;
  target: ActiveEnemy;
  type: TowerKey;
  dmg: number;
  color: string;
  speed: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface SplashRing {
  x: number;
  y: number;
  r: number;
  color: string;
  life: number;
}

export default function BioDefenseTDPage() {
  const { user, appUser } = useAuth();
  const myUid = appUser?.uid || user?.uid || '';

  // ── Responsive Portrait (< 768px) vs Landscape (>= 768px) Detector ────────
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setIsMobileView(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // ── Pet Guardian Synergy (0 Firestore Reads — computed from AuthContext) ──
  const petStats = useMemo(
    () => getEffectivePetStats(appUser?.pet?.stats, appUser?.exp || 0),
    [appUser?.pet?.stats, appUser?.exp]
  );
  const petAtkMultiplier = useMemo(
    () => 1 + Math.min(0.2, Math.max(0.05, petStats.str * 0.01)),
    [petStats.str]
  );
  const petBonusPercent = Math.round((petAtkMultiplier - 1) * 100);
  const petDisplayName = appUser?.pet?.nickname || appUser?.pet?.virusName || 'Phage Guardian';

  // ── Daily EXP Cap (0 extra Firestore Reads on load — derived from appUser) ──
  const capLimit = DAILY_EXP_CAPS['bio-defense'] || 240;
  const todayStr = getTodayDateString();
  const initialEarnedToday = useMemo(() => {
    const rec = (appUser as any)?.dailyGameExp;
    if (rec && rec.date === todayStr) {
      return Number(rec['bio-defense']) || 0;
    }
    return 0;
  }, [appUser, todayStr]);

  const [earnedTodayState, setEarnedTodayState] = useState<number | null>(null);
  const earnedToday = earnedTodayState !== null ? earnedTodayState : initialEarnedToday;
  const isCapped = earnedToday >= capLimit;

  // ── Stage & Gameplay UI States ────────────────────────────────────────────
  const [stageIdx, setStageIdx] = useState(0);
  const stage = STAGES[stageIdx];
  const activeMap = isMobileView ? stage.mobileMap : stage.desktopMap;
  const logicalW = isMobileView ? MOBILE_W : DESKTOP_W;
  const logicalH = isMobileView ? MOBILE_H : DESKTOP_H;

  const [hp, setHp] = useState(10);
  const [atp, setAtp] = useState(stage.startAtp);
  const [score, setScore] = useState(0);
  const [waveIdx, setWaveIdx] = useState(0);
  const [waveActive, setWaveActive] = useState(false);
  const [gameSpeed, setGameSpeed] = useState<1 | 2 | 3>(1);
  const [soundOn, setSoundOn] = useState(true);
  const [selectedBuildType, setSelectedBuildType] = useState<TowerKey>('alcohol');
  const [inspectedPadIdx, setInspectedPadIdx] = useState<number | null>(null);
  const [intelMessage, setIntelMessage] = useState(stage.waves[0].hint);
  const [towerSnapshot, setTowerSnapshot] = useState<(ActiveTower | null)[]>([]);

  // Quiz Boost State (Client-side shuffled 15-chapter bank -> 0 Firestore reads!)
  const [quizBank] = useState<MasterQuestion[]>(() =>
    shuffleArray(ALL_15_CHAPTER_QUESTIONS).map((q) => ({
      ...q,
      choices: shuffleArray(q.choices)
    }))
  );
  const [quizCursor, setQuizCursor] = useState(0);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizCharges, setQuizCharges] = useState(2);
  const [selectedQuizAns, setSelectedQuizAns] = useState<string | null>(null);

  const [endResult, setEndResult] = useState<{ won: boolean; awardedExp: number | null; saving: boolean } | null>(null);
  const hasSavedRef = useRef(false);

  // ── Quota-Conserving Milestone Live Tracking (Only 3 Phase Buckets across 10 Waves!) ──
  const wavePhaseBucket = waveIdx >= 9 ? 'final10' : waveIdx >= 4 ? 'mid5to9' : 'early1to4';
  const liveProgressText = useMemo(() => {
    if (endResult) {
      return endResult.won ? `พิชิต 10 Waves ${stage.name}!` : `พ่ายแพ้ ${stage.name}`;
    }
    if (wavePhaseBucket === 'final10') return `${stage.name} | ศึกไฟนอลบอส Wave 10/10`;
    if (wavePhaseBucket === 'mid5to9') return `${stage.name} | ช่วงครึ่งหลัง (Wave 5-9/10)`;
    return `${stage.name} | ช่วงต้นเกม (Wave 1-4/10)`;
  }, [endResult, stage.name, wavePhaseBucket]);

  useLiveTracking('bio-defense', liveProgressText);

  // ── Simulation Refs ───────────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const towersRef = useRef<(ActiveTower | null)[]>([]);
  const enemiesRef = useRef<ActiveEnemy[]>([]);
  const spawnQueueRef = useRef<EnemySpawn[]>([]);
  const spawnTimerRef = useRef(0);
  const projectilesRef = useRef<Projectile[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const splashesRef = useRef<SplashRing[]>([]);
  const animTimeRef = useRef(0);
  const enemyIdCounterRef = useRef(1);
  const lastShotSfxRef = useRef(0);

  const stateRef = useRef({
    hp,
    atp,
    score,
    waveIdx,
    waveActive,
    gameSpeed,
    soundOn,
    quizOpen,
    endOpen: !!endResult,
    inspectedPadIdx,
    stage,
    isMobileView,
    activeMap,
    logicalW,
    logicalH,
    petAtkMultiplier
  });

  useEffect(() => {
    stateRef.current = {
      hp,
      atp,
      score,
      waveIdx,
      waveActive,
      gameSpeed,
      soundOn,
      quizOpen,
      endOpen: !!endResult,
      inspectedPadIdx,
      stage,
      isMobileView,
      activeMap,
      logicalW,
      logicalH,
      petAtkMultiplier
    };
  }, [
    hp,
    atp,
    score,
    waveIdx,
    waveActive,
    gameSpeed,
    soundOn,
    quizOpen,
    endResult,
    inspectedPadIdx,
    stage,
    isMobileView,
    activeMap,
    logicalW,
    logicalH,
    petAtkMultiplier
  ]);

  const initStage = useCallback((targetStageIdx: number) => {
    const st = STAGES[targetStageIdx];
    const initialTowers: (ActiveTower | null)[] = st.desktopMap.pads.map((_, idx) =>
      idx === st.starterPadIdx
        ? { type: 'alcohol', level: 1, cooldown: 0, pulse: 0 }
        : null
    );
    towersRef.current = initialTowers;
    setTowerSnapshot([...initialTowers]);
    enemiesRef.current = [];
    spawnQueueRef.current = [];
    spawnTimerRef.current = 0;
    projectilesRef.current = [];
    floatingTextsRef.current = [];
    splashesRef.current = [];

    setHp(10);
    setAtp(st.startAtp);
    setScore(0);
    setWaveIdx(0);
    setWaveActive(false);
    setInspectedPadIdx(null);
    setQuizCharges(2);
    setQuizOpen(false);
    setSelectedQuizAns(null);
    setEndResult(null);
    setIntelMessage(st.waves[0].hint);
    hasSavedRef.current = false;
  }, []);

  useEffect(() => {
    initStage(stageIdx);
  }, [stageIdx, initStage]);

  // ── Single End-of-Game Firestore Reward Handler ───────────────────────────
  const finalizeGame = useCallback(
    async (won: boolean, finalScore: number, remainingHp: number) => {
      if (hasSavedRef.current) return;
      hasSavedRef.current = true;

      if (stateRef.current.soundOn) {
        if (won) sfx.victory();
        else sfx.defeat();
      }

      const st = stateRef.current.stage;
      const reachedWave = stateRef.current.waveIdx; // 0-indexed: >= 5 means Wave 5 Mid-Boss defeated!
      const intendedExp = won
        ? st.expReward
        : reachedWave >= 5
        ? Math.round(st.expReward * 0.45)
        : reachedWave >= 2
        ? Math.round(st.expReward * 0.15)
        : 0;

      if (!myUid || (finalScore <= 0 && intendedExp <= 0)) {
        setEndResult({ won, awardedExp: 0, saving: false });
        return;
      }

      setEndResult({ won, awardedExp: null, saving: true });
      try {
        const totalScoreBonus = finalScore + (won ? remainingHp * 35 : 0);
        const res = await awardDailyCappedExp(
          myUid,
          'bio-defense',
          `Bio-Defense TD (${st.name})`,
          totalScoreBonus,
          intendedExp
        );
        setEarnedTodayState((prev) => (prev !== null ? prev : initialEarnedToday) + res.awardedExp);
        setEndResult({ won, awardedExp: res.awardedExp, saving: false });
      } catch (err) {
        console.error('Failed to save Bio-Defense TD reward:', err);
        setEndResult({ won, awardedExp: 0, saving: false });
      }
    },
    [myUid, initialEarnedToday]
  );

  const handleStartWave = () => {
    if (waveActive || endResult || waveIdx >= stage.waves.length) return;
    if (soundOn) sfx.click();
    const w = stage.waves[waveIdx];
    spawnQueueRef.current = w.enemies.map((e) => ({ ...e }));
    spawnTimerRef.current = 0;
    setWaveActive(true);
    setIntelMessage(w.hint);
    setInspectedPadIdx(null);
  };

  const cycleSpeed = () => {
    setGameSpeed((s) => (s === 1 ? 2 : s === 2 ? 3 : 1));
  };

  // ── Touch-Friendly Hit-Testing on Build Pads ──────────────────────────────
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (endResult || quizOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * logicalW;
    const my = ((e.clientY - rect.top) / rect.height) * logicalH;

    const hitRadius = isMobileView ? 30 : 27;

    for (let i = 0; i < activeMap.pads.length; i++) {
      const pad = activeMap.pads[i];
      if (Math.hypot(mx - pad.x, my - pad.y) <= hitRadius) {
        const existing = towersRef.current[i];
        if (existing) {
          if (soundOn) sfx.click();
          setInspectedPadIdx(i);
        } else {
          const def = TOWER_DEFS[selectedBuildType];
          if (atp >= def.cost) {
            if (soundOn) sfx.click();
            setAtp((prev) => prev - def.cost);
            towersRef.current[i] = {
              type: selectedBuildType,
              level: 1,
              cooldown: 0,
              pulse: 1
            };
            setTowerSnapshot([...towersRef.current]);
            floatingTextsRef.current.push({
              x: Math.min(logicalW - 60, Math.max(60, pad.x)),
              y: pad.y - 24,
              text: `สร้าง ${def.shortName}!`,
              color: def.color,
              life: 1.0
            });
            setInspectedPadIdx(null);
          } else {
            if (soundOn) sfx.wrong();
            floatingTextsRef.current.push({
              x: logicalW / 2,
              y: Math.max(40, pad.y - 24),
              text: 'ATP ไม่พอ! กดคำถาม +60 ATP ด้านบน',
              color: '#fb7185',
              life: 1.3
            });
          }
        }
        return;
      }
    }
    setInspectedPadIdx(null);
  };

  const handleUpgradeTower = () => {
    if (inspectedPadIdx === null) return;
    const t = towersRef.current[inspectedPadIdx];
    const pad = activeMap.pads[inspectedPadIdx];
    if (!t || t.level >= MAX_TOWER_LEVEL) return;
    const def = TOWER_DEFS[t.type];
    const upgCost = Math.round(def.cost * 0.8 * t.level);
    if (atp < upgCost) {
      if (soundOn) sfx.wrong();
      floatingTextsRef.current.push({
        x: pad.x,
        y: pad.y - 24,
        text: 'ATP ไม่พออัปเกรด!',
        color: '#fb7185',
        life: 1.1
      });
      return;
    }
    if (soundOn) sfx.levelUp();
    setAtp((prev) => prev - upgCost);
    t.level += 1;
    t.pulse = 1;
    setTowerSnapshot([...towersRef.current]);
    floatingTextsRef.current.push({
      x: pad.x,
      y: pad.y - 26,
      text: `Lv.${t.level} UP!`,
      color: def.color,
      life: 1.1
    });
  };

  const handleSellTower = () => {
    if (inspectedPadIdx === null) return;
    const t = towersRef.current[inspectedPadIdx];
    const pad = activeMap.pads[inspectedPadIdx];
    if (!t) return;
    const def = TOWER_DEFS[t.type];
    const refund = Math.round(def.cost * 0.6 * t.level);
    if (soundOn) sfx.click();
    setAtp((prev) => prev + refund);
    towersRef.current[inspectedPadIdx] = null;
    setTowerSnapshot([...towersRef.current]);
    setInspectedPadIdx(null);
    floatingTextsRef.current.push({
      x: pad.x,
      y: pad.y - 22,
      text: `+${refund} ATP`,
      color: '#fbbf24',
      life: 1.0
    });
  };

  // ── Virology Quiz Boost ───────────────────────────────────────────────────
  const handleOpenQuiz = () => {
    if (quizCharges <= 0 || endResult) return;
    if (soundOn) sfx.click();
    setSelectedQuizAns(null);
    setQuizOpen(true);
  };

  const currentQuizItem = quizBank[quizCursor % quizBank.length];

  const handleSelectQuizChoice = (choice: string) => {
    if (selectedQuizAns !== null) return;
    setSelectedQuizAns(choice);
    setQuizCharges((prev) => Math.max(0, prev - 1));

    const isCorrect = choice === currentQuizItem.answer;
    if (isCorrect) {
      if (soundOn) sfx.correct();
      setAtp((prev) => prev + 60);
      setScore((prev) => prev + 30);
      floatingTextsRef.current.push({
        x: logicalW / 2,
        y: logicalH / 2 - 20,
        text: '+60 ATP สังเคราะห์สำเร็จ!',
        color: '#10b981',
        life: 1.5
      });
    } else {
      if (soundOn) sfx.wrong();
    }
  };

  const handleCloseQuiz = () => {
    if (selectedQuizAns !== null) {
      setQuizCursor((prev) => prev + 1);
    }
    setSelectedQuizAns(null);
    setQuizOpen(false);
  };

  // ── Main 60 FPS Simulation & Adaptive Canvas Renderer ─────────────────────
  useEffect(() => {
    let rafId = 0;
    let lastTs = performance.now();

    const applyHit = (proj: Projectile, target: ActiveEnemy, wLimit: number) => {
      const def = TOWER_DEFS[proj.type];
      let mult = 1.0;
      let tag = '';

      if (proj.type === 'alcohol') {
        if (target.kind === 'naked') {
          mult = 0;
          tag = 'IMMUNE! (Naked)';
        } else if (target.kind === 'enveloped') {
          mult = 2.5;
          tag = 'LIPID LYSIS x2.5!';
        } else {
          mult = 0.75;
        }
      } else if (proj.type === 'bleach') {
        if (target.kind === 'naked') {
          mult = 1.45;
          tag = 'CAPSID OXIDIZED!';
        }
      } else if (proj.type === 'bcell') {
        target.slowTimer = target.isBoss ? 1.5 : 2.4;
      } else if (proj.type === 'tcell') {
        if (target.kind === 'intracellular') {
          mult = 2.2;
          tag = 'CYTOTOXIC x2.2!';
        } else {
          mult = 1.3;
        }
      }

      const finalDmg = Math.round(proj.dmg * mult);
      const clampedX = Math.min(wLimit - 68, Math.max(68, target.x));

      if (finalDmg === 0) {
        floatingTextsRef.current.push({
          x: clampedX,
          y: target.y - 18,
          text: tag,
          color: '#f59e0b',
          life: 1.05
        });
        return;
      }

      target.hp -= finalDmg;
      floatingTextsRef.current.push({
        x: clampedX,
        y: target.y - 16,
        text: tag ? `${tag} -${finalDmg}` : `-${finalDmg}`,
        color: def.color,
        life: tag ? 0.9 : 0.6
      });

      if (def.splash) {
        splashesRef.current.push({
          x: target.x,
          y: target.y,
          r: 8,
          color: def.color,
          life: 0.28
        });
        for (const other of enemiesRef.current) {
          if (
            other !== target &&
            other.hp > 0 &&
            Math.hypot(other.x - target.x, other.y - target.y) <= def.splash
          ) {
            other.hp -= Math.round(finalDmg * 0.55);
          }
        }
      }
    };

    const tick = (now: number) => {
      const rawDt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      const st = stateRef.current;
      animTimeRef.current += rawDt;

      const path = st.activeMap.path;
      const pads = st.activeMap.pads;
      const rangeScale = st.isMobileView ? 0.88 : 1.0;
      const speedScale = st.isMobileView ? 0.88 : 1.0;

      for (const e of enemiesRef.current) {
        const pA = path[e.segIndex] || path[0];
        const pB = path[Math.min(path.length - 1, e.segIndex + 1)] || pA;
        e.x = pA.x + (pB.x - pA.x) * e.segT;
        e.y = pA.y + (pB.y - pA.y) * e.segT;
      }

      if (!st.quizOpen && !st.endOpen) {
        const step = rawDt * st.gameSpeed;

        // 1. Spawn Queue
        if (st.waveActive && spawnQueueRef.current.length > 0) {
          spawnTimerRef.current += step;
          while (
            spawnQueueRef.current.length > 0 &&
            spawnTimerRef.current >= spawnQueueRef.current[0].delay
          ) {
            const tpl = spawnQueueRef.current.shift()!;
            enemiesRef.current.push({
              ...tpl,
              id: enemyIdCounterRef.current++,
              maxHp: tpl.hp,
              segIndex: 0,
              segT: 0,
              x: path[0].x,
              y: path[0].y,
              slowTimer: 0
            });
          }
        }

        // 2. Move Enemies
        let currentHpLocal = st.hp;
        let gainedAtp = 0;
        let gainedScore = 0;

        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const e = enemiesRef.current[i];
          if (e.hp <= 0) {
            gainedAtp += e.reward;
            gainedScore += e.isFinalBoss ? 250 : e.isBoss ? 140 : 20;
            floatingTextsRef.current.push({
              x: Math.min(st.logicalW - 45, Math.max(45, e.x)),
              y: e.y,
              text: `+${e.reward} ATP`,
              color: '#fbbf24',
              life: 0.85
            });
            enemiesRef.current.splice(i, 1);
            continue;
          }

          if (e.slowTimer > 0) e.slowTimer -= step;
          let remDist = e.speed * speedScale * (e.slowTimer > 0 ? 0.55 : 1) * step;

          let reachedOrgan = false;
          while (remDist > 0 && e.segIndex < path.length - 1) {
            const pA = path[e.segIndex];
            const pB = path[e.segIndex + 1];
            const segLen = Math.max(1, Math.hypot(pB.x - pA.x, pB.y - pA.y));
            const distLeftInSeg = (1 - e.segT) * segLen;

            if (remDist >= distLeftInSeg) {
              remDist -= distLeftInSeg;
              e.segIndex += 1;
              e.segT = 0;
              if (e.segIndex >= path.length - 1) {
                reachedOrgan = true;
                break;
              }
            } else {
              e.segT += remDist / segLen;
              remDist = 0;
            }
          }

          if (reachedOrgan) {
            const hpLoss = e.isFinalBoss ? 5 : e.isBoss ? 3 : 1;
            currentHpLocal = Math.max(0, currentHpLocal - hpLoss);
            if (st.soundOn) sfx.damage();
            const goalPt = path[path.length - 1];
            floatingTextsRef.current.push({
              x: Math.min(st.logicalW - 65, Math.max(65, goalPt.x)),
              y: goalPt.y - 28,
              text: `-${hpLoss} HP ติดเชื้อ!`,
              color: '#ef4444',
              life: 1.2
            });
            enemiesRef.current.splice(i, 1);
          } else {
            const pA = path[e.segIndex];
            const pB = path[e.segIndex + 1];
            e.x = pA.x + (pB.x - pA.x) * e.segT;
            e.y = pA.y + (pB.y - pA.y) * e.segT;
          }
        }

        if (gainedAtp > 0) setAtp((prev) => prev + gainedAtp);
        if (gainedScore > 0) setScore((prev) => prev + gainedScore);
        if (currentHpLocal !== st.hp) {
          setHp(currentHpLocal);
          if (currentHpLocal <= 0) {
            setWaveActive(false);
            finalizeGame(false, st.score + gainedScore, 0);
          }
        }

        // 3. Wave Completion Check
        if (
          currentHpLocal > 0 &&
          st.waveActive &&
          spawnQueueRef.current.length === 0 &&
          enemiesRef.current.length === 0
        ) {
          const clearedWaveNum = st.waveIdx + 1;
          const nextW = st.waveIdx + 1;
          setWaveActive(false);

          if (nextW >= st.stage.waves.length) {
            finalizeGame(true, st.score + gainedScore + 200, currentHpLocal);
          } else {
            if (st.soundOn) {
              if (clearedWaveNum === 5) sfx.levelUp();
              else sfx.correct();
            }
            const waveBonusAtp = clearedWaveNum === 5 ? 50 : 22;
            const nextIsBoss = st.stage.waves[nextW].isBossWave;
            setWaveIdx(nextW);
            setAtp((prev) => prev + waveBonusAtp);
            setQuizCharges((prev) => (nextIsBoss ? 2 : Math.min(2, prev + 1)));
            setIntelMessage(
              clearedWaveNum === 5
                ? `ปราบบอส Wave 5 สำเร็จ! (+${waveBonusAtp} ATP) • ถัดไป: ${st.stage.waves[nextW].hint}`
                : `ผ่าน Wave ${clearedWaveNum}/10 (+${waveBonusAtp} ATP) • ${st.stage.waves[nextW].hint}`
            );
          }
        }

        // 4. Towers Firing
        pads.forEach((pad, idx) => {
          const t = towersRef.current[idx];
          if (!t) return;
          const def = TOWER_DEFS[t.type];
          if (t.cooldown > 0) t.cooldown -= step;
          if (t.pulse > 0) t.pulse = Math.max(0, t.pulse - step * 3);

          if (t.cooldown <= 0 && enemiesRef.current.length > 0) {
            const effRange = (def.range + (t.level - 1) * 11) * rangeScale;
            let best: ActiveEnemy | null = null;
            let bestPriority = -Infinity;

            for (const e of enemiesRef.current) {
              const d = Math.hypot(e.x - pad.x, e.y - pad.y);
              if (d <= effRange) {
                let prio = (e.segIndex + e.segT) * 1000;
                if (t.type === 'alcohol' && e.kind === 'enveloped') prio += 5000;
                if (t.type === 'alcohol' && e.kind === 'naked') prio -= 5000;
                if (t.type === 'bleach' && e.kind === 'naked') prio += 3000;
                if (t.type === 'tcell' && (e.kind === 'intracellular' || e.isBoss)) prio += 5000;
                if (prio > bestPriority) {
                  bestPriority = prio;
                  best = e;
                }
              }
            }

            if (best) {
              t.cooldown = def.fireRate / (1 + (t.level - 1) * 0.15);
              t.pulse = 1;
              if (st.soundOn && now - lastShotSfxRef.current > 240) {
                sfx.attack();
                lastShotSfxRef.current = now;
              }
              const effDmg = Math.round(
                def.dmg * (1 + (t.level - 1) * 0.42) * st.petAtkMultiplier
              );
              projectilesRef.current.push({
                x: pad.x,
                y: pad.y,
                target: best,
                type: t.type,
                dmg: effDmg,
                color: def.color,
                speed: 370 * speedScale
              });
            }
          }
        });

        // 5. Projectiles
        for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
          const p = projectilesRef.current[i];
          if (!p.target || p.target.hp <= 0) {
            projectilesRef.current.splice(i, 1);
            continue;
          }
          const dx = p.target.x - p.x;
          const dy = p.target.y - p.y;
          const dist = Math.hypot(dx, dy);
          const move = p.speed * step;
          if (dist <= move + 9) {
            applyHit(p, p.target, st.logicalW);
            projectilesRef.current.splice(i, 1);
          } else {
            p.x += (dx / dist) * move;
            p.y += (dy / dist) * move;
          }
        }
      }

      // 6. Particles & Floating Combat Text
      for (let i = splashesRef.current.length - 1; i >= 0; i--) {
        splashesRef.current[i].life -= rawDt;
        splashesRef.current[i].r += rawDt * 120;
        if (splashesRef.current[i].life <= 0) splashesRef.current.splice(i, 1);
      }
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        floatingTextsRef.current[i].life -= rawDt;
        floatingTextsRef.current[i].y -= rawDt * 24;
        if (floatingTextsRef.current[i].life <= 0) floatingTextsRef.current.splice(i, 1);
      }

      // 7. Render Adaptive Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const rect = canvas.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          const targetW = Math.max(1, Math.round(rect.width * dpr));
          const targetH = Math.max(1, Math.round(rect.height * dpr));
          if (canvas.width !== targetW || canvas.height !== targetH) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          ctx.save();
          ctx.scale(canvas.width / st.logicalW, canvas.height / st.logicalH);

          const isBossWaveNow = !!st.stage.waves[st.waveIdx]?.isBossWave;
          ctx.fillStyle = isBossWaveNow ? '#0d0718' : '#070d19';
          ctx.fillRect(0, 0, st.logicalW, st.logicalH);

          // Bio Grid
          ctx.strokeStyle = isBossWaveNow
            ? 'rgba(244, 63, 94, 0.08)'
            : 'rgba(34, 211, 238, 0.065)';
          ctx.lineWidth = 1;
          const gridStep = st.isMobileView ? 32 : 38;
          for (let x = 0; x < st.logicalW; x += gridStep) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, st.logicalH);
            ctx.stroke();
          }
          for (let y = 0; y < st.logicalH; y += gridStep) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(st.logicalW, y);
            ctx.stroke();
          }

          // Vascular / Mucosal Pathway
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          path.forEach((pt, idx) => (idx === 0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y)));
          ctx.lineWidth = st.isMobileView ? 30 : 34;
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.18)';
          ctx.stroke();

          ctx.lineWidth = 2;
          ctx.setLineDash([8, 8]);
          ctx.lineDashOffset = -animTimeRef.current * 30;
          ctx.strokeStyle = 'rgba(251, 113, 133, 0.5)';
          ctx.stroke();
          ctx.setLineDash([]);

          // Spawn Portal Node
          const spawn = path[0];
          ctx.beginPath();
          ctx.arc(spawn.x, spawn.y, 13, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = '#fb7185';
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(spawn.x, spawn.y, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#fda4af';
          ctx.fill();

          ctx.font = 'bold 12px sans-serif';
          ctx.fillStyle = '#fda4af';
          if (st.isMobileView) {
            ctx.textAlign = spawn.x > 250 ? 'right' : spawn.x < 130 ? 'left' : 'center';
            const labelX = spawn.x > 250 ? spawn.x - 18 : spawn.x < 130 ? spawn.x + 18 : spawn.x;
            const labelY = spawn.x >= 130 && spawn.x <= 250 ? spawn.y - 17 : spawn.y + 4;
            ctx.fillText('ทางเข้าเชื้อ', labelX, labelY);
          } else {
            ctx.textAlign = 'left';
            ctx.fillText('ทางเข้าเชื้อ', spawn.x - 10, spawn.y - 20);
          }

          // Target Organ Node
          const goal = path[path.length - 1];
          const organX = st.isMobileView ? goal.x : goal.x + 12;
          const organY = st.isMobileView ? goal.y + 8 : goal.y;

          ctx.beginPath();
          ctx.arc(organX, organY, 22, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#2dd4bf';
          ctx.stroke();

          drawOrganVector(ctx, st.stage.id, organX, organY);

          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#f1f5f9';
          ctx.fillText(
            `${st.stage.organLabel} (${st.hp}/10)`,
            Math.min(st.logicalW - 46, Math.max(46, organX)),
            organY + 35
          );

          // Tactical Build Pads & Towers
          pads.forEach((pad, idx) => {
            const t = towersRef.current[idx];
            const isInspected = st.inspectedPadIdx === idx;
            if (t) {
              const def = TOWER_DEFS[t.type];
              const effRange = (def.range + (t.level - 1) * 11) * rangeScale;
              if (isInspected) {
                ctx.beginPath();
                ctx.arc(pad.x, pad.y, effRange, 0, Math.PI * 2);
                ctx.fillStyle = `${def.color}20`;
                ctx.fill();
                ctx.strokeStyle = def.color;
                ctx.lineWidth = 1.6;
                ctx.stroke();
              }

              const rad = 21 + t.pulse * 3.5;
              ctx.beginPath();
              ctx.arc(pad.x, pad.y, rad, 0, Math.PI * 2);
              ctx.fillStyle = '#0f172a';
              ctx.fill();
              ctx.lineWidth = t.level >= 4 ? 3.2 : 2.5;
              ctx.strokeStyle = def.color;
              ctx.stroke();

              drawTowerVector(ctx, t.type, pad.x, pad.y, def.color);

              ctx.fillStyle = 'rgba(2, 6, 23, 0.9)';
              ctx.fillRect(pad.x - 17, pad.y + 16, 34, 14);
              ctx.font = 'bold 11px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillStyle = t.level >= MAX_TOWER_LEVEL ? '#fbbf24' : def.color;
              ctx.fillText(t.level >= MAX_TOWER_LEVEL ? 'MAX' : `Lv.${t.level}`, pad.x, pad.y + 26.5);
            } else {
              const pulse = 0.55 + Math.sin(animTimeRef.current * 3.2 + idx) * 0.28;
              ctx.beginPath();
              ctx.arc(pad.x, pad.y, 20, 0, Math.PI * 2);
              ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
              ctx.fill();
              ctx.setLineDash([4, 3]);
              ctx.lineWidth = 2;
              ctx.strokeStyle = `rgba(45, 212, 191, ${pulse})`;
              ctx.stroke();
              ctx.setLineDash([]);

              ctx.font = 'bold 18px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillStyle = '#5eead4';
              ctx.fillText('+', pad.x, pad.y + 6);
            }
          });

          // Draw Viruses (with Boss Aura & Vector Crown for Wave 5 & Wave 10 Bosses!)
          for (const e of enemiesRef.current) {
            ctx.save();
            ctx.translate(e.x, e.y);
            const r = e.isFinalBoss ? 20 : e.isBoss ? 17 : 12.5;

            if (e.isBoss) {
              const auraPulse = r + 7 + Math.sin(animTimeRef.current * 6) * 2.5;
              ctx.beginPath();
              ctx.arc(0, 0, auraPulse, 0, Math.PI * 2);
              ctx.strokeStyle = e.isFinalBoss ? '#fbbf24' : '#fb7185';
              ctx.lineWidth = 2;
              ctx.stroke();
            }

            if (e.kind === 'naked') {
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 3) * i + animTimeRef.current * 1.5;
                const px = Math.cos(ang) * r;
                const py = Math.sin(ang) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.fillStyle = e.color;
              ctx.fill();
              ctx.lineWidth = 2.2;
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();
            } else {
              const spikes = e.isBoss ? 10 : 7;
              ctx.strokeStyle = e.color;
              ctx.lineWidth = 2;
              for (let i = 0; i < spikes; i++) {
                const ang = ((Math.PI * 2) / spikes) * i + animTimeRef.current * 1.3;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(Math.cos(ang) * (r + 5.5), Math.sin(ang) * (r + 5.5));
                ctx.stroke();
              }
              ctx.beginPath();
              ctx.arc(0, 0, r, 0, Math.PI * 2);
              ctx.fillStyle = e.color;
              ctx.fill();
              ctx.setLineDash([3, 2]);
              ctx.strokeStyle = e.kind === 'intracellular' ? '#f0abfc' : '#fde047';
              ctx.stroke();
              ctx.setLineDash([]);
            }

            // Vector Boss Crown above Boss HP bar
            if (e.isBoss) {
              ctx.fillStyle = e.isFinalBoss ? '#fbbf24' : '#fda4af';
              ctx.beginPath();
              ctx.moveTo(-7, -r - 16);
              ctx.lineTo(-9, -r - 23);
              ctx.lineTo(-3, -r - 19);
              ctx.lineTo(0, -r - 25);
              ctx.lineTo(3, -r - 19);
              ctx.lineTo(9, -r - 23);
              ctx.lineTo(7, -r - 16);
              ctx.closePath();
              ctx.fill();
            }

            if (e.slowTimer > 0) {
              ctx.beginPath();
              ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 1.6;
              ctx.stroke();
            }

            const barW = e.isFinalBoss ? 52 : e.isBoss ? 44 : 32;
            ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
            ctx.fillRect(-barW / 2, -r - 13, barW, 5.5);
            ctx.fillStyle = e.isBoss ? '#f59e0b' : e.hp / e.maxHp > 0.4 ? '#22c55e' : '#ef4444';
            ctx.fillRect(-barW / 2, -r - 13, barW * Math.max(0, e.hp / e.maxHp), 5.5);

            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = e.isBoss ? '#fde047' : '#ffffff';
            ctx.fillText(e.name, 0, r + 16);
            ctx.restore();
          }

          // Projectiles
          for (const p of projectilesRef.current) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4.8, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
          }

          // Splash Rings
          for (const sp of splashesRef.current) {
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
            ctx.strokeStyle = sp.color;
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // Floating Combat Texts
          for (const ft of floatingTextsRef.current) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, ft.life * 1.4);
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'rgba(2, 6, 23, 0.85)';
            ctx.lineWidth = 3;
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
          }

          ctx.restore();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [finalizeGame]);

  const inspectedTower =
    inspectedPadIdx !== null ? towerSnapshot[inspectedPadIdx] || null : null;
  const inspectedDef = inspectedTower ? TOWER_DEFS[inspectedTower.type] : null;
  const upgradeCost =
    inspectedTower && inspectedDef
      ? Math.round(inspectedDef.cost * 0.8 * inspectedTower.level)
      : 0;
  const sellRefund =
    inspectedTower && inspectedDef
      ? Math.round(inspectedDef.cost * 0.6 * inspectedTower.level)
      : 0;
  const selectedTowerInfo = TOWER_DEFS[selectedBuildType];
  const currentWaveObj = stage.waves[Math.min(waveIdx, stage.waves.length - 1)];

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-1 pb-24 space-y-3 sm:space-y-4">
      {/* ── Compact Responsive Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 sm:pb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/student/play"
            onClick={() => soundOn && sfx.click()}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-teal-400 transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30">
                10 WAVES • BOSS W5 & W10
              </span>
              <span className="hidden sm:inline-flex text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Guardian: {petDisplayName} (+{petBonusPercent}% ATK)
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-black text-white truncate mt-0.5">
              Bio-Defense TD: ป้อมปราการภูมิคุ้มกัน
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="px-2.5 py-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className={isCapped ? 'text-emerald-400 font-bold' : 'text-white font-bold'}>
              {earnedToday}/{capLimit} <span className="hidden sm:inline">EXP</span>
            </span>
          </div>
          <button
            onClick={() => setSoundOn((s) => !s)}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="เปิด/ปิดเสียง"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* ── Compact 3-Column Stage Switcher ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        {STAGES.map((st, idx) => {
          const active = idx === stageIdx;
          return (
            <button
              key={st.id}
              onClick={() => {
                if (soundOn) sfx.click();
                setStageIdx(idx);
              }}
              className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all text-left flex items-center justify-between gap-1.5 cursor-pointer ${
                active
                  ? 'bg-teal-950/60 border-teal-400 shadow-[0_0_18px_rgba(20,184,166,0.2)]'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <StageLucideIcon id={st.id} className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    <span className="sm:hidden">{st.shortTab}</span>
                    <span className="hidden sm:inline">{st.name}</span>
                  </div>
                  <div className="hidden sm:block text-xs text-slate-400 truncate">{st.nameTh}</div>
                </div>
              </div>
              <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-slate-950/80 text-teal-300 border border-teal-500/30 shrink-0">
                +{st.expReward}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Adaptive Main Grid: Mobile Portrait Stack / Desktop Side-by-Side ─ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 rounded-2xl sm:rounded-3xl bg-slate-900/85 backdrop-blur-xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* HUD Bar */}
          <div className="px-3 py-2.5 sm:px-4 sm:py-3 bg-slate-950/90 border-b border-slate-800 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-2">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
                  <span className="text-rose-400 font-mono">{hp}/10</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
                  <span className="text-amber-300 font-mono">{atp} ATP</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                  W <span className="text-teal-400 font-bold">{Math.min(waveIdx + 1, stage.waves.length)}/10</span>
                </div>
              </div>

              <div className="flex sm:hidden items-center gap-1.5">
                <button
                  onClick={cycleSpeed}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-bold border flex items-center gap-1 cursor-pointer ${
                    gameSpeed > 1
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <FastForward className="w-3 h-3" />
                  <span>{gameSpeed}x</span>
                </button>
                <button
                  onClick={() => {
                    if (soundOn) sfx.click();
                    initStage(stageIdx);
                  }}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                  title="เริ่มด่านใหม่"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
              <button
                onClick={handleOpenQuiz}
                disabled={quizCharges <= 0 || !!endResult}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition ${
                  quizCharges > 0
                    ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 border-purple-500/50 cursor-pointer'
                    : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed'
                }`}
              >
                <Brain className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">คำถาม +60⚡ ({quizCharges}/2)</span>
              </button>

              <button
                onClick={handleStartWave}
                disabled={waveActive || !!endResult}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition ${
                  waveActive
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                    : currentWaveObj?.isBossWave
                    ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-[0_0_18px_rgba(244,63,94,0.45)] cursor-pointer'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_16px_rgba(16,185,129,0.35)] cursor-pointer'
                }`}
              >
                {currentWaveObj?.isBossWave ? (
                  <Skull className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                )}
                <span className="truncate">
                  {waveActive
                    ? 'กำลังสกัดเชื้อ...'
                    : currentWaveObj?.bossTier === 'final'
                    ? 'ปล่อย FINAL BOSS W10'
                    : currentWaveObj?.bossTier === 'mid'
                    ? 'ปล่อย BOSS WAVE 5'
                    : `ปล่อย Wave ${Math.min(waveIdx + 1, 10)}`}
                </span>
              </button>

              <button
                onClick={cycleSpeed}
                className={`hidden sm:flex px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold border items-center gap-1 transition cursor-pointer ${
                  gameSpeed > 1
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="เร่งความเร็ว 1x / 2x / 3x"
              >
                <FastForward className="w-3.5 h-3.5" />
                <span>{gameSpeed}x</span>
              </button>

              <button
                onClick={() => {
                  if (soundOn) sfx.click();
                  initStage(stageIdx);
                }}
                className="hidden sm:flex p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                title="เริ่มด่านใหม่"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── 10-Wave Timeline Strip (Highlights Boss Wave 5 & Final Boss Wave 10) ── */}
          <div className="px-3 py-1.5 sm:px-4 bg-slate-950/75 border-b border-slate-800/80 grid grid-cols-10 gap-1">
            {stage.waves.map((w, idx) => {
              const wNum = idx + 1;
              const isCleared = idx < waveIdx || (endResult?.won ?? false);
              const isCurrent = idx === waveIdx && !endResult?.won;
              const isBoss = !!w.isBossWave;
              return (
                <div
                  key={wNum}
                  className={`h-6 rounded-md border text-[11px] font-mono font-bold flex items-center justify-center gap-0.5 transition ${
                    isCleared
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : isCurrent
                      ? isBoss
                        ? 'bg-rose-500/30 border-rose-400 text-rose-200 animate-pulse'
                        : 'bg-cyan-500/25 border-cyan-400 text-cyan-200'
                      : isBoss
                      ? 'bg-rose-950/50 border-rose-500/35 text-rose-300'
                      : 'bg-slate-900/70 border-slate-800 text-slate-500'
                  }`}
                  title={w.hint}
                >
                  {w.bossTier === 'final' ? (
                    <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                  ) : isBoss ? (
                    <Skull className="w-3 h-3 text-rose-400 shrink-0" />
                  ) : null}
                  <span>{wNum}</span>
                </div>
              );
            })}
          </div>

          {/* Slim Intel Strip */}
          <div
            className={`px-3 py-1.5 sm:px-4 sm:py-2 border-b flex items-center gap-2 text-xs ${
              currentWaveObj?.isBossWave
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                : 'bg-slate-900/95 border-slate-800/80 text-slate-200'
            }`}
          >
            {currentWaveObj?.isBossWave ? (
              <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            )}
            <span className="line-clamp-1">{intelMessage}</span>
          </div>

          {/* ADAPTIVE CANVAS */}
          <div
            className={`relative w-full bg-slate-950 select-none ${
              isMobileView ? 'aspect-[380/490]' : 'aspect-[760/400]'
            }`}
          >
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className="w-full h-full block cursor-pointer touch-manipulation"
            />

            {/* Selected Tower Upgrade (Up to Lv.5!) / Sell Floating Pill */}
            <AnimatePresence>
              {inspectedPadIdx !== null && inspectedTower && inspectedDef && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-2.5 right-2.5 left-2.5 sm:left-auto z-10 p-2.5 sm:p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TowerLucideIcon type={inspectedTower.type} className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span className="truncate">{inspectedDef.shortName}</span>
                        <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono">
                          Lv.{inspectedTower.level}/{MAX_TOWER_LEVEL}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{inspectedDef.roleTh}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      onClick={handleUpgradeTower}
                      disabled={inspectedTower.level >= MAX_TOWER_LEVEL}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        inspectedTower.level >= MAX_TOWER_LEVEL
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer'
                      }`}
                    >
                      {inspectedTower.level >= MAX_TOWER_LEVEL ? 'MAX' : `อัปเกรด ${upgradeCost}⚡`}
                    </button>
                    <button
                      onClick={handleSellTower}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 transition cursor-pointer"
                    >
                      รื้อ +{sellRefund}
                    </button>
                    <button
                      onClick={() => setInspectedPadIdx(null)}
                      className="px-1.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Virology Quiz Overlay */}
            <AnimatePresence>
              {quizOpen && currentQuizItem && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-slate-950/95 backdrop-blur-md p-3.5 sm:p-6 flex flex-col justify-between overflow-y-auto"
                >
                  <div className="space-y-3 max-w-2xl mx-auto w-full">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        สังเคราะห์ +60 ATP (หยุดเวลาชั่วคราว)
                      </span>
                      <button
                        onClick={handleCloseQuiz}
                        className="text-xs font-bold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
                      >
                        ปิด ✕
                      </button>
                    </div>

                    <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                      {currentQuizItem.q}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentQuizItem.choices.map((ch, idx) => {
                        const isPicked = selectedQuizAns === ch;
                        const isRight = ch === currentQuizItem.answer;
                        let cls =
                          'bg-slate-900/90 hover:border-purple-400 border-slate-800 text-slate-200';
                        if (selectedQuizAns !== null) {
                          if (isRight) {
                            cls = 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold';
                          } else if (isPicked) {
                            cls = 'bg-rose-500/20 border-rose-500 text-rose-200';
                          } else {
                            cls = 'bg-slate-900/40 border-slate-800/60 text-slate-500';
                          }
                        }
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSelectQuizChoice(ch)}
                            disabled={selectedQuizAns !== null}
                            className={`text-left p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm transition ${cls} ${
                              selectedQuizAns === null ? 'cursor-pointer' : ''
                            }`}
                          >
                            {ch}
                          </button>
                        );
                      })}
                    </div>

                    {selectedQuizAns !== null && (
                      <div
                        className={`p-3 rounded-xl border text-xs leading-relaxed flex flex-col sm:flex-row sm:items-center gap-2.5 ${
                          selectedQuizAns === currentQuizItem.answer
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                            : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                        }`}
                      >
                        <div className="flex items-start gap-2 flex-1">
                          {selectedQuizAns === currentQuizItem.answer ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-bold mb-0.5">
                              {selectedQuizAns === currentQuizItem.answer
                                ? 'ถูกต้อง! รับพลังงาน +60 ATP'
                                : `คำตอบที่ถูกคือ: ${currentQuizItem.answer}`}
                            </div>
                            <div className="text-slate-300">{currentQuizItem.explanation}</div>
                          </div>
                        </div>
                        <button
                          onClick={handleCloseQuiz}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-slate-950 font-black text-xs shrink-0 cursor-pointer"
                        >
                          กลับเข้าสนามรบ →
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Victory / Defeat Result Modal */}
            <AnimatePresence>
              {endResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 bg-slate-950/93 backdrop-blur-md p-5 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-3">
                    {endResult.won ? (
                      <Trophy className="w-8 h-8 text-amber-400" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-rose-400" />
                    )}
                  </div>
                  <h2 className="text-lg sm:text-2xl font-black text-white">
                    {endResult.won
                      ? `พิชิตครบ 10 Waves ปกป้อง ${stage.organLabel} สำเร็จ!`
                      : `พ่ายแพ้ใน Wave ${waveIdx + 1}/10 (${stage.organLabel} ติดเชื้อ!)`}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md mt-1.5">
                    {endResult.won
                      ? 'สุดยอด! คุณปราบทั้งมิดบอส Wave 5 และไฟนอลบอส Wave 10 ได้อย่างสมบูรณ์แบบ'
                      : 'เคล็ดลับ: อัปเกรดป้อม Bleach สกัด Naked Virus และสร้าง CD8+ T-Cell ไว้รุมยิงบอสใน Wave 5 และ Wave 10!'}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                      คะแนน: <span className="text-cyan-400 font-bold">{score}</span>
                    </div>
                    <div className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
                      รางวัล:{' '}
                      {endResult.saving ? (
                        <span className="text-slate-400">กำลังบันทึก...</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">
                          +{endResult.awardedExp ?? 0} EXP
                          {endResult.awardedExp === 0 && ' (โหมดฝึกซ้อม)'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                    <button
                      onClick={() => initStage(stageIdx)}
                      className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider cursor-pointer transition"
                    >
                      เล่นอีกครั้ง
                    </button>
                    {endResult.won && stageIdx < STAGES.length - 1 && (
                      <button
                        onClick={() => setStageIdx((idx) => idx + 1)}
                        className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black text-xs uppercase tracking-wider cursor-pointer transition"
                      >
                        ด่านถัดไป →
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── MOBILE COMPACT 4-SLOT TOWER DOCK ──────────────────────────── */}
          <div className="xl:hidden p-2.5 sm:p-3 bg-slate-950/95 border-t border-slate-800 space-y-2">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {(Object.keys(TOWER_DEFS) as TowerKey[]).map((key) => {
                const def = TOWER_DEFS[key];
                const isSelected = selectedBuildType === key;
                const canAfford = atp >= def.cost;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (soundOn) sfx.click();
                      setSelectedBuildType(key);
                      setInspectedPadIdx(null);
                    }}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-between gap-1 cursor-pointer ${
                      isSelected
                        ? `border-2 ${def.badgeClass} shadow-md`
                        : 'border-slate-800 bg-slate-900/80'
                    } ${!canAfford ? 'opacity-55' : ''}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <TowerLucideIcon type={key} className="w-4 h-4 shrink-0" />
                      <span
                        className={`text-[11px] font-mono font-bold px-1 rounded ${
                          canAfford ? 'text-amber-300' : 'text-rose-400'
                        }`}
                      >
                        {def.cost}⚡
                      </span>
                    </div>
                    <div className="text-xs font-black text-white leading-tight truncate w-full text-left">
                      {def.shortName}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-300 leading-tight truncate w-full text-left">
                      {def.compactTag}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/90 text-xs text-slate-300 flex items-center gap-2">
              <TowerLucideIcon type={selectedBuildType} className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                <b className="text-white">{selectedTowerInfo.shortName}:</b> {selectedTowerInfo.virologyNote}
              </span>
            </div>
          </div>
        </div>

        {/* ── DESKTOP SIDE TACTICAL COMMAND PANEL ─────────────────────────── */}
        <div className="hidden xl:flex xl:col-span-4 flex-col gap-3">
          <div className="p-4 rounded-3xl bg-slate-900/85 backdrop-blur-xl border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <span>เลือกป้อม (อัปเกรดสูงสุด Lv.5)</span>
              </h2>
              <span className="text-xs font-mono font-bold text-amber-300">{atp} ATP</span>
            </div>

            <p className="text-xs text-slate-400">
              คลิกเลือกป้อมด้านล่าง แล้วคลิกจุด <b className="text-teal-300">[+]</b> บนสนามรบเพื่อสร้าง
            </p>

            <div className="space-y-2.5">
              {(Object.keys(TOWER_DEFS) as TowerKey[]).map((key) => {
                const def = TOWER_DEFS[key];
                const isSelected = selectedBuildType === key;
                const canAfford = atp >= def.cost;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      if (soundOn) sfx.click();
                      setSelectedBuildType(key);
                      setInspectedPadIdx(null);
                    }}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? `border-2 ${def.badgeClass} shadow-lg`
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    } ${!canAfford ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-black text-white flex items-center gap-2">
                        <TowerLucideIcon type={key} className="w-4 h-4" />
                        <span>{def.name}</span>
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                          canAfford ? 'bg-amber-500/15 text-amber-300' : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {def.cost} ATP
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 mt-1">{def.roleTh}</div>
                    <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{def.virologyNote}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900/75 border border-slate-800 space-y-2 text-xs">
            <div className="font-bold text-white">ตารางบอสประจำด่าน (10 Waves)</div>
            <div className="text-slate-300 flex items-center gap-2">
              <Skull className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span><b>Wave 5 (Mid-Boss):</b> CAV-1 / PRRSV / SuHV-1 (+50 ATP โบนัสเมื่อผ่าน)</span>
            </div>
            <div className="text-slate-300 flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span><b>Wave 10 (Final Boss):</b> มหาศึกบอสคู่ FIPV, ASFV และ Rabies Titan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
