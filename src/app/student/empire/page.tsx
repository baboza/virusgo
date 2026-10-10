"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, doc, setDoc, updateDoc, increment, arrayUnion, getDoc, writeBatch } from 'firebase/firestore';
import { EmpireTile, Guild, User } from '@/types';
import { SVGVirus } from '@/components/ui/SVGVirus';
import { Loader2, ArrowLeft, Swords, Crosshair, AlertTriangle, Shield, Lock, Home, Target, Flame, Sparkles, Users, Plus, Check, Crown, Gift, Radio, Building2, Zap, Rocket, ShieldCheck, BookOpen, ZoomIn, ZoomOut, Compass, X, BarChart3, Eye, CloudFog, ChevronRight } from 'lucide-react';
import { sfx } from '@/utils/sound';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { familyToVirusType } from '@/components/ui/SVGVirus';
import { getDailyEmpireInfo, DAILY_EMPIRE_ATTACK_LIMIT, getTodayDateString, getDailyScoutDroneInfo, DAILY_SCOUT_DRONE_LIMIT } from '@/lib/dailyExpCap';

const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-[9px]">3D...</div>
});

export const MAP_SIZE = 50; // Expanded to 50x50 = 2,500 tiles!

// Helper: 4-Rim Sanctuary Zone for New Players
export const isSanctuaryZone = (x: number, y: number): boolean => {
  return x < 4 || x >= MAP_SIZE - 4 || y < 4 || y >= MAP_SIZE - 4;
};

// Helper: Central Vault & Guardian Core Zone
export const isCentralVaultZone = (x: number, y: number): boolean => {
  return x >= 22 && x <= 27 && y >= 22 && y <= 27;
};

// Helper: Check if tile has active beginner shield
export const isShieldedTile = (tile?: EmpireTile | null): boolean => {
  if (!tile?.shieldUntil) return false;
  return new Date(tile.shieldUntil).getTime() > Date.now();
};

// Helper: Calculate the 4-tile 2x2 cluster coordinates for a given top-left anchor (x,y)
export const getCitadel2x2Coords = (x: number, y: number): string[] => {
  return [
    `${x},${y}`,
    `${x + 1},${y}`,
    `${x},${y + 1}`,
    `${x + 1},${y + 1}`
  ];
};

// Helper: Check if tile is within 2 tiles of any cell in a Guild Citadel (Zone of Influence)
export const isCitadelInfluenceZone = (
  x: number, 
  y: number, 
  citadelCoord?: string | null, 
  citadelCoords?: string[] | null
): boolean => {
  const coords: string[] = [];
  if (Array.isArray(citadelCoords) && citadelCoords.length > 0) {
    coords.push(...citadelCoords);
  } else if (citadelCoord) {
    coords.push(citadelCoord);
  }
  if (coords.length === 0) return false;

  return coords.some((c) => {
    const [cx, cy] = c.split(',').map(Number);
    return Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2;
  });
};

// Helper: Check if territory is decayed (>72 hours inactive, immune if inside Citadel Influence Zone)
export const isDecayedTile = (
  tile?: EmpireTile | null, 
  guildCitadelCoord?: string | null,
  guildCitadelCoords?: string[] | null
): boolean => {
  if (!tile || tile.type !== 'player' || tile.isOutpost || tile.isCitadel) return false;
  // If territory is within the protection zone of its guild's Citadel, it is immune to decay!
  if (isCitadelInfluenceZone(tile.x, tile.y, guildCitadelCoord, guildCitadelCoords)) return false;
  const lastActiveTime = tile.lastActive 
    ? new Date(tile.lastActive).getTime() 
    : tile.lastAttacked 
    ? new Date(tile.lastAttacked).getTime() 
    : 0;
  if (!lastActiveTime) return false;
  return Date.now() - lastActiveTime > 72 * 3600 * 1000;
};

// Map virus family to color (used across empire & battle pages)
export const familyToColor = (family: string) => {
  const f = family.toLowerCase();
  if (f.includes('rabies')) return '#ef4444';
  if (f.includes('parvo')) return '#3b82f6';
  if (f.includes('corona')) return '#10b981';
  if (f.includes('retro')) return '#a855f7';
  if (f.includes('paramyxo')) return '#f97316';
  if (f.includes('arteri')) return '#ec4899';
  if (f.includes('picorna')) return '#eab308';
  if (f.includes('asfar')) return '#6366f1';
  if (f.includes('flavi')) return '#84cc16';
  if (f.includes('orthomyxo')) return '#14b8a6';
  return '#06b6d4';
};

// 12 Distinct Neon/Vibrant Tactical Colors for Students
const PLAYER_PALETTE = [
  '#a855f7', // Purple
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#8b5cf6', // Violet
  '#14b8a6', // Teal
  '#eab308', // Yellow
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#d946ef', // Fuchsia
];

export const getPlayerUniqueColor = (uid: string, isCurrentPlayer: boolean) => {
  // Current player is ALWAYS Cyan (#06b6d4) for instant recognition
  if (isCurrentPlayer) return '#06b6d4';
  
  // Consistent deterministic hash for other students
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PLAYER_PALETTE.length;
  return PLAYER_PALETTE[index];
};

export const getVaultGuardianCoords = (): string[] => {
  const coords: string[] = [];
  // 50x50 central vault perimeter (22..27, excluding 24,24..25,25)
  for (let gx = 22; gx <= 27; gx++) {
    for (let gy = 22; gy <= 27; gy++) {
      if ((gx === 24 || gx === 25) && (gy === 24 || gy === 25)) continue;
      coords.push(`${gx},${gy}`);
    }
  }
  // Include legacy coordinates if any
  for (let gx = 12; gx <= 17; gx++) {
    for (let gy = 12; gy <= 17; gy++) {
      if ((gx === 14 || gx === 15) && (gy === 14 || gy === 15)) continue;
      coords.push(`${gx},${gy}`);
    }
  }
  return coords;
};

// Bio-Radar Scout Drone Question Pool (Virology & Bio-Defense)
export const SCOUT_FALLBACK_QUIZ = [
  {
    q: "ไวรัสที่มีสารพันธุกรรมเป็น RNA สายเดี่ยว แบบบวก (ssRNA(+)) สามารถทำหน้าที่ใดได้โดยตรงเมื่อเข้าสู่เซลล์โฮสต์?",
    options: ["เป็น mRNA ให้ไรโบโซมสังเคราะห์โปรตีนได้ทันที", "ต้องแปลงเป็น DNA ก่อนเสมอ", "จำลองตัวเองโดยไม่อาศัยเอนไซม์ใดๆ", "ไม่สามารถเข้าสู่ไซโทพลาสซึมได้"],
    ans: 0,
    explanation: "RNA สายเดี่ยวแบบ Positive-sense (+) ทำหน้าที่เสมือน mRNA ที่ไรโบโซมของโฮสต์สามารถจับและแปลรหัส (Translate) โปรตีนได้ทันที"
  },
  {
    q: "โครงสร้างใดของไวรัสที่มีหน้าที่สำคัญในการยึดเกาะกับตัวรับ (Receptor) บนผิวเซลล์โฮสต์?",
    options: ["Glycoprotein Spikes บน Envelope หรือ Capsid", "Capsomere ภายในแกนกลาง", "Reverse Transcriptase", "Poly-A tail"],
    ans: 0,
    explanation: "Spike Glycoprotein ทำหน้าที่เสมือนกุญแจจับกับ Receptor บนผิวเซลล์โฮสต์เพื่อเหนี่ยวนำการเข้าสู่เซลล์"
  },
  {
    q: "Envelope (เยื่อหุ้ม) ของไวรัสมักได้มาจากแหล่งใด?",
    options: ["เยื่อหุ้มเซลล์หรือเยื่อหุ้มออร์แกเนลล์ของเซลล์โฮสต์", "สังเคราะห์ขึ้นใหม่จากกรดอะมิโนอิสระ", "ผนังเซลล์ของแบคทีเรีย", "สร้างขึ้นโดยไมโตคอนเดรียของไวรัส"],
    ans: 0,
    explanation: "Viral Envelope ได้มาจาก Lipid bilayer ของเยื่อหุ้มเซลล์โฮสต์ในระหว่างกระบวนการแตกหน่อ (Budding)"
  },
  {
    q: "การทดสอบใดใช้ตรวจหาสารพันธุกรรมของไวรัสที่มีความไวและความจำเพาะสูงที่สุดในการวินิจฉัยระดับโมเลกุล?",
    options: ["RT-PCR / Real-time PCR", "Gram Stain", "ELISA Antigen test อย่างเดียว", "การเพาะเลี้ยงในจานอาหารวุ้นสังเคราะห์"],
    ans: 0,
    explanation: "RT-PCR / Real-time PCR เป็น Gold standard ในการเพิ่มจำนวนและตรวจจับสารพันธุกรรมของไวรัสที่มีความแม่นยำสูงมาก"
  },
  {
    q: "ไวรัสที่มีเยื่อหุ้ม (Enveloped virus) มักถูกทำลายได้ง่ายกว่า Non-enveloped virus ด้วยสารใด?",
    options: ["แอลกอฮอล์ 70% และสบู่/ผงซักฟอก", "น้ำเปล่าอุณหภูมิห้อง", "เกลือแกงความเข้มข้นต่ำ", "แสงแดดอ่อนๆ เพียง 1 วินาที"],
    ans: 0,
    explanation: "สารลดแรงตึงผิว (สบู่) และแอลกอฮอล์สามารถละลาย Lipid envelope ทำให้โปรตีนหนามหลุดและสูญเสียความสามารถในการติดเชื้อ"
  },
  {
    q: "Bacteriophage คือไวรัสที่มีเป้าหมายในการติดเชื้อสิ่งมีชีวิตกลุ่มใด?",
    options: ["แบคทีเรีย", "สัตว์เลี้ยงลูกด้วยนม", "พืชดอก", "ราและยีสต์"],
    ans: 0,
    explanation: "Bacteriophage เป็นกลุ่มไวรัสที่ติดเชื้อเฉพาะเซลล์แบคทีเรียเท่านั้น"
  },
  {
    q: "เซลล์เม็ดเลือดขาวชนิดใดมีบทบาทหลักในการสร้างแอนติบอดี (Antibodies) เพื่อทำลายไวรัส?",
    options: ["B Cells (Plasma Cells)", "Neutrophils", "Eosinophils", "Erythrocytes"],
    ans: 0,
    explanation: "B lymphocytes เมื่อถูกกระตุ้นจะเจริญเป็น Plasma cells และหลั่ง Specific Antibodies เพื่อต่อต้านเชื้อ"
  },
  {
    q: "กลไกใดของเซลล์โฮสต์ที่ทำหน้าที่หลั่งไซโตไคน์เตือนเซลล์ข้างเคียงให้ต้านทานการติดเชื้อไวรัส?",
    options: ["Interferon response (IFN)", "Histamine release", "Insulin signaling", "Hemoglobin synthesis"],
    ans: 0,
    explanation: "Interferons (IFN-α, IFN-β) เป็นโปรตีนไซโตไคน์ที่เซลล์หลั่งออกมาเมื่อติดเชื้อไวรัสเพื่อกระตุ้นสถานะ Antiviral state แก่เซลล์ข้างเคียง"
  }
];

export default function EmpireMap() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [tiles, setTiles] = useState<Record<string, EmpireTile>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);

  // Daily Empire Attack Quota Info
  const dailyEmpireInfo = useMemo(() => getDailyEmpireInfo(appUser), [appUser]);

  // Daily Scout Drone Quota Info (5 missions per day)
  const dailyScoutInfo = useMemo(() => getDailyScoutDroneInfo(appUser), [appUser]);

  // Drag-to-pan state (Smooth Mouse & Touch Dragging)
  const mapRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const hasMoved = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!mapRef.current) return;
    isDragging.current = true;
    hasMoved.current = false;
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: mapRef.current.scrollLeft,
      scrollTop: mapRef.current.scrollTop,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !mapRef.current) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMoved.current = true;
    }
    mapRef.current.scrollLeft = startPos.current.scrollLeft - dx;
    mapRef.current.scrollTop = startPos.current.scrollTop - dy;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (hasMoved.current) {
      setTimeout(() => {
        hasMoved.current = false;
      }, 100);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!mapRef.current) return;
    isDragging.current = true;
    hasMoved.current = false;
    const touch = e.touches[0];
    startPos.current = {
      x: touch.clientX,
      y: touch.clientY,
      scrollLeft: mapRef.current.scrollLeft,
      scrollTop: mapRef.current.scrollTop,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !mapRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - startPos.current.x;
    const dy = touch.clientY - startPos.current.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
      hasMoved.current = true;
    }
    mapRef.current.scrollLeft = startPos.current.scrollLeft - dx;
    mapRef.current.scrollTop = startPos.current.scrollTop - dy;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (hasMoved.current) {
      setTimeout(() => {
        hasMoved.current = false;
      }, 150);
    }
  };

  // Guild / Alliance States
  const [guilds, setGuilds] = useState<Record<string, Guild>>({});
  const [showGuildModal, setShowGuildModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [isPcMenuMinimized, setIsPcMenuMinimized] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildTag, setNewGuildTag] = useState('');
  const [newGuildColor, setNewGuildColor] = useState(PLAYER_PALETTE[0]);
  const [isCreatingGuild, setIsCreatingGuild] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [previewGuildId, setPreviewGuildId] = useState<string | null>(null);

  // Fog of War & GM View States
  const isGmUser = useMemo(() => {
    return appUser?.email === 'never.away@gmail.com' || appUser?.role === 'instructor';
  }, [appUser?.email, appUser?.role]);

  // GM View Mode: 'all' = God-mode view (sees all tiles), 'fog' = simulate player fog view
  const [gmViewMode, setGmViewMode] = useState<'all' | 'fog'>('all');

  // Scout Drone States
  const [showScoutModal, setShowScoutModal] = useState(false);
  const [scoutTarget, setScoutTarget] = useState<{ x: number; y: number } | null>(null);
  const [scoutQuestions, setScoutQuestions] = useState(SCOUT_FALLBACK_QUIZ);
  const [scoutQIndex, setScoutQIndex] = useState(0);
  const [isScouting, setIsScouting] = useState(false);
  const [scoutFeedback, setScoutFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);


  useEffect(() => {
    if (!appUser) return;
    if ((appUser.exp || 0) < 1000) {
      router.push('/student');
      return;
    }

    // 1. Subscribe to Empire Tiles
    const qTiles = query(collection(db, 'empire_tiles'));
    const unsubTiles = onSnapshot(qTiles, (snap) => {
      const newTiles: Record<string, EmpireTile> = {};
      let bossCount = 0;
      snap.forEach((d) => {
        const t = d.data() as EmpireTile;
        newTiles[d.id] = t;
        if (t.type === 'boss') bossCount++;
      });
      setTiles(newTiles);
      setLoading(false);

      const hasOutpost = Object.values(newTiles).some((t) => t.isOutpost || t.type === 'outpost');
      // Only seed bosses & outposts if the database is newly created and completely uninitialized
      if (snap.size > 0 && bossCount < 5 && !hasOutpost && appUser?.role === 'instructor') {
        distributeBosses(newTiles);
      }
    });

    // 2. Subscribe to Guilds
    const qGuilds = query(collection(db, 'guilds'));
    const unsubGuilds = onSnapshot(qGuilds, (snap) => {
      const gMap: Record<string, Guild> = {};
      snap.forEach((d) => {
        gMap[d.id] = d.data() as Guild;
      });
      setGuilds(gMap);
    });

    // 3. Subscribe to All Users (to sync guild members list & leader status)
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const uList: User[] = [];
      snap.forEach((d) => {
        uList.push(d.data() as User);
      });
      setAllUsers(uList);
    });

    return () => {
      unsubTiles();
      unsubGuilds();
      unsubUsers();
    };
  }, [appUser, router]);

  const currentGuildMembers = useMemo(() => {
    if (!appUser?.guildId) return [];
    return allUsers.filter((u) => u.guildId === appUser.guildId);
  }, [allUsers, appUser?.guildId]);

  // Auto-award Exploration & Conquest Badges (Option A: Guild Conquered + Personal Drone Scouts)
  // Ensures ALL members of any guild with >= 625 conquered sectors receive 🥉 Junior Explorer immediately!
  const hasAutoAwardedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (Object.keys(tiles).length === 0 || allUsers.length === 0) return;

    // 1. Group conquered tiles by guild
    const guildTileCoords: Record<string, string[]> = {};
    Object.values(tiles).forEach((t) => {
      if (t.guildId) {
        if (!guildTileCoords[t.guildId]) guildTileCoords[t.guildId] = [];
        guildTileCoords[t.guildId].push(`${t.x},${t.y}`);
      }
    });

    // 2. Scope target users: Instructors can sync all users; students only update their own profile (strictly complies with Firestore security rules)
    const isInstructor = appUser?.role === 'instructor' || appUser?.role === 'admin';
    const usersToAward = isInstructor ? allUsers : allUsers.filter((u) => u.uid === appUser?.uid);

    usersToAward.forEach((u) => {
      if (!u.uid) return;
      const uBadges = Array.isArray(u.badges) ? u.badges : [];
      const gCoords = u.guildId ? (guildTileCoords[u.guildId] || []) : [];
      const pExplored = Array.isArray(u.exploredTiles) ? u.exploredTiles : [];

      // Effective explored set = Union of personal drone scouts + guild conquered sectors
      const effectiveSet = new Set<string>([...pExplored, ...gCoords]);
      const effectiveCount = effectiveSet.size;

      const badgesToGive: string[] = [];
      if (effectiveCount >= (MAP_SIZE * MAP_SIZE * 0.25) && !uBadges.includes('Junior Explorer')) {
        badgesToGive.push('Junior Explorer');
      }
      if (effectiveCount >= (MAP_SIZE * MAP_SIZE * 0.5) && !uBadges.includes('Master Cartographer')) {
        badgesToGive.push('Master Cartographer');
      }
      if (effectiveCount >= (MAP_SIZE * MAP_SIZE) && !uBadges.includes('Grand Conqueror')) {
        badgesToGive.push('Grand Conqueror');
      }

      // Filter badges not yet processed for this user in this session
      const pendingBadges = badgesToGive.filter((b) => !hasAutoAwardedRef.current.has(`${u.uid}_${b}`));

      if (pendingBadges.length > 0) {
        pendingBadges.forEach((b) => hasAutoAwardedRef.current.add(`${u.uid}_${b}`));
        const userRef = doc(db, 'users', u.uid);
        updateDoc(userRef, {
          badges: arrayUnion(...pendingBadges),
        }).then(() => {
          if (u.uid === appUser?.uid) {
            setClaimSuccessMsg(
              `🎖️ ยินดีด้วย! กิลด์ของคุณครอบครอง/สำรวจดินแดนเกิน 25% (625 ช่อง) สมาชิกทุกคนปลดล็อคเหรียญตรา 🥉 Junior Explorer สำเร็จ!`
            );
            setTimeout(() => setClaimSuccessMsg(null), 5000);
          }
        }).catch((err) => console.error(`Failed to auto-award badge to ${u.uid}:`, err));
      }
    });
  }, [tiles, allUsers, appUser?.uid, appUser?.role]);

  // Distribute bosses and 4 farm outposts across grid sectors
  const distributeBosses = async (currentTiles: Record<string, EmpireTile>) => {
    // 1. Fortress Bosses: 2 concentric layers of Guardian Bosses around central vault perimeter (perimeter of [22..27], [22..27] = 28 guardians)
    const guardianCoords: { x: number; y: number }[] = [];
    for (let gx = 22; gx <= 27; gx++) {
      for (let gy = 22; gy <= 27; gy++) {
        // Exclude the 4 center cells
        if ((gx === 24 || gx === 25) && (gy === 24 || gy === 25)) continue;
        guardianCoords.push({ x: gx, y: gy });
      }
    }

    for (const g of guardianCoords) {
      const gId = `${g.x},${g.y}`;
      if (!currentTiles[gId] || currentTiles[gId].type === 'empty') {
        const isInnerRing = (g.x >= 23 && g.x <= 26 && g.y >= 23 && g.y <= 26);
        const guardianBoss: EmpireTile = {
          id: gId,
          x: g.x,
          y: g.y,
          type: 'boss',
          bossHp: isInnerRing ? 2000 : 1400,
          maxBossHp: isInnerRing ? 2000 : 1400,
          ownerName: isInnerRing ? 'ผู้พิทักษ์สมบัติชั้นใน (Vault Elite Guardian)' : 'ผู้พิทักษ์สมบัติชั้นนอก (Perimeter Guardian)',
          ownerFamily: ['corona', 'rabies', 'parvo', 'retro', 'orthomyxo'][Math.floor(Math.random() * 5)],
        };
        await setDoc(doc(db, 'empire_tiles', gId), guardianBoss);
      }
    }

    // 3. Regular Zone Bosses: Place 1 boss in each 5x5 zone (excluding the central vault zones)
    const zoneSize = 5;
    const zonesPerRow = MAP_SIZE / zoneSize; // 10 zones for 50x50

    for (let zx = 0; zx < zonesPerRow; zx++) {
      for (let zy = 0; zy < zonesPerRow; zy++) {
        // Skip central zones that contain the fortress vault (zones 4 & 5)
        if ((zx === 4 || zx === 5) && (zy === 4 || zy === 5)) continue;

        let zoneHasBoss = false;
        for (let ox = 0; ox < zoneSize; ox++) {
          for (let oy = 0; oy < zoneSize; oy++) {
            const checkId = `${zx * zoneSize + ox},${zy * zoneSize + oy}`;
            if (currentTiles[checkId]?.type === 'boss') {
              zoneHasBoss = true;
              break;
            }
          }
          if (zoneHasBoss) break;
        }

        if (!zoneHasBoss) {
          const rx = zx * zoneSize + 1 + Math.floor(Math.random() * (zoneSize - 2));
          const ry = zy * zoneSize + 1 + Math.floor(Math.random() * (zoneSize - 2));
          const bossId = `${rx},${ry}`;

          if (!currentTiles[bossId] || currentTiles[bossId].type === 'empty') {
            const bossTile: EmpireTile = {
              id: bossId,
              x: rx,
              y: ry,
              type: 'boss',
              bossHp: 900,
              maxBossHp: 900,
              ownerName: 'Immune System Boss',
              ownerFamily: ['corona', 'rabies', 'parvo', 'retro', 'orthomyxo'][Math.floor(Math.random() * 5)],
            };
            await setDoc(doc(db, 'empire_tiles', bossId), bossTile);
          }
        }
      }
    }

    // 4. Bio-Farm Outposts: 4 Strategic Outposts across the 4 quadrants (gives 100 EXP/day)
    const outpostCoords = [
      { x: 10, y: 10, name: 'ป้อมฟาร์มวิจัยตะวันตกเฉียงเหนือ (NW Outpost)' },
      { x: 39, y: 10, name: 'ป้อมฟาร์มวิจัยตะวันออกเฉียงเหนือ (NE Outpost)' },
      { x: 10, y: 39, name: 'ป้อมฟาร์มวิจัยตะวันตกเฉียงใต้ (SW Outpost)' },
      { x: 39, y: 39, name: 'ป้อมฟาร์มวิจัยตะวันออกเฉียงใต้ (SE Outpost)' },
    ];

    for (const o of outpostCoords) {
      const oId = `${o.x},${o.y}`;
      if (!currentTiles[oId] || currentTiles[oId].type === 'empty') {
        const outpostTile: EmpireTile = {
          id: oId,
          x: o.x,
          y: o.y,
          type: 'outpost',
          isOutpost: true,
          dailyExp: 100,
          bossHp: 800,
          maxBossHp: 800,
          ownerName: o.name,
          ownerFamily: 'corona',
        };
        await setDoc(doc(db, 'empire_tiles', oId), outpostTile);
      }
    }
  };

  // Fast pre-calculated statistics
  const stats = useMemo(() => {
    let myCount = 0;
    let enemyCount = 0;
    let bossCount = 0;
    let outpostCount = 0;

    Object.values(tiles).forEach((t) => {
      if (t.isOutpost || t.type === 'outpost') outpostCount++;
      if (t.type === 'boss') bossCount++;
      else if (t.type === 'player') {
        if (t.ownerUid === appUser?.uid) myCount++;
        else enemyCount++;
      }
    });

    return { myCount, enemyCount, bossCount, outpostCount };
  }, [tiles, appUser?.uid]);

  // Pre-calculated Set of all tiles currently protected by a Guild Citadel Aura
  const citadelAuraTileIds = useMemo(() => {
    const auraSet = new Set<string>();
    Object.values(guilds).forEach((g) => {
      const coords = g.citadelCoords || (g.citadelCoord ? [g.citadelCoord] : []);
      coords.forEach((c) => {
        const [cx, cy] = c.split(',').map(Number);
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            const ax = cx + dx;
            const ay = cy + dy;
            if (ax >= 0 && ax < MAP_SIZE && ay >= 0 && ay < MAP_SIZE) {
              auraSet.add(`${ax},${ay}`);
            }
          }
        }
      });
    });
    return auraSet;
  }, [guilds]);

  // Fog of War: Pre-calculated Set of tiles visible to the current player
  // Sanctuary border zone, central vault, bosses, outposts, player bases, and scouted tiles
  const visibleTileSet = useMemo(() => {
    // 1. If GM in 'all' mode: All tiles on the 50x50 map are visible
    if (isGmUser && gmViewMode === 'all') {
      return new Set<string>(); // Special handling: handled in isTileVisible or filled below
    }

    const vSet = new Set<string>();

    // 2. Sanctuary zone (rim of 4 tiles around map) is always visible
    for (let x = 0; x < MAP_SIZE; x++) {
      for (let y = 0; y < MAP_SIZE; y++) {
        if (isSanctuaryZone(x, y)) {
          vSet.add(`${x},${y}`);
        }
      }
    }

    // 3. Central Vault zone is always visible (22..27, 22..27)
    for (let x = 22; x <= 27; x++) {
      for (let y = 22; y <= 27; y++) {
        vSet.add(`${x},${y}`);
      }
    }

    // 4. Strategic Beacons: Bosses & Outposts are visible beacons on radar
    Object.values(tiles).forEach((t) => {
      if (t.type === 'boss' || t.isOutpost || t.type === 'outpost') {
        vSet.add(t.id);
      }
    });

    // 5. Player's bases & Guild bases grant vision radius of 2 tiles
    const userGuildId = appUser?.guildId;
    Object.values(tiles).forEach((t) => {
      const isMyBase = t.ownerUid === appUser?.uid;
      const isGuildBase = userGuildId && t.guildId === userGuildId;
      if (isMyBase || isGuildBase) {
        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            const vx = t.x + dx;
            const vy = t.y + dy;
            if (vx >= 0 && vx < MAP_SIZE && vy >= 0 && vy < MAP_SIZE) {
              vSet.add(`${vx},${vy}`);
            }
          }
        }
      }
    });

    // 6. Permanently scouted tiles by user (stored in Firestore appUser.exploredTiles)
    if (Array.isArray(appUser?.exploredTiles)) {
      appUser.exploredTiles.forEach((coord) => vSet.add(coord));
    }

    return vSet;
  }, [isGmUser, gmViewMode, tiles, appUser?.uid, appUser?.guildId, appUser?.exploredTiles]);

  // Fast helper to check tile visibility
  const isTileVisible = useCallback((x: number, y: number): boolean => {
    if (isGmUser && gmViewMode === 'all') return true;
    return visibleTileSet.has(`${x},${y}`);
  }, [isGmUser, gmViewMode, visibleTileSet]);

  // Effective distinct explored count for HUD and badges (personal drone scouts + guild conquered sectors)
  const effectiveExploredCount = useMemo(() => {
    const exploredSet = new Set<string>(Array.isArray(appUser?.exploredTiles) ? appUser.exploredTiles : []);
    if (appUser?.guildId) {
      Object.values(tiles).forEach((t) => {
        if (t.guildId === appUser.guildId) {
          exploredSet.add(`${t.x},${t.y}`);
        }
      });
    }
    return exploredSet.size;
  }, [appUser?.exploredTiles, appUser?.guildId, tiles]);

  // Exploration percentage for UI HUD (out of 2,500 tiles, strictly aligned with Badges 25%, 50%, 100%)
  const explorationPercent = useMemo(() => {
    if (isGmUser && gmViewMode === 'all') return 100;
    return Math.min(100, Math.round((effectiveExploredCount / (MAP_SIZE * MAP_SIZE)) * 100));
  }, [isGmUser, gmViewMode, effectiveExploredCount]);


  const activeTileData = selectedTile ? tiles[`${selectedTile.x},${selectedTile.y}`] : null;
  const isMyTile = activeTileData?.ownerUid === appUser?.uid;
  // Check if active tile belongs to a guild member (checks guildId or member uid)
  const isGuildTile = Boolean(
    appUser?.guildId &&
      (activeTileData?.guildId === appUser.guildId ||
        (activeTileData?.ownerUid &&
          allUsers.some((u) => u.uid === activeTileData.ownerUid && u.guildId === appUser.guildId)))
  );

  // Player's currently owned tiles
  const myOwnedTiles = useMemo(() => {
    return Object.values(tiles).filter((t) => t.ownerUid === appUser?.uid);
  }, [tiles, appUser?.uid]);

  // Set of tile IDs that player can attack right now
  const attackableTileIds = useMemo(() => {
    const ids = new Set<string>();
    const userGuildId = appUser?.guildId;

    // 1. Drop Pod / Paratroop: If player currently has 0 tiles, they can drop pod ANYWHERE!
    if (myOwnedTiles.length === 0) {
      for (let x = 0; x < MAP_SIZE; x++) {
        for (let y = 0; y < MAP_SIZE; y++) {
          const id = `${x},${y}`;
          const t = tiles[id];
          // Cannot drop onto ally guild tile
          if (userGuildId && t?.guildId === userGuildId) continue;
          // Cannot drop onto shielded tiles
          if (isShieldedTile(t)) continue;
          // Cannot drop onto outposts
          if (t?.isOutpost || t?.type === 'outpost') continue;
          // Cannot drop onto Central Vault & Vault Guardians
          if (isCentralVaultZone(x, y) || t?.ownerName?.includes('ผู้พิทักษ์') || t?.ownerName?.includes('Guardian')) continue;
          
          ids.add(id);
        }
      }
      return ids;
    }

    // 2. Normal Expansion: Adjacent to player's territory OR Ally Guild's territory
    const allianceTiles = Object.values(tiles).filter((t) => 
      t.ownerUid === appUser?.uid || (userGuildId && t.guildId === userGuildId)
    );

    allianceTiles.forEach((t) => {
      const neighbors = [
        `${t.x + 1},${t.y}`,
        `${t.x - 1},${t.y}`,
        `${t.x},${t.y + 1}`,
        `${t.x},${t.y - 1}`,
      ];
      neighbors.forEach((nid) => {
        const [nx, ny] = nid.split(',').map(Number);
        if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) return;

        const neighbor = tiles[nid];
        // Cannot attack own tile or ally guild tile
        const isAlly = neighbor?.ownerUid === appUser?.uid || (userGuildId && neighbor?.guildId === userGuildId);
        if (isAlly) return;

        // Cannot attack shielded tiles
        if (isShieldedTile(neighbor)) return;

        ids.add(nid);
      });
    });

    return ids;
  }, [tiles, appUser?.uid, appUser?.guildId, myOwnedTiles.length]);

  const canInfect = useMemo(() => {
    if (!selectedTile || isMyTile || isGuildTile) return false;
    if (isShieldedTile(activeTileData)) return false;
    return attackableTileIds.has(`${selectedTile.x},${selectedTile.y}`);
  }, [selectedTile, isMyTile, isGuildTile, activeTileData, attackableTileIds]);

  // Upkeep & Auto-Abandon (Territory Decay & Upkeep System)
  const hasRefreshedUpkeepRef = useRef(false);
  const hasCleanedAbandonRef = useRef(false);

  useEffect(() => {
    if (!appUser || Object.keys(tiles).length === 0) return;

    // 1. Upkeep: Auto-refresh lastActive for current user's tiles if > 1 hour since last refresh (run at most ONCE per session via writeBatch)
    if (!hasRefreshedUpkeepRef.current) {
      const myTilesToRefresh = Object.values(tiles).filter((t) => {
        if (t.ownerUid !== appUser.uid) return false;
        if (!t.lastActive) return true;
        return (Date.now() - new Date(t.lastActive).getTime()) > 3600 * 1000;
      });

      if (myTilesToRefresh.length > 0) {
        hasRefreshedUpkeepRef.current = true;
        const nowIso = new Date().toISOString();
        const batch = writeBatch(db);
        myTilesToRefresh.slice(0, 100).forEach((t) => {
          batch.update(doc(db, 'empire_tiles', t.id), { lastActive: nowIso });
        });
        batch.commit().catch(console.error);
      }
    }

    // 2. Auto-Abandon: Revert tiles inactive > 120h (5 days) back to empty
    // SAFETY RULE: ONLY Instructors / Admins are permitted to run background abandon cleanup to prevent write storms
    const isInstructor = appUser.role === 'instructor' || appUser.role === 'admin';
    if (isInstructor && !hasCleanedAbandonRef.current) {
      const abandonedTiles = Object.values(tiles).filter((t) => {
        if (t.type !== 'player' || t.isOutpost || t.isCitadel) return false;
        if (citadelAuraTileIds.has(t.id)) return false;
        const lastTime = t.lastActive 
          ? new Date(t.lastActive).getTime() 
          : t.lastAttacked 
          ? new Date(t.lastAttacked).getTime() 
          : 0;
        if (!lastTime) return false;
        return (Date.now() - lastTime) > 120 * 3600 * 1000;
      });

      if (abandonedTiles.length > 0) {
        hasCleanedAbandonRef.current = true;
        const batch = writeBatch(db);
        abandonedTiles.slice(0, 50).forEach((t) => {
          batch.set(doc(db, 'empire_tiles', t.id), {
            id: t.id,
            x: t.x,
            y: t.y,
            type: 'empty'
          });
        });
        batch.commit().catch(console.error);
      }
    }
  }, [appUser, tiles, citadelAuraTileIds]);

  const handleTileClick = useCallback((x: number, y: number) => {
    if (hasMoved.current) return;
    setSelectedTile({ x, y });
  }, []);

  // Quick Jump to coordinates and center on screen
  const jumpToTile = (x: number, y: number) => {
    setSelectedTile({ x, y });
    if (!mapRef.current) return;
    // Estimate tile position taking zoom into account
    const tileW = Math.min(44, Math.max(28, window.innerWidth * 0.044));
    const targetX = x * (tileW + 2.5) * zoomLevel;
    const targetY = y * (tileW + 2.5) * zoomLevel;
    mapRef.current.scrollTo({
      left: targetX - mapRef.current.clientWidth / 2 + (tileW * zoomLevel) / 2,
      top: targetY - mapRef.current.clientHeight / 2 + (tileW * zoomLevel) / 2,
      behavior: 'smooth',
    });
  };

  // Zoom Handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(1.5, Math.round((prev + 0.2) * 100) / 100));
  };
  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.6, Math.round((prev - 0.2) * 100) / 100));
  };
  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Jump to Center of the Empire Map
  const jumpToCenter = () => {
    jumpToTile(25, 25);
  };

  // Auto-find safe landing site in Sanctuary Rim for new players
  const handleAutoFindSanctuary = () => {
    const emptySanctuaryTiles: { x: number; y: number }[] = [];
    for (let x = 0; x < MAP_SIZE; x++) {
      for (let y = 0; y < MAP_SIZE; y++) {
        if (!isSanctuaryZone(x, y)) continue;
        const id = `${x},${y}`;
        const t = tiles[id];
        if (!t || t.type === 'empty') {
          emptySanctuaryTiles.push({ x, y });
        }
      }
    }

    if (emptySanctuaryTiles.length > 0) {
      const picked = emptySanctuaryTiles[Math.floor(Math.random() * emptySanctuaryTiles.length)];
      jumpToTile(picked.x, picked.y);
      sfx.click();
    } else {
      const allEmpty = Object.values(tiles).filter((t) => t.type === 'empty');
      if (allEmpty.length > 0) {
        jumpToTile(allEmpty[0].x, allEmpty[0].y);
      }
    }
  };

  // Jump to User's Own Base
  const jumpToMyBase = () => {
    const myFirst = Object.values(tiles).find((t) => t.ownerUid === appUser?.uid);
    if (myFirst) {
      jumpToTile(myFirst.x, myFirst.y);
    }
  };

  // Jump to Nearest Boss
  const jumpToNearestBoss = () => {
    const myFirst = Object.values(tiles).find((t) => t.ownerUid === appUser?.uid);
    const bossList = Object.values(tiles).filter((t) => t.type === 'boss');
    if (bossList.length === 0) return;

    if (!myFirst) {
      jumpToTile(bossList[0].x, bossList[0].y);
      return;
    }

    // Find closest boss by Manhattan distance
    let closest = bossList[0];
    let minDist = 9999;
    bossList.forEach((b) => {
      const dist = Math.abs(b.x - myFirst.x) + Math.abs(b.y - myFirst.y);
      if (dist < minDist) {
        minDist = dist;
        closest = b;
      }
    });

    jumpToTile(closest.x, closest.y);
  };


  // Jump to Outpost
  const jumpToOutpost = () => {
    const outpostList = [
      { x: 10, y: 10 },
      { x: 39, y: 10 },
      { x: 10, y: 39 },
      { x: 39, y: 39 },
      { x: 6, y: 6 },
      { x: 23, y: 6 },
      { x: 6, y: 23 },
      { x: 23, y: 23 }
    ];
    const myFirst = Object.values(tiles).find((t) => t.ownerUid === appUser?.uid);
    if (!myFirst) {
      jumpToTile(outpostList[0].x, outpostList[0].y);
      return;
    }
    let closest = outpostList[0];
    let minDist = 9999;
    outpostList.forEach((o) => {
      const dist = Math.abs(o.x - myFirst.x) + Math.abs(o.y - myFirst.y);
      if (dist < minDist) {
        minDist = dist;
        closest = o;
      }
    });
    jumpToTile(closest.x, closest.y);
  };

  // Outpost Daily EXP Claim State
  const [claimingOutpost, setClaimingOutpost] = useState(false);
  const [claimSuccessMsg, setClaimSuccessMsg] = useState<string | null>(null);

  const handleClaimDailyExp = async (tileId: string) => {
    if (!appUser || claimingOutpost) return;
    const tileData = tiles[tileId];
    if (!tileData || tileData.ownerUid !== appUser.uid) return;

    const todayDate = new Date().toISOString().split('T')[0];
    if (tileData.lastClaimedDate === todayDate) {
      alert('คุณได้เก็บเกี่ยวผลผลิตจากป้อมนี้ไปแล้วในวันนี้! กรุณารอวันถัดไป');
      return;
    }

    setClaimingOutpost(true);
    try {
      // 1. Give +100 EXP to owner
      await updateDoc(doc(db, 'users', appUser.uid), {
        exp: increment(100),
        score: increment(100)
      });

      // 2. Update tile's lastClaimedDate
      await updateDoc(doc(db, 'empire_tiles', tileId), {
        lastClaimedDate: todayDate
      });

      // 3. Record history
      const { addDoc, collection: col } = await import('firebase/firestore');
      await addDoc(col(db, 'users', appUser.uid, 'history'), {
        gameId: 'empire-outpost-daily',
        gameName: 'Empire Outpost Daily Farm',
        score: 100,
        expEarned: 100,
        playedAt: new Date().toISOString()
      });

      sfx.levelUp();
      setClaimSuccessMsg(`🎉 เก็บเกี่ยวผลผลิตสำเร็จ! ได้รับ +100 EXP ประจำวันจากป้อมวิจัย`);
      setTimeout(() => setClaimSuccessMsg(null), 4000);
    } catch (e: any) {
      console.error('Failed to claim daily exp:', e);
    } finally {
      setClaimingOutpost(false);
    }
  };

  // Guild Management Handlers
  const handleCreateGuild = async () => {
    if (!appUser || !newGuildName.trim() || !newGuildTag.trim()) return;
    setIsCreatingGuild(true);
    try {
      const gId = `guild_${Date.now()}`;
      const creatorTilesCount = Object.values(tiles).filter((t) => t.ownerUid === appUser.uid).length;
      const newGuild: Guild = {
        id: gId,
        name: newGuildName.trim(),
        tag: newGuildTag.trim().toUpperCase(),
        color: newGuildColor,
        leaderUid: appUser.uid,
        leaderName: appUser.fullname,
        membersCount: 1,
        totalTiles: creatorTilesCount,
        createdAt: new Date().toISOString(),
      };

      const batch = writeBatch(db);
      batch.set(doc(db, 'guilds', gId), newGuild);
      batch.update(doc(db, 'users', appUser.uid), {
        guildId: gId,
        guildName: newGuild.name,
      });

      // Update current user's tiles to reflect guild atomically
      Object.values(tiles)
        .filter((t) => t.ownerUid === appUser.uid)
        .slice(0, 450)
        .forEach((t) => {
          batch.update(doc(db, 'empire_tiles', t.id), {
            guildId: gId,
            guildName: newGuild.name,
          });
        });
      await batch.commit();

      setNewGuildName('');
      setNewGuildTag('');
      setShowGuildModal(false);
    } catch (err) {
      console.error("Error creating guild:", err);
    } finally {
      setIsCreatingGuild(false);
    }
  };

  const handleUpdateGuildColor = async (color: string) => {
    if (!appUser?.guildId) return;
    const currentG = guilds[appUser.guildId];
    if (!currentG || currentG.leaderUid !== appUser.uid) return;
    try {
      await updateDoc(doc(db, 'guilds', currentG.id), { color });
    } catch (err) {
      console.error("Error updating guild color:", err);
    }
  };

  const handleJoinGuild = async (targetGuild: Guild) => {
    if (!appUser) return;
    try {
      const joiningUserTiles = Object.values(tiles).filter((t) => t.ownerUid === appUser.uid);
      const batch = writeBatch(db);

      batch.update(doc(db, 'guilds', targetGuild.id), {
        membersCount: (targetGuild.membersCount || 1) + 1,
        totalTiles: (targetGuild.totalTiles || 0) + joiningUserTiles.length,
      });
      batch.update(doc(db, 'users', appUser.uid), {
        guildId: targetGuild.id,
        guildName: targetGuild.name,
      });

      // Update tiles to match new guild atomically
      joiningUserTiles.slice(0, 450).forEach((t) => {
        batch.update(doc(db, 'empire_tiles', t.id), {
          guildId: targetGuild.id,
          guildName: targetGuild.name,
        });
      });
      await batch.commit();

      setShowGuildModal(false);
    } catch (err) {
      console.error("Error joining guild:", err);
    }
  };

  const handleLeaveGuild = async () => {
    if (!appUser || !appUser.guildId) return;
    const currentG = guilds[appUser.guildId];
    try {
      const leavingUserTiles = Object.values(tiles).filter((t) => t.ownerUid === appUser.uid);
      const batch = writeBatch(db);

      if (currentG) {
        batch.update(doc(db, 'guilds', currentG.id), {
          membersCount: Math.max(1, (currentG.membersCount || 2) - 1),
          totalTiles: Math.max(0, (currentG.totalTiles || 0) - leavingUserTiles.length),
        });
      }
      batch.update(doc(db, 'users', appUser.uid), {
        guildId: null,
        guildName: null,
      });

      // Remove guild tag from tiles atomically
      leavingUserTiles.slice(0, 450).forEach((t) => {
        batch.update(doc(db, 'empire_tiles', t.id), {
          guildId: null,
          guildName: null,
        });
      });
      await batch.commit();
    } catch (err) {
      console.error("Error leaving guild:", err);
    }
  };

  // Citadel Management Handlers
  const [donatingCitadelExp, setDonatingCitadelExp] = useState(false);

  const handleEstablishCitadel = async (tileId: string) => {
    if (!appUser?.guildId) return;
    const currentG = guilds[appUser.guildId];
    if (!currentG || currentG.leaderUid !== appUser.uid) {
      alert('เฉพาะหัวหน้ากิลด์เท่านั้นที่สามารถสถาปนานครหลวงกิลด์ (Guild Citadel) ได้');
      return;
    }

    // Lock: Cannot relocate citadel (future feature will use City Relocation Scroll)
    const hasExistingCitadel = Boolean(currentG.citadelCoord || (currentG.citadelCoords && currentG.citadelCoords.length > 0));
    if (hasExistingCitadel) {
      alert('🔒 นครหลวงกิลด์ (เมืองหลวง) ถูกสถาปนาแล้วและล็อคตำแหน่งไว้ ไม่สามารถย้ายเมืองหลวงได้ในขณะนี้\n\n(ระบบย้ายเมืองหลวงด้วย "ใบย้ายเมือง" จะเปิดให้ใช้งานในอนาคต)');
      return;
    }

    const [tx, ty] = tileId.split(',').map(Number);
    // Find a 2x2 square containing (tx, ty) where all 4 tiles belong to the guild
    const candidateOffsets = [
      [0, 0],   // (tx, ty) as top-left
      [-1, 0],  // (tx, ty) as top-right
      [0, -1],  // (tx, ty) as bottom-left
      [-1, -1], // (tx, ty) as bottom-right
    ];

    let validCoords: string[] | null = null;
    let anchorCoord: string | null = null;

    for (const [ox, oy] of candidateOffsets) {
      const ax = tx + ox;
      const ay = ty + oy;
      if (ax < 0 || ax + 1 >= MAP_SIZE || ay < 0 || ay + 1 >= MAP_SIZE) continue;

      const cluster = getCitadel2x2Coords(ax, ay);
      const allGuildOwnedAndValid = cluster.every((cid) => {
        const [cx, cy] = cid.split(',').map(Number);
        if (isCentralVaultZone(cx, cy)) return false;
        const t = tiles[cid];
        if (!t) return false;
        if (t.isOutpost || t.type === 'outpost') return false;
        // Check guild ownership: either tile.guildId matches OR tile.ownerUid is a member of this guild
        const isOwnedByGuild = t.guildId === appUser.guildId || (t.ownerUid && allUsers.some((u) => u.uid === t.ownerUid && u.guildId === appUser.guildId));
        return isOwnedByGuild;
      });

      if (allGuildOwnedAndValid) {
        validCoords = cluster;
        anchorCoord = `${ax},${ay}`;
        break;
      }
    }

    if (!validCoords || !anchorCoord) {
      alert(
        'การสถาปนานครหลวงกิลด์ต้องใช้พื้นที่อาณาเขตกิลด์ขนาด 4 ช่อง (บล็อกสี่เหลี่ยม 2×2 เซกเตอร์)\n\n' +
        'กรุณาให้สมาชิกกิลด์เข้ายึดพื้นที่รอบข้างให้เป็นกลุ่มก้อนสี่เหลี่ยม 2×2 ก่อนสถาปนา!'
      );
      return;
    }

    try {
      // 1. If previous citadel existed, clear isCitadel flag on old tiles
      const oldCoords = currentG.citadelCoords || (currentG.citadelCoord ? [currentG.citadelCoord] : []);
      const clearPromises = oldCoords
        .filter((cid) => tiles[cid]?.isCitadel)
        .map((cid) => updateDoc(doc(db, 'empire_tiles', cid), { isCitadel: false }));
      await Promise.all(clearPromises);

      // 2. Set new citadel flag on all 4 tiles
      const setPromises = validCoords.map((cid) =>
        updateDoc(doc(db, 'empire_tiles', cid), {
          isCitadel: true,
          guildId: appUser.guildId,
          guildName: currentG.name,
        })
      );
      await Promise.all(setPromises);

      // 3. Update guild record with 4-tile coordinates
      const lvl = currentG.citadelLevel || 1;
      await updateDoc(doc(db, 'guilds', currentG.id), {
        citadelCoord: anchorCoord,
        citadelCoords: validCoords,
        citadelLevel: lvl,
        citadelExp: currentG.citadelExp || 0,
        citadelHp: lvl * 1000 + 2500,
        maxCitadelHp: lvl * 1000 + 2500,
      });

      sfx.levelUp();
      setClaimSuccessMsg(
        `🏛️ สถาปนานครหลวงกิลด์ [${currentG.tag}] สำเร็จบนพื้นที่ 4 ช่อง [${validCoords.join(' , ')}]!`
      );
      setTimeout(() => setClaimSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error establishing citadel:', err);
      alert('เกิดข้อผิดพลาดในการสถาปนานครหลวง');
    }
  };

  const handleDonateCitadelExp = async (amount: number = 25) => {
    if (!appUser?.guildId || donatingCitadelExp) return;
    const currentG = guilds[appUser.guildId];
    if (!currentG || !currentG.citadelCoord) {
      alert('กิลด์ของคุณยังไม่มีนครหลวง กรุณาให้หัวหน้ากิลด์สถาปนานครหลวงก่อน');
      return;
    }
    if ((appUser.exp || 0) < amount + 20) {
      alert(`คุณมี EXP ไม่เพียงพอสำหรับการบริจาค (ต้องการขั้นต่ำ ${amount + 20} EXP)`);
      return;
    }

    setDonatingCitadelExp(true);
    try {
      // 1. Deduct user EXP
      await updateDoc(doc(db, 'users', appUser.uid), {
        exp: increment(-amount),
      });

      // 2. Add to guild citadel exp and check for level up
      const currentLevel = currentG.citadelLevel || 1;
      const currentExp = (currentG.citadelExp || 0) + amount;
      const neededExpForNext = currentLevel * 150; // LV1->2: 150 EXP, LV2->3: 300 EXP
      let newLevel = currentLevel;
      if (currentExp >= neededExpForNext && currentLevel < 5) {
        newLevel = currentLevel + 1;
      }

      await updateDoc(doc(db, 'guilds', currentG.id), {
        citadelExp: currentExp,
        citadelLevel: newLevel,
        maxCitadelHp: newLevel * 1000 + 2500,
      });

      sfx.levelUp();
      setClaimSuccessMsg(
        newLevel > currentLevel
          ? `🎉 นครหลวงกิลด์เลเวลอัป! ก้าวสู่ระดับ LV.${newLevel} รัศมีคุ้มกันและพลังป้องกันเพิ่มขึ้น!`
          : `🧪 บริจาค ${amount} EXP พัฒนานครหลวงกิลด์สำเร็จ!`
      );
      setTimeout(() => setClaimSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error donating to citadel:', err);
    } finally {
      setDonatingCitadelExp(false);
    }
  };

  const jumpToCitadel = () => {
    if (!appUser?.guildId) return;
    const currentG = guilds[appUser.guildId];
    if (currentG?.citadelCoord) {
      const [cx, cy] = currentG.citadelCoord.split(',').map(Number);
      jumpToTile(cx, cy);
      setShowNavMenu(false);
    } else {
      alert('กิลด์ของคุณยังไม่ได้สถาปนานครหลวง');
    }
  };

  const handleResetMyQuota = async () => {
    if (!appUser) return;
    if (confirm('🔄 [สิทธิ์อาจารย์/ผู้ดูแล] ต้องการรีเซ็ตโควตาการบุกรุกของตนเองกลับเป็น 10/10 เพื่อทดสอบระบบหรือไม่?')) {
      try {
        const userRef = doc(db, 'users', appUser.uid);
        await updateDoc(userRef, {
          dailyEmpireBattles: {
            date: getTodayDateString(),
            count: 0
          }
        });
        alert('✅ รีเซ็ตโควตาสำเร็จ! โควตากลับเป็น 10/10 แล้ว');
      } catch (err) {
        console.error('Failed to reset quota:', err);
      }
    }
  };

  // Open Scout Drone Quiz Modal for selected tile
  const handleOpenScoutModal = (x: number, y: number) => {
    // Check Daily Scout Drone Limit
    if (!dailyScoutInfo.canScout) {
      alert(`⛔ แบตเตอรี่โดรนสอดแนมหมด! คุณใช้โควตาสอดแนมครบ ${DAILY_SCOUT_DRONE_LIMIT} ครั้งสำหรับวันนี้แล้ว (รีเซ็ตทุกเที่ยงคืน)`);
      return;
    }

    setScoutTarget({ x, y });
    setScoutQIndex(Math.floor(Math.random() * scoutQuestions.length));
    setScoutFeedback(null);
    setShowScoutModal(true);
    sfx.click();
  };

  // Reset Scout Drone Quota (Instructor/GM test helper)
  const handleResetScoutQuota = async () => {
    if (!appUser) return;
    if (confirm('🔄 [สิทธิ์อาจารย์/ผู้ดูแล] ต้องการรีเซ็ตโควตาโดรนสอดแนมของตนเองกลับเป็น 5/5 หรือไม่?')) {
      try {
        const userRef = doc(db, 'users', appUser.uid);
        await updateDoc(userRef, {
          dailyScoutDrones: {
            date: getTodayDateString(),
            count: 0
          }
        });
        alert('✅ รีเซ็ตโควตาโดรนสำเร็จ! แบตเตอรี่กลับเป็น 5/5 แล้ว');
      } catch (err) {
        console.error('Failed to reset scout quota:', err);
      }
    }
  };

  // Handle Scout Drone Quiz Answer submission
  const handleAnswerScoutQuiz = async (selectedOptionIndex: number) => {
    if (!appUser || !scoutTarget || isScouting) return;

    if (!dailyScoutInfo.canScout) {
      alert(`⛔ โควตาสอดแนมสำหรับวันนี้หมดแล้ว (${DAILY_SCOUT_DRONE_LIMIT}/${DAILY_SCOUT_DRONE_LIMIT})`);
      setShowScoutModal(false);
      return;
    }

    const currentQuiz = scoutQuestions[scoutQIndex];
    if (selectedOptionIndex !== currentQuiz.ans) {
      sfx.wrong();
      setScoutFeedback({
        isCorrect: false,
        text: `❌ ยังไม่ถูกต้อง! คำอธิบาย: ${currentQuiz.explanation}`
      });
      return;
    }

    // Correct Answer: Reveal 5x5 area (up to 25 tiles) centered at target
    setIsScouting(true);
    sfx.correct();
    setScoutFeedback({
      isCorrect: true,
      text: `🎉 ตอบถูกต้อง! ${currentQuiz.explanation}`
    });

    try {
      const revealedTiles: string[] = [];
      for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
          const rx = scoutTarget.x + dx;
          const ry = scoutTarget.y + dy;
          if (rx >= 0 && rx < MAP_SIZE && ry >= 0 && ry < MAP_SIZE) {
            revealedTiles.push(`${rx},${ry}`);
          }
        }
      }

      // Calculate total explored set including previous explored tiles + revealed tiles + guild conquered tiles
      const previousExplored = Array.isArray(appUser.exploredTiles) ? appUser.exploredTiles : [];
      const guildTiles = appUser.guildId
        ? Object.values(tiles).filter((t) => t.guildId === appUser.guildId).map((t) => `${t.x},${t.y}`)
        : [];
      const totalExploredSet = new Set([...previousExplored, ...revealedTiles, ...guildTiles]);
      const currentBadges = Array.isArray(appUser.badges) ? [...appUser.badges] : [];
      const newBadgesToAdd: string[] = [];

      // Check Badges:
      // 🥉 Junior Explorer: สำรวจครบ 25% (>= 625 tiles)
      if (totalExploredSet.size >= (MAP_SIZE * MAP_SIZE * 0.25) && !currentBadges.includes('Junior Explorer')) {
        newBadgesToAdd.push('Junior Explorer');
      }
      // 🥈 Master Cartographer: สำรวจครบ 50% (>= 1250 tiles)
      if (totalExploredSet.size >= (MAP_SIZE * MAP_SIZE * 0.5) && !currentBadges.includes('Master Cartographer')) {
        newBadgesToAdd.push('Master Cartographer');
      }
      // 🥇 Grand Conqueror: สำรวจครบ 100% (>= 2500 tiles)
      if (totalExploredSet.size >= (MAP_SIZE * MAP_SIZE) && !currentBadges.includes('Grand Conqueror')) {
        newBadgesToAdd.push('Grand Conqueror');
      }

      // Save permanently to user's profile with arrayUnion, increment dailyScoutDrones count, and award +25 EXP
      const userRef = doc(db, 'users', appUser.uid);
      const today = getTodayDateString();
      const currentScouts = (appUser.dailyScoutDrones?.date === today ? (Number(appUser.dailyScoutDrones?.count) || 0) : 0) + 1;

      const updatePayload: any = {
        exploredTiles: arrayUnion(...revealedTiles),
        dailyScoutDrones: {
          date: today,
          count: currentScouts
        },
        exp: increment(25),
        score: increment(25)
      };

      if (newBadgesToAdd.length > 0) {
        updatePayload.badges = arrayUnion(...newBadgesToAdd);
      }

      await updateDoc(userRef, updatePayload);

      sfx.levelUp();
      const badgeText = newBadgesToAdd.length > 0 ? ` 🎖️ ปลดล็อคเหรียญตรา: ${newBadgesToAdd.join(', ')}!` : '';
      setClaimSuccessMsg(`🛸 โดรนสแกนสำเร็จ! ปลดล็อคหมอก 25 เซกเตอร์ และรับ +25 EXP (เหลือโควตาวันนี้ ${Math.max(0, DAILY_SCOUT_DRONE_LIMIT - currentScouts)} ครั้ง)${badgeText}`);
      setTimeout(() => setClaimSuccessMsg(null), 5000);

      // Close modal after brief success presentation
      setTimeout(() => {
        setShowScoutModal(false);
        setScoutFeedback(null);
        setIsScouting(false);
      }, 1500);
    } catch (err) {
      console.error('Error scouting tiles:', err);
      setIsScouting(false);
    }
  };



  const handleAction = () => {
    if (!selectedTile || !canInfect) return;

    // Check Daily Attack Limit (exempt first base placement)
    if (stats.myCount > 0 && !dailyEmpireInfo.canAttack) {
      alert(`⛔ คุณใช้โควตาการบุกรุกครบ ${DAILY_EMPIRE_ATTACK_LIMIT} ครั้งสำหรับวันนี้แล้ว! (รีเซ็ตทุกเที่ยงคืน)`);
      return;
    }

    if (appUser?.pet?.isInjured) {
      if (confirm('🚨 ไวรัสของคุณบาดเจ็บจากการรบและพลังชีวิตหมดลง! ต้องการไปห้องเพาะเลี้ยงเพื่อทำหัตถการรักษาและฟื้นฟู HP หรือไม่?')) {
        router.push('/student/virus-pet');
      }
      return;
    }
    router.push(`/student/empire/battle?tile=${selectedTile.x},${selectedTile.y}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-950 text-cyan-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="font-mono text-xs uppercase tracking-wider">กำลังโหลดแผนที่...</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-slate-950 text-slate-100 flex flex-col select-none">
      
      {/* 1. Slim Modern Top Navigation Bar (HUD Style) */}
      <header className="z-30 bg-slate-900/95 border-b border-slate-800/80 px-2 sm:px-4 py-2 backdrop-blur-md shrink-0 flex items-center justify-between gap-1 sm:gap-2 shadow-lg">
        {/* Left: Back Arrow, Title, and Attack Quota */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <Link 
            href="/student" 
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            title="กลับหน้าหลัก"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <h1 className="text-xs sm:text-base font-black text-white tracking-wide">
              อาณาจักร
            </h1>
            <span className="text-[9px] sm:text-[10px] font-mono px-1 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              50×50
            </span>
          </div>

          {/* Daily Quota Badge */}
          <button
            type="button"
            onClick={appUser?.role === 'instructor' ? handleResetMyQuota : undefined}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-bold font-mono border flex items-center gap-1 shadow-sm shrink-0 transition-all ${
              dailyEmpireInfo.canAttack 
                ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-300' 
                : 'bg-red-950/80 border-red-500/50 text-red-300'
            } ${appUser?.role === 'instructor' ? 'cursor-pointer hover:border-amber-400/80 active:scale-95' : 'cursor-default'}`}
            title={appUser?.role === 'instructor' ? "คลิกเพื่อรีเซ็ตโควตาทดสอบ (สิทธิ์อาจารย์/ผู้ดูแล)" : "โควตาการบุกรุกประจำวัน รีเซ็ตทุกเที่ยงคืน"}
          >
            <Swords className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">โควตา:</span>
            <span>{dailyEmpireInfo.remainingAttacks}/{DAILY_EMPIRE_ATTACK_LIMIT}</span>
            {appUser?.role === 'instructor' && (
              <span className="text-[9px] text-amber-400/80 hover:text-amber-300 font-bold ml-0.5" title="รีเซ็ตโควตา">↺</span>
            )}
          </button>

          {/* Daily Scout Drone Quota Badge (5/5 per day) */}
          <button
            type="button"
            onClick={appUser?.role === 'instructor' ? handleResetScoutQuota : undefined}
            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-bold font-mono border flex items-center gap-1 shadow-sm shrink-0 transition-all ${
              dailyScoutInfo.canScout 
                ? 'bg-blue-950/80 border-blue-500/40 text-blue-300' 
                : 'bg-red-950/80 border-red-500/50 text-red-300'
            } ${appUser?.role === 'instructor' ? 'cursor-pointer hover:border-amber-400/80 active:scale-95' : 'cursor-default'}`}
            title={appUser?.role === 'instructor' ? "คลิกเพื่อรีเซ็ตโควตาโดรนทดสอบ (สิทธิ์อาจารย์/ผู้ดูแล)" : "แบตเตอรี่โดรนสอดแนมประจำวัน (รีเซ็ตทุกเที่ยงคืน)"}
          >
            <Rocket className="w-3 h-3 text-cyan-400" />
            <span className="hidden sm:inline">โดรน:</span>
            <span>{dailyScoutInfo.remainingScouts}/{DAILY_SCOUT_DRONE_LIMIT}</span>
            {appUser?.role === 'instructor' && (
              <span className="text-[9px] text-amber-400/80 hover:text-amber-300 font-bold ml-0.5" title="รีเซ็ตโควตาโดรน">↺</span>
            )}
          </button>
        </div>

        {/* Right: Navigation (mobile), GM Toggle, Exploration %, Quick Stats, Guild, and Rules */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* GM View Mode Toggle Button (For never.away@gmail.com and instructors) */}
          {isGmUser && (
            <button
              type="button"
              onClick={() => {
                setGmViewMode((prev) => (prev === 'all' ? 'fog' : 'all'));
                sfx.click();
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-xl text-[10px] sm:text-xs font-mono font-bold border transition-all flex items-center gap-1 shadow-sm active:scale-95 ${
                gmViewMode === 'all'
                  ? 'bg-amber-950/90 border-amber-500/70 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-800/90 border-slate-600 text-slate-300'
              }`}
              title="สลับมุมมอง GM: มองเห็นทั้งแผนที่ 50x50 หรือจำลองมุมมองหมอกสงครามของผู้เล่น"
            >
              {gmViewMode === 'all' ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">GM:</span>
                  <span>เห็นทั้งหมด</span>
                </>
              ) : (
                <>
                  <CloudFog className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">GM:</span>
                  <span>จำลองหมอก</span>
                </>
              )}
            </button>
          )}

          {/* Map Exploration Progress Badge */}
          <div 
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/80 border border-slate-700/80 text-[10px] sm:text-xs font-mono font-bold text-slate-300"
            title={`พื้นที่ที่คุณและกิลด์สำรวจแล้ว: ${explorationPercent}% (${effectiveExploredCount}/2,500 เซกเตอร์) (ปลดล็อคผ่านโดรนสอดแนม/ฐานกิลด์)`}
          >
            <CloudFog className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300">{explorationPercent}%</span>
          </div>

          {/* Mobile-Only Fast Travel & Zoom Nav Button */}
          <button
            type="button"
            onClick={() => setShowNavMenu(true)}
            className="md:hidden px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 transition-all flex items-center gap-1 shadow-sm active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.25)]"
            title="เครื่องมือนำทางและซูมแผนที่"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">นำทาง</span>
          </button>

          {/* Quick Stats Pill */}
          <button
            type="button"
            onClick={() => setShowStatsModal(true)}
            className="px-2 sm:px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all flex items-center gap-1 shadow-sm active:scale-95"
            title="ดูสถิติดินแดนทั้งแผนที่"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300 font-black">{stats.myCount}</span>
            <span className="text-slate-500 text-[10px] hidden sm:inline">/ 2,500</span>
          </button>

          {/* Guild Button (with truncation to prevent overflow) */}
          <button
            type="button"
            onClick={() => setShowGuildModal(true)}
            className={`px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold font-mono border transition-all flex items-center gap-1 shadow-sm active:scale-95 max-w-[95px] sm:max-w-[140px] ${
              appUser?.guildId
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="ระบบพันธมิตรกิลด์"
          >
            <Users className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{appUser?.guildName ? `[${appUser.guildName}]` : 'กิลด์'}</span>
          </button>

          {/* Rules Button */}
          <button
            type="button"
            onClick={() => setShowRulesModal(true)}
            className="px-2 sm:px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-900/60 transition-all flex items-center gap-1 shadow-sm active:scale-95 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
            title="ดูกฎและกติกาการทำสงครามอาณาจักร"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">กติกา</span>
          </button>
        </div>
      </header>

      {/* Floating Claim Success Toast */}
      {claimSuccessMsg && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 p-2.5 px-4 rounded-2xl bg-emerald-500/90 border border-emerald-400 text-slate-950 font-black text-xs sm:text-sm animate-in fade-in slide-in-from-top-3 flex items-center gap-2 shadow-[0_10px_30px_rgba(16,185,129,0.5)] backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-slate-950 animate-spin" />
          <span>{claimSuccessMsg}</span>
        </div>
      )}

      {/* 2. PC-Only Floating Tactical Menu (Hidden on mobile to avoid blocking tiles, visible on PC) */}
      <div className="hidden md:flex fixed top-16 right-4 z-30 flex-col gap-2 pointer-events-auto animate-in fade-in duration-200">
        {!isPcMenuMinimized ? (
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 shadow-2xl flex flex-col gap-1.5 w-44">
            {/* Header of PC Menu */}
            <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 font-bold text-slate-200">
                <Compass className="w-3.5 h-3.5 text-cyan-400" /> เมนูนำทาง
              </span>
              <button
                type="button"
                onClick={() => setIsPcMenuMinimized(true)}
                className="p-0.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-xs"
                title="ย่อเมนู"
              >
                —
              </button>
            </div>

            {/* If 0 bases: Magic Auto-Find Landing Site Button */}
            {stats.myCount === 0 && (
              <button
                type="button"
                onClick={handleAutoFindSanctuary}
                className="w-full px-2.5 py-1.5 rounded-xl text-xs font-black font-mono bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse"
                title="สุ่มหาจุดเกิดปลอดภัยสำหรับสถาปนาฐานแรก"
              >
                <Rocket className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                <span className="truncate">🚀 หาจุดเกิด</span>
              </button>
            )}

            {/* Jump to My Base */}
            {stats.myCount > 0 && (
              <button
                type="button"
                onClick={jumpToMyBase}
                className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 transition-all flex items-center gap-2 shadow-sm active:scale-95"
                title="เลื่อนไปหาฐานทัพหลักของคุณ"
              >
                <Home className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">🏠 ฐานฉัน</span>
              </button>
            )}

            {/* Guild Citadel Quick Jump */}
            {appUser?.guildId && guilds[appUser.guildId]?.citadelCoord && (
              <button
                type="button"
                onClick={jumpToCitadel}
                className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-amber-950/80 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 transition-all flex items-center gap-2 shadow-sm active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                title="เลื่อนไปยังนครหลวงกิลด์ของคุณ"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                <span className="truncate">🏛️ นครหลวง</span>
              </button>
            )}

            {/* Nearest Boss */}
            <button
              type="button"
              onClick={jumpToNearestBoss}
              className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-red-950/80 hover:bg-red-900/80 border border-red-500/40 text-red-300 transition-all flex items-center gap-2 shadow-sm active:scale-95"
              title="เลื่อนไปหาบอสที่ใกล้ที่สุด"
            >
              <Target className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="truncate">⚔️ ล่าบอส</span>
            </button>

            {/* Farm Outpost */}
            <button
              type="button"
              onClick={jumpToOutpost}
              className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 transition-all flex items-center gap-2 shadow-sm active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              title="เลื่อนไปหาป้อมฟาร์มวิจัย (รับ 100 EXP/วัน)"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
              <span className="truncate">🌾 ป้อมฟาร์ม</span>
            </button>

            {/* Center of Map */}
            <button
              type="button"
              onClick={jumpToCenter}
              className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-amber-950/80 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 transition-all flex items-center gap-2 shadow-sm active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
              title="เลื่อนไปยังใจกลางสมรภูมิ (Center 25,25)"
            >
              <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">🏛️ ใจกลาง (25,25)</span>
            </button>

            {/* Safe Sanctuary Zone */}
            <button
              type="button"
              onClick={() => jumpToTile(2, 2)}
              className="w-full px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-sky-950/80 hover:bg-sky-900/80 border border-sky-500/40 text-sky-300 transition-all flex items-center gap-2 shadow-sm active:scale-95 shadow-[0_0_12px_rgba(14,165,233,0.2)]"
              title="เลื่อนไปยังเขตเกิดปลอดภัย 4 ทิศ (Outer Ring Sanctuary)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">🛡️ เขตปลอดภัย (2,2)</span>
            </button>

            {/* Zoom Controls inside PC Menu */}
            <div className="pt-1.5 mt-0.5 border-t border-slate-800 flex items-center justify-between px-1">
              <span className="text-[10px] font-mono text-slate-400">ซูม</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-90 text-xs font-bold"
                  title="ซูมออก (-)"
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-800/80 text-cyan-400 hover:text-white"
                  title="รีเซ็ต 100%"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center active:scale-90 text-xs font-bold"
                  title="ซูมเข้า (+)"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Minimized PC Button */
          <button
            type="button"
            onClick={() => setIsPcMenuMinimized(false)}
            className="w-10 h-10 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center shadow-xl backdrop-blur-md transition-all active:scale-95 hover:border-cyan-500/50"
            title="เปิดเมนูนำทาง"
          >
            <Compass className="w-5 h-5 text-cyan-400" />
          </button>
        )}
      </div>

      {/* Navigation & Zoom Modal (Opens from Header 'นำทาง' Button, Never Blocks Sectors!) */}
      {showNavMenu && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm sm:max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Compass className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                  นำทาง & ควบคุมแผนที่
                </h2>
              </div>
              <button 
                onClick={() => setShowNavMenu(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="ปิด"
              >
                ✕
              </button>
            </div>

            {/* 1. Zoom Controls */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="flex items-center gap-1.5 font-bold text-slate-200">
                  <ZoomIn className="w-3.5 h-3.5 text-cyan-400" /> ปรับขนาดการมองเห็น (Zoom)
                </span>
                <span className="text-cyan-400 font-black">{Math.round(zoomLevel * 100)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <ZoomOut className="w-3.5 h-3.5" /> ซูมออก (-)
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-cyan-400 font-mono text-xs active:scale-95 transition-all"
                  title="รีเซ็ตขนาด 100%"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> ซูมเข้า (+)
                </button>
              </div>
            </div>

            {/* 2. Fast Travel Locations */}
            <div className="space-y-2">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider px-1">
                วาร์ปไปยังพิกัดสำคัญ (Fast Travel)
              </div>
              <div className="grid grid-cols-2 gap-2">
                
                {/* Auto-Find Sanctuary for New Players */}
                {stats.myCount === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      handleAutoFindSanctuary();
                      setShowNavMenu(false);
                    }}
                    className="col-span-2 p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs font-mono flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all active:scale-95 animate-pulse"
                  >
                    <Rocket className="w-4 h-4 text-slate-950" />
                    <span>🎯 สุ่มหาจุดเกิดปลอดภัย (Sanctuary)</span>
                  </button>
                )}

                {/* Jump to My Base */}
                {stats.myCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      jumpToMyBase();
                      setShowNavMenu(false);
                    }}
                    className="p-2.5 rounded-2xl bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-500/40 text-cyan-300 font-bold font-mono text-xs flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Home className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="truncate">🏠 ฐานของฉัน</span>
                  </button>
                )}

                {/* Jump to Guild Citadel */}
                {appUser?.guildId && guilds[appUser.guildId]?.citadelCoord && (
                  <button
                    type="button"
                    onClick={() => {
                      jumpToCitadel();
                      setShowNavMenu(false);
                    }}
                    className="p-2.5 rounded-2xl bg-amber-950/70 hover:bg-amber-900/70 border border-amber-500/50 text-amber-300 font-bold font-mono text-xs flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                    <span className="truncate">🏛️ นครหลวงกิลด์</span>
                  </button>
                )}

                {/* Nearest Boss */}
                <button
                  type="button"
                  onClick={() => {
                    jumpToNearestBoss();
                    setShowNavMenu(false);
                  }}
                  className="p-2.5 rounded-2xl bg-red-950/70 hover:bg-red-900/70 border border-red-500/40 text-red-300 font-bold font-mono text-xs flex items-center gap-2 transition-all active:scale-95"
                >
                  <Target className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="truncate">⚔️ ล่าบอสผู้พิทักษ์</span>
                </button>

                {/* Farm Outpost */}
                <button
                  type="button"
                  onClick={() => {
                    jumpToOutpost();
                    setShowNavMenu(false);
                  }}
                  className="p-2.5 rounded-2xl bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-500/40 text-emerald-300 font-bold font-mono text-xs flex items-center gap-2 transition-all active:scale-95"
                >
                  <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                  <span className="truncate">🌾 ป้อมฟาร์ม (+100 EXP)</span>
                </button>

                {/* Center of Map */}
                <button
                  type="button"
                  onClick={() => {
                    jumpToCenter();
                    setShowNavMenu(false);
                  }}
                  className="p-2.5 rounded-2xl bg-amber-950/70 hover:bg-amber-900/70 border border-amber-500/40 text-amber-300 font-bold font-mono text-xs flex items-center gap-2 transition-all active:scale-95"
                >
                  <Compass className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">🏛️ ใจกลาง (25, 25)</span>
                </button>

                {/* Safe Sanctuary Zone */}
                <button
                  type="button"
                  onClick={() => {
                    jumpToTile(2, 2);
                    setShowNavMenu(false);
                  }}
                  className="p-2.5 rounded-2xl bg-sky-950/70 hover:bg-sky-900/70 border border-sky-500/40 text-sky-300 font-bold font-mono text-xs flex items-center gap-2 transition-all active:scale-95"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="truncate">🛡️ เขตปลอดภัย (2, 2)</span>
                </button>

              </div>
            </div>

            {/* Footer */}
            <div className="pt-1 text-center border-t border-slate-800">
              <button 
                type="button"
                onClick={() => setShowNavMenu(false)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold font-mono transition-colors"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 3. Full-Width Edge-to-Edge Drag-to-Pan Viewport (No Scrollbars) */}
      <main
        ref={mapRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className="flex-1 overflow-auto no-scrollbar cursor-grab active:cursor-grabbing select-none p-6 sm:p-12 pb-28 sm:pb-32 bg-slate-950 touch-pan-x touch-pan-y relative"
      >
        <div
          className="relative select-none mx-auto w-max transition-transform duration-150 origin-top-left"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${MAP_SIZE}, 1fr)`,
            gap: '2.5px',
            transform: `scale(${zoomLevel})`,
          }}
        >
          {Array.from({ length: MAP_SIZE * MAP_SIZE }).map((_, i) => {
            const x = i % MAP_SIZE;
            const y = Math.floor(i / MAP_SIZE);
            const id = `${x},${y}`;
            const tile = tiles[id];
            const isSelected = selectedTile?.x === x && selectedTile?.y === y;
            const isMyTileOnMap = tile?.ownerUid === appUser?.uid;
            const isAttackable = attackableTileIds.has(id);
            const hasBase = stats.myCount > 0;
            const isSanctuary = isSanctuaryZone(x, y);
            const isShielded = isShieldedTile(tile);
            const guildObj = tile?.guildId ? guilds[tile.guildId] : null;
            const isCitadel = tile?.isCitadel || 
              (guildObj?.citadelCoords && guildObj.citadelCoords.includes(id)) || 
              (guildObj?.citadelCoord === id);
            const isInCitadelZone = citadelAuraTileIds.has(id);
            const isDecayed = isDecayedTile(tile, guildObj?.citadelCoord, guildObj?.citadelCoords);

            const playerColor = tile?.type === 'player' && tile.ownerUid
              ? getPlayerUniqueColor(tile.ownerUid, isMyTileOnMap)
              : undefined;

            const isAllyGuildTile = tile?.guildId && appUser?.guildId && tile.guildId === appUser.guildId;
            const isOutpost = tile?.type === 'outpost' || tile?.isOutpost;

            // Guild & Player Color Logic: If in a guild, use the guild's assigned color!
            const tileBgColor = isShielded
              ? '#083344'
              : guildObj?.color
              ? guildObj.color
              : playerColor
              ? isMyTileOnMap
                ? `${playerColor}ee`
                : isAllyGuildTile
                ? `${playerColor}88`
                : `${playerColor}55`
              : isOutpost
              ? '#064e3b'
              : tile?.type === 'boss'
              ? '#b91c1c'
              : isSanctuary
              ? '#082f49'
              : '#0f172a';

            const isVisible = isTileVisible(x, y);

            // Fog of War Cell Rendering: If tile is concealed by fog
            if (!isVisible) {
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleTileClick(x, y)}
                  className={`relative rounded-sm overflow-hidden flex items-center justify-center transition-all ${
                    isSelected ? 'z-20 ring-2 ring-cyan-400 scale-110 shadow-lg' : 'hover:border-slate-600'
                  }`}
                  style={{
                    width: 'clamp(28px, 4.4vw, 44px)',
                    height: 'clamp(28px, 4.4vw, 44px)',
                    backgroundColor: '#020617', // Pitch dark
                    border: isSelected ? '1.5px solid #22d3ee' : '1px dashed #1e293b',
                    backgroundImage: 'radial-gradient(circle, rgba(30,41,59,0.7) 1px, transparent 1px)',
                    backgroundSize: '6px 6px',
                  }}
                  title={`[หมอกสงคราม] พิกัด [${x}, ${y}] - ส่งโดรนสอดแนมเพื่อเปิดแผนที่`}
                >
                  <CloudFog className="w-3.5 h-3.5 text-slate-700/80 animate-pulse pointer-events-none" />
                </button>
              );
            }

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleTileClick(x, y)}
                className={`relative rounded-sm overflow-hidden flex items-center justify-center transition-transform active:scale-90 ${
                  isSelected ? 'z-20 ring-2 ring-white scale-110 shadow-lg' : ''
                }`}
                style={{
                  width: 'clamp(28px, 4.4vw, 44px)',
                  height: 'clamp(28px, 4.4vw, 44px)',
                  backgroundColor: tileBgColor,
                  border: isMyTileOnMap
                    ? isOutpost
                      ? '2.5px solid #34d399'
                      : '2px solid #ffffff'
                    : isAllyGuildTile
                    ? '2px solid #fbbf24'
                    : guildObj?.color
                    ? `1.5px solid ${guildObj.color}`
                    : playerColor
                    ? `1.5px solid ${playerColor}`
                    : isCitadel
                    ? '2px solid #f59e0b'
                    : isShielded
                    ? '2px solid #06b6d4'
                    : isDecayed
                    ? '1.5px dashed #f59e0b'
                    : isOutpost
                    ? '2px solid #10b981'
                    : !hasBase && isSelected
                    ? '2px solid #34d399'
                    : hasBase && isAttackable
                    ? '1.5px dashed #22c55e'
                    : tile?.type === 'boss'
                    ? '1.5px solid #f87171'
                    : isSanctuary
                    ? '1px dashed #0284c7'
                    : '1px solid #1e293b',
                  boxShadow: isCitadel
                    ? '0 0 14px rgba(245,158,11,0.9)'
                    : isShielded
                    ? '0 0 10px rgba(6,182,212,0.85)'
                    : isOutpost
                    ? '0 0 12px rgba(16,185,129,0.7)'
                    : isMyTileOnMap
                    ? `0 0 10px rgba(255,255,255,0.7)`
                    : isAllyGuildTile
                    ? `0 0 8px rgba(251,191,36,0.6)`
                    : isInCitadelZone
                    ? 'inset 0 0 6px rgba(245,158,11,0.5)'
                    : guildObj?.color
                    ? `0 0 6px ${guildObj.color}50`
                    : playerColor
                    ? `0 0 6px ${playerColor}40`
                    : !hasBase && isSelected
                    ? '0 0 12px rgba(52,211,153,0.8)'
                    : hasBase && isAttackable
                    ? '0 0 6px rgba(34,197,94,0.45)'
                    : undefined,
                  opacity: isDecayed ? 0.75 : 1,
                }}
              >
                {/* Attackable Reach Indicator Dot (Only when player already has a base) */}
                {hasBase && isAttackable && !isMyTileOnMap && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse pointer-events-none" />
                )}

                {/* Citadel Icon */}
                {isCitadel && (
                  <div className="w-full h-full p-1 flex items-center justify-center text-amber-300">
                    <Building2 className="w-full h-full drop-shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-pulse" />
                  </div>
                )}

                {/* Outpost Icon (Unclaimed or Claimed) */}
                {isOutpost && !tile?.ownerFamily && !isCitadel && (
                  <div className="w-full h-full p-1 flex items-center justify-center text-emerald-300">
                    <Radio className="w-full h-full animate-pulse text-emerald-400" />
                  </div>
                )}

                {/* Boss Icon */}
                {tile?.type === 'boss' && !isCitadel && (
                  <div className="w-full h-full p-0.5 flex items-center justify-center text-white">
                    <SVGVirus type={tile.ownerFamily as any || 'corona'} className="w-full h-full" />
                  </div>
                )}

                {/* Player Icon */}
                {tile?.type === 'player' && tile.ownerFamily && !isCitadel && (
                  <div className="w-full h-full p-0.5 flex items-center justify-center relative">
                    {tile.bonusExp && (
                      <Crown className="w-2.5 h-2.5 text-yellow-300 absolute -top-0.5 -right-0.5 drop-shadow z-10" />
                    )}
                    {isOutpost && (
                      <Radio className="w-2.5 h-2.5 text-emerald-300 absolute -top-0.5 -right-0.5 drop-shadow z-10 animate-pulse" />
                    )}
                    <SVGVirus
                      type={tile.ownerFamily as any}
                      className={`w-full h-full ${isMyTileOnMap ? 'text-white' : 'text-slate-200'}`}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </main>

      {/* 4. Floating Bottom Action Drawer (Thumb-Friendly Mobile-Ready) */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-2 sm:p-4 max-w-4xl mx-auto pointer-events-none">
        {selectedTile ? (
          <div className="pointer-events-auto bg-slate-900/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between gap-2.5 sm:gap-4">
              
              {/* Check if Selected Tile is in Fog of War */}
              {!isTileVisible(selectedTile.x, selectedTile.y) ? (
                <>
                  {/* Fog Radar Hologram Icon */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-950/90 border border-slate-800 shrink-0 overflow-hidden relative shadow-inner flex items-center justify-center">
                    <CloudFog className="w-6 h-6 text-cyan-400 animate-pulse" />
                  </div>

                  {/* Fog Info Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
                      <span className="text-white font-black">เซกเตอร์ [{selectedTile.x}, {selectedTile.y}]</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded font-mono">
                        ปกคลุมด้วยหมอกสงคราม (Uncharted)
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      ส่งโดรนสอดแนมตอบคำถามไวรัสวิทยาเพื่อเปิดแผนที่ 5×5 ถาวร (+25 EXP)
                    </div>
                  </div>

                  {/* Scout Drone Button */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!dailyScoutInfo.canScout}
                      onClick={() => handleOpenScoutModal(selectedTile.x, selectedTile.y)}
                      className={`h-10 sm:h-11 px-3.5 sm:px-5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                        dailyScoutInfo.canScout
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)] active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-slate-700/80 cursor-not-allowed'
                      }`}
                    >
                      {dailyScoutInfo.canScout ? (
                        <>
                          <Rocket className="w-4 h-4 text-slate-950 animate-bounce" />
                          <span>🛸 ส่งโดรนสอดแนม ({dailyScoutInfo.remainingScouts}/{DAILY_SCOUT_DRONE_LIMIT})</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-slate-500" />
                          <span>แบตหมด ({DAILY_SCOUT_DRONE_LIMIT}/{DAILY_SCOUT_DRONE_LIMIT})</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTile(null)}
                      className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                      title="ปิดกล่องข้อมูล"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
              {/* 3D Target Pet Hologram Preview */}
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-950/90 border border-slate-700/80 shrink-0 overflow-hidden relative shadow-inner flex items-center justify-center">
                {(activeTileData?.isCitadel ||
                  (activeTileData?.guildId &&
                    (guilds[activeTileData.guildId]?.citadelCoords?.includes(`${selectedTile.x},${selectedTile.y}`) ||
                      guilds[activeTileData.guildId]?.citadelCoord === `${selectedTile.x},${selectedTile.y}`))) ? (
                  <div className="w-full h-full flex items-center justify-center bg-amber-950/60 text-amber-300 shadow-[inset_0_0_12px_rgba(245,158,11,0.5)]">
                    <Building2 className="w-6 h-6 text-amber-400 animate-pulse" />
                  </div>
                ) : (activeTileData?.type === 'outpost' || activeTileData?.isOutpost) ? (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-950/60 text-emerald-300 shadow-[inset_0_0_10px_rgba(16,185,129,0.4)]">
                    <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
                  </div>
                ) : activeTileData?.type === 'boss' ? (
                  <VirusViewer3D 
                    type="corona" 
                    color="#ef4444" 
                    interactive={false} 
                    className="w-full h-full scale-125" 
                  />
                ) : activeTileData?.type === 'player' ? (
                  <VirusViewer3D 
                    type={familyToVirusType(activeTileData.ownerFamily || 'parvo')} 
                    color={
                      activeTileData.guildId && guilds[activeTileData.guildId]?.color
                        ? guilds[activeTileData.guildId].color
                        : getPlayerUniqueColor(activeTileData.ownerUid || '', isMyTile) 
                    } 
                    interactive={false} 
                    className="w-full h-full scale-125" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Crosshair className="w-5 h-5 text-slate-600 animate-spin-slow" />
                  </div>
                )}
              </div>

              {/* Sector Information & Badges */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-mono font-bold text-cyan-400 flex-wrap">
                  <span className="text-white font-black">เซกเตอร์ [{selectedTile.x}, {selectedTile.y}]</span>
                  {(activeTileData?.isCitadel ||
                    (activeTileData?.guildId &&
                      (guilds[activeTileData.guildId]?.citadelCoords?.includes(`${selectedTile.x},${selectedTile.y}`) ||
                        guilds[activeTileData.guildId]?.citadelCoord === `${selectedTile.x},${selectedTile.y}`))) && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1 shadow-sm">
                      <Building2 className="w-2.5 h-2.5 text-amber-400" /> นครหลวงกิลด์ (4 ช่อง) LV.{activeTileData?.guildId ? (guilds[activeTileData.guildId]?.citadelLevel || 1) : 1}
                    </span>
                  )}
                  {activeTileData?.guildId && isCitadelInfluenceZone(selectedTile.x, selectedTile.y, guilds[activeTileData.guildId]?.citadelCoord, guilds[activeTileData.guildId]?.citadelCoords) && !(activeTileData?.isCitadel || guilds[activeTileData.guildId]?.citadelCoords?.includes(`${selectedTile.x},${selectedTile.y}`) || guilds[activeTileData.guildId]?.citadelCoord === `${selectedTile.x},${selectedTile.y}`) && (
                    <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 text-amber-400" /> ป้องกันรกร้าง (Aura)
                    </span>
                  )}
                  {isSanctuaryZone(selectedTile.x, selectedTile.y) && (
                    <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-sky-400" /> เขตเกิดปลอดภัย
                    </span>
                  )}
                  {isShieldedTile(activeTileData) && (
                    <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1 animate-pulse">
                      <ShieldCheck className="w-2.5 h-2.5 text-cyan-400" /> บาเรีย ({Math.max(1, Math.ceil((new Date(activeTileData?.shieldUntil!).getTime() - Date.now()) / (3600 * 1000)))} ชม.)
                    </span>
                  )}
                  {isDecayedTile(activeTileData, activeTileData?.guildId ? guilds[activeTileData.guildId]?.citadelCoord : undefined, activeTileData?.guildId ? guilds[activeTileData.guildId]?.citadelCoords : undefined) && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5 text-amber-400" /> ฐานรกร้าง (-50% HP)
                    </span>
                  )}
                  {isMyTile && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-sans">
                      ของคุณ
                    </span>
                  )}
                  {isGuildTile && !isMyTile && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                      <Shield className="w-2.5 h-2.5 text-amber-400" /> พันธมิตร
                    </span>
                  )}
                  {(activeTileData?.type === 'outpost' || activeTileData?.isOutpost) && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-emerald-400" /> +100 EXP/วัน
                    </span>
                  )}
                </div>

                <div className="text-xs sm:text-sm font-bold text-slate-200 truncate flex items-center gap-1.5 mt-0.5">
                  {(activeTileData?.type === 'outpost' || activeTileData?.isOutpost) ? (
                    <span className="text-emerald-300 font-black flex items-center gap-1.5">
                      <span>{activeTileData.ownerName || 'ป้อมฟาร์มวิจัย (Bio-Farm Outpost)'}</span>
                      {activeTileData.ownerUid && (
                        <span className="text-[10px] text-slate-300 font-normal">
                          (ผู้ครอง: {activeTileData.ownerName})
                        </span>
                      )}
                    </span>
                  ) : activeTileData?.type === 'boss' ? (
                    <span className="text-red-300 font-black">{activeTileData.ownerName || 'บอสระบบภูมิคุ้มกัน'}</span>
                  ) : activeTileData?.type === 'player' ? (
                    <>
                      <span 
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm" 
                        style={{ 
                          backgroundColor: activeTileData.guildId && guilds[activeTileData.guildId]?.color
                            ? guilds[activeTileData.guildId].color
                            : getPlayerUniqueColor(activeTileData.ownerUid || '', isMyTile) 
                        }}
                      />
                      {activeTileData.guildName && (
                        <span 
                          className="text-[10px] px-1.5 py-0.2 rounded border font-mono font-bold"
                          style={{
                            backgroundColor: activeTileData.guildId && guilds[activeTileData.guildId]?.color
                              ? `${guilds[activeTileData.guildId].color}25`
                              : 'rgba(245,158,11,0.2)',
                            borderColor: activeTileData.guildId && guilds[activeTileData.guildId]?.color
                              ? guilds[activeTileData.guildId].color
                              : '#f59e0b',
                            color: activeTileData.guildId && guilds[activeTileData.guildId]?.color
                              ? guilds[activeTileData.guildId].color
                              : '#fcd34d',
                          }}
                        >
                          [{activeTileData.guildName}]
                        </span>
                      )}
                      <span>{activeTileData.ownerName}</span>
                      <span className="text-[10px] text-slate-400 font-normal">({activeTileData.ownerFamily})</span>
                    </>
                  ) : (
                    <span className="text-slate-400">เซลล์ว่างเปล่า (ยังไม่มีเจ้าของ)</span>
                  )}
                </div>
              </div>

              {/* Action Button & Close Button */}
              <div className="shrink-0 flex items-center gap-1.5">
                {/* Guild Leader: Establish Citadel Button (Only when guild has no citadel yet - Relocation locked) */}
                {appUser?.guildId &&
                  guilds[appUser.guildId]?.leaderUid === appUser.uid &&
                  !guilds[appUser.guildId]?.citadelCoord &&
                  (!guilds[appUser.guildId]?.citadelCoords || guilds[appUser.guildId]?.citadelCoords?.length === 0) &&
                  (activeTileData?.guildId === appUser.guildId || activeTileData?.ownerUid === appUser.uid || isGuildTile) &&
                  !activeTileData?.isCitadel &&
                  !activeTileData?.isOutpost &&
                  !isCentralVaultZone(selectedTile.x, selectedTile.y) && (
                    <button
                      type="button"
                      onClick={() => handleEstablishCitadel(`${selectedTile.x},${selectedTile.y}`)}
                      className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.6)] active:scale-95 transition-all"
                      title="สถาปนานครหลวงกิลด์ 4 ช่อง (2x2 บล็อก) ณ บริเวณนี้"
                    >
                      <Building2 className="w-4 h-4 text-slate-950" />
                      <span>🏛️ สถาปนานครหลวง (4 ช่อง)</span>
                    </button>
                )}

                {isMyTile && (activeTileData?.isOutpost || activeTileData?.type === 'outpost') ? (
                  (() => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const hasClaimedToday = activeTileData.lastClaimedDate === todayStr;
                    return (
                      <button
                        type="button"
                        disabled={hasClaimedToday || claimingOutpost}
                        onClick={() => handleClaimDailyExp(`${selectedTile.x},${selectedTile.y}`)}
                        className={`h-10 sm:h-11 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all ${
                          hasClaimedToday
                            ? 'bg-slate-800 text-emerald-400/60 border border-emerald-900/40 cursor-default'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95'
                        }`}
                      >
                        <Zap className={`w-4 h-4 ${hasClaimedToday ? 'text-emerald-500/60' : 'text-slate-950 fill-current'}`} />
                        <span>{hasClaimedToday ? 'รับแล้ว' : '🌾 เก็บเกี่ยว (+100 EXP)'}</span>
                      </button>
                    );
                  })()
                ) : isShieldedTile(activeTileData) ? (
                  <button
                    type="button"
                    disabled
                    className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 bg-slate-800 text-cyan-400 border border-cyan-500/40 cursor-not-allowed shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  >
                    <ShieldCheck className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <span>ติดบาเรีย ({Math.max(1, Math.ceil((new Date(activeTileData?.shieldUntil!).getTime() - Date.now()) / (3600 * 1000)))} ชม.)</span>
                  </button>
                ) : !isMyTile && (
                  <button
                    type="button"
                    disabled={!canInfect || (stats.myCount > 0 && !dailyEmpireInfo.canAttack)}
                    onClick={handleAction}
                    className={`h-10 sm:h-11 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all ${
                      canInfect && (stats.myCount === 0 || dailyEmpireInfo.canAttack)
                        ? stats.myCount === 0
                          ? 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-[0_0_15px_rgba(52,211,153,0.6)] active:scale-95'
                          : (activeTileData?.type === 'outpost' || activeTileData?.isOutpost)
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95'
                          : activeTileData?.type === 'boss'
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] active:scale-95'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {canInfect && (stats.myCount === 0 || dailyEmpireInfo.canAttack) ? (
                      <>
                        {stats.myCount === 0 ? (
                          <>
                            <Rocket className="w-4 h-4 text-slate-950 animate-bounce" />
                            <span>{activeTileData?.type === 'empty' ? '🚀 สถาปนาฐานแรก' : '🚀 ทิ้งดิ่งชิงฐาน'}</span>
                          </>
                        ) : (activeTileData?.type === 'outpost' || activeTileData?.isOutpost) ? (
                          <>
                            <Radio className="w-4 h-4 text-slate-950 animate-pulse" />
                            <span>ยึดป้อม (+100 EXP)</span>
                          </>
                        ) : activeTileData?.type === 'boss' ? (
                          <>
                            <Swords className="w-4 h-4" />
                            <span>ตีบอส</span>
                          </>
                        ) : (
                          <>
                            <Swords className="w-4 h-4" />
                            <span>บุกรุก</span>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[11px] whitespace-nowrap">
                          {stats.myCount > 0 && !dailyEmpireInfo.canAttack
                            ? `โควตาหมด (${dailyEmpireInfo.attacksToday}/${DAILY_EMPIRE_ATTACK_LIMIT})`
                            : stats.myCount === 0
                            ? 'เลือกช่องเพื่อส่ง Drop Pod'
                            : 'ต้องติดกับเขตคุณ'}
                        </span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedTile(null)}
                  className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                  title="ปิดกล่องข้อมูล"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
                </>
              )}

            </div>
          </div>
        ) : (
          <div className="pointer-events-auto bg-slate-900/90 border border-slate-800/80 rounded-2xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-xs font-mono">
            {stats.myCount === 0 ? (
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-slate-300 truncate">
                  🚀 <strong className="text-emerald-400">ผู้เล่นใหม่:</strong> แตะช่องว่างเพื่อส่ง Drop Pod หรือกดสุ่มจุดเกิด
                </span>
                <button
                  type="button"
                  onClick={handleAutoFindSanctuary}
                  className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shrink-0 transition-all shadow-[0_0_12px_rgba(16,185,129,0.5)] active:scale-95"
                >
                  🎯 สุ่มจุดปลอดภัย
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full text-slate-400 text-[11px] sm:text-xs">
                <span>แตะช่องใดก็ได้บนแผนที่เพื่อดูข้อมูลและเริ่มบุกรุก</span>
                <span className="text-cyan-400 font-bold">โควตาบุกวันนี้ {dailyEmpireInfo.remainingAttacks}/{DAILY_EMPIRE_ATTACK_LIMIT}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Stats Overview Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <BarChart3 className="w-5 h-5" />
                <h2 className="text-base font-black uppercase tracking-wider text-white">
                  ภาพรวมสมรภูมิ (Empire Statistics)
                </h2>
              </div>
              <button 
                onClick={() => setShowStatsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Card 1: ของคุณ */}
              <div className="bg-cyan-950/70 border border-cyan-500/40 rounded-2xl p-3 flex items-center gap-3 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0" />
                <div>
                  <div className="text-[10px] font-mono text-cyan-300/80">ของคุณ</div>
                  <div className="text-xl font-black text-cyan-200">{stats.myCount} เขต</div>
                </div>
              </div>

              {/* Card 2: ศัตรู */}
              <div className="bg-purple-950/70 border border-purple-500/40 rounded-2xl p-3 flex items-center gap-3 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                <span className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] shrink-0" />
                <div>
                  <div className="text-[10px] font-mono text-purple-300/80">ผู้เล่นอื่น</div>
                  <div className="text-xl font-black text-purple-200">{stats.enemyCount} เขต</div>
                </div>
              </div>

              {/* Card 3: บอส */}
              <div className="bg-red-950/70 border border-red-500/40 rounded-2xl p-3 flex items-center gap-3 shadow-[0_0_12px_rgba(239,68,68,0.15)]">
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_#f87171] shrink-0 animate-pulse" />
                <div>
                  <div className="text-[10px] font-mono text-red-300/80">บอสผู้พิทักษ์</div>
                  <div className="text-xl font-black text-red-200">{stats.bossCount} จุด</div>
                </div>
              </div>

              {/* Card 4: ป้อมฟาร์ม */}
              <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-3 flex items-center gap-3 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0 animate-pulse" />
                <div>
                  <div className="text-[10px] font-mono text-emerald-300/80">ป้อมฟาร์มวิจัย</div>
                  <div className="text-xl font-black text-emerald-200">{stats.outpostCount} ป้อม</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 text-xs font-mono text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>ขนาดแผนที่ทั้งหมด:</span>
                <span className="text-white font-bold">50 × 50 (2,500 เซกเตอร์)</span>
              </div>
              <div className="flex justify-between">
                <span>โควตาการบุกรุกวันนี้:</span>
                <span className="text-cyan-300 font-bold">{dailyEmpireInfo.remainingAttacks} / {DAILY_EMPIRE_ATTACK_LIMIT} ครั้ง</span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button 
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase transition-all"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Guild / Alliance Modal */}
      {showGuildModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Users className="w-5 h-5" />
                <h2 className="text-base font-black uppercase tracking-wider text-white">
                  ระบบพันธมิตรกิลด์ (Alliance)
                </h2>
              </div>
              <button 
                onClick={() => setShowGuildModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Current Guild Status */}
            {appUser?.guildId ? (
              (() => {
                const currentG = guilds[appUser.guildId];
                const isLeader = currentG?.leaderUid === appUser.uid;
                const guildTilesCount = Object.values(tiles).filter((t) => t.guildId === appUser.guildId).length;

                return (
                  <div className="space-y-4">
                    {/* 1. Guild Overview Card */}
                    <div 
                      className="rounded-2xl p-4 border relative overflow-hidden space-y-3 shadow-lg"
                      style={{
                        backgroundColor: `${currentG?.color || '#a855f7'}18`,
                        borderColor: `${currentG?.color || '#a855f7'}60`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span 
                              className="w-3.5 h-3.5 rounded-full border border-white/80 shadow-[0_0_8px_rgba(255,255,255,0.5)] shrink-0" 
                              style={{ backgroundColor: currentG?.color || '#a855f7' }} 
                            />
                            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                              พันธมิตรกิลด์ของคุณ
                            </span>
                          </div>
                          <h3 className="text-xl font-black text-white flex items-center gap-2 mt-1">
                            <span className="font-mono text-cyan-400">[{currentG?.tag || 'TAG'}]</span>
                            <span>{currentG?.name || appUser.guildName}</span>
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            {isLeader ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 font-mono">
                                <Crown className="w-3.5 h-3.5 text-amber-400" /> คุณคือหัวหน้ากิลด์
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-cyan-400" /> สมาชิกกิลด์
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                              รวมยึดครอง {guildTilesCount} เซกเตอร์
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleLeaveGuild}
                          className="text-xs px-3 py-1.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition-colors shrink-0 font-medium active:scale-95"
                        >
                          ออกจากกิลด์
                        </button>
                      </div>
                    </div>

                    {/* 2. Guild Citadel Status & Upgrade Card */}
                    <div className="bg-slate-950/70 border border-amber-500/40 rounded-2xl p-3.5 space-y-3 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-400" />
                          <span className="text-xs font-black uppercase text-white tracking-wide font-mono">
                            นครหลวงกิลด์ (Guild Citadel)
                          </span>
                        </div>
                        {currentG?.citadelCoord ? (
                          <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                            LV.{currentG?.citadelLevel || 1}
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                            ยังไม่มีนครหลวง
                          </span>
                        )}
                      </div>

                      {currentG?.citadelCoord ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-mono">
                              พิกัด: <strong className="text-amber-300">[{currentG.citadelCoord}]</strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                jumpToCitadel();
                                setShowGuildModal(false);
                              }}
                              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold active:scale-95 transition-all flex items-center gap-1"
                            >
                              <Compass className="w-3 h-3 text-amber-400" /> วาร์ปไปนครหลวง
                            </button>
                          </div>

                          {/* Progress Bar towards Next Level */}
                          <div>
                            {(() => {
                              const lvl = currentG.citadelLevel || 1;
                              const neededExp = lvl * 150;
                              const currentExp = currentG.citadelExp || 0;
                              const pct = Math.min(100, Math.round((currentExp / neededExp) * 100));
                              return (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                                    <span>ความเจริญนครหลวง (EXP กิลด์)</span>
                                    <span className="text-amber-300 font-bold">
                                      {lvl >= 5 ? 'MAX LEVEL' : `${currentExp} / ${neededExp} EXP (${pct}%)`}
                                    </span>
                                  </div>
                                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                                    <div
                                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                                      style={{ width: `${lvl >= 5 ? 100 : pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* Perks & Mechanics Info */}
                          <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                            <div className="flex items-center gap-1.5 text-amber-400 font-bold font-mono text-[10px]">
                              <ShieldCheck className="w-3.5 h-3.5" /> สิทธิประโยชน์ของนครหลวง (ขนาด 4 เซกเตอร์ 2×2):
                            </div>
                            <ul className="text-[10px] text-slate-400 list-disc list-inside space-y-0.5 leading-relaxed">
                              <li>สร้างรัศมีคุ้มกันรอบตัว 2 ช่อง: <strong className="text-amber-200">ไม่มีวันรกร้าง (Decay-Immune)</strong></li>
                              <li>กำแพงป้องกันหนาแน่น 2 เท่า (HP {(currentG.citadelLevel || 1) * 1000 + 2500} หน่วย) ทุกช่องในกลุ่มนครหลวง</li>
                              <li>สมาชิกสามารถบริจาค EXP ส่วนตัวเพื่ออัปเกรดความรุ่งเรืองของนครหลวงได้</li>
                              <li className="text-amber-300 font-medium">🔒 ตำแหน่งเมืองหลวงถูกล็อคถาวร (ระบบย้ายเมืองหลวงด้วย &quot;ใบย้ายเมือง&quot; จะเปิดให้ใช้งานในอนาคต)</li>
                            </ul>
                          </div>

                          {/* Donate EXP Button */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] text-slate-400 font-mono">
                              EXP ของคุณ: <strong className="text-cyan-400">{appUser.exp || 0}</strong>
                            </span>
                            <button
                              type="button"
                              disabled={donatingCitadelExp || (currentG.citadelLevel || 1) >= 5 || (appUser.exp || 0) < 45}
                              onClick={() => handleDonateCitadelExp(25)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs font-mono transition-all disabled:opacity-40 active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.4)] flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                              <span>{donatingCitadelExp ? 'กำลังบริจาค...' : 'บริจาค 25 EXP'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
                          <p>
                            กิลด์ของคุณยังไม่มีนครหลวง! <strong className="text-white">หัวหน้ากิลด์ (👑)</strong> สามารถเลือกช่องในอาณาเขตกิลด์ที่เป็น <strong className="text-amber-300">กลุ่มบล็อก 4 ช่อง (สี่เหลี่ยม 2×2)</strong> แล้วกดปุ่ม <strong>[🏛️ สถาปนานครหลวง (4 ช่อง)]</strong> ในแถบด้านล่าง
                          </p>
                          <div className="text-[10px] text-amber-400/90 font-mono">
                            ⚡ สมาชิกกิลด์สามารถช่วยกันยึดขยายพื้นที่ให้ติดกันเป็นบล็อกสี่เหลี่ยม 2×2 เพื่อให้หัวหน้ากิลด์สถาปนานครหลวงได้
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Guild Color Selector (Leader can pick color, members see it) */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> สีกิลด์บนแผนที่
                          </span>
                          <span 
                            className="w-4 h-4 rounded-full border border-white shadow-sm inline-block"
                            style={{ backgroundColor: currentG?.color || '#a855f7' }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {isLeader ? 'หัวหน้าสามารถเปลี่ยนสีได้' : 'สีเดียวกันทั้งกิลด์'}
                        </span>
                      </div>

                      {isLeader ? (
                        <div>
                          <div className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                            แตะเลือกสีประจำกิลด์ (ทุกช่องในแผนที่ที่คนในกิลด์ยึดไว้จะเปลี่ยนเป็นสีนี้พร้อมกัน):
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {PLAYER_PALETTE.map((c) => {
                              const isSelected = (currentG?.color || '') === c;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => handleUpdateGuildColor(c)}
                                  className={`h-7 rounded-lg flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'ring-2 ring-white scale-105 shadow-md shadow-white/20' 
                                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: c }}
                                  title={c}
                                >
                                  {isSelected && <Check className="w-4 h-4 text-white drop-shadow font-bold" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 font-mono">
                          ดินแดนทั้งหมดของกิลด์จะเปล่งแสงเป็นสีนี้บนแผนที่ขนาด 50×50 เพื่อแสดงอาณาเขตพันธมิตร
                        </div>
                      )}
                    </div>

                    {/* 4. Guild Members List */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5 font-mono">
                          <Users className="w-3.5 h-3.5" /> รายชื่อสมาชิก ({currentGuildMembers.length} คน)
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          พรมแดนเชื่อมถึงกัน
                        </span>
                      </div>

                      <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                        {currentGuildMembers
                          .slice()
                          .sort((a, b) => {
                            if (a.uid === currentG?.leaderUid) return -1;
                            if (b.uid === currentG?.leaderUid) return 1;
                            return (b.exp || 0) - (a.exp || 0);
                          })
                          .map((member) => {
                            const isMemberLeader = member.uid === currentG?.leaderUid;
                            const isMe = member.uid === appUser.uid;
                            const memberTileCount = Object.values(tiles).filter((t) => t.ownerUid === member.uid).length;

                            return (
                              <div
                                key={member.uid}
                                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                                  isMe
                                    ? 'bg-cyan-950/40 border-cyan-500/50'
                                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                                    <SVGVirus
                                      type={member.pet?.family as any || 'parvo'}
                                      className="w-5 h-5 text-cyan-400"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-white truncate flex items-center gap-1.5">
                                      <span>{member.fullname || 'นิสิต'}</span>
                                      {isMe && (
                                        <span className="text-[10px] font-mono text-cyan-400 font-bold">(คุณ)</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
                                      <span>LV.{Math.floor((member.exp || 0) / 100) + 1}</span>
                                      <span>•</span>
                                      <span className="text-cyan-300 font-semibold">ครอง {memberTileCount} เซกเตอร์</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="shrink-0 ml-2">
                                  {isMemberLeader ? (
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 text-[10px] font-bold flex items-center gap-1 font-mono shadow-sm">
                                      <Crown className="w-3 h-3 text-amber-400" /> หัวหน้า
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">
                                      สมาชิก
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="space-y-4">
                {/* Create New Guild Form */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5 font-mono">
                    <Plus className="w-3.5 h-3.5" /> ก่อตั้งพันธมิตรใหม่ (คุณจะเป็นหัวหน้ากิลด์ 👑)
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="ชื่อกิลด์ (เช่น Phage Clan)"
                      value={newGuildName}
                      onChange={(e) => setNewGuildName(e.target.value)}
                      className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <input
                      type="text"
                      placeholder="แท็ก [TAG]"
                      maxLength={5}
                      value={newGuildTag}
                      onChange={(e) => setNewGuildTag(e.target.value)}
                      className="col-span-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 uppercase focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  {/* Choose Guild Color for creation */}
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>เลือกสีกิลด์ประจำอาณาจักร:</span>
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-white inline-block shadow-sm"
                          style={{ backgroundColor: newGuildColor }}
                        />
                      </span>
                      <span className="text-[10px] text-slate-500">แสดงบนแผนที่</span>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {PLAYER_PALETTE.map((c) => {
                        const isSelected = newGuildColor === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewGuildColor(c)}
                            className={`h-7 rounded-lg flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'ring-2 ring-white scale-105 shadow-md shadow-white/20' 
                                : 'opacity-70 hover:opacity-100 hover:scale-105'
                            }`}
                            style={{ backgroundColor: c }}
                            title={c}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white drop-shadow font-bold" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleCreateGuild}
                    disabled={isCreatingGuild || !newGuildName.trim() || !newGuildTag.trim()}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  >
                    <Crown className="w-4 h-4 text-slate-950" />
                    <span>{isCreatingGuild ? 'กำลังก่อตั้ง...' : 'ก่อตั้งกิลด์และเป็นหัวหน้า'}</span>
                  </button>
                </div>

                {/* Join Existing Guild List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-mono text-slate-400 uppercase">กิลด์ที่เปิดรับสมัคร</h4>
                  <div className="max-h-52 overflow-y-auto space-y-2 custom-scrollbar">
                    {Object.values(guilds).length > 0 ? (
                      Object.values(guilds).map((g) => {
                        const membersOfThisGuild = allUsers.filter((u) => u.guildId === g.id);
                        const isExpanded = previewGuildId === g.id;

                        return (
                          <div 
                            key={g.id} 
                            className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 space-y-2 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <span 
                                  className="w-3.5 h-3.5 rounded-full border border-white/60 shrink-0 shadow-sm" 
                                  style={{ backgroundColor: g.color || '#a855f7' }}
                                />
                                <div>
                                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                                    <span className="font-mono text-cyan-400">[{g.tag}]</span> 
                                    <span>{g.name}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                                    <span className="flex items-center gap-0.5 text-amber-300 font-semibold">
                                      <Crown className="w-2.5 h-2.5 text-amber-400" /> {g.leaderName}
                                    </span>
                                    <span>•</span>
                                    <span>สมาชิก {membersOfThisGuild.length || g.membersCount || 1} คน</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPreviewGuildId(isExpanded ? null : g.id)}
                                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] transition-colors"
                                >
                                  {isExpanded ? 'ย่อ' : 'ดูสมาชิก'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleJoinGuild(g)}
                                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase transition-all shadow-sm active:scale-95"
                                >
                                  เข้าร่วม
                                </button>
                              </div>
                            </div>

                            {/* Expanded Member List for previewing prior to joining */}
                            {isExpanded && (
                              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                                <div className="text-[10px] font-mono text-slate-400 uppercase">
                                  สมาชิกในกิลด์นี้ ({membersOfThisGuild.length} คน):
                                </div>
                                <div className="space-y-1 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                                  {membersOfThisGuild.length > 0 ? (
                                    membersOfThisGuild.map((m) => (
                                      <div 
                                        key={m.uid} 
                                        className="flex items-center justify-between text-[11px] bg-slate-900/90 rounded-lg px-2.5 py-1 border border-slate-800"
                                      >
                                        <span className="text-white truncate font-medium">{m.fullname}</span>
                                        {m.uid === g.leaderUid ? (
                                          <span className="text-[9px] text-amber-300 font-mono font-bold flex items-center gap-0.5">
                                            <Crown className="w-2.5 h-2.5" /> หัวหน้า
                                          </span>
                                        ) : (
                                          <span className="text-[9px] text-slate-400 font-mono">สมาชิก</span>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-[10px] text-slate-500 font-mono py-1">
                                      {g.leaderName} (หัวหน้ากิลด์)
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-xs font-mono text-slate-500">
                        ยังไม่มีกิลด์ในระบบ เป็นคนแรกที่ก่อตั้งเลย!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 text-center">
              <button 
                onClick={() => setShowGuildModal(false)}
                className="text-xs font-mono text-slate-400 hover:text-white"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 4. War Rules & Guidelines Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white">
                  กฎและกติกาสมรภูมิอาณาจักร (Empire Warfare Rules)
                </h2>
              </div>
              <button 
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Rules Content */}
            <div className="overflow-y-auto space-y-3 pr-1 text-xs sm:text-sm custom-scrollbar flex-1">
              
              {/* Section 1: Drop Pod */}
              <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Rocket className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs sm:text-sm uppercase tracking-wider">1. สิทธิการสถาปนาฐานแรก & ทิ้งดิ่ง (Drop Pod)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  สำหรับนิสิตใหม่หรือผู้ที่ยังไม่มีดินแดนในครอบครอง (<span className="text-emerald-300 font-bold">0 อาณาเขต</span>) คุณสามารถใช้ระบบ <span className="text-emerald-300 font-bold">Drop Pod</span> เลือกคลิกช่องใดก็ได้บนแผนที่ขนาด 50×50 (ทั้งช่องว่าง, จุดบอส, หรือชิงฐานศัตรู) เพื่อทิ้งดิ่งลงจอดสถาปนาเมืองแรกได้ทันที <span className="text-emerald-300 underline">โดยไม่ต้องมีพรมแดนเชื่อมติดกัน</span> และ<span className="text-emerald-300 font-bold"> ฟรีโควตาการบุกรุก</span> ไม่หักรอบโจมตีประจำวัน
                </p>
              </div>

              {/* Section 2: Sanctuary & Shield */}
              <div className="bg-slate-950/70 border border-sky-500/30 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-sky-400 font-bold">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs sm:text-sm uppercase tracking-wider">2. เขตปลอดภัย 4 ทิศ (Sanctuary) & บาเรียคุ้มกัน 48 ชั่วโมง</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  • <span className="text-sky-300 font-bold">ขอบนอก 4 ทิศ (Outer Rim Sanctuary):</span> พื้นที่ริมแผนที่ 4 ช่องรอบนอกสุด คือโซนปลอดภัยสำหรับผู้เล่นใหม่ (สังเกตขอบประสีฟ้าและไอคอน 🛡️)<br/>
                  • <span className="text-cyan-300 font-bold">บาเรียมือใหม่ 48 ชั่วโมง (Beginner Shield):</span> เมื่อสถาปนาฐานแรกสำเร็จ ฐานทัพหลักของคุณจะได้รับบาเรียคุ้มครองนานถึง 48 ชั่วโมงเต็ม ผู้เล่นคนอื่นหรือกิลด์ใหญ่จะไม่สามารถเข้าตีหรือแย่งชิงได้
                </p>
              </div>

              {/* Section 3: Adjacency Expansion */}
              <div className="bg-slate-950/70 border border-cyan-500/30 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <Swords className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs sm:text-sm uppercase tracking-wider">3. กฎการขยายอาณาเขต & การประลองตอบคำถาม</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  • หลังจากมีฐานแล้ว การบุกรุกช่องถัดไปจะต้องเลือกช่องที่ <span className="text-cyan-300 font-bold">เชื่อมติดกับอาณาเขตของตนเอง หรือติดกับเขตพันธมิตรกิลด์</span> เท่านั้น<br/>
                  • เมื่อเข้าสู่สมรภูมิ คุณต้องตอบคำถามชีววิทยาไวรัสให้ถูกต้องและรวดเร็ว เพื่อปล่อยพลังโจมตีกำจัดฝ่ายตรงข้าม หากตอบผิดจะถูกศัตรูสวนกลับ ค่าพลังของไวรัสสัตว์เลี้ยง (STR, VIT, AGI, DEX) มีผลต่อพลังโจมตี เลือด และโอกาสคริติคอล
                </p>
              </div>

              {/* Section 4: Daily Quota */}
              <div className="bg-slate-950/70 border border-red-500/30 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-red-400 font-bold">
                  <Swords className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs sm:text-sm uppercase tracking-wider">4. โควตาการบุกรุกประจำวัน (Daily Limit)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  เพื่อป้องกันการกวาดแผนที่แบบต่อเนื่องและเปิดโอกาสให้ผู้เล่นทุกคนได้วางแผน นิสิตแต่ละคนจะได้รับสิทธิ์การบุกรุกได้สูงสุด <span className="text-red-300 font-bold">10 ครั้งต่อวัน</span> (รีเซ็ตโควตาทุกวันเวลาเที่ยงคืน 00:00 น.)
                </p>
              </div>

              {/* Section 5: Bio-Farm Outposts */}
              <div className="bg-slate-950/70 border border-emerald-500/30 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <Radio className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
                  <span className="font-mono text-xs sm:text-sm uppercase tracking-wider">5. ป้อมฟาร์มวิจัยเชิงยุทธศาสตร์ (Bio-Farm Outposts)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  มีป้อมวิจัยขนาดใหญ่ 4 จุดกระจายตัวตาม 4 ทิศของแผนที่ เมื่อยึดครองสำเร็จจะได้รับโบนัส +100 EXP ทันที และเจ้าของป้อมสามารถกด <span className="text-emerald-300 font-bold">🌾 เก็บเกี่ยวผลผลิตเพื่อรับ +100 EXP ฟรีได้ทุกๆ วัน</span>
                </p>
              </div>

              {/* Section 6: Upkeep & Decay */}
              <div className="bg-slate-950/70 border border-amber-500/30 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs sm:text-sm uppercase tracking-wider">6. การบำรุงรักษา (Upkeep) & ฐานรกร้าง (Decay)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  • <span className="text-amber-300 font-bold">การบำรุงรักษาอัตโนมัติ:</span> ทุกครั้งที่คุณเปิดเข้าดูแผนที่ Empire ระบบจะต่ออายุการดูแลอาณาเขตของคุณให้สดใหม่อยู่เสมอ<br/>
                  • <span className="text-amber-400 font-bold">ฐานรกร้าง (ไม่ได้เข้า &gt; 72 ชั่วโมง):</span> หากไม่เข้าเกมนานเกิน 3 วัน ดินแดนจะขึ้นสถานะ ⚠️ ฐานรกร้าง และถูกลดพลังชีวิต HP และ ATK ของบอทป้องกันลง 50% ทำให้ผู้เล่นอื่นเข้าตีชิงได้ง่ายขึ้น<br/>
                  • <span className="text-slate-400 font-bold">สลายตัวคืนสู่ธรรมชาติ (ไม่ได้เข้า &gt; 120 ชั่วโมง / 5 วัน):</span> หากทิ้งร้างเกิน 5 วัน ดินแดนจะสลายตัวกลับเป็นเซลล์ว่างเปล่าอัตโนมัติ เพื่อเปิดพื้นที่ให้ผู้เล่นใหม่
                </p>
              </div>

              {/* Section 7: Guild Alliance */}
              <div className="bg-slate-950/70 border border-indigo-500/30 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs sm:text-sm uppercase tracking-wider">7. ระบบพันธมิตรกิลด์ (Guild Alliance)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  • นิสิตสามารถรวมกลุ่มสร้างกิลด์หรือเข้าร่วมกิลด์ที่มีอยู่ได้ โดยสมาชิกทุกคนจะมีแท็กและสีประจำกิลด์เดียวกัน<br/>
                  • คนในกิลด์เดียวกัน <span className="text-indigo-300 font-bold">ไม่สามารถโจมตีกันเองได้</span> และสามารถใช้ดินแดนของเพื่อนร่วมกิลด์เป็นเส้นทางเดินทัพเชื่อมต่อขยายอาณาเขตด้วยกันได้
                </p>
              </div>

              {/* Section 8: Guild Citadel */}
              <div className="bg-slate-950/70 border border-amber-500/40 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs sm:text-sm uppercase tracking-wider">8. นครหลวงกิลด์ (Guild Citadel) แบบ Civilization (ขนาด 4 ช่อง)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  • <span className="text-amber-300 font-bold">การสถาปนานครหลวง 4 ช่อง:</span> เฉพาะ <strong className="text-amber-300">หัวหน้ากิลด์ (👑)</strong> เท่านั้นที่มีอำนาจสถาปนา โดยกิลด์จะต้องยึดครองดินแดนติดต่อกันเป็น <span className="text-amber-300 font-bold">กลุ่มบล็อก 4 ช่อง (สี่เหลี่ยม 2×2 เซกเตอร์)</span> จึงจะสามารถสถาปนาเป็นนครหลวงกิลด์ได้<br/>
                  • <span className="text-red-300 font-bold">🔒 ล็อคตำแหน่งเมืองหลวง:</span> เมื่อสถาปนานครหลวงแล้วจะไม่สามารถย้ายตำแหน่งได้ (ในอนาคตจะมีระบบไอเทม &quot;ใบย้ายเมือง&quot; สำหรับการย้ายพิกัดเมืองหลวง)<br/>
                  • <span className="text-amber-200 font-bold">รัศมีคุ้มกันไม่รกร้าง (Decay Immunity):</span> ดินแดนทุกช่องในระยะ 2 ช่องรอบกลุ่มนครหลวงทั้ง 4 ช่อง จะได้รับออร่าคุ้มครอง <span className="text-amber-300 font-bold">ไม่มีวันรกร้างหรือสลายตัว</span> แม้เจ้าของดินแดนจะไม่ได้เข้าเกมนานเกินกำหนด<br/>
                  • <span className="text-yellow-300 font-bold">ป้อมปราการป้องกันหนาแน่น:</span> ดินแดนทั้ง 4 ช่องของนครหลวงมีพลังป้องกันและเลือด HP สูงกว่าปกติ 2 เท่า (เริ่มต้น 3,500 HP ขึ้นไป) บอทป้องกันได้รับบัฟ ATK +15<br/>
                  • <span className="text-cyan-300 font-bold">การพัฒนาและบริจาค EXP:</span> สมาชิกกิลด์สามารถร่วมกันบริจาค EXP เพื่ออัปเกรดเลเวลของนครหลวง (สูงสุด LV.5) เพิ่มความทนทานและรัศมีพลังของกิลด์
                </p>
              </div>

              {/* Section 9: Fog of War & Scouts */}
              <div className="bg-slate-950/70 border border-cyan-500/40 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <CloudFog className="w-4 h-4 shrink-0" />
                  <span className="font-mono text-xs sm:text-sm uppercase tracking-wider">9. หมอกสงคราม (Fog of War) & โดรนสอดแนม (Bio-Radar)</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  • <span className="text-cyan-300 font-bold">หมอกสงครามครอบคลุม:</span> แผนที่ขนาด 50×50 จะถูกปกคลุมด้วยหมอกสงคราม โดยมีจุดที่มองเห็นได้แต่แรกคือ ขอบเขตเกิดปลอดภัย (Sanctuary 4 ทิศ), ป้อมฟาร์มวิจัย (Outposts), บอสผู้พิทักษ์ และใจกลางสมบัติ<br/>
                  • <span className="text-emerald-300 font-bold">ระยะสายตาจากฐาน (Vision Radius):</span> ฐานทัพของคุณและสมาชิกในกิลด์จะเปิดการมองเห็นรัศมี 2 ช่องรอบฐานโดยอัตโนมัติ<br/>
                  • <span className="text-cyan-400 font-bold">🛸 ส่งโดรนสอดแนม (สแกน 5×5):</span> คลิกที่ช่องหมอกเพื่อส่งโดรน ผู้เล่นแต่ละคนมีแบตเตอรี่โดรน <strong className="text-cyan-300">5 ครั้งต่อวัน</strong> (รีเซ็ตทุกเที่ยงคืน) เมื่อตอบคำถามไวรัสวิทยาถูกต้อง จะเปิดแผนที่พื้นที่ 5×5 (25 เซกเตอร์) <strong className="text-white">แบบถาวรตลอดไป</strong> ไม่ต้องตอบซ้ำทุกวัน พร้อมรับ <span className="text-emerald-300 font-bold">+25 EXP</span> ต่อครั้งทันที
                </p>
              </div>

            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-800 text-center shrink-0">
              <button 
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-wider text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                เข้าใจแล้ว เข้าสู่สมรภูมิ!
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 8. Scout Drone Quiz Modal (Bio-Radar Question Modal) */}
      {showScoutModal && scoutTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Rocket className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>🛸 โดรนสอดแนมชีวภาพ</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                      พิกัด [{scoutTarget.x}, {scoutTarget.y}]
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ตอบคำถามไวรัสวิทยาเพื่อปล่อยสัญญาณโซนาร์สแกนแผนที่ 5×5 (25 ช่อง) ถาวร
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowScoutModal(false);
                  setScoutFeedback(null);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quiz Card */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" /> คำถามพิสูจน์รหัสผ่านโซนาร์
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-blue-300 font-bold bg-blue-950/80 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    🔋 เหลือโควตาวันนี้ {dailyScoutInfo.remainingScouts}/{DAILY_SCOUT_DRONE_LIMIT}
                  </span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    +25 EXP
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                {scoutQuestions[scoutQIndex]?.q}
              </p>

              {/* Multiple Choice Options */}
              <div className="space-y-2 pt-1">
                {scoutQuestions[scoutQIndex]?.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={isScouting}
                    onClick={() => handleAnswerScoutQuiz(idx)}
                    className="w-full text-left p-3 sm:p-3.5 rounded-xl bg-slate-900/90 hover:bg-cyan-950/60 border border-slate-700/80 hover:border-cyan-500/60 text-slate-200 hover:text-white text-xs sm:text-sm font-medium transition-all flex items-center justify-between group active:scale-[0.99] disabled:opacity-50"
                  >
                    <span>{opt}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              {/* Answer Feedback Alert */}
              {scoutFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs leading-relaxed animate-in fade-in flex items-start gap-2 border ${
                    scoutFeedback.isCorrect
                      ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                      : 'bg-red-950/80 border-red-500/50 text-red-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{scoutFeedback.text}</div>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>เมื่อสแกนสำเร็จ หมอกจะหายไปอย่างถาวรสำหรับบัญชีของคุณ</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
