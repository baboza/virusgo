"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc,
  updateDoc, 
  increment, 
  arrayUnion, 
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { EmpireTile, Guild, User } from '@/types';
import { 
  Loader2, 
  ArrowLeft, 
  Swords, 
  Crosshair, 
  Shield, 
  Sparkles, 
  Users, 
  Crown, 
  Radio, 
  Building2, 
  Compass, 
  X, 
  BarChart3, 
  Eye, 
  EyeOff,
  CloudFog,
  MapPin, 
  Maximize2,
  RefreshCw,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Hammer,
  Wrench,
  HelpCircle,
  ShieldAlert,
  Coins,
  Heart
} from 'lucide-react';
import { sfx } from '@/utils/sound';
import { 
  getDailyEmpireInfo, 
  DAILY_EMPIRE_ATTACK_LIMIT, 
  getTodayDateString, 
  getDailyScoutDroneInfo, 
  DAILY_SCOUT_DRONE_LIMIT 
} from '@/lib/dailyExpCap';
import { ALL_15_CHAPTER_QUESTIONS } from '@/data/veterinaryVirologyContent';
import { 
  MAP_SIZE, 
  isSanctuaryZone, 
  isCentralVaultZone, 
  isShieldedTile,
  isDecayedTile,
  getCitadel2x2Coords,
  isCitadelInfluenceZone,
  DEFENSE_STRUCTURES, 
  DefenseStructureConfig,
  SCOUT_FALLBACK_QUIZ,
  getPlayerUniqueColor
} from '@/lib/empireConstants';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';

export * from '@/lib/empireConstants';
import type { MarchOrder } from '@/components/empire/EmpireCanvas3D';

// Dynamically import Three.js Tactical Canvas (no SSR)
const EmpireCanvas3D = dynamic(() => import('@/components/empire/EmpireCanvas3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-cyan-400 space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      <div className="text-sm font-mono tracking-widest uppercase">
        กำลังโหลดระบบแผนที่ยุทธการ 3D (TACTICAL WAR ROOM)...
      </div>
    </div>
  )
});

export default function StudentEmpirePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [appUser, setAppUser] = useState<User | null>(null);

  // Live Firestore State
  const [tiles, setTiles] = useState<Record<string, EmpireTile>>({});
  const tilesRef = useRef<Record<string, EmpireTile>>({});
  const [guilds, setGuilds] = useState<Record<string, Guild>>({});
  const [loading, setLoading] = useState(true);

  // Tactical Controls & Selection
  const [selectedCoord, setSelectedCoord] = useState<string | null>(null);
  const [targetFocus, setTargetFocus] = useState<{ x: number; y: number } | null>({ x: 25, y: 25 });
  const [cameraMode, setCameraMode] = useState<'iso' | 'top'>('iso');

  // Modals
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showScoutModal, setShowScoutModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);

  // Action Drawer Messages & Feedback
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Scout Quiz State
  const [scoutQuestion, setScoutQuestion] = useState<{
    q: string;
    options: string[];
    answer: number;
    explanation?: string;
  } | null>(null);
  const [scoutChoice, setScoutChoice] = useState<number | null>(null);
  const [scoutFeedback, setScoutFeedback] = useState<string | null>(null);
  const [isScouting, setIsScouting] = useState(false);

  // Build & Repair State
  const [buildingInProgress, setBuildingInProgress] = useState(false);
  const [repairingInProgress, setRepairingInProgress] = useState(false);
  const [claimingOutpost, setClaimingOutpost] = useState(false);


  // GM Privilege Check (Full legacy whitelist)
  const isGmUser = useMemo(() => {
    return Boolean(
      appUser?.email === 'never.away@gmail.com' ||
      appUser?.email === 'admin@virusgo.com' ||
      appUser?.role === 'instructor' ||
      appUser?.role === 'admin' ||
      appUser?.email?.includes('instructor') ||
      appUser?.email?.includes('admin')
    );
  }, [appUser]);

  // GM View Mode: 'all' = sees all tiles, 'fog' = simulate player fog view
  const [gmViewMode, setGmViewMode] = useState<'all' | 'fog'>('all');

  // ── 1. Fetch User Data & Profile ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setAppUser(docSnap.data() as User);
      }
    });
    return () => unsub();
  }, [user]);

  // ── 2. Real-time Subscription to Empire Tiles & Guilds (Delta-Optimized) ─────────────
  useEffect(() => {
    const unsubTiles = onSnapshot(collection(db, 'empire_tiles'), (snapshot) => {
      // Initial Load: Build full map
      if (Object.keys(tilesRef.current).length === 0) {
        const tileMap: Record<string, EmpireTile> = {};
        snapshot.forEach((docSnap) => {
          tileMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as EmpireTile;
        });
        tilesRef.current = tileMap;
        setTiles(tileMap);
        setLoading(false);
        return;
      }

      // Delta Sync: Check doc changes to avoid redundant full-map re-renders & quota waste
      let hasRelevantChange = false;
      const updatedMap = { ...tilesRef.current };

      snapshot.docChanges().forEach((change) => {
        const docId = change.doc.id;
        if (change.type === 'removed') {
          delete updatedMap[docId];
          hasRelevantChange = true;
        } else {
          const newData = { id: docId, ...change.doc.data() } as EmpireTile;
          const prevData = updatedMap[docId];

          if (
            !prevData ||
            prevData.ownerUid !== newData.ownerUid ||
            prevData.type !== newData.type ||
            prevData.buildingType !== newData.buildingType ||
            prevData.buildingHp !== newData.buildingHp ||
            prevData.currentDefenderHp !== newData.currentDefenderHp ||
            prevData.shieldUntil !== newData.shieldUntil ||
            prevData.lastActive !== newData.lastActive ||
            prevData.lastAttacked !== newData.lastAttacked ||
            prevData.guildId !== newData.guildId ||
            prevData.isCitadel !== newData.isCitadel ||
            prevData.bossHp !== newData.bossHp
          ) {
            updatedMap[docId] = newData;
            hasRelevantChange = true;
          }
        }
      });

      if (hasRelevantChange) {
        tilesRef.current = updatedMap;
        setTiles(updatedMap);
      }
    });

    const unsubGuilds = onSnapshot(collection(db, 'guilds'), (snapshot) => {
      const gMap: Record<string, Guild> = {};
      snapshot.forEach((docSnap) => {
        gMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as Guild;
      });
      setGuilds(gMap);
    });

    return () => {
      unsubTiles();
      unsubGuilds();
    };
  }, []);


  // ── 2.2 Calculate Explored Fog of War ─────────────────────────────
  const exploredTiles = useMemo(() => {
    const set = new Set<string>();

    // Rim of 4 tiles around map is always visible (Sanctuary)
    for (let x = 0; x < MAP_SIZE; x++) {
      for (let y = 0; y < MAP_SIZE; y++) {
        if (isSanctuaryZone(x, y)) {
          set.add(`${x},${y}`);
        }
      }
    }

    if (!appUser) return set;

    // Add user's scouted tiles from profile
    if (Array.isArray(appUser.exploredTiles)) {
      appUser.exploredTiles.forEach((coord) => set.add(coord));
    }

    // Add tiles around user's owned tiles (+1 radius)
    Object.values(tiles).forEach((t) => {
      const isMyTile = t.ownerUid === appUser.uid;
      const isMyGuildTile = appUser.guildId && t.guildId === appUser.guildId;

      if (isMyTile || isMyGuildTile) {
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const nx = t.x + dx;
            const ny = t.y + dy;
            if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
              set.add(`${nx},${ny}`);
            }
          }
        }
      }
    });

    return set;
  }, [appUser, tiles]);

  // ── 2.3 Bio-Radar Minimap 2D Pixel Canvas State & Effect ─────────
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showRadarMobile, setShowRadarMobile] = useState(true);

  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark tactical background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, MAP_SIZE, MAP_SIZE);

    // Draw explored tiles & landmarks
    for (let x = 0; x < MAP_SIZE; x++) {
      for (let y = 0; y < MAP_SIZE; y++) {
        const coord = `${x},${y}`;
        const isExplored = Boolean(isGmUser || exploredTiles.has(coord));
        const tile = tiles[coord];

        if (isExplored) {
          const tileGuild = tile?.guildId ? guilds[tile.guildId] : undefined;

          if (tile?.type === 'boss') {
            ctx.fillStyle = '#ef4444'; // Red for boss
            ctx.fillRect(x, y, 1, 1);
          } else if (tile?.ownerUid === appUser?.uid) {
            ctx.fillStyle = '#06b6d4'; // Cyan for player
            ctx.fillRect(x, y, 1, 1);
          } else if (appUser?.guildId && tile?.guildId === appUser.guildId) {
            ctx.fillStyle = '#f59e0b'; // Amber for player's guild
            ctx.fillRect(x, y, 1, 1);
          } else if (tile?.guildId && guilds[tile.guildId]?.color) {
            ctx.fillStyle = guilds[tile.guildId].color; // Rival guild
            ctx.fillRect(x, y, 1, 1);
          } else if (tile?.isOutpost || tile?.type === 'outpost') {
            ctx.fillStyle = '#10b981'; // Green for outpost
            ctx.fillRect(x, y, 1, 1);
          } else if (isSanctuaryZone(x, y)) {
            ctx.fillStyle = '#075985'; // Sanctuary rim
            ctx.fillRect(x, y, 1, 1);
          } else {
            ctx.fillStyle = '#1e293b'; // Explored empty
            ctx.fillRect(x, y, 1, 1);
          }
        } else {
          if (isSanctuaryZone(x, y)) {
            ctx.fillStyle = '#0c4a6e';
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    }

    // Viewport camera target bracket
    if (targetFocus) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.strokeRect(targetFocus.x - 2, targetFocus.y - 2, 5, 5);
    }

    // Selected tile marker
    if (selectedCoord) {
      const [sx, sy] = selectedCoord.split(',').map(Number);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(sx, sy, 1, 1);
    }
  }, [tiles, guilds, exploredTiles, appUser, targetFocus, selectedCoord, isGmUser]);

  // ── 4. Stats Summary & Rankings ───────────────────────────────────
  const stats = useMemo(() => {
    let myCount = 0;
    let guildCount = 0;
    const guildTileCounts: Record<string, number> = {};

    Object.values(tiles).forEach((t) => {
      if (t.ownerUid === appUser?.uid) myCount++;
      if (appUser?.guildId && t.guildId === appUser.guildId) guildCount++;
      if (t.guildId) {
        guildTileCounts[t.guildId] = (guildTileCounts[t.guildId] || 0) + 1;
      }
    });

    const exploredPercent = Math.min(
      100,
      Math.round((exploredTiles.size / (MAP_SIZE * MAP_SIZE)) * 100)
    );

    // Top guilds sorted by conquered territories
    const topGuilds = Object.entries(guildTileCounts)
      .map(([gid, count]) => ({
        guild: guilds[gid],
        count
      }))
      .filter((item) => Boolean(item.guild))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return { myCount, guildCount, exploredPercent, topGuilds };
  }, [tiles, appUser, exploredTiles, guilds]);

  // Total sectors owned per student across the realm
  const playerTerritories = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(tiles).forEach((t) => {
      if (t.ownerUid) {
        counts[t.ownerUid] = (counts[t.ownerUid] || 0) + 1;
      }
    });
    return counts;
  }, [tiles]);

  // ── 5. Daily Quota Limits ──────────────────────────────────────────
  const dailyAttackInfo = useMemo(() => {
    return getDailyEmpireInfo(appUser);
  }, [appUser]);

  const dailyScoutInfo = useMemo(() => {
    return getDailyScoutDroneInfo(appUser);
  }, [appUser]);

  // ── 6. Selected Tile Analysis ─────────────────────────────────────
  const currentTile = selectedCoord ? tiles[selectedCoord] : null;

  const currentTileGuild = useMemo(() => {
    if (!currentTile?.guildId) return null;
    return guilds[currentTile.guildId] || null;
  }, [currentTile, guilds]);

  const isCurrentTileDecayed = useMemo(() => {
    return isDecayedTile(
      currentTile, 
      currentTileGuild?.citadelCoord, 
      currentTileGuild?.citadelCoords
    );
  }, [currentTile, currentTileGuild]);

  const isCurrentTileShielded = useMemo(() => {
    return isShieldedTile(currentTile);
  }, [currentTile]);

  // Helper to validate coordinate on 50x50 map
  const isValidCoord = useCallback((coord: string | null | undefined): boolean => {
    if (!coord || typeof coord !== 'string') return false;
    const parts = coord.split(',');
    if (parts.length !== 2) return false;
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    return !isNaN(x) && !isNaN(y) && x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE;
  }, []);

  // ── 7. Handlers: Camera Navigation ────────────────────────────────
  const handleSelectCoord = useCallback((coord: string) => {
    sfx.click();
    setSelectedCoord(coord);
    // Prefetch battle page bundle in background immediately when sector is tapped
    if (coord) {
      router.prefetch(`/student/empire/battle?tile=${coord}`);
    }
  }, [router]);

  const handleJumpToCenter = () => {
    sfx.click();
    const cx = Math.floor(MAP_SIZE / 2);
    const cy = Math.floor(MAP_SIZE / 2);
    setTargetFocus({ x: cx, y: cy });
    setSelectedCoord(`${cx},${cy}`);
  };

  const handleJumpToMyBase = () => {
    sfx.click();
    const myTile = Object.values(tiles).find((t) => t.ownerUid === appUser?.uid);
    if (myTile) {
      setTargetFocus({ x: myTile.x, y: myTile.y });
      setSelectedCoord(`${myTile.x},${myTile.y}`);
    } else {
      handleJumpToCenter();
    }
  };

  const handleJumpToCitadel = () => {
    sfx.click();
    if (!appUser?.guildId) return;
    const g = guilds[appUser.guildId] as any;
    if (g?.citadelCoord) {
      const [cx, cy] = g.citadelCoord.split(',').map(Number);
      setTargetFocus({ x: cx, y: cy });
      setSelectedCoord(g.citadelCoord);
    } else {
      alert('กิลด์ของคุณยังไม่ได้สถาปนานครหลวง');
    }
  };

  // ── 8. Handler: Infiltrate / Attack (HoMM Marching to Target Tile) ──
  const [marchOrder, setMarchOrder] = useState<MarchOrder | null>(null);
  const [isMarching, setIsMarching] = useState(false);

  const heroPetCoord = useMemo(() => {
    // 1. Check pet.currentTileCoord from Firestore
    if (isValidCoord(appUser?.pet?.currentTileCoord)) {
      return appUser!.pet!.currentTileCoord!;
    }
    // 2. Synchronous fallback to localStorage (solves instant page refresh before Firestore snapshot)
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('virusgo_hero_coord');
      if (isValidCoord(cached)) {
        return cached!;
      }
    }
    // 3. Fallback to player's capital base
    const capital = Object.values(tiles).find(t => t.ownerUid === appUser?.uid && t.isCapital);
    if (capital) return `${capital.x},${capital.y}`;
    // 4. Fallback to any owned tile
    const anyTile = Object.values(tiles).find(t => t.ownerUid === appUser?.uid);
    if (anyTile) return `${anyTile.x},${anyTile.y}`;
    return null;
  }, [appUser?.pet?.currentTileCoord, appUser?.uid, tiles, isValidCoord]);

  // Sync localStorage whenever appUser.pet.currentTileCoord updates
  useEffect(() => {
    if (typeof window !== 'undefined' && isValidCoord(appUser?.pet?.currentTileCoord)) {
      localStorage.setItem('virusgo_hero_coord', appUser!.pet!.currentTileCoord!);
    }
  }, [appUser?.pet?.currentTileCoord, isValidCoord]);

  // Auto-focus camera on hero's location upon initial loading
  const hasInitiallyFocused = useRef(false);
  useEffect(() => {
    if (hasInitiallyFocused.current) return;
    if (heroPetCoord) {
      const [hx, hy] = heroPetCoord.split(',').map(Number);
      if (!isNaN(hx) && !isNaN(hy)) {
        setTargetFocus({ x: hx, y: hy });
        setSelectedCoord(heroPetCoord);
        hasInitiallyFocused.current = true;
      }
    }
  }, [heroPetCoord]);

  const handleStartAttack = () => {
    if (!selectedCoord) return;
    sfx.click();

    // Check Daily Attack Limit (exempt GM)
    if (!isGmUser && !dailyAttackInfo.canAttack) {
      alert(`⛔ คุณใช้โควตาการบุกรุกครบ ${DAILY_EMPIRE_ATTACK_LIMIT} ครั้งสำหรับวันนี้แล้ว! (รีเซ็ตทุกเที่ยงคืน)`);
      return;
    }

    // Check Pet Health
    if (appUser?.pet?.isInjured) {
      if (confirm('🚨 ไวรัสของคุณบาดเจ็บจากการรบและพลังชีวิตหมดลง! ต้องการไปห้องเพาะเลี้ยงเพื่อรักษาและฟื้นฟู HP หรือไม่?')) {
        router.push('/student/virus-pet');
      }
      return;
    }

    const target = selectedCoord;

    // Immediately cache target in localStorage and Firestore for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('virusgo_hero_coord', target);
    }
    if (appUser?.uid) {
      updateDoc(doc(db, 'users', appUser.uid), {
        'pet.currentTileCoord': target,
      }).catch(console.error);
    }

    // Direct, instantaneous route into battle (คลิกเข้าได้เลย 0ms delay!)
    router.push(`/student/empire/battle?tile=${target}`);
  };

  // ── 8.1 Handler: Bio-Radar Minimap Interaction (Tap or Drag) ──────
  const handleRadarInteract = (e: React.PointerEvent<HTMLDivElement | HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const tx = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(px * MAP_SIZE)));
    const ty = Math.min(MAP_SIZE - 1, Math.max(0, Math.floor(py * MAP_SIZE)));
    sfx.click();
    setTargetFocus({ x: tx, y: ty });
    setSelectedCoord(`${tx},${ty}`);
  };

  // ── 9. Handler: Scout Drone Calibration & Quiz (Bio-Radar) ────────
  const handleStartScout = (customCoord?: string) => {
    if (!appUser) return;

    if (!isGmUser && !dailyScoutInfo.canScout) {
      alert(`⛔ แบตเตอรี่โดรนสอดแนมหมด! คุณใช้โควตาสอดแนมครบ ${DAILY_SCOUT_DRONE_LIMIT} ครั้งสำหรับวันนี้แล้ว (รีเซ็ตทุกเที่ยงคืน)`);
      return;
    }

    let target = customCoord || selectedCoord;
    // If no target or target is already explored, find the nearest unexplored fog tile
    if (!target || exploredTiles.has(target)) {
      const fx = targetFocus?.x ?? 25;
      const fy = targetFocus?.y ?? 25;
      let found: string | null = null;
      for (let r = 1; r < MAP_SIZE; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const nx = fx + dx;
            const ny = fy + dy;
            if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
              const c = `${nx},${ny}`;
              if (!exploredTiles.has(c)) {
                found = c;
                break;
              }
            }
          }
          if (found) break;
        }
        if (found) break;
      }
      if (found) {
        target = found;
        setSelectedCoord(found);
        const [nx, ny] = found.split(',').map(Number);
        setTargetFocus({ x: nx, y: ny });
      } else {
        target = `${fx},${fy}`;
        setSelectedCoord(target);
      }
    }

    sfx.click();

    let qObj: {
      q: string;
      options: string[];
      answer: number;
      explanation?: string;
    };
    if (ALL_15_CHAPTER_QUESTIONS && ALL_15_CHAPTER_QUESTIONS.length > 0) {
      const randomQ = ALL_15_CHAPTER_QUESTIONS[Math.floor(Math.random() * ALL_15_CHAPTER_QUESTIONS.length)];
      const answerIdx = randomQ.choices.findIndex((c) => c === randomQ.answer);
      qObj = {
        q: randomQ.q,
        options: randomQ.choices,
        answer: answerIdx >= 0 ? answerIdx : 0,
        explanation: randomQ.explanation
      };
    } else {
      const randomFallback = SCOUT_FALLBACK_QUIZ[Math.floor(Math.random() * SCOUT_FALLBACK_QUIZ.length)];
      qObj = {
        q: randomFallback.q,
        options: randomFallback.options,
        answer: randomFallback.answer,
        explanation: randomFallback.explanation
      };
    }

    setScoutQuestion(qObj);
    setScoutChoice(null);
    setScoutFeedback(null);
    setShowScoutModal(true);
  };

  const handleAnswerScout = async (choiceIndex: number) => {
    if (!scoutQuestion || !selectedCoord || !appUser || isScouting) return;
    setIsScouting(true);
    setScoutChoice(choiceIndex);

    const isCorrect = choiceIndex === scoutQuestion.answer;
    if (isCorrect) {
      sfx.victory();
      setScoutFeedback('วิเคราะห์ความถี่คลื่นถูกต้อง! โดรนเปิดเผยหมอกในรัศมี 5×5 ช่อง (+25 EXP)');

      try {
        const [cx, cy] = selectedCoord.split(',').map(Number);
        const revealedCoords: string[] = [];

        for (let dx = -2; dx <= 2; dx++) {
          for (let dy = -2; dy <= 2; dy++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
              revealedCoords.push(`${nx},${ny}`);
            }
          }
        }

        const today = getTodayDateString();
        const currentScouts = (appUser.dailyScoutDrones?.date === today ? (Number(appUser.dailyScoutDrones?.count) || 0) : 0) + 1;

        // Check badge milestones
        const prevExplored = Array.isArray(appUser.exploredTiles) ? appUser.exploredTiles : [];
        const combinedExplored = new Set([...prevExplored, ...revealedCoords]);
        const currentBadges = Array.isArray(appUser.badges) ? [...appUser.badges] : [];
        const newBadges: string[] = [];

        if (combinedExplored.size >= MAP_SIZE * MAP_SIZE * 0.25 && !currentBadges.includes('Junior Explorer')) {
          newBadges.push('Junior Explorer');
        }
        if (combinedExplored.size >= MAP_SIZE * MAP_SIZE * 0.5 && !currentBadges.includes('Master Cartographer')) {
          newBadges.push('Master Cartographer');
        }
        if (combinedExplored.size >= MAP_SIZE * MAP_SIZE && !currentBadges.includes('Grand Conqueror')) {
          newBadges.push('Grand Conqueror');
        }

        const userRef = doc(db, 'users', appUser.uid);
        const updatePayload: any = {
          exploredTiles: arrayUnion(...revealedCoords),
          dailyScoutDrones: {
            date: today,
            count: currentScouts
          },
          exp: increment(25),
          score: increment(25)
        };

        if (newBadges.length > 0) {
          updatePayload.badges = arrayUnion(...newBadges);
        }

        await updateDoc(userRef, updatePayload);

        setTimeout(() => {
          setIsScouting(false);
          setShowScoutModal(false);
          setActionSuccessMsg(`🛸 สแกนหมอกสำเร็จ! ปลดล็อคพื้นที่ 5×5 ช่องรอบ [${selectedCoord}] (+25 EXP)`);
          setTimeout(() => setActionSuccessMsg(null), 4000);
        }, 1800);
      } catch (err) {
        console.error("Scout drone error:", err);
        setIsScouting(false);
      }
    } else {
      sfx.wrong();
      setScoutFeedback(`สัญญาณถูกรบกวน! คำตอบที่ถูกต้องคือ: ${scoutQuestion.options[scoutQuestion.answer]}`);
      setTimeout(() => {
        setIsScouting(false);
        setShowScoutModal(false);
      }, 2500);
    }
  };

  // ── 10. Handler: Build Defense Structure ──────────────────────────
  const handleBuildStructure = async (structId: string) => {
    if (!selectedCoord || !appUser || buildingInProgress) return;
    const struct = DEFENSE_STRUCTURES[structId];
    if (!struct) return;

    const userExp = Number(appUser.exp || 0);
    if (userExp < struct.costExp) {
      alert(`⚠️ EXP ไม่เพียงพอ! การก่อสร้าง "${struct.name}" ต้องการ ${struct.costExp} EXP (คุณมี ${userExp} EXP)`);
      return;
    }

    setBuildingInProgress(true);
    try {
      const tileRef = doc(db, 'empire_tiles', selectedCoord);
      const userRef = doc(db, 'users', appUser.uid);

      // Deduct EXP
      await updateDoc(userRef, {
        exp: increment(-struct.costExp)
      });

      // Update tile with structure
      await updateDoc(tileRef, {
        buildingType: struct.id,
        buildingName: struct.name,
        buildingHp: struct.bonusHp,
        maxBuildingHp: struct.bonusHp,
        buildingLevel: 1,
        builtBy: appUser.uid,
        builtByName: appUser.fullname || 'Defender'
      });

      sfx.levelUp();
      setShowBuildModal(false);
      setActionSuccessMsg(`🧱 สถาปนา "${struct.name}" สำเร็จ ณ เซกเตอร์ [${selectedCoord}] (-${struct.costExp} EXP)`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Build structure error:", err);
      alert('เกิดข้อผิดพลาดในการสร้างสิ่งก่อสร้าง');
    } finally {
      setBuildingInProgress(false);
    }
  };

  // ── 11. Handler: Repair Defense Structure ─────────────────────────
  const handleRepairStructure = async () => {
    if (!selectedCoord || !appUser || !currentTile || repairingInProgress) return;
    if (!currentTile.buildingType) return;
    const struct = DEFENSE_STRUCTURES[currentTile.buildingType];
    if (!struct) return;

    const currentHp = currentTile.buildingHp || 0;
    const maxHp = currentTile.maxBuildingHp || struct.bonusHp;
    if (currentHp >= maxHp) {
      alert('🛡️ สิ่งก่อสร้างนี้มีความสมบูรณ์ 100% อยู่แล้ว');
      return;
    }

    const userExp = Number(appUser.exp || 0);
    if (userExp < struct.repairCostExp) {
      alert(`⚠️ EXP ไม่เพียงพอ! การซ่อมแซมต้องการ ${struct.repairCostExp} EXP (คุณมี ${userExp} EXP)`);
      return;
    }

    setRepairingInProgress(true);
    try {
      const tileRef = doc(db, 'empire_tiles', selectedCoord);
      const userRef = doc(db, 'users', appUser.uid);

      await updateDoc(userRef, {
        exp: increment(-struct.repairCostExp)
      });

      await updateDoc(tileRef, {
        buildingHp: maxHp,
        currentDefenderHp: currentTile.maxDefenderHp || maxHp
      });

      sfx.victory();
      setActionSuccessMsg(`🔨 ซ่อมแซม "${struct.name}" จนสมบูรณ์ 100% (-${struct.repairCostExp} EXP)`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Repair error:", err);
      alert('เกิดข้อผิดพลาดในการซ่อมแซม');
    } finally {
      setRepairingInProgress(false);
    }
  };

  // ── 12. Handler: Daily Outpost Harvest ────────────────────────────
  const handleClaimDailyExp = async () => {
    if (!selectedCoord || !appUser || claimingOutpost || !currentTile) return;
    const today = getTodayDateString();

    if (currentTile.lastClaimedDate === today) {
      alert('คุณได้เก็บเกี่ยวผลผลิตจากป้อมนี้ไปแล้วในวันนี้! กรุณารอวันถัดไป');
      return;
    }

    setClaimingOutpost(true);
    try {
      const tileRef = doc(db, 'empire_tiles', selectedCoord);
      const userRef = doc(db, 'users', appUser.uid);

      await updateDoc(userRef, {
        exp: increment(100),
        score: increment(100)
      });

      await updateDoc(tileRef, {
        lastClaimedDate: today
      });

      sfx.levelUp();
      setActionSuccessMsg(`🎉 เก็บเกี่ยวผลผลิตสำเร็จ! ได้รับ +100 EXP ประจำวันจากป้อมวิจัย`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Claim daily exp error:", err);
    } finally {
      setClaimingOutpost(false);
    }
  };

  // ── 12.1 Handler: Restore Decayed Territory Upkeep (>72h Inactivity) ──────
  const [restoringUpkeep, setRestoringUpkeep] = useState(false);

  const handleRestoreUpkeep = async () => {
    if (!selectedCoord || !appUser || !currentTile || restoringUpkeep) return;
    setRestoringUpkeep(true);
    try {
      const tileRef = doc(db, 'empire_tiles', selectedCoord);
      const fullHp = currentTile.maxDefenderHp || 1000;
      await updateDoc(tileRef, {
        lastActive: new Date().toISOString(),
        currentDefenderHp: fullHp,
      });

      sfx.victory();
      setActionSuccessMsg(`✨ ฟื้นฟูอาณาเขต [${selectedCoord}] สำเร็จ! พลังชีวิตและค่าสถานะกลับคืน 100%`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Restore upkeep error:", err);
      alert('เกิดข้อผิดพลาดในการฟื้นฟูอาณาเขต');
    } finally {
      setRestoringUpkeep(false);
    }
  };

  // ── 13. GM Administrative Tools Handlers ──────────────────────────
  const handleGmFullHealTile = async (tileId: string) => {
    if (!isGmUser) return;
    try {
      const t = tiles[tileId];
      if (!t) return;
      const updates: Partial<EmpireTile> = {
        currentDefenderHp: t.maxDefenderHp || 1000,
      };
      if (t.buildingType) {
        updates.buildingHp = t.maxBuildingHp || 1000;
      }
      await updateDoc(doc(db, 'empire_tiles', tileId), updates);
      sfx.victory();
      setActionSuccessMsg(`💖 [GM] ฟื้นฟู HP 100% ให้เซกเตอร์ [${tileId}] สำเร็จ`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to heal tile by GM:', err);
    }
  };

  const handleGmGrantShield = async (tileId: string, hours: number = 24) => {
    if (!isGmUser) return;
    try {
      const shieldUntil = new Date(Date.now() + hours * 3600 * 1000).toISOString();
      await updateDoc(doc(db, 'empire_tiles', tileId), { shieldUntil });
      sfx.victory();
      setActionSuccessMsg(`🛡️ [GM] มอบบาเรีย ${hours} ชม. ให้เซกเตอร์ [${tileId}] สำเร็จ`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to grant shield by GM:', err);
    }
  };

  const handleGmRemoveShield = async (tileId: string) => {
    if (!isGmUser) return;
    try {
      await updateDoc(doc(db, 'empire_tiles', tileId), { shieldUntil: null });
      sfx.click();
      setActionSuccessMsg(`🔓 [GM] ปลดบาเรียของเซกเตอร์ [${tileId}] สำเร็จ`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to remove shield by GM:', err);
    }
  };

  const handleGmResetTile = async (tileId: string) => {
    if (!isGmUser) return;
    if (!confirm(`[GM Action] ยืนยันการล้างเซกเตอร์ [${tileId}] ให้กลับเป็นช่องว่างหรือไม่?`)) return;

    try {
      const [tx, ty] = tileId.split(',').map(Number);
      await setDoc(doc(db, 'empire_tiles', tileId), {
        id: tileId,
        x: tx,
        y: ty,
        type: 'empty'
      });
      sfx.click();
      setActionSuccessMsg(`🧹 [GM] รีเซ็ตเซกเตอร์ [${tileId}] ให้เป็นช่องว่างเรียบร้อยแล้ว`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error("GM reset tile error:", err);
    }
  };

  const handleGmInstantClaim = async (tileId: string) => {
    if (!isGmUser || !appUser) return;
    try {
      await updateDoc(doc(db, 'empire_tiles', tileId), {
        type: 'player',
        ownerUid: appUser.uid,
        ownerName: appUser.fullname || 'GM Admin',
        guildId: appUser.guildId || null,
        currentDefenderHp: 2000,
        maxDefenderHp: 2000,
        lastAttacked: new Date().toISOString()
      });
      sfx.victory();
      setActionSuccessMsg(`👑 [GM] ยึดครองเซกเตอร์ [${tileId}] สำเร็จทันที`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error("GM instant claim error:", err);
    }
  };

  const handleGmResetMyQuota = async () => {
    if (!appUser || !isGmUser) return;
    if (!confirm('🔄 [GM Action] ยืนยันการรีเซ็ตโควตาการบุกรุกและโดรนสอดแนมของตนเองกลับเป็นเต็ม 10/10 หรือไม่?')) return;

    try {
      const today = getTodayDateString();
      const userRef = doc(db, 'users', appUser.uid);
      await updateDoc(userRef, {
        dailyEmpireBattles: { date: today, count: 0 },
        dailyScoutDrones: { date: today, count: 0 }
      });
      sfx.levelUp();
      alert('✅ [GM] รีเซ็ตโควตาวันนี้สำเร็จเป็น 10/10 แล้ว!');
    } catch (err) {
      console.error("GM reset quota error:", err);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-slate-950 text-cyan-400 gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <span className="font-mono text-sm uppercase tracking-widest">
          กำลังเตรียมการระบบสมรภูมิ 3D (TACTICAL WAR ROOM)...
        </span>
      </div>
    );
  }

  const isMyTile = currentTile?.ownerUid === appUser?.uid;
  const isGuildTile = Boolean(appUser?.guildId && currentTile?.guildId === appUser.guildId);
  const isOutpost = Boolean(currentTile?.isOutpost || currentTile?.type === 'outpost');
  const isBoss = Boolean(currentTile?.type === 'boss');
  const isExplored = Boolean(isGmUser || (selectedCoord && exploredTiles.has(selectedCoord)));
  const todayStr = getTodayDateString();
  const hasClaimedToday = currentTile?.lastClaimedDate === todayStr;

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-slate-950 font-sans select-none text-slate-100 flex flex-col">
      
      {/* ── TOP HUD HEADER: RESPONSIVE COMPACT BAR ───────────────────────── */}
      <header className="z-30 bg-slate-900/95 border-b border-slate-800/80 px-2.5 sm:px-5 py-2 backdrop-blur-xl shrink-0 flex items-center justify-between gap-2 shadow-2xl">
        
        {/* Left: Brand & Return */}
        <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto shrink-0">
          <Link
            href="/student"
            onClick={() => sfx.click()}
            className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-cyan-400 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
            title="กลับแดชบอร์ดหลัก"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider sm:tracking-widest shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                3D WAR ROOM
              </span>
              <span className="text-xs text-slate-400 font-mono hidden lg:inline">
                แผนที่ยุทธการ 50×50 (2,500 เซกเตอร์)
              </span>
            </div>
            <h1 className="text-sm sm:text-xl font-black text-white tracking-wide flex items-center gap-1.5 mt-0.5">
              <span>VIRUS EMPIRE</span>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hidden xs:inline">
                TACTICAL 3D
              </span>
            </h1>
          </div>
        </div>

        {/* Center: Desktop-only Telemetry Pills (md and up) */}
        <div className="hidden md:flex items-center gap-2 pointer-events-auto">
          {/* My Territory */}
          <div className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-cyan-500/40 flex items-center gap-1.5 text-xs font-mono shadow-md backdrop-blur-md">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">ฉันครอง:</span>
            <span className="text-cyan-300 font-bold">{stats.myCount} ช่อง</span>
          </div>

          {/* Guild Territory */}
          {appUser?.guildId && (
            <div className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-amber-500/40 flex items-center gap-1.5 text-xs font-mono shadow-md backdrop-blur-md">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">กิลด์:</span>
              <span className="text-amber-300 font-bold">{stats.guildCount} ช่อง</span>
            </div>
          )}

          {/* Fog Explored */}
          <div className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-emerald-500/40 flex items-center gap-1.5 text-xs font-mono shadow-md backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">สำรวจ:</span>
            <span className="text-emerald-300 font-bold">{stats.exploredPercent}%</span>
          </div>

          {/* Daily Attacks Remaining */}
          <div className="px-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center gap-1 text-xs font-mono shadow-md backdrop-blur-md">
            <Swords className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-300 font-bold">
              {dailyAttackInfo.remainingAttacks}/{dailyAttackInfo.limit}
            </span>
          </div>

          {/* Daily Scout Drone Flights */}
          <button
            type="button"
            onClick={() => handleStartScout()}
            className="px-2.5 py-1 rounded-xl bg-slate-900/90 hover:bg-teal-950/80 border border-slate-700/80 hover:border-teal-500/50 flex items-center gap-1 text-xs font-mono shadow-md backdrop-blur-md cursor-pointer transition-all active:scale-95"
            title="ภารกิจโดรนสอดแนม (Bio-Radar) - ตอบคำถามไวรัสวิทยาเปิดหมอก 5x5 ช่อง (+25 EXP)"
          >
            <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="text-teal-300 font-bold">
              โดรน: {dailyScoutInfo.remainingScouts}/{dailyScoutInfo.limit}
            </span>
          </button>
        </div>

        {/* Right: Actions & Tools (Both Mobile & Desktop) */}
        <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
          {/* Pet Status Badge */}
          {appUser?.pet && (
            <Link
              href="/student/virus-pet"
              onClick={() => sfx.click()}
              className={`px-2 sm:px-2.5 py-1 rounded-xl border flex items-center gap-1 text-[10px] sm:text-xs font-mono shadow-md backdrop-blur-md cursor-pointer transition-all active:scale-95 ${
                appUser.pet.isInjured
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse'
                  : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              }`}
              title={appUser.pet.isInjured ? 'สัตว์เลี้ยงบาดเจ็บ! คลิกเพื่อไปรักษา' : 'สัตว์เลี้ยงพร้อมรบ'}
            >
              <Heart className={`w-3 h-3 ${appUser.pet.isInjured ? 'text-rose-400' : 'text-emerald-400'}`} />
              <span className="hidden sm:inline">{appUser.pet.nickname || appUser.pet.virusName}:</span>
              <span>{appUser.pet.isInjured ? 'บาดเจ็บ' : 'พร้อมรบ'}</span>
            </Link>
          )}

          {/* Rules / Intel Button */}
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setShowRulesModal(true);
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-400 text-cyan-400 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
            title="คู่มือและกติกาสมรภูมิ 3D"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Statistics Modal Button */}
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setShowStatsModal(true);
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-amber-400 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
            title="ดูสถิติและทำเนียบเกียรติยศกิลด์"
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* GM View Mode Toggle Button */}
          {isGmUser && (
            <button
              type="button"
              onClick={() => {
                setGmViewMode((prev) => (prev === 'all' ? 'fog' : 'all'));
                sfx.click();
              }}
              className={`px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-mono font-bold border transition-all flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer ${
                gmViewMode === 'all'
                  ? 'bg-amber-950/90 border-amber-500/70 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-800/90 border-slate-600 text-slate-300'
              }`}
              title="สลับมุมมอง GM: มองเห็นทั้งแผนที่ 50x50 หรือจำลองมุมมองหมอกสงครามของผู้เล่น"
            >
              {gmViewMode === 'all' ? (
                <>
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                  <span className="hidden sm:inline">GM:</span>
                  <span>เห็นหมด</span>
                </>
              ) : (
                <>
                  <CloudFog className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" />
                  <span className="hidden sm:inline">GM:</span>
                  <span>หมอก</span>
                </>
              )}
            </button>
          )}

          {/* GM Quota Reset */}
          {isGmUser && (
            <button
              type="button"
              onClick={handleGmResetMyQuota}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-[10px] sm:text-xs font-mono font-bold transition-all shadow-md cursor-pointer flex items-center gap-1 active:scale-95"
              title="[GM] รีเซ็ตโควตาตนเองเป็น 10/10"
            >
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">รีเซ็ตโควตา</span>
            </button>
          )}
        </div>
      </header>

      {/* ── MOBILE TELEMETRY STRIP (Single-line smooth horizontal ticker) ── */}
      <div className="md:hidden z-20 bg-slate-950/90 border-b border-slate-800/80 px-2.5 py-1.5 backdrop-blur-md flex items-center gap-1.5 overflow-x-auto no-scrollbar text-[11px] font-mono shrink-0">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 shrink-0">
          <MapPin className="w-3 h-3 text-cyan-400" />
          <span>ฉัน: <strong className="text-white">{stats.myCount}</strong></span>
        </div>

        {appUser?.guildId && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-300 shrink-0">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>กิลด์: <strong className="text-white">{stats.guildCount}</strong></span>
          </div>
        )}

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 shrink-0">
          <Radio className="w-3 h-3 text-emerald-400" />
          <span>สำรวจ: <strong className="text-white">{stats.exploredPercent}%</strong></span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 shrink-0">
          <Swords className="w-3 h-3 text-rose-400" />
          <span>โจมตี: <strong className="text-white">{dailyAttackInfo.remainingAttacks}/{dailyAttackInfo.limit}</strong></span>
        </div>

        <button
          type="button"
          onClick={() => handleStartScout()}
          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-teal-950/80 hover:bg-teal-900 border border-teal-500/50 text-teal-300 shrink-0 cursor-pointer active:scale-95 shadow-sm"
          title="แตะเพื่อส่งโดรนสอดแนมหมอก (Bio-Radar) ทันที"
        >
          <Radio className="w-3 h-3 text-teal-400 animate-pulse" />
          <span>โดรน: <strong className="text-white">{dailyScoutInfo.remainingScouts}/{dailyScoutInfo.limit}</strong></span>
        </button>
      </div>

      {/* ── 3D HOLOGRAPHIC TACTICAL WAR TABLE (CANVAS) ────────────────────── */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <EmpireCanvas3D
          tiles={tiles}
          guilds={guilds}
          exploredTiles={exploredTiles}
          myUid={appUser?.uid}
          myGuildId={appUser?.guildId}
          selectedCoord={selectedCoord}
          onSelectCoord={handleSelectCoord}
          targetFocus={targetFocus}
          cameraMode={cameraMode}
          isGmUser={Boolean(isGmUser && gmViewMode === 'all')}
          petCoord={heroPetCoord}
          petFamily={appUser?.pet?.family}
          ownerName={appUser?.pet?.nickname || appUser?.fullname}
          marchOrder={marchOrder}
        />



        {/* ── FLOATING TACTICAL CONTROLS (RIGHT DOCK) ────────────────────────── */}
        <div className="absolute right-2.5 sm:right-5 top-2.5 sm:top-4 z-20 flex flex-col gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Toggle 3D Isometric / 2D Top-Down */}
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setCameraMode((prev) => (prev === 'iso' ? 'top' : 'iso'));
            }}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/90 hover:bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md flex items-center justify-center group"
            title={cameraMode === 'iso' ? 'สลับเป็นมุมมองมุมบน 2D Top-Down' : 'สลับเป็นมุมมอง 3D Isometric'}
          >
            <Compass className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${cameraMode === 'top' ? 'rotate-90 text-amber-400' : 'text-cyan-400'}`} />
          </button>

          {/* Jump to Center */}
          <button
            type="button"
            onClick={handleJumpToCenter}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/90 hover:bg-cyan-950/80 border border-slate-700/80 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md flex items-center justify-center"
            title="เลื่อนกล้องไปศูนย์กลางแผนที่ [25, 25]"
          >
            <Crosshair className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Jump to My Base */}
          <button
            type="button"
            onClick={handleJumpToMyBase}
            className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/90 hover:bg-cyan-950/80 border border-slate-700/80 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md flex items-center justify-center"
            title="เลื่อนกล้องไปที่ฐานของฉัน"
          >
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
          </button>

          {/* Jump to Citadel (if guild has citadel) */}
          {appUser?.guildId && (
            <button
              type="button"
              onClick={handleJumpToCitadel}
              className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-900/90 hover:bg-amber-950/80 border border-slate-700/80 hover:border-amber-400 text-slate-300 hover:text-amber-300 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md flex items-center justify-center"
              title="เลื่อนกล้องไปที่นครหลวงกิลด์"
            >
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </button>
          )}

          {/* Toggle Bio-Radar Minimap */}
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setShowRadarMobile((prev) => !prev);
            }}
            className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md flex items-center justify-center ${
              showRadarMobile 
                ? 'bg-cyan-950/90 border-cyan-400/70 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-white'
            }`}
            title="เปิด/ปิด เรดาร์ยุทธการชีวภาพ (BIO-RADAR)"
          >
            <Radio className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* ── BOTTOM TACTICAL RADAR (BIO-RADAR MINIMAP) ───────────────────────── */}
        <div className="absolute left-2.5 sm:left-5 bottom-2.5 sm:bottom-4 z-20 pointer-events-auto">
          {showRadarMobile ? (
            <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-900/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1 font-bold text-cyan-400">
                  <Radio className="w-3 h-3 text-cyan-400 animate-pulse" /> BIO-RADAR
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">50×50</span>
                  <button
                    type="button"
                    onClick={() => setShowRadarMobile(false)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                    title="ย่อขนาดเรดาร์"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 50x50 Interactive Real-Time Radar Canvas */}
              <div 
                className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden cursor-crosshair shadow-inner touch-none select-none"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  handleRadarInteract(e);
                }}
                onPointerMove={(e) => {
                  if (e.buttons > 0) {
                    handleRadarInteract(e);
                  }
                }}
              >
                {/* 2D Canvas rendering live 50x50 grid pixels */}
                <canvas 
                  ref={radarCanvasRef}
                  width={MAP_SIZE}
                  height={MAP_SIZE}
                  className="w-full h-full [image-rendering:pixelated] block pointer-events-none"
                />

                {/* Radar Sweep Line Animation */}
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent animate-pulse pointer-events-none" />

                {/* Radar Blip for Selected Tile */}
                {selectedCoord && (() => {
                  const [sx, sy] = selectedCoord.split(',').map(Number);
                  return (
                    <div 
                      className="absolute w-2.5 h-2.5 rounded-full bg-cyan-400 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_10px_#22d3ee] animate-ping pointer-events-none"
                      style={{ left: `${(sx / MAP_SIZE) * 100}%`, top: `${(sy / MAP_SIZE) * 100}%` }}
                    />
                  );
                })()}
              </div>

              {/* Radar Color Key Legend */}
              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400 pt-0.5 px-0.5 select-none">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block" />คุณ</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />กิลด์</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />บอส</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />ฟาร์ม</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRadarMobile(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer backdrop-blur-md"
              title="เปิดเรดาร์ยุทธการ (BIO-RADAR)"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>BIO-RADAR</span>
            </button>
          )}
        </div>

        {/* ── ACTION SUCCESS NOTIFICATION TOAST ───────────────────────────────── */}
        {actionSuccessMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div className="px-4 py-2 sm:px-5 sm:py-3 rounded-2xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 font-mono text-xs sm:text-sm font-bold shadow-[0_0_30px_rgba(6,182,212,0.5)] backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-300">
              {actionSuccessMsg}
            </div>
          </div>
        )}

        {/* ── BOTTOM TACTICAL ACTION DRAWER (WHEN SECTOR SELECTED) ───────────── */}
        {selectedCoord && (
          <div className="absolute inset-x-2.5 sm:inset-x-auto sm:right-5 bottom-2 sm:bottom-5 sm:w-[400px] z-30 pointer-events-auto max-h-[60vh] sm:max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900/95 border border-cyan-500/40 shadow-[0_0_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl space-y-2.5 sm:space-y-3.5 overflow-y-auto">
              
              {/* Header: Sector Coordinates & Close */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs">
                    #
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-mono flex items-center gap-1.5 flex-wrap">
                      <span>SECTOR [{selectedCoord}]</span>
                      {isGmUser && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 shadow-sm whitespace-nowrap">
                          <Eye className="w-2.5 h-2.5 text-amber-400" /> GM Inspector
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {isSanctuaryZone(Number(selectedCoord.split(',')[0]), Number(selectedCoord.split(',')[1])) 
                        ? '🛡️ เขตรักษาความปลอดภัย (Sanctuary Rim)'
                        : isCentralVaultZone(Number(selectedCoord.split(',')[0]), Number(selectedCoord.split(',')[1]))
                        ? '⚡ ศูนย์กลางชีวะ (Central Core Vault)'
                        : '⚔️ สมรภูมิยุทธการ (Tactical Frontier)'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCoord(null)}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sector Details */}
              <div className="space-y-2 text-xs font-mono">
                {/* ── COMMANDER & VIRUS PET IDENTITY CARD ── */}
                {currentTile?.ownerUid && (
                  <div 
                    className="p-3 rounded-2xl bg-slate-950/80 border flex items-center gap-3 shadow-md"
                    style={{ 
                      borderColor: `${getPlayerUniqueColor(currentTile.ownerUid, isMyTile)}45`,
                    }}
                  >
                    {/* Glowing SVG Virus Pet in Student's Unique Tactical Color */}
                    <div 
                      className="w-12 h-12 rounded-2xl bg-slate-900 border flex items-center justify-center p-1.5 shrink-0 relative shadow-inner"
                      style={{ 
                        borderColor: `${getPlayerUniqueColor(currentTile.ownerUid, isMyTile)}70`,
                        boxShadow: `0 0 16px ${getPlayerUniqueColor(currentTile.ownerUid, isMyTile)}25`
                      }}
                    >
                      <SVGVirus 
                        type={familyToVirusType(currentTile.ownerFamily || 'parvo')} 
                        className="w-full h-full"
                        style={{ color: getPlayerUniqueColor(currentTile.ownerUid, isMyTile) }}
                        glowColor={getPlayerUniqueColor(currentTile.ownerUid, isMyTile)}
                      />
                      {isMyTile && (
                        <span className="absolute -top-1.5 -right-1.5 text-xs drop-shadow">👑</span>
                      )}
                    </div>

                    {/* Owner & Virus Details */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: getPlayerUniqueColor(currentTile.ownerUid, isMyTile) }}
                        />
                        <span className="font-bold text-white text-sm truncate">
                          {currentTile.ownerName || 'ผู้เล่น'}
                        </span>
                        {isMyTile && (
                          <span className="text-[9px] bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded font-black">คุณ</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span className="text-cyan-300 capitalize font-bold">
                          🦠 {currentTile.ownerFamily || 'Parvo'}
                        </span>
                        <span>•</span>
                        <span className="text-amber-300 font-bold">
                          📍 {playerTerritories[currentTile.ownerUid] || 1} เซกเตอร์
                        </span>
                      </div>

                      {currentTile.guildName && (
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          🛡️ กิลด์: <span className="text-slate-200 font-bold">[{currentTile.guildName}]</span>
                        </div>
                      )}

                      {/* Hero Duel vs Garrison Status Tag */}
                      {(() => {
                        const isHeroHere = Boolean(
                          (isMyTile && heroPetCoord === selectedCoord) ||
                          (currentTile.heroStationedUid && currentTile.heroStationedUid === currentTile.ownerUid)
                        );
                        return isHeroHere ? (
                          <div className="mt-1 px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/50 flex items-center gap-1.5 text-[10px] text-amber-300 font-bold shadow-sm">
                            <span>👑</span>
                            <span>{isMyTile ? 'ฮีโร่ของคุณประจำการอยู่ที่นี่' : 'ตรวจพบจอมทัพประจำการ (Hero Duel • ทัพเต็ม 3 กองพัน)'}</span>
                          </div>
                        ) : (
                          <div className="mt-1 px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center gap-1.5 text-[9px] text-slate-300">
                            <span>🛡️</span>
                            <span>กองกำลังรักษาการประจำเซกเตอร์ ({currentTile.defenderStacks?.reduce((acc, s) => acc + s.count, 0) || 60} virions เฝ้าป้อม)</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Boss Identity Card */}
                {isBoss && (
                  <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-rose-500/50 flex items-center justify-center p-1.5 shrink-0 shadow-[0_0_16px_rgba(244,63,94,0.3)]">
                      <SVGVirus type="corona" className="w-full h-full text-rose-500" glowColor="#f43f5e" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-rose-400 font-black text-sm flex items-center gap-1">
                        <Flame className="w-4 h-4 text-rose-500" /> บอสไวรัสกลายพันธุ์ระบาด
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        ชีววัตถุอันตรายระดับวิกฤต • เอาชนะเพื่อรับ EXP และปลดปล่อยพื้นที่
                      </p>
                    </div>
                  </div>
                )}

                {/* Outpost Identity Card */}
                {isOutpost && !currentTile?.ownerUid && (
                  <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-emerald-500/50 flex items-center justify-center p-2 shrink-0 shadow-[0_0_16px_rgba(16,185,129,0.3)] text-emerald-400">
                      <Radio className="w-6 h-6 text-emerald-400 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-emerald-400 font-black text-sm">
                        🌾 ป้อมฟาร์มวิจัย (Research Outpost)
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono">
                        เซกเตอร์ทรัพยากรกลาง • ยึดครองเพื่อรับทรัพยากรวิจัยต่อเนื่อง
                      </p>
                    </div>
                  </div>
                )}

                {/* Ownership */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400">ผู้ครอบครอง:</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    {currentTile?.ownerName ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span>{currentTile.ownerName}</span>
                        {isMyTile && (
                          <span className="text-[9px] bg-cyan-500 text-slate-950 px-1.5 py-0.5 rounded font-black">คุณ</span>
                        )}
                        {currentTile.guildName && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded">
                            [{currentTile.guildName}]
                          </span>
                        )}
                      </>
                    ) : isBoss ? (
                      <span className="text-rose-400 font-black flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> บอสไวรัสระบาด
                      </span>
                    ) : isOutpost ? (
                      <span className="text-emerald-400 font-black flex items-center gap-1">
                        🌾 ป้อมฟาร์มวิจัย (Outpost)
                      </span>
                    ) : (
                      <span className="text-slate-500">พื้นที่รกร้าง / ปลอดเชื้อ</span>
                    )}
                  </span>
                </div>

                {/* Status Warnings: Shield or Decay */}
                {isCurrentTileShielded && (
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-[11px]">
                    <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>มีบาเรียคุ้มกันมือใหม่ (Beginner Shield)</span>
                  </div>
                )}

                {isCurrentTileDecayed && (
                  <div className="p-3 rounded-2xl bg-amber-950/70 border border-amber-500/60 text-amber-200 text-xs shadow-md space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>🏚️ อาณาเขตเสื่อมสลาย (Decayed Sector)</span>
                      <span className="text-[9px] bg-amber-500/30 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono ml-auto">
                        &gt;72 ชม.
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed font-mono">
                      {isMyTile 
                        ? '⚠️ ฐานของคุณขาดการดูแลเกิน 72 ชั่วโมง! พลังป้องกัน (HP) และพลังโจมตีลดลง 50% กรุณากด "ฟื้นฟูอาณาเขต" ทันทีเพื่อป้องกันการถูกชิง'
                        : '🎯 เป้าหมายนี้ขาดการดูแลเกิน 72 ชั่วโมง! พลังป้องกันและพลังโจมตีลดลง 50% เหมาะอย่างยิ่งสำหรับการบุกชิงยึดครอง!'}
                    </p>
                  </div>
                )}

                {/* Defense HP / Structure HP */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400">พลังป้องกัน (HP):</span>
                  <span className="font-bold text-emerald-400">
                    {currentTile?.buildingHp !== undefined
                      ? `${currentTile.buildingHp.toLocaleString()} / ${(currentTile.maxBuildingHp || 1500).toLocaleString()} HP`
                      : currentTile?.currentDefenderHp !== undefined
                      ? `${currentTile.currentDefenderHp.toLocaleString()} / ${(currentTile.maxDefenderHp || 1000).toLocaleString()} HP`
                      : '1,000 HP'}
                  </span>
                </div>

                {/* Defense Structure Name */}
                {currentTile?.buildingType && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400">สิ่งปลูกสร้าง:</span>
                    <span className="font-bold text-amber-300">
                      {DEFENSE_STRUCTURES[currentTile.buildingType]?.name || currentTile.buildingType}
                    </span>
                  </div>
                )}

                {/* Co-op Siege Rally info */}
                {currentTile?.lastAttackedByName && currentTile.currentDefenderHp && currentTile.currentDefenderHp < (currentTile.maxDefenderHp || 1000) && (
                  <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[10px]">
                    ⚔️ กำลังถูกล้อมโจมตีโดย: <span className="font-bold text-white">{currentTile.lastAttackedByName}</span> (เปิดโอกาส Co-op Rally)
                  </div>
                )}

                {/* GM Live Diagnostics Info */}
                {isGmUser && currentTile?.ownerUid && (
                  <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[10px] font-mono text-amber-300/90 flex items-center gap-2 flex-wrap">
                    <span>UID: <span className="text-amber-200 font-bold">{currentTile.ownerUid.slice(0, 12)}...</span></span>
                    {currentTile.currentDefenderHp !== undefined && (
                      <span>• 💖 HP: {currentTile.currentDefenderHp}/{currentTile.maxDefenderHp || 1000}</span>
                    )}
                    {currentTile.shieldUntil && (
                      <span>• 🛡️ บาเรีย: ถึง {new Date(currentTile.shieldUntil).toLocaleTimeString('th-TH')}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Tactical Actions */}
              <div className="pt-1 flex flex-col gap-2">
                {/* 1. If Unexplored Fog of War */}
                {!isExplored ? (
                  <button
                    type="button"
                    onClick={() => handleStartScout()}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
                  >
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>ส่งโดรนสอดแนมหมอก (Scout Drone)</span>
                  </button>
                ) : (
                  <>
                    {/* 2. Attack / Infiltrate Button (Enemy, Neutral, Boss, Decayed) */}
                    {!isMyTile && (() => {
                      const isEnemyHeroStationed = Boolean(
                        currentTile?.ownerUid && 
                        currentTile.heroStationedUid === currentTile.ownerUid
                      );

                      return (
                        <button
                          type="button"
                          disabled={isMarching}
                          onClick={handleStartAttack}
                          className={`w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-98 cursor-pointer ${
                            isMarching
                              ? 'bg-slate-800 text-rose-300 border border-rose-500/50 cursor-not-allowed animate-pulse'
                              : isEnemyHeroStationed
                              ? 'bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 hover:from-amber-400 hover:via-rose-500 hover:to-amber-500 text-slate-950 shadow-amber-950/60 ring-2 ring-amber-400/80 animate-pulse font-black'
                              : isCurrentTileDecayed
                              ? 'bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 hover:from-amber-500 hover:via-rose-500 hover:to-red-500 text-white shadow-amber-950/60 ring-2 ring-amber-400/60 animate-pulse'
                              : currentTile?.type === 'player'
                              ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-950/50'
                              : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-950/50'
                          }`}
                        >
                          {isEnemyHeroStationed ? (
                            <Crown className="w-4 h-4 text-slate-950" />
                          ) : (
                            <Swords className={`w-4 h-4 ${isMarching ? 'animate-spin' : ''}`} />
                          )}
                          <span>
                            {isMarching
                              ? '👑 ไวรัสฮีโร่กำลังเคลื่อนทัพ...'
                              : isBoss 
                              ? 'โจมตีบอสไวรัส (Boss Raid 3D)' 
                              : isEnemyHeroStationed
                              ? '⚔️ ท้าดวลจอมทัพ (Hero Duel • ชิงชัยชนะ)'
                              : currentTile?.type === 'player'
                              ? '🏰 บุกตีกองรักษาการ (Garrison Siege)'
                              : isCurrentTileDecayed
                              ? '⚔️ บุกยึดฐานรกร้างเสื่อมสภาพ (-50% HP)'
                              : 'เข้าสู่สมรภูมิรบ (Infiltrate & Battle)'}
                          </span>
                        </button>
                      );
                    })()}

                    {/* 2.1 Restore Upkeep for Owned Decayed Base */}
                    {isMyTile && isCurrentTileDecayed && (
                      <button
                        type="button"
                        disabled={restoringUpkeep}
                        onClick={handleRestoreUpkeep}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 hover:from-amber-400 hover:via-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 hover:scale-[1.02] active:scale-98 cursor-pointer transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{restoringUpkeep ? 'กำลังฟื้นฟู...' : 'ฟื้นฟูอาณาเขต (Restore Upkeep - พลังกลับคืน 100%)'}</span>
                      </button>
                    )}

                    {/* 3. Harvest Outpost EXP (if owned outpost) */}
                    {isMyTile && isOutpost && (
                      <button
                        type="button"
                        disabled={hasClaimedToday || claimingOutpost}
                        onClick={handleClaimDailyExp}
                        className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all ${
                          hasClaimedToday
                            ? 'bg-slate-800 text-emerald-400/60 border border-emerald-900/40 cursor-default'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-950/50 hover:scale-[1.02] active:scale-98 cursor-pointer'
                        }`}
                      >
                        <Coins className="w-4 h-4" />
                        <span>{hasClaimedToday ? 'เก็บเกี่ยว EXP ประจำวันแล้ว' : 'เก็บเกี่ยวผลผลิตประจำวัน (+100 EXP)'}</span>
                      </button>
                    )}

                    {/* 4. Repair Damaged Structure */}
                    {isMyTile && currentTile?.buildingType && currentTile.buildingHp !== undefined && currentTile.buildingHp < (currentTile.maxBuildingHp || 1500) && (
                      <button
                        type="button"
                        disabled={repairingInProgress}
                        onClick={handleRepairStructure}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
                      >
                        <Wrench className="w-4 h-4" />
                        <span>ซ่อมแซมสิ่งก่อสร้าง (Repair)</span>
                      </button>
                    )}

                    {/* 5. Build Structure (if owned & no structure yet) */}
                    {(isMyTile || isGuildTile) && !currentTile?.buildingType && (
                      <button
                        type="button"
                        onClick={() => {
                          sfx.click();
                          setShowBuildModal(true);
                        }}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>สร้างป้อมปราการชีวภาพ (Build Defense)</span>
                      </button>
                    )}

                    {/* 6. GM Action Toolkit (Full 4-button controller) */}
                    {isGmUser && selectedCoord && (
                      <div className="p-2.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-1.5 mt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono text-amber-300 font-bold">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-amber-400" /> [GM TOOLKIT] ควบคุมเซกเตอร์
                          </span>
                          <span className="text-[10px] text-amber-400/70">[{selectedCoord}]</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => handleGmFullHealTile(selectedCoord)}
                            className="py-2 px-2.5 rounded-xl text-xs font-mono font-bold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center gap-1"
                            title="[GM] ฮีลเลือดฐานและสิ่งปลูกสร้างเต็ม 100%"
                          >
                            💖 ฮีลเต็ม
                          </button>
                          <button
                            type="button"
                            onClick={() => isCurrentTileShielded ? handleGmRemoveShield(selectedCoord) : handleGmGrantShield(selectedCoord, 24)}
                            className="py-2 px-2.5 rounded-xl text-xs font-mono font-bold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center gap-1"
                            title={isCurrentTileShielded ? "[GM] ปลดบาเรีย" : "[GM] มอบบาเรีย 24 ชม."}
                          >
                            {isCurrentTileShielded ? '🔓 ปลดบาเรีย' : '🛡️ ให้บาเรีย'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGmInstantClaim(selectedCoord)}
                            className="py-2 px-2.5 rounded-xl text-xs font-mono font-bold bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 text-amber-300 transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center gap-1"
                            title="[GM] ยึดครองเซกเตอร์นี้ให้ตนเองทันที"
                          >
                            👑 ยึดทันที
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGmResetTile(selectedCoord)}
                            className="py-2 px-2.5 rounded-xl text-xs font-mono font-bold bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 transition-all active:scale-95 shadow-sm cursor-pointer flex items-center justify-center gap-1"
                            title="[GM] รีเซ็ตช่องนี้ให้กลับเป็นช่องว่าง"
                          >
                            🧹 ล้างช่อง
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL 1: SCOUT DRONE QUIZ MODAL ─────────────────────────────────── */}
      {showScoutModal && scoutQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-emerald-500/50 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Radio className="w-5 h-5 animate-pulse" />
                <span>ภารกิจโดรนสอดแนมหมอก (SCOUT DRONE CALIBRATION)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowScoutModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <span className="text-xs font-mono text-slate-400">คำถามจูนคลื่นสัญญาณเรดาร์:</span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1 leading-relaxed">
                {scoutQuestion.q}
              </h3>
            </div>

            <div className="space-y-2.5">
              {scoutQuestion.options.map((opt: string, idx: number) => {
                const isSelected = scoutChoice === idx;
                const isCorrect = idx === scoutQuestion.answer;

                let btnStyle = "bg-slate-950/80 hover:bg-slate-800 border-slate-700/80 text-slate-200";
                if (isScouting && isSelected) {
                  btnStyle = isCorrect 
                    ? "bg-emerald-600 text-white border-emerald-400 scale-[1.02]" 
                    : "bg-rose-600 text-white border-rose-400";
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isScouting}
                    onClick={() => handleAnswerScout(idx)}
                    className={`w-full p-4 rounded-2xl border text-left text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isScouting && isSelected && (
                      isCorrect ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <X className="w-5 h-5 text-rose-300" />
                    )}
                  </button>
                );
              })}
            </div>

            {scoutFeedback && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 text-xs font-mono text-center text-emerald-300">
                {scoutFeedback}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 2: BUILD DEFENSE STRUCTURE MODAL ──────────────────────────── */}
      {showBuildModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-cyan-500/50 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Building2 className="w-5 h-5" />
                <span>สถาปนาป้อมปราการชีวภาพ (BIO-DEFENSE WORKSHOP)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBuildModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {Object.values(DEFENSE_STRUCTURES).map((struct) => {
                const canAfford = (appUser?.exp || 0) >= struct.costExp;

                return (
                  <div
                    key={struct.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{struct.icon}</span>
                        <h4 className="text-sm font-bold text-white">{struct.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400">{struct.desc}</p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-cyan-400">
                        <span className="text-emerald-400 font-bold">+HP {struct.bonusHp.toLocaleString()}</span>
                        <span>•</span>
                        <span className="text-rose-400 font-bold">+ATK {struct.bonusAtk}</span>
                        <span>•</span>
                        <span>ค่าสร้าง: {struct.costExp} EXP</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!canAfford || buildingInProgress}
                      onClick={() => handleBuildStructure(struct.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md hover:scale-105 active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {buildingInProgress ? 'กำลังสร้าง...' : 'สร้าง'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: EMPIRE STATISTICS & LEADERBOARD MODAL ─────────────────── */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-amber-500/50 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <BarChart3 className="w-5 h-5" />
                <span>สถิติยุทธการ VIRUS EMPIRE &amp; ทำเนียบเกียรติยศ</span>
              </div>
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400 font-mono">เซกเตอร์ทั้งหมด</div>
                <div className="text-xl font-black text-white font-mono mt-1">2,500</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400 font-mono">สำรวจแล้ว</div>
                <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                  {stats.exploredPercent}%
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400 font-mono">กิลด์ที่ยึดครอง</div>
                <div className="text-xl font-black text-amber-400 font-mono mt-1">
                  {Object.keys(guilds).length} กิลด์
                </div>
              </div>
            </div>

            {/* Top Conquering Guilds */}
            {stats.topGuilds.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  กิลด์ที่มีอาณาเขตสูงสุด (TOP 5 GUILDS):
                </h4>
                <div className="space-y-1.5">
                  {stats.topGuilds.map((item, idx) => (
                    <div 
                      key={item.guild.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">#{idx + 1}</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.guild.color }} />
                        <span className="text-white font-bold">{item.guild.name}</span>
                        <span className="text-slate-400 text-[10px]">[{item.guild.tag}]</span>
                      </div>
                      <span className="text-amber-300 font-bold">{item.count} ช่อง</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GM Only: Live Territory Directory by Player & Guild */}
            {isGmUser && (() => {
              const playerTerritories: Record<string, { ownerUid: string; ownerName: string; guildName?: string; guildId?: string; ownerFamily?: string; count: number; firstCoord: { x: number; y: number } }> = {};
              Object.values(tiles).forEach((t) => {
                if (t.type === 'player' && t.ownerUid) {
                  if (!playerTerritories[t.ownerUid]) {
                    playerTerritories[t.ownerUid] = {
                      ownerUid: t.ownerUid,
                      ownerName: t.ownerName || 'ไม่ระบุชื่อ',
                      guildName: t.guildName,
                      guildId: t.guildId,
                      ownerFamily: t.ownerFamily,
                      count: 0,
                      firstCoord: { x: t.x, y: t.y },
                    };
                  }
                  playerTerritories[t.ownerUid].count++;
                }
              });

              const list = Object.values(playerTerritories).sort((a, b) => b.count - a.count);

              return (
                <div className="bg-slate-950/80 border border-amber-500/40 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-amber-400" /> ทำเนียบผู้เล่นและอาณาเขต (GM Directory)
                    </span>
                    <span className="text-[10px] text-slate-400">{list.length} ผู้เล่นมีดินแดน</span>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                    {list.length === 0 ? (
                      <div className="text-center py-4 text-xs font-mono text-slate-500">
                        ยังไม่มีผู้เล่นคนใดครอบครองดินแดน
                      </div>
                    ) : (
                      list.map((p) => (
                        <div
                          key={p.ownerUid}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span 
                              className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                              style={{
                                backgroundColor: p.guildId && guilds[p.guildId]?.color
                                  ? guilds[p.guildId].color
                                  : getPlayerUniqueColor(p.ownerUid, false)
                              }}
                            />
                            <div className="min-w-0 truncate">
                              <span className="font-bold text-white truncate block">{p.ownerName}</span>
                              <span className="text-[10px] text-slate-400">
                                {p.guildName ? `[${p.guildName}]` : 'ไม่มีกิลด์'} • {p.ownerFamily || 'ไวรัส'} • {p.count} เซกเตอร์
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowStatsModal(false);
                              setTargetFocus({ x: p.firstCoord.x, y: p.firstCoord.y });
                              setSelectedCoord(`${p.firstCoord.x},${p.firstCoord.y}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-[11px] transition-all shrink-0 active:scale-95 border border-amber-500/40 cursor-pointer"
                            title={`วาร์ปไปดูฐานพิกัด [${p.firstCoord.x}, ${p.firstCoord.y}]`}
                          >
                            🎯 ส่องฐาน [{p.firstCoord.x},{p.firstCoord.y}]
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 text-center">
              <Link href="/student/leaderboard">
                <button
                  type="button"
                  onClick={() => sfx.click()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>เข้าสู่ตารางอันดับเกียรติยศเต็ม (Full Leaderboard)</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: RULES & INTEL GUIDE MODAL ─────────────────────────────── */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full p-6 sm:p-8 rounded-3xl bg-slate-900 border border-cyan-500/50 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <HelpCircle className="w-5 h-5" />
                <span>คู่มือยุทธการและกติกา 3D WAR ROOM</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-mono">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <h4 className="font-bold text-cyan-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> เขตคุ้มกันมือใหม่ (Sanctuary Rim)
                </h4>
                <p>
                  แถบขอบแผนที่ด้านนอก 4 ช่องรอบทิศ เป็นเขตปลอดภัยสำหรับผู้เล่นใหม่ ปราศจากหมอกและไม่สามารถถูกผู้เล่นอื่นแย่งชิงได้ง่าย
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> ศูนย์กลางชีวะ (Central Core Vault)
                </h4>
                <p>
                  พิกัดใจกลาง [22,22] ถึง [27,27] มีบอสไวรัสระดับสูงเฝ้าอยู่ หากพิชิตได้จะได้รับรางวัลมหาศาลและบัฟพิเศษสำหรับกิลด์
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Radio className="w-4 h-4" /> โดรนสอดแนมหมอก (Scout Drone)
                </h4>
                <p>
                  ใช้โควตาโดรนวันละ 5 ครั้ง ตอบคำถามไวรัสวิทยาเพื่อเปิดเผยหมอก 5×5 ช่อง รับ +25 EXP ต่อครั้ง และปลดล็อคเหรียญตรานักสำรวจ
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <h4 className="font-bold text-rose-400 flex items-center gap-1.5">
                  <Swords className="w-4 h-4" /> สมรภูมิรบและการยึดครอง (Battle &amp; Siege)
                </h4>
                <p>
                  คลิกที่ช่องศัตรู/บอส เพื่อเข้าสู่สนามรบ 3D ด้วยสัตว์เลี้ยงคู่ใจ วันละ 10 ครั้ง การโจมตีสร้างความเสียหายต่อเนื่องแบบ Co-op Rally ร่วมกับเพื่อนในกิลด์
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <h4 className="font-bold text-teal-400 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> ป้อมปราการชีวภาพ (Defense Structures)
                </h4>
                <p>
                  ใช้แต้ม EXP สถาปนากำแพงชีวภาพ ป้อมแอนติบอดี หรือสถานีฟื้นฟู เพื่อเพิ่ม HP และพลังสะท้อนการโจมตีให้กับดินแดนของตนเอง
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
