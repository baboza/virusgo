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
  getDocs,
  query,
  where,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { ContinentId, EmpireTile, Guild, HomeContinentId, User } from '@/types';
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
  Globe2,
  Lock,
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
  Heart,
  Plus,
  Check,
  ShieldCheck
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
  ALL_CONTINENT_ORDER,
  CONTINENTS,
  MAP_SIZE, 
  getMapSizeForContinent,
  getPangaeaTerrain,
  isPangaeaOceanTile,
  isSanctuaryZone, 
  isCentralVaultZone, 
  isShieldedTile,
  isDecayedTile,
  getCitadel2x2Coords,
  isCitadelInfluenceZone,
  DEFENSE_STRUCTURES, 
  DefenseStructureConfig,
  SCOUT_FALLBACK_QUIZ,
  getPlayerUniqueColor,
  PLAYER_PALETTE,
  resolveGuildContinent,
  resolveUserContinent,
  resolveUserYear,
  stripTileDocPrefix,
  toTileDocId,
  translateHomeCoordToPangaea,
} from '@/lib/empireConstants';
import {
  buildContinentTilesQuery,
  executePangaeaTectonicMerge,
  revertPangaeaTectonicMerge,
  seedContinentVaultAndOutposts,
} from '@/lib/empireWorldEngine';
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
  const [allGuildsMap, setAllGuildsMap] = useState<Record<string, Guild>>({});
  const [loading, setLoading] = useState(true);

  // Multi-Cohort Continent & Pangaea World State
  const [activeContinent, setActiveContinent] = useState<ContinentId>('capsidia');
  const [hasInitContinent, setHasInitContinent] = useState(false);
  const [pangaeaUnlocked, setPangaeaUnlocked] = useState(false);
  const [isMergingPangaea, setIsMergingPangaea] = useState(false);
  const [isSeedingContinent, setIsSeedingContinent] = useState(false);
  const spectatorCacheRef = useRef<Record<string, { ts: number; tiles: Record<string, EmpireTile> }>>({});
  const autoSeededRef = useRef<Record<string, boolean>>({});

  const myHomeContinent = useMemo<HomeContinentId>(() => resolveUserContinent(appUser), [appUser]);
  const myCohortYear = useMemo(() => resolveUserYear(appUser), [appUser]);
  const activeMapSize = useMemo(() => getMapSizeForContinent(activeContinent), [activeContinent]);
  const activeContinentMeta = CONTINENTS[activeContinent] || CONTINENTS.capsidia;

  // Guilds filtered by active continent (or all 3 continents' guilds on Pangaea!)
  const guilds = useMemo<Record<string, Guild>>(() => {
    if (activeContinent === 'pangaea') return allGuildsMap;
    const filtered: Record<string, Guild> = {};
    Object.entries(allGuildsMap).forEach(([gid, g]) => {
      if (resolveGuildContinent(g) === activeContinent) {
        filtered[gid] = g;
      }
    });
    return filtered;
  }, [allGuildsMap, activeContinent]);

  // Tactical Controls & Selection
  const [selectedCoord, setSelectedCoord] = useState<string | null>(null);
  const [targetFocus, setTargetFocus] = useState<{ x: number; y: number } | null>({ x: 25, y: 25 });
  const [cameraMode, setCameraMode] = useState<'iso' | 'top'>('iso');

  // Modals
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showScoutModal, setShowScoutModal] = useState(false);
  const [showBuildModal, setShowBuildModal] = useState(false);
  const [showGuildModal, setShowGuildModal] = useState(false);

  // Guild / Alliance Management & Recruitment State
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildTag, setNewGuildTag] = useState('');
  const [newGuildColor, setNewGuildColor] = useState(PLAYER_PALETTE[0] || '#a855f7');
  const [isCreatingGuild, setIsCreatingGuild] = useState(false);
  const [isJoiningGuild, setIsJoiningGuild] = useState<string | null>(null);
  const [previewGuildId, setPreviewGuildId] = useState<string | null>(null);
  const [guildMembers, setGuildMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [previewMembersMap, setPreviewMembersMap] = useState<Record<string, User[]>>({});
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

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

  // Determine whether the user is spectating another cohort's continent (Read-Only Reconnaissance)
  const isSpectatorMode = useMemo(() => {
    if (isGmUser) return false;
    if (activeContinent === 'pangaea') return !pangaeaUnlocked;
    return activeContinent !== myHomeContinent;
  }, [isGmUser, activeContinent, pangaeaUnlocked, myHomeContinent]);

  // ── 1. Fetch User Data & World Config ─────────────────────────────
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setAppUser(docSnap.data() as User);
      }
    });
    return () => unsub();
  }, [user]);

  // Subscribe to Pangaea World Merge status (`game_content/empire_world_config` = 1 lightweight doc)
  useEffect(() => {
    const unsubWorld = onSnapshot(
      doc(db, 'game_content', 'empire_world_config'),
      (snap) => {
        if (snap.exists()) {
          setPangaeaUnlocked(Boolean(snap.data()?.pangaeaUnlocked));
        }
      },
      () => {}
    );
    return () => unsubWorld();
  }, []);

  // Initialize activeContinent from URL ?continent=... or default to student's home continent
  useEffect(() => {
    if (!appUser || hasInitContinent) return;
    let initial: ContinentId = resolveUserContinent(appUser);
    if (typeof window !== 'undefined') {
      const qParam = new URLSearchParams(window.location.search).get('continent') as ContinentId | null;
      if (qParam && ALL_CONTINENT_ORDER.includes(qParam)) {
        initial = qParam;
      }
    }
    setActiveContinent(initial);
    const sz = getMapSizeForContinent(initial);
    setTargetFocus({ x: Math.floor(sz / 2), y: Math.floor(sz / 2) });
    setHasInitContinent(true);
  }, [appUser, hasInitContinent]);

  // Subscribe to Guilds once (small collection ~5-18 docs total across all 3 cohorts)
  useEffect(() => {
    const unsubGuilds = onSnapshot(collection(db, 'guilds'), (snapshot) => {
      const gMap: Record<string, Guild> = {};
      snapshot.forEach((docSnap) => {
        gMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() } as Guild;
      });
      setAllGuildsMap(gMap);
    });
    return () => unsubGuilds();
  }, []);

  // ── 2. Continent-Scoped Subscription / Spectator Cache for Empire Tiles ─────────────
  useEffect(() => {
    if (!hasInitContinent && !isGmUser && !appUser) return;

    tilesRef.current = {};
    setSelectedCoord(null);

    // 2A. Spectator Mode (visiting another cohort's continent or locked Pangaea):
    // Use 1-shot getDocs + 3-minute in-memory cache to eliminate cross-continent live listener reads!
    if (isSpectatorMode) {
      const cached = spectatorCacheRef.current[activeContinent];
      if (cached && Date.now() - cached.ts < 3 * 60 * 1000) {
        tilesRef.current = cached.tiles;
        setTiles(cached.tiles);
        setLoading(false);
        return;
      }

      let cancelled = false;
      setLoading(true);
      getDocs(buildContinentTilesQuery(activeContinent))
        .then((snap) => {
          if (cancelled) return;
          const tileMap: Record<string, EmpireTile> = {};
          snap.forEach((docSnap) => {
            const raw = docSnap.data() as EmpireTile;
            const cleanId = stripTileDocPrefix(raw.id || docSnap.id);
            tileMap[cleanId] = { ...raw, id: cleanId };
          });
          spectatorCacheRef.current[activeContinent] = { ts: Date.now(), tiles: tileMap };
          tilesRef.current = tileMap;
          setTiles(tileMap);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Spectator continent fetch error:', err);
          if (!cancelled) setLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }

    // 2B. Active Playable Continent (Home Continent, Unlocked Pangaea, or GM):
    // Scoped real-time Delta Sync ONLY for activeContinent!
    const qTiles = buildContinentTilesQuery(activeContinent);
    const unsubTiles = onSnapshot(qTiles, (snapshot) => {
      // Auto-seed Vault Guardians & 4 Bio-Farm Outposts once if Year 4 (hemoria) or Year 5 (synapsia) is brand new
      if (
        snapshot.empty &&
        (activeContinent === 'hemoria' || activeContinent === 'synapsia') &&
        !autoSeededRef.current[activeContinent]
      ) {
        autoSeededRef.current[activeContinent] = true;
        seedContinentVaultAndOutposts(activeContinent, true).catch(console.error);
      }

      if (Object.keys(tilesRef.current).length === 0) {
        const tileMap: Record<string, EmpireTile> = {};
        snapshot.forEach((docSnap) => {
          const raw = docSnap.data() as EmpireTile;
          const cleanId = stripTileDocPrefix(raw.id || docSnap.id);
          tileMap[cleanId] = { ...raw, id: cleanId };
        });
        tilesRef.current = tileMap;
        setTiles(tileMap);
        setLoading(false);
        return;
      }

      let hasRelevantChange = false;
      const updatedMap = { ...tilesRef.current };

      snapshot.docChanges().forEach((change) => {
        const raw = change.doc.data() as EmpireTile;
        const cleanId = stripTileDocPrefix(raw?.id || change.doc.id);
        if (change.type === 'removed') {
          delete updatedMap[cleanId];
          hasRelevantChange = true;
        } else {
          const newData = { ...raw, id: cleanId } as EmpireTile;
          const prevData = updatedMap[cleanId];

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
            updatedMap[cleanId] = newData;
            hasRelevantChange = true;
          }
        }
      });

      if (hasRelevantChange) {
        tilesRef.current = updatedMap;
        setTiles(updatedMap);
      }
      setLoading(false);
    });

    return () => {
      unsubTiles();
    };
  }, [activeContinent, isSpectatorMode, hasInitContinent, isGmUser, appUser?.uid]);


  // ── 2.2 Calculate Explored Fog of War ─────────────────────────────
  const exploredTiles = useMemo(() => {
    const set = new Set<string>();

    // In Spectator Mode, reveal occupied cities, bosses, and outposts (+1 radius) so students can admire rival cohorts!
    if (isSpectatorMode) {
      for (let x = 0; x < activeMapSize; x++) {
        for (let y = 0; y < activeMapSize; y++) {
          if (isSanctuaryZone(x, y, activeContinent) || isCentralVaultZone(x, y, activeContinent)) {
            set.add(`${x},${y}`);
          }
        }
      }
      Object.values(tiles).forEach((t) => {
        if (t.type !== 'empty') {
          for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
              const nx = t.x + dx;
              const ny = t.y + dy;
              if (nx >= 0 && nx < activeMapSize && ny >= 0 && ny < activeMapSize) {
                set.add(`${nx},${ny}`);
              }
            }
          }
        }
      });
      return set;
    }

    // Rim of 4 tiles around continent (and Land Bridges + Core Rim on Pangaea) is always visible
    for (let x = 0; x < activeMapSize; x++) {
      for (let y = 0; y < activeMapSize; y++) {
        if (isSanctuaryZone(x, y, activeContinent)) {
          set.add(`${x},${y}`);
        } else if (activeContinent === 'pangaea') {
          const pInfo = getPangaeaTerrain(x, y);
          if (pInfo.terrain === 'bridge' || pInfo.terrain === 'core') {
            set.add(`${x},${y}`);
          }
        }
      }
    }

    if (!appUser) return set;

    // Add user's scouted tiles from profile (home vs pangaea)
    const savedExplored = activeContinent === 'pangaea'
      ? appUser.pangaeaExploredTiles
      : appUser.exploredTiles;
    if (Array.isArray(savedExplored)) {
      savedExplored.forEach((coord) => set.add(coord));
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
            if (nx >= 0 && nx < activeMapSize && ny >= 0 && ny < activeMapSize) {
              set.add(`${nx},${ny}`);
            }
          }
        }
      }
    });

    return set;
  }, [appUser, tiles, activeContinent, activeMapSize, isSpectatorMode]);

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
    ctx.fillRect(0, 0, activeMapSize, activeMapSize);

    // Draw explored tiles & landmarks
    for (let x = 0; x < activeMapSize; x++) {
      for (let y = 0; y < activeMapSize; y++) {
        if (activeContinent === 'pangaea') {
          const pInfo = getPangaeaTerrain(x, y);
          if (pInfo.terrain === 'ocean') {
            ctx.fillStyle = '#041226';
            ctx.fillRect(x, y, 1, 1);
            continue;
          }
          if (pInfo.terrain === 'bridge') {
            ctx.fillStyle = '#d97706';
            ctx.fillRect(x, y, 1, 1);
          }
        }
        const coord = `${x},${y}`;
        const isExplored = Boolean(isGmUser || exploredTiles.has(coord));
        const tile = tiles[coord];

        if (isExplored) {
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
          } else if (isSanctuaryZone(x, y, activeContinent)) {
            ctx.fillStyle = '#075985'; // Sanctuary rim
            ctx.fillRect(x, y, 1, 1);
          } else {
            ctx.fillStyle = '#1e293b'; // Explored empty
            ctx.fillRect(x, y, 1, 1);
          }
        } else {
          if (isSanctuaryZone(x, y, activeContinent)) {
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
  }, [tiles, guilds, exploredTiles, appUser, targetFocus, selectedCoord, isGmUser, activeMapSize, activeContinent]);

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
      Math.round((exploredTiles.size / (activeMapSize * activeMapSize)) * 100)
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
  }, [tiles, appUser, exploredTiles, guilds, activeMapSize]);

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
    return allGuildsMap[currentTile.guildId] || guilds[currentTile.guildId] || null;
  }, [currentTile, allGuildsMap, guilds]);

  const isCurrentTileDecayed = useMemo(() => {
    const cCoord = activeContinent === 'pangaea' ? currentTileGuild?.pangaeaCitadelCoord : currentTileGuild?.citadelCoord;
    const cCoords = activeContinent === 'pangaea' ? currentTileGuild?.pangaeaCitadelCoords : currentTileGuild?.citadelCoords;
    return isDecayedTile(currentTile, cCoord, cCoords);
  }, [currentTile, currentTileGuild, activeContinent]);

  const isCurrentTileShielded = useMemo(() => {
    return isShieldedTile(currentTile);
  }, [currentTile]);

  // Helper to validate coordinate on active map (50x50 or 120x120)
  const isValidCoord = useCallback((coord: string | null | undefined): boolean => {
    if (!coord || typeof coord !== 'string') return false;
    const parts = coord.split(',');
    if (parts.length !== 2) return false;
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    return !isNaN(x) && !isNaN(y) && x >= 0 && x < activeMapSize && y >= 0 && y < activeMapSize;
  }, [activeMapSize]);

  // ── 7. Handlers: Camera & Continent Navigation ─────────────────────
  const hasInitiallyFocused = useRef(false);

  const handleSwitchContinent = useCallback((target: ContinentId) => {
    sfx.click();
    if (target === 'pangaea' && !pangaeaUnlocked && !isGmUser) {
      alert('🔒 มหาทวีป PANGAEA (120×120) จะเปิดให้ส่งทัพรบข้ามรุ่นในช่วงศึกชิงจ้าวปลายภาคเรียน!\n\nอาจารย์ผู้สอนสามารถกดปุ่มรวมแผ่นดิน (Tectonic World Merge) เมื่อถึงเวลาเปิดศึกใหญ่');
      return;
    }
    setActiveContinent(target);
    setSelectedCoord(null);
    const sz = getMapSizeForContinent(target);
    setTargetFocus({ x: Math.floor(sz / 2), y: Math.floor(sz / 2) });
    hasInitiallyFocused.current = false;
  }, [pangaeaUnlocked, isGmUser]);

  const handleSelectCoord = useCallback((coord: string) => {
    sfx.click();
    setSelectedCoord(coord);
    if (coord && !isSpectatorMode) {
      router.prefetch(`/student/empire/battle?tile=${coord}&continent=${activeContinent}`);
    }
  }, [router, activeContinent, isSpectatorMode]);

  const handleJumpToCenter = () => {
    sfx.click();
    const cx = Math.floor(activeMapSize / 2);
    const cy = Math.floor(activeMapSize / 2);
    setTargetFocus({ x: cx, y: cy });
    setSelectedCoord(`${cx},${cy}`);
  };

  const handleJumpToMyBase = () => {
    sfx.click();
    const myCapital = Object.values(tiles).find((t) => t.ownerUid === appUser?.uid && t.isCapital);
    const myTile = myCapital || Object.values(tiles).find((t) => t.ownerUid === appUser?.uid);
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
    const g = allGuildsMap[appUser.guildId];
    const cCoord = activeContinent === 'pangaea' ? g?.pangaeaCitadelCoord : g?.citadelCoord;
    if (cCoord) {
      const [cx, cy] = cCoord.split(',').map(Number);
      setTargetFocus({ x: cx, y: cy });
      setSelectedCoord(cCoord);
    } else {
      const isLeader = g?.leaderUid === appUser.uid || isGmUser;
      if (isLeader) {
        alert('กิลด์ของคุณยังไม่มีนครหลวงในทวีปนี้!\n\n👑 ในฐานะหัวหน้ากิลด์ คุณสามารถคลิกเลือกเซกเตอร์ของกิลด์ แล้วกดปุ่ม "🏛️ สถาปนานครหลวงกิลด์" ในเมนูด้านล่างเพื่อสร้างได้ทันที');
      } else {
        alert('กิลด์ของคุณยังไม่ได้สถาปนานครหลวงในทวีปนี้ กรุณาแจ้งหัวหน้ากิลด์ให้สถาปนานครหลวงกิลด์');
      }
    }
  };

  // ── 8. Handler: Infiltrate / Attack (HoMM Marching to Target Tile) ──
  const [marchOrder, setMarchOrder] = useState<MarchOrder | null>(null);
  const [isMarching, setIsMarching] = useState(false);

  const heroPetCoord = useMemo(() => {
    if (isSpectatorMode) return null;

    if (activeContinent === 'pangaea') {
      if (isValidCoord(appUser?.pet?.pangaeaTileCoord)) {
        return appUser!.pet!.pangaeaTileCoord!;
      }
      if (typeof window !== 'undefined') {
        const cachedP = localStorage.getItem('virusgo_hero_coord_pangaea');
        if (isValidCoord(cachedP)) return cachedP!;
      }
      if (appUser?.pet?.currentTileCoord) {
        const [hx, hy] = appUser.pet.currentTileCoord.split(',').map(Number);
        if (!isNaN(hx) && !isNaN(hy)) {
          return translateHomeCoordToPangaea(myHomeContinent, appUser.pet.currentTileCoord);
        }
      }
    } else {
      if (isValidCoord(appUser?.pet?.currentTileCoord)) {
        return appUser!.pet!.currentTileCoord!;
      }
      if (typeof window !== 'undefined') {
        const cached =
          localStorage.getItem(`virusgo_hero_coord_${activeContinent}`) ||
          (activeContinent === 'capsidia' ? localStorage.getItem('virusgo_hero_coord') : null);
        if (isValidCoord(cached)) {
          return cached!;
        }
      }
    }

    const capital = Object.values(tiles).find(t => t.ownerUid === appUser?.uid && t.isCapital);
    if (capital) return `${capital.x},${capital.y}`;
    const anyTile = Object.values(tiles).find(t => t.ownerUid === appUser?.uid);
    if (anyTile) return `${anyTile.x},${anyTile.y}`;
    return null;
  }, [
    isSpectatorMode,
    activeContinent,
    appUser?.pet?.pangaeaTileCoord,
    appUser?.pet?.currentTileCoord,
    appUser?.uid,
    myHomeContinent,
    tiles,
    isValidCoord,
  ]);

  // Map of rival ownerUid -> single latest coord where their hero is stationed (Strict 1 Hero per player)
  const rivalStationedHeroCoords = useMemo(() => {
    const map: Record<string, { coord: string; timestamp: number }> = {};
    Object.values(tiles).forEach((t) => {
      if (t.ownerUid && t.heroStationedUid === t.ownerUid && t.ownerUid !== appUser?.uid) {
        const time = new Date(t.lastAttacked || t.lastActive || 0).getTime();
        if (!map[t.ownerUid] || time > map[t.ownerUid].timestamp) {
          map[t.ownerUid] = { coord: t.id, timestamp: time };
        }
      }
    });
    const set = new Set<string>();
    Object.values(map).forEach(m => set.add(m.coord));
    return set;
  }, [tiles, appUser?.uid]);

  // Tactical Adjacency & March Range Enforcement
  const isTargetAttackable = useMemo(() => {
    if (!selectedCoord || isSpectatorMode) {
      return { canAttack: false, reason: 'อยู่ในโหมดส่องดูแผนที่ (Spectator Mode)' };
    }
    
    const [tx, ty] = selectedCoord.split(',').map(Number);
    if (isNaN(tx) || isNaN(ty)) {
      return { canAttack: false, reason: 'พิกัดไม่ถูกต้อง' };
    }
    
    if (activeContinent === 'pangaea' && isPangaeaOceanTile(tx, ty)) {
      return { canAttack: false, reason: '🌊 มหาสมุทรชีวภาพลึก ไม่สามารถเดินทัพได้ กรุณาใช้สะพานบกยุทธศาสตร์' };
    }

    // Count user's owned tiles on this continent
    const userOwnedTiles = Object.values(tiles).filter(t => t.ownerUid === appUser?.uid);
    const userTileCount = userOwnedTiles.length;

    // Rule 1: First Drop Pod Landing (User owns 0 tiles on this continent)
    if (userTileCount === 0) {
      return { canAttack: true, reason: '🎯 พื้นที่ลงจอดปฐมภูมิ (Drop Pod Genesis)' };
    }

    // Rule 2: Adjacency (8 directions Chebyshev distance <= 1 from user or guild tile)
    const myGuildId = appUser?.guildId;
    const isAdjacentToFriendly = Object.values(tiles).some(t => {
      const isFriendly = (t.ownerUid === appUser?.uid) || Boolean(myGuildId && t.guildId === myGuildId);
      if (!isFriendly) return false;
      const dx = Math.abs(t.x - tx);
      const dy = Math.abs(t.y - ty);
      return dx <= 1 && dy <= 1 && (dx + dy > 0);
    });

    if (isAdjacentToFriendly) {
      return { canAttack: true, reason: '🔗 เชื่อมต่อกับอาณาเขตของตนเองหรือกิลด์' };
    }

    // Rule 3: March Range from Stationed Hero (Chebyshev distance <= 2)
    if (heroPetCoord) {
      const [hx, hy] = heroPetCoord.split(',').map(Number);
      if (!isNaN(hx) && !isNaN(hy)) {
        const hDist = Math.max(Math.abs(hx - tx), Math.abs(hy - ty));
        if (hDist <= 2) {
          return { canAttack: true, reason: `⚔️ อยู่ในรัศมีเดินทัพของฮีโร่ (${hDist} ช่อง)` };
        }
      }
    }

    return {
      canAttack: false,
      reason: '🔭 อยู่นอกระยะเดินทัพ! ต้องเชื่อมต่อกับอาณาเขตเดิม (Adjacency) หรืออยู่ในรัศมีเดินทัพของฮีโร่ (March Range ไม่เกิน 2 ช่อง)',
    };
  }, [selectedCoord, isSpectatorMode, activeContinent, tiles, appUser?.uid, appUser?.guildId, heroPetCoord]);

  // Handler: Station Hero at Owned Base
  const [stationingHero, setStationingHero] = useState(false);

  const handleStationHero = async (targetCoord: string) => {
    if (!appUser?.uid || isSpectatorMode || stationingHero) return;
    const targetTile = tiles[targetCoord];
    if (!targetTile || targetTile.ownerUid !== appUser.uid) {
      alert('คุณสามารถย้ายฮีโร่มาประจำการได้เฉพาะในดินแดนที่คุณครอบครองเท่านั้น');
      return;
    }
    setStationingHero(true);
    try {
      // 1. Clear old stationed tile if any
      const oldCoord = heroPetCoord;
      if (oldCoord && oldCoord !== targetCoord) {
        updateDoc(doc(db, 'empire_tiles', toTileDocId(activeContinent, oldCoord)), {
          heroStationedUid: null,
        }).catch(console.error);
      }
      // 2. Set new tile stationed
      await updateDoc(doc(db, 'empire_tiles', toTileDocId(activeContinent, targetCoord)), {
        heroStationedUid: appUser.uid,
      });
      // 3. Update user doc
      const coordField = activeContinent === 'pangaea' ? 'pet.pangaeaTileCoord' : 'pet.currentTileCoord';
      await updateDoc(doc(db, 'users', appUser.uid), {
        [coordField]: targetCoord,
      });
      // 4. Update localStorage
      if (typeof window !== 'undefined') {
        if (activeContinent === 'pangaea') {
          localStorage.setItem('virusgo_hero_coord_pangaea', targetCoord);
        } else {
          localStorage.setItem(`virusgo_hero_coord_${activeContinent}`, targetCoord);
          if (activeContinent === 'capsidia') {
            localStorage.setItem('virusgo_hero_coord', targetCoord);
          }
        }
      }
      sfx.victory();
      setActionSuccessMsg(`👑 ย้ายฮีโร่มาประจำการที่ [${targetCoord}] สำเร็จ! พร้อมนำทัพขยายอาณาเขตจากฐานนี้`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error stationing hero:', err);
      alert('เกิดข้อผิดพลาดในการย้ายฮีโร่ประจำการ');
    } finally {
      setStationingHero(false);
    }
  };

  // Sync localStorage whenever hero coord updates on home continent or Pangaea
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeContinent === 'pangaea' && isValidCoord(appUser?.pet?.pangaeaTileCoord)) {
      localStorage.setItem('virusgo_hero_coord_pangaea', appUser!.pet!.pangaeaTileCoord!);
    } else if (activeContinent !== 'pangaea' && !isSpectatorMode && isValidCoord(appUser?.pet?.currentTileCoord)) {
      localStorage.setItem(`virusgo_hero_coord_${activeContinent}`, appUser!.pet!.currentTileCoord!);
      if (activeContinent === 'capsidia') {
        localStorage.setItem('virusgo_hero_coord', appUser!.pet!.currentTileCoord!);
      }
    }
  }, [activeContinent, isSpectatorMode, appUser?.pet?.currentTileCoord, appUser?.pet?.pangaeaTileCoord, isValidCoord]);

  // Auto-focus camera on hero's location upon initial loading on own/Pangaea map
  useEffect(() => {
    if (hasInitiallyFocused.current || isSpectatorMode) return;
    if (heroPetCoord) {
      const [hx, hy] = heroPetCoord.split(',').map(Number);
      if (!isNaN(hx) && !isNaN(hy)) {
        setTargetFocus({ x: hx, y: hy });
        setSelectedCoord(heroPetCoord);
        hasInitiallyFocused.current = true;
      }
    }
  }, [heroPetCoord, isSpectatorMode]);

  const handleStartAttack = () => {
    if (!selectedCoord) return;
    sfx.click();

    if (isSpectatorMode) {
      alert('🔭 คุณกำลังอยู่ในโหมดส่องทวีปต่างรุ่น (Read-Only Reconnaissance)\nกรุณาสลับกลับทวีปประจำชั้นปีของคุณเพื่อส่งทัพบุกโจมตี');
      return;
    }

    const [tx, ty] = selectedCoord.split(',').map(Number);
    if (activeContinent === 'pangaea' && isPangaeaOceanTile(tx, ty)) {
      alert('🌊 ไม่สามารถส่งกองทัพเดินลงมหาสมุทรชีวภาพได้!\nกรุณาส่งทัพผ่านสะพานบกยุทธศาสตร์ (Bio-Isthmus Land Bridge) เพื่อข้ามไปยังแผ่นดินอื่นหรือเกาะกลางโลก');
      return;
    }

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

    // Check Reachability / March Range
    if (!isGmUser && !isTargetAttackable.canAttack) {
      alert(isTargetAttackable.reason);
      return;
    }

    const target = selectedCoord;

    // Immediately cache target in localStorage and Firestore for persistence
    if (typeof window !== 'undefined') {
      if (activeContinent === 'pangaea') {
        localStorage.setItem('virusgo_hero_coord_pangaea', target);
      } else {
        localStorage.setItem(`virusgo_hero_coord_${activeContinent}`, target);
        if (activeContinent === 'capsidia') {
          localStorage.setItem('virusgo_hero_coord', target);
        }
      }
    }
    if (appUser?.uid) {
      const coordField = activeContinent === 'pangaea' ? 'pet.pangaeaTileCoord' : 'pet.currentTileCoord';
      updateDoc(doc(db, 'users', appUser.uid), {
        [coordField]: target,
      }).catch(console.error);
    }

    router.push(`/student/empire/battle?tile=${target}&continent=${activeContinent}`);
  };

  // ── 8.1 Handler: Bio-Radar Minimap Interaction (Tap or Drag) ──────
  const handleRadarInteract = (e: React.PointerEvent<HTMLDivElement | HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const tx = Math.min(activeMapSize - 1, Math.max(0, Math.floor(px * activeMapSize)));
    const ty = Math.min(activeMapSize - 1, Math.max(0, Math.floor(py * activeMapSize)));
    sfx.click();
    setTargetFocus({ x: tx, y: ty });
    setSelectedCoord(`${tx},${ty}`);
  };

  // ── 9. Handler: Scout Drone Calibration & Quiz (Bio-Radar) ────────
  const handleStartScout = (customCoord?: string) => {
    if (!appUser) return;
    if (isSpectatorMode) {
      alert('🔭 โหมดส่องทวีปรุ่นพี่/รุ่นน้องเปิดแผนที่ให้ดูครบแล้ว ไม่จำเป็นต้องใช้โดรนสอดแนม');
      return;
    }

    if (!isGmUser && !dailyScoutInfo.canScout) {
      alert(`⛔ แบตเตอรี่โดรนสอดแนมหมด! คุณใช้โควตาสอดแนมครบ ${DAILY_SCOUT_DRONE_LIMIT} ครั้งสำหรับวันนี้แล้ว (รีเซ็ตทุกเที่ยงคืน)`);
      return;
    }

    let target = customCoord || selectedCoord;
    const centerFallback = Math.floor(activeMapSize / 2);
    // If no target or target is already explored, find the nearest unexplored fog tile
    if (!target || exploredTiles.has(target)) {
      const fx = targetFocus?.x ?? centerFallback;
      const fy = targetFocus?.y ?? centerFallback;
      let found: string | null = null;
      for (let r = 1; r < activeMapSize; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const nx = fx + dx;
            const ny = fy + dy;
            if (nx >= 0 && nx < activeMapSize && ny >= 0 && ny < activeMapSize) {
              if (activeContinent === 'pangaea' && isPangaeaOceanTile(nx, ny)) continue;
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
      const answerText = randomQ.answer;
      const shuffledOptions = [...randomQ.choices].sort(() => Math.random() - 0.5);
      const answerIdx = shuffledOptions.indexOf(answerText);
      qObj = {
        q: randomQ.q,
        options: shuffledOptions,
        answer: answerIdx >= 0 ? answerIdx : 0,
        explanation: randomQ.explanation
      };
    } else {
      const randomFallback = SCOUT_FALLBACK_QUIZ[Math.floor(Math.random() * SCOUT_FALLBACK_QUIZ.length)];
      const answerText = randomFallback.options[randomFallback.answer];
      const shuffledOptions = [...randomFallback.options].sort(() => Math.random() - 0.5);
      const answerIdx = shuffledOptions.indexOf(answerText);
      qObj = {
        q: randomFallback.q,
        options: shuffledOptions,
        answer: answerIdx >= 0 ? answerIdx : 0,
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
            if (nx >= 0 && nx < activeMapSize && ny >= 0 && ny < activeMapSize) {
              revealedCoords.push(`${nx},${ny}`);
            }
          }
        }

        const today = getTodayDateString();
        const currentScouts = (appUser.dailyScoutDrones?.date === today ? (Number(appUser.dailyScoutDrones?.count) || 0) : 0) + 1;

        const isPangaeaScout = activeContinent === 'pangaea';
        const prevExplored = isPangaeaScout
          ? (Array.isArray(appUser.pangaeaExploredTiles) ? appUser.pangaeaExploredTiles : [])
          : (Array.isArray(appUser.exploredTiles) ? appUser.exploredTiles : []);
        const combinedExplored = new Set([...prevExplored, ...revealedCoords]);
        const currentBadges = Array.isArray(appUser.badges) ? [...appUser.badges] : [];
        const newBadges: string[] = [];

        if (!isPangaeaScout) {
          if (combinedExplored.size >= MAP_SIZE * MAP_SIZE * 0.25 && !currentBadges.includes('Junior Explorer')) {
            newBadges.push('Junior Explorer');
          }
          if (combinedExplored.size >= MAP_SIZE * MAP_SIZE * 0.5 && !currentBadges.includes('Master Cartographer')) {
            newBadges.push('Master Cartographer');
          }
          if (combinedExplored.size >= MAP_SIZE * MAP_SIZE && !currentBadges.includes('Grand Conqueror')) {
            newBadges.push('Grand Conqueror');
          }
        }

        const userRef = doc(db, 'users', appUser.uid);
        const updatePayload: Record<string, unknown> = {
          [isPangaeaScout ? 'pangaeaExploredTiles' : 'exploredTiles']: arrayUnion(...revealedCoords),
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
    if (!selectedCoord || !appUser || buildingInProgress || isSpectatorMode) return;
    const struct = DEFENSE_STRUCTURES[structId];
    if (!struct) return;

    const userExp = Number(appUser.exp || 0);
    if (userExp < struct.costExp) {
      alert(`⚠️ EXP ไม่เพียงพอ! การก่อสร้าง "${struct.name}" ต้องการ ${struct.costExp} EXP (คุณมี ${userExp} EXP)`);
      return;
    }

    setBuildingInProgress(true);
    try {
      const tileRef = doc(db, 'empire_tiles', toTileDocId(activeContinent, selectedCoord));
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
    if (!selectedCoord || !appUser || !currentTile || repairingInProgress || isSpectatorMode) return;
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
      const tileRef = doc(db, 'empire_tiles', toTileDocId(activeContinent, selectedCoord));
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
    if (!selectedCoord || !appUser || claimingOutpost || !currentTile || isSpectatorMode) return;
    const today = getTodayDateString();

    if (currentTile.lastClaimedDate === today) {
      alert('คุณได้เก็บเกี่ยวผลผลิตจากป้อมนี้ไปแล้วในวันนี้! กรุณารอวันถัดไป');
      return;
    }

    const rewardExp = Number(currentTile.dailyExp || 100);
    setClaimingOutpost(true);
    try {
      const tileRef = doc(db, 'empire_tiles', toTileDocId(activeContinent, selectedCoord));
      const userRef = doc(db, 'users', appUser.uid);

      await updateDoc(userRef, {
        exp: increment(rewardExp),
        score: increment(rewardExp)
      });

      await updateDoc(tileRef, {
        lastClaimedDate: today
      });

      sfx.levelUp();
      setActionSuccessMsg(`🎉 เก็บเกี่ยวผลผลิตสำเร็จ! ได้รับ +${rewardExp} EXP ประจำวันจากป้อมวิจัย`);
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
    if (!selectedCoord || !appUser || !currentTile || restoringUpkeep || isSpectatorMode) return;
    setRestoringUpkeep(true);
    try {
      const tileRef = doc(db, 'empire_tiles', toTileDocId(activeContinent, selectedCoord));
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

  // ── 12.2 Handler: Establish Guild Citadel (1 Tile or 2x2 Grand Fortress) ──
  const [establishingCitadel, setEstablishingCitadel] = useState(false);

  const handleEstablishCitadel = async (tileId: string) => {
    if (!appUser?.guildId || isSpectatorMode) return;
    const currentG = allGuildsMap[appUser.guildId] || guilds[appUser.guildId];
    const isLeader = currentG?.leaderUid === appUser.uid || isGmUser;
    if (!currentG || !isLeader) {
      alert('เฉพาะหัวหน้ากิลด์ (👑) เท่านั้นที่สามารถสถาปนานครหลวงกิลด์ได้');
      return;
    }

    const [tx, ty] = tileId.split(',').map(Number);
    const candidateOffsets = [
      [0, 0],
      [-1, 0],
      [0, -1],
      [-1, -1],
    ];

    let validCoords: string[] | null = null;
    let anchorCoord: string = tileId;

    for (const [ox, oy] of candidateOffsets) {
      const ax = tx + ox;
      const ay = ty + oy;
      if (ax < 0 || ax + 1 >= activeMapSize || ay < 0 || ay + 1 >= activeMapSize) continue;

      const cluster = getCitadel2x2Coords(ax, ay);
      const allGuildOwnedAndValid = cluster.every((cid) => {
        const [cx, cy] = cid.split(',').map(Number);
        if (isCentralVaultZone(cx, cy, activeContinent)) return false;
        if (activeContinent === 'pangaea' && isPangaeaOceanTile(cx, cy)) return false;
        const t = tiles[cid];
        if (!t) return false;
        if (t.isOutpost || t.type === 'outpost') return false;
        const isOwnedByGuild = t.guildId === appUser.guildId || t.ownerUid === appUser.uid;
        return isOwnedByGuild;
      });

      if (allGuildOwnedAndValid) {
        validCoords = cluster;
        anchorCoord = `${ax},${ay}`;
        break;
      }
    }

    const is2x2Block = Boolean(validCoords && validCoords.length === 4);
    const finalCoords = is2x2Block ? validCoords! : [tileId];

    setEstablishingCitadel(true);
    try {
      const isPangaea = activeContinent === 'pangaea';
      const oldCoords = isPangaea
        ? (currentG.pangaeaCitadelCoords || (currentG.pangaeaCitadelCoord ? [currentG.pangaeaCitadelCoord] : []))
        : (currentG.citadelCoords || (currentG.citadelCoord ? [currentG.citadelCoord] : []));
      const clearPromises = oldCoords
        .filter((cid) => tiles[cid]?.isCitadel)
        .map((cid) => updateDoc(doc(db, 'empire_tiles', toTileDocId(activeContinent, cid)), { isCitadel: false }));
      await Promise.all(clearPromises);

      const setPromises = finalCoords.map((cid) =>
        updateDoc(doc(db, 'empire_tiles', toTileDocId(activeContinent, cid)), {
          isCitadel: true,
          guildId: appUser.guildId,
          guildName: currentG.name,
        })
      );
      await Promise.all(setPromises);

      const lvl = currentG.citadelLevel || 1;
      const guildPayload: Record<string, unknown> = {
        citadelLevel: lvl,
        citadelExp: currentG.citadelExp || 0,
        citadelHp: lvl * 1000 + 2500,
        maxCitadelHp: lvl * 1000 + 2500,
      };
      if (isPangaea) {
        guildPayload.pangaeaCitadelCoord = anchorCoord;
        guildPayload.pangaeaCitadelCoords = finalCoords;
      } else {
        guildPayload.citadelCoord = anchorCoord;
        guildPayload.citadelCoords = finalCoords;
      }
      await updateDoc(doc(db, 'guilds', currentG.id), guildPayload);

      sfx.levelUp();
      setActionSuccessMsg(
        is2x2Block
          ? `🏛️ สถาปนานครหลวงกิลด์ [${currentG.tag || currentG.name}] แบบมหาปราสาท 4 ช่อง [${finalCoords.join(', ')}] สำเร็จ!`
          : `🏛️ สถาปนานครหลวงกิลด์ [${currentG.tag || currentG.name}] ณ เซกเตอร์ [${tileId}] สำเร็จ! (ยึดครบ 4 ช่อง 2×2 เพื่อขยายเป็นมหาปราสาท)`
      );
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Error establishing citadel:', err);
      alert('เกิดข้อผิดพลาดในการสถาปนานครหลวงกิลด์');
    } finally {
      setEstablishingCitadel(false);
    }
  };

  // ── 12.3 Handler: Donate EXP to Upgrade Guild Citadel ─────────────
  const [donatingCitadelExp, setDonatingCitadelExp] = useState(false);

  const handleDonateCitadelExp = async (amount: number = 25) => {
    if (!appUser?.guildId || donatingCitadelExp) return;
    const currentG = allGuildsMap[appUser.guildId] || guilds[appUser.guildId];
    if (!currentG || (!currentG.citadelCoord && !currentG.citadelCoords && !currentG.pangaeaCitadelCoord)) {
      alert('กิลด์ของคุณยังไม่มีนครหลวง กรุณาให้หัวหน้ากิลด์สถาปนานครหลวงก่อน');
      return;
    }
    const userExp = Number(appUser.exp || 0);
    if (userExp < amount + 20) {
      alert(`คุณมี EXP ไม่เพียงพอสำหรับการบริจาค (ต้องการขั้นต่ำ ${amount + 20} EXP, คุณมี ${userExp} EXP)`);
      return;
    }

    setDonatingCitadelExp(true);
    try {
      await updateDoc(doc(db, 'users', appUser.uid), {
        exp: increment(-amount),
      });

      const currentLevel = currentG.citadelLevel || 1;
      const currentExp = (currentG.citadelExp || 0) + amount;
      const neededExpForNext = currentLevel * 150;
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
      setActionSuccessMsg(
        newLevel > currentLevel
          ? `🎉 นครหลวงกิลด์เลเวลอัป! ก้าวสู่ระดับ LV.${newLevel} รัศมีคุ้มกันและพลังป้องกันเพิ่มขึ้น!`
          : `🧪 บริจาค ${amount} EXP พัฒนานครหลวงกิลด์สำเร็จ!`
      );
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error donating to citadel:', err);
    } finally {
      setDonatingCitadelExp(false);
    }
  };

  // ── 12.4 Guild Members Fetch & Preview ────────────────────────────
  useEffect(() => {
    if (!showGuildModal || !appUser?.guildId) {
      setGuildMembers([]);
      return;
    }
    let isCancelled = false;
    setLoadingMembers(true);
    const q = query(
      collection(db, 'users'),
      where('guildId', '==', appUser.guildId),
      limit(50)
    );
    getDocs(q)
      .then((snap) => {
        if (isCancelled) return;
        const list: User[] = [];
        snap.forEach((d) => list.push(d.data() as User));
        setGuildMembers(list);
      })
      .catch((err) => console.error('Error fetching guild members:', err))
      .finally(() => {
        if (!isCancelled) setLoadingMembers(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [showGuildModal, appUser?.guildId]);

  const handleTogglePreviewGuild = async (targetGuildId: string) => {
    if (previewGuildId === targetGuildId) {
      setPreviewGuildId(null);
      return;
    }
    setPreviewGuildId(targetGuildId);
    if (previewMembersMap[targetGuildId]) return;

    setLoadingPreviewId(targetGuildId);
    try {
      const q = query(
        collection(db, 'users'),
        where('guildId', '==', targetGuildId),
        limit(30)
      );
      const snap = await getDocs(q);
      const list: User[] = [];
      snap.forEach((d) => list.push(d.data() as User));
      setPreviewMembersMap((prev) => ({ ...prev, [targetGuildId]: list }));
    } catch (err) {
      console.error('Error previewing guild members:', err);
    } finally {
      setLoadingPreviewId(null);
    }
  };

  // ── 12.5 Guild Lifecycle Handlers (Create, Join, Leave, Color) ────
  const handleCreateGuild = async () => {
    if (!appUser || !newGuildName.trim() || !newGuildTag.trim() || isCreatingGuild) return;
    if (activeContinent === 'pangaea') {
      alert(`กรุณาสลับกลับทวีปบ้านเกิดของคุณ (${CONTINENTS[myHomeContinent].code}) ก่อนก่อตั้งกิลด์ เพื่อให้ซิงค์พื้นที่กิลด์ประจำรุ่นอย่างถูกต้อง`);
      return;
    }
    setIsCreatingGuild(true);
    try {
      const gId = `guild_${Date.now()}`;
      const creatorTilesCount = !isSpectatorMode
        ? Object.values(tiles).filter((t) => t.ownerUid === appUser.uid).length
        : 0;
      const cleanName = newGuildName.trim();
      const cleanTag = newGuildTag.trim().toUpperCase().slice(0, 5);

      const newGuild: Guild = {
        id: gId,
        name: cleanName,
        tag: cleanTag,
        color: newGuildColor,
        continentId: myHomeContinent,
        leaderUid: appUser.uid,
        leaderName: appUser.fullname || 'ผู้บัญชาการ',
        membersCount: 1,
        totalTiles: creatorTilesCount,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'guilds', gId), newGuild);
      await updateDoc(doc(db, 'users', appUser.uid), {
        guildId: gId,
        guildName: cleanName,
      });

      if (!isSpectatorMode) {
        const tileUpdates = Object.values(tiles)
          .filter((t) => t.ownerUid === appUser.uid)
          .map((t) =>
            updateDoc(doc(db, 'empire_tiles', toTileDocId(activeContinent, t.id)), {
              guildId: gId,
              guildName: cleanName,
            })
          );
        await Promise.all(tileUpdates);
      }

      setNewGuildName('');
      setNewGuildTag('');
      sfx.levelUp();
      setActionSuccessMsg(`👑 สถาปนาพันธมิตรกิลด์ [${cleanTag}] ${cleanName} ประจำทวีป ${CONTINENTS[myHomeContinent].code} สำเร็จ!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error creating guild:', err);
      alert('เกิดข้อผิดพลาดในการสร้างกิลด์ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsCreatingGuild(false);
    }
  };

  const handleJoinGuild = async (targetGuild: Guild) => {
    if (!appUser || isJoiningGuild) return;
    if (activeContinent === 'pangaea') {
      alert(`กรุณาสลับกลับทวีปบ้านเกิดของคุณ (${CONTINENTS[myHomeContinent].code}) ก่อนเข้าร่วมกิลด์ เพื่อให้ซิงค์พื้นที่กิลด์ประจำรุ่นอย่างถูกต้อง`);
      return;
    }
    const gContinent = resolveGuildContinent(targetGuild);
    if (!isGmUser && gContinent !== myHomeContinent) {
      alert(`⛔ คุณสามารถเข้าร่วมกิลด์ในทวีปประจำชั้นปีของคุณ (${CONTINENTS[myHomeContinent].code}) เท่านั้น!`);
      return;
    }
    setIsJoiningGuild(targetGuild.id);
    try {
      const joiningUserTilesCount = !isSpectatorMode
        ? Object.values(tiles).filter((t) => t.ownerUid === appUser.uid).length
        : 0;

      await updateDoc(doc(db, 'guilds', targetGuild.id), {
        membersCount: increment(1),
        totalTiles: increment(joiningUserTilesCount),
      });
      await updateDoc(doc(db, 'users', appUser.uid), {
        guildId: targetGuild.id,
        guildName: targetGuild.name,
      });

      if (!isSpectatorMode) {
        const tileUpdates = Object.values(tiles)
          .filter((t) => t.ownerUid === appUser.uid)
          .map((t) =>
            updateDoc(doc(db, 'empire_tiles', toTileDocId(activeContinent, t.id)), {
              guildId: targetGuild.id,
              guildName: targetGuild.name,
            })
          );
        await Promise.all(tileUpdates);
      }

      sfx.levelUp();
      setShowGuildModal(false);
      setActionSuccessMsg(`🛡️ คุณได้เข้าร่วมพันธมิตร [${targetGuild.tag}] ${targetGuild.name} เรียบร้อยแล้ว!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error joining guild:', err);
      alert('เกิดข้อผิดพลาดในการเข้าร่วมกิลด์');
    } finally {
      setIsJoiningGuild(null);
    }
  };

  const handleLeaveGuild = async () => {
    if (!appUser || !appUser.guildId) return;
    if (activeContinent === 'pangaea') {
      alert(`กรุณาสลับกลับทวีปบ้านเกิดของคุณ (${CONTINENTS[myHomeContinent].code}) ก่อนออกจากกิลด์ เพื่อให้ซิงค์พื้นที่กิลด์ประจำรุ่นอย่างถูกต้อง`);
      return;
    }
    const currentG = allGuildsMap[appUser.guildId] || guilds[appUser.guildId];
    if (!confirm(`คุณต้องการออกจากพันธมิตรกิลด์ [${currentG?.tag || ''}] ${currentG?.name || ''} ใช่หรือไม่?`)) {
      return;
    }
    try {
      const leavingUserTilesCount = !isSpectatorMode
        ? Object.values(tiles).filter((t) => t.ownerUid === appUser.uid).length
        : 0;
      if (currentG) {
        await updateDoc(doc(db, 'guilds', currentG.id), {
          membersCount: increment(-1),
          totalTiles: increment(-leavingUserTilesCount),
        });
      }
      await updateDoc(doc(db, 'users', appUser.uid), {
        guildId: null,
        guildName: null,
      });

      if (!isSpectatorMode) {
        const tileUpdates = Object.values(tiles)
          .filter((t) => t.ownerUid === appUser.uid)
          .map((t) =>
            updateDoc(doc(db, 'empire_tiles', toTileDocId(activeContinent, t.id)), {
              guildId: null,
              guildName: null,
            })
          );
        await Promise.all(tileUpdates);
      }

      sfx.click();
      setShowGuildModal(false);
      setActionSuccessMsg('คุณได้ออกจากกิลด์เรียบร้อยแล้ว');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Error leaving guild:', err);
      alert('เกิดข้อผิดพลาดในการออกจากกิลด์');
    }
  };

  const handleUpdateGuildColor = async (color: string) => {
    if (!appUser?.guildId) return;
    const currentG = allGuildsMap[appUser.guildId] || guilds[appUser.guildId];
    if (!currentG || (currentG.leaderUid !== appUser.uid && !isGmUser)) return;
    try {
      await updateDoc(doc(db, 'guilds', currentG.id), { color });
      sfx.click();
      setActionSuccessMsg(`เปลี่ยนสีกิลด์ประจำอาณาจักรเป็น ${color} เรียบร้อย!`);
      setTimeout(() => setActionSuccessMsg(null), 2500);
    } catch (err) {
      console.error('Error updating guild color:', err);
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
      await updateDoc(doc(db, 'empire_tiles', toTileDocId(activeContinent, tileId)), updates);
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
      await updateDoc(doc(db, 'empire_tiles', toTileDocId(activeContinent, tileId)), { shieldUntil });
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
      await updateDoc(doc(db, 'empire_tiles', toTileDocId(activeContinent, tileId)), { shieldUntil: null });
      sfx.click();
      setActionSuccessMsg(`🔓 [GM] ปลดบาเรียของเซกเตอร์ [${tileId}] สำเร็จ`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to remove shield by GM:', err);
    }
  };

  const handleGmResetTile = async (tileId: string) => {
    if (!isGmUser) return;
    if (!confirm(`[GM Action] ยืนยันการล้างเซกเตอร์ [${tileId}] บนทวีป ${activeContinentMeta.code} ให้กลับเป็นช่องว่างหรือไม่?`)) return;

    try {
      const cleanCoord = stripTileDocPrefix(tileId);
      const [tx, ty] = cleanCoord.split(',').map(Number);
      const docId = toTileDocId(activeContinent, cleanCoord);
      await setDoc(doc(db, 'empire_tiles', docId), {
        id: cleanCoord,
        continentId: activeContinent,
        x: tx,
        y: ty,
        type: 'empty'
      });
      sfx.click();
      setActionSuccessMsg(`🧹 [GM] รีเซ็ตเซกเตอร์ [${cleanCoord}] ให้เป็นช่องว่างเรียบร้อยแล้ว`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error("GM reset tile error:", err);
    }
  };

  const handleGmInstantClaim = async (tileId: string) => {
    if (!isGmUser || !appUser) return;
    try {
      const cleanCoord = stripTileDocPrefix(tileId);
      const [tx, ty] = cleanCoord.split(',').map(Number);
      const docId = toTileDocId(activeContinent, cleanCoord);
      await setDoc(doc(db, 'empire_tiles', docId), {
        id: cleanCoord,
        continentId: activeContinent,
        x: tx,
        y: ty,
        type: 'player',
        ownerUid: appUser.uid,
        ownerName: appUser.fullname || 'GM Admin',
        guildId: appUser.guildId || null,
        currentDefenderHp: 2000,
        maxDefenderHp: 2000,
        lastAttacked: new Date().toISOString()
      }, { merge: true });
      sfx.victory();
      setActionSuccessMsg(`👑 [GM] ยึดครองเซกเตอร์ [${cleanCoord}] สำเร็จทันที`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error("GM instant claim error:", err);
    }
  };

  const handleGmSeedContinent = async () => {
    if (!isGmUser || isSeedingContinent || activeContinent === 'pangaea') return;
    if (!confirm(`🌱 [GM] ยืนยันการเสกบอสใจกลาง (Vault) และป้อมฟาร์มวิจัย (Outposts) บนทวีป ${activeContinentMeta.code} หรือไม่?\n(จะสร้างเฉพาะช่องที่ยังว่าง ไม่ทับฐานของผู้เล่นเดิม)`)) return;
    setIsSeedingContinent(true);
    try {
      const res = await seedContinentVaultAndOutposts(activeContinent);
      sfx.levelUp();
      setActionSuccessMsg(`🌱 [GM] เสกบอส ${res.seededGuardians} จุด และป้อมฟาร์ม ${res.seededOutposts} จุด บน ${activeContinentMeta.code} สำเร็จ!`);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      console.error('GM seed continent error:', err);
      alert('เกิดข้อผิดพลาดในการเสกบอสประจำทวีป');
    } finally {
      setIsSeedingContinent(false);
    }
  };

  const handleGmTriggerPangaeaMerge = async (unlockForStudents: boolean = false) => {
    if (!isGmUser || isMergingPangaea) return;
    const modeTitle = unlockForStudents
      ? '🌍 [GM LIVE MERGE — เปิดศึก PANGAEA 120×120 ให้นิสิตทุกชั้นปี]'
      : '🧪 [GM SANDBOX TEST — ทดลองสร้างแผนที่ PANGAEA 120×120 โดยยังล็อกนิสิตไว้]';
    const msg =
      `${modeTitle}\n\n` +
      'ระบบจะคัดลอกแผ่นดิน เมืองหลวง ป้อมปราการ และนครหลวงกิลด์ของทั้ง 3 ทวีป:\n' +
      '• 👑 ปี 5 SYNAPSIA -> แผ่นดินเหนือ\n' +
      '• 💎 ปี 3 CAPSIDIA -> แผ่นดินตะวันตกเฉียงใต้\n' +
      '• 🔥 ปี 4 HEMORIA -> แผ่นดินตะวันออกเฉียงใต้\n' +
      'พร้อมเปิดสะพานบก 3 สายเชื่อมเข้าหาเกาะกลางโลก (Pangaea World Core)\n' +
      '(ข้อมูลทวีปเดิมของแต่ละชั้นปีปลอดภัย 100% และสามารถกดปุ่ม "⏪ ยกเลิก/ล้าง Pangaea" กลับเป็นปกติได้ตลอดเวลา!)\n\nยืนยันดำเนินการหรือไม่?';
    if (!confirm(msg)) return;

    setIsMergingPangaea(true);
    try {
      const res = await executePangaeaTectonicMerge(unlockForStudents);
      sfx.victory();
      setPangaeaUnlocked(unlockForStudents);
      handleSwitchContinent('pangaea');
      setActionSuccessMsg(
        unlockForStudents
          ? `🌍 เปิดศึก PANGAEA จริงสำเร็จ! คัดลอกเมืองผู้เล่น ${res.copiedPlayerTiles} เซกเตอร์ (รวม ${res.totalOperations} รายการ)!`
          : `🧪 สร้างแผนที่ทดลอง PANGAEA สำเร็จ! คัดลอกเมืองผู้เล่น ${res.copiedPlayerTiles} เซกเตอร์ (นิสิตทั่วไปยังถูกล็อกไว้)`
      );
      setTimeout(() => setActionSuccessMsg(null), 6000);
    } catch (err) {
      console.error('Pangaea merge error:', err);
      alert('เกิดข้อผิดพลาดในการรวมมหาทวีป PANGAEA');
    } finally {
      setIsMergingPangaea(false);
    }
  };

  const handleGmRevertPangaea = async () => {
    if (!isGmUser || isMergingPangaea) return;
    if (
      !confirm(
        '⏪ [GM REVERT] ยืนยันการยกเลิกและล้างแผนที่ทดลอง PANGAEA กลับสู่สถานะปกติหรือไม่?\n\n' +
          '• ลบเฉพาะเซกเตอร์จำลองบน PANGAEA ทั้งหมด และล็อกแผนที่กลับทันที\n' +
          '• ข้อมูลบ้าน คะแนน และกิลด์บนทวีป CAPSIDIA (ปี 3), HEMORIA (ปี 4), SYNAPSIA (ปี 5) ปลอดภัย 100%!'
      )
    ) {
      return;
    }

    setIsMergingPangaea(true);
    try {
      const res = await revertPangaeaTectonicMerge();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('virusgo_hero_coord_pangaea');
      }
      setPangaeaUnlocked(false);
      handleSwitchContinent(myHomeContinent);
      setActionSuccessMsg(
        `⏪ ยกเลิกและรีเซ็ต PANGAEA เรียบร้อย! (ล้างเซกเตอร์จำลอง ${res.deletedTilesCount} ช่อง — ทวีปหลักทั้ง 3 รุ่นปลอดภัย 100%)`
      );
      setTimeout(() => setActionSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Pangaea revert error:', err);
      alert('เกิดข้อผิดพลาดในการยกเลิกแผนที่ PANGAEA');
    } finally {
      setIsMergingPangaea(false);
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
                {activeContinentMeta.emoji} {activeContinentMeta.code}
              </span>
              <span className="text-xs text-slate-400 font-mono hidden lg:inline">
                {activeContinentMeta.thaiName} • {activeMapSize}×{activeMapSize} ({(activeMapSize * activeMapSize).toLocaleString()} เซกเตอร์)
              </span>
            </div>
            <h1 className="text-sm sm:text-xl font-black text-white tracking-wide flex items-center gap-1.5 mt-0.5">
              <span>VIRUS EMPIRE</span>
              <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hidden xs:inline">
                {activeContinent === 'pangaea' ? 'PANGAEA 120×120' : `ปี ${activeContinentMeta.year}`}
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

          {/* Guild / Alliance Management Button */}
          <button
            type="button"
            onClick={() => {
              sfx.click();
              setShowGuildModal(true);
            }}
            className={`px-2 sm:px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 ${
              appUser?.guildId
                ? 'bg-amber-950/80 hover:bg-amber-900/80 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'bg-indigo-950/90 hover:bg-indigo-900/90 border-indigo-500/60 text-indigo-300 ring-1 ring-indigo-400/50 shadow-[0_0_12px_rgba(99,102,241,0.35)] animate-pulse'
            }`}
            title={
              appUser?.guildId
                ? `พันธมิตรกิลด์: [${allGuildsMap[appUser.guildId]?.tag || 'กิลด์'}] ${allGuildsMap[appUser.guildId]?.name || ''}`
                : 'ระบบพันธมิตรกิลด์ - ยังไม่มีกิลด์ (คลิกเพื่อเข้าร่วมหรือก่อตั้ง)'
            }
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="hidden sm:inline">
              {appUser?.guildId
                ? `[${allGuildsMap[appUser.guildId]?.tag || 'กิลด์'}]`
                : 'พันธมิตรกิลด์'}
            </span>
            {!appUser?.guildId && (
              <span className="text-[10px] sm:hidden font-mono text-indigo-300 font-black">กิลด์</span>
            )}
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

      {/* ── CONTINENT SWITCHER & PANGAEA WORLD CONVERGENCE BAR ────────────── */}
      <div className="z-25 bg-slate-950/95 border-b border-slate-800/80 px-2.5 sm:px-5 py-1.5 backdrop-blur-md flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          {ALL_CONTINENT_ORDER.map((cid) => {
            const meta = CONTINENTS[cid];
            const isSelected = activeContinent === cid;
            const isMine = cid === myHomeContinent;
            const isLockedPangaea = cid === 'pangaea' && !pangaeaUnlocked && !isGmUser;

            return (
              <button
                key={cid}
                type="button"
                onClick={() => handleSwitchContinent(cid)}
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-mono font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 ${
                  isSelected
                    ? cid === 'capsidia'
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                      : cid === 'hemoria'
                      ? 'bg-rose-950/90 border-rose-400 text-rose-200 shadow-[0_0_12px_rgba(251,113,133,0.3)]'
                      : cid === 'synapsia'
                      ? 'bg-amber-950/90 border-amber-400 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-emerald-950/90 border-emerald-400 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                    : isLockedPangaea
                    ? 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
                title={meta.subtitle}
              >
                <span>{meta.emoji}</span>
                <span>
                  {cid === 'pangaea' ? 'PANGAEA (รวม 3 รุ่น)' : `ปี ${meta.year}: ${meta.code}`}
                </span>
                {isMine && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-white/15 text-white font-black">
                    ทวีปเรา
                  </span>
                )}
                {isLockedPangaea && <Lock className="w-3 h-3 text-slate-500" />}
                {cid === 'pangaea' && pangaeaUnlocked && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-black animate-pulse">
                    LIVE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Spectator Return OR GM Continent / Pangaea Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isSpectatorMode && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-[10px] sm:text-xs font-mono text-indigo-200">
              <Eye className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="hidden sm:inline">โหมดส่องทวีปต่างรุ่น (ดูได้อย่างเดียว)</span>
              <span className="sm:hidden">โหมดส่อง</span>
              <button
                type="button"
                onClick={() => handleSwitchContinent(myHomeContinent)}
                className="ml-1 px-2 py-0.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-[10px] cursor-pointer transition-colors"
              >
                กลับทวีปเรา →
              </button>
            </div>
          )}

          {isGmUser && activeContinent !== 'pangaea' && (
            <button
              type="button"
              disabled={isSeedingContinent}
              onClick={handleGmSeedContinent}
              className="px-2.5 py-1 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
              title="[GM] เสกบอสใจกลาง (Vault) และป้อมฟาร์มประจำทวีปนี้"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{isSeedingContinent ? 'กำลังเสก...' : 'เสกบอสทวีปนี้'}</span>
            </button>
          )}

          {isGmUser && (
            <>
              <button
                type="button"
                disabled={isMergingPangaea}
                onClick={() => handleGmTriggerPangaeaMerge(false)}
                className="px-2.5 py-1 rounded-xl bg-cyan-950/90 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-200 text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                title="[GM Sandbox] ทดลองสร้างแผนที่ PANGAEA 120×120 โดยยังล็อกนิสิตทั่วไปไว้"
              >
                <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isMergingPangaea ? 'กำลังทำงาน...' : '🧪 ทดลอง PANGAEA (GM)'}</span>
              </button>

              <button
                type="button"
                disabled={isMergingPangaea}
                onClick={() => handleGmTriggerPangaeaMerge(true)}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 text-[10px] sm:text-xs font-mono font-black flex items-center gap-1 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                title="[GM Live] เปิดศึก PANGAEA 120×120 จริง และปลดล็อกให้นิสิตทุกชั้นปีเข้าเล่น"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>เปิดศึกจริง</span>
              </button>

              {(activeContinent === 'pangaea' || pangaeaUnlocked) && (
                <button
                  type="button"
                  disabled={isMergingPangaea}
                  onClick={handleGmRevertPangaea}
                  className="px-2.5 py-1 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-500/50 text-rose-200 text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
                  title="[GM Revert] ยกเลิกและล้างแผนที่ทดลอง PANGAEA กลับสู่สถานะปกติ (ไม่กระทบข้อมูลทวีปหลัก)"
                >
                  <RefreshCw className="w-3 h-3 text-rose-400" />
                  <span>⏪ ยกเลิก PANGAEA</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

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
          continentId={activeContinent}
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
                  <span className="text-slate-500">{activeMapSize}×{activeMapSize}</span>
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

              {/* Interactive Real-Time Radar Canvas */}
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
                {/* 2D Canvas rendering live grid pixels */}
                <canvas 
                  ref={radarCanvasRef}
                  width={activeMapSize}
                  height={activeMapSize}
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
                      style={{ left: `${(sx / activeMapSize) * 100}%`, top: `${(sy / activeMapSize) * 100}%` }}
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
                      {(() => {
                        const [sx, sy] = selectedCoord.split(',').map(Number);
                        if (activeContinent === 'pangaea') {
                          const pInfo = getPangaeaTerrain(sx, sy);
                          if (pInfo.terrain === 'ocean') return '🌊 มหาสมุทรชีวภาพกั้นทวีป (Bio-Ocean — ไม่สามารถเดินทัพข้ามได้)';
                          if (pInfo.terrain === 'bridge') return '🌉 สะพานบกยุทธศาสตร์เชื่อมมหาทวีป (Bio-Isthmus Chokepoint)';
                          if (pInfo.terrain === 'core') return '🌍 เกาะกลางโลก PANGAEA WORLD CORE (สมรภูมิชิงบัลลังก์ 3 รุ่น)';
                          if (pInfo.homeland) return `${CONTINENTS[pInfo.homeland].emoji} แผ่นดิน ${CONTINENTS[pInfo.homeland].code} (ปี ${CONTINENTS[pInfo.homeland].year})`;
                        }
                        if (isSanctuaryZone(sx, sy, activeContinent)) return '🛡️ เขตรักษาความปลอดภัย (Sanctuary Rim)';
                        if (isCentralVaultZone(sx, sy, activeContinent)) return '⚡ ศูนย์กลางชีวะ (Central Core Vault)';
                        return '⚔️ สมรภูมิยุทธการ (Tactical Frontier)';
                      })()}
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

                      {/* Citadel Badge */}
                      {currentTile?.isCitadel && (
                        <div className="mt-1 px-2 py-0.5 rounded-lg bg-amber-950/90 border border-amber-500/60 flex items-center gap-1.5 text-[10px] text-amber-300 font-bold shadow-sm">
                          <span>🚩</span>
                          <span>มหานครกิลด์ (Guild Citadel) LV.{currentTileGuild?.citadelLevel || 1} • รัศมีคุ้มกันป้องกันรกร้าง 2 ช่อง</span>
                        </div>
                      )}

                      {/* Hero Duel vs Garrison Status Tag */}
                      {!currentTile?.isCitadel && (() => {
                        const isHeroHere = Boolean(
                          (isMyTile && heroPetCoord === selectedCoord) ||
                          (currentTile.heroStationedUid && currentTile.heroStationedUid === currentTile.ownerUid && rivalStationedHeroCoords.has(currentTile.id))
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
                {(() => {
                  const [sx, sy] = selectedCoord.split(',').map(Number);
                  const isOcean = activeContinent === 'pangaea' && isPangaeaOceanTile(sx, sy);
                  if (isOcean) {
                    return (
                      <div className="p-3 rounded-2xl bg-sky-950/60 border border-sky-500/40 text-sky-200 text-xs font-mono text-center space-y-1">
                        <div className="font-bold text-sky-300">🌊 มหาสมุทรชีวภาพลึก (Impassable Bio-Ocean)</div>
                        <div className="text-[11px] text-slate-400">
                          กรุณานำทัพเคลื่อนผ่าน <strong className="text-amber-300">สะพานบกสีทอง 3 สาย (Bio-Isthmus Bridge)</strong> เพื่อข้ามไปยังแผ่นดินอื่นหรือเกาะกลางโลก
                        </div>
                      </div>
                    );
                  }
                  if (isSpectatorMode) {
                    return (
                      <div className="p-3 rounded-2xl bg-indigo-950/70 border border-indigo-500/50 text-indigo-200 text-xs font-mono space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                          <Eye className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>โหมดส่องทวีปต่างรุ่น (ดูได้อย่างเดียว)</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          คุณกำลังส่องความเคลื่อนไหวของ {activeContinentMeta.emoji} <strong>{activeContinentMeta.code}</strong> ({activeContinentMeta.thaiName}) สลับกลับทวีปของคุณเพื่อส่งทัพหรือก่อสร้าง
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSwitchContinent(myHomeContinent)}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer transition-all active:scale-95"
                        >
                          กลับสู่ทวีปของเรา ({CONTINENTS[myHomeContinent].emoji} {CONTINENTS[myHomeContinent].code}) →
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* 1. If Unexplored Fog of War */}
                {!isSpectatorMode && !(activeContinent === 'pangaea' && isPangaeaOceanTile(Number(selectedCoord.split(',')[0]), Number(selectedCoord.split(',')[1]))) && (!isExplored ? (
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
                      if (!isGmUser && !isTargetAttackable.canAttack) {
                        return (
                          <div className="space-y-1.5">
                            <button
                              type="button"
                              disabled
                              className="w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 bg-slate-800/80 text-slate-400 border border-slate-700/60 cursor-not-allowed shadow-none"
                            >
                              <Compass className="w-4 h-4 text-amber-400/80" />
                              <span>🔭 อยู่นอกระยะเดินทัพ (Out of March Range)</span>
                            </button>
                            <p className="text-[10px] text-amber-400/80 text-center font-mono leading-tight">
                              💡 เดินทัพได้เฉพาะช่องที่ติดกับดินแดนเดิม หรือห่างจากฮีโร่ไม่เกิน 2 ช่อง
                            </p>
                          </div>
                        );
                      }

                      const isEnemyHeroStationed = Boolean(
                        currentTile?.ownerUid && 
                        currentTile.heroStationedUid === currentTile.ownerUid &&
                        rivalStationedHeroCoords.has(currentTile.id)
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

                    {/* 2.2 Station Hero at Owned Base */}
                    {isMyTile && (
                      heroPetCoord === selectedCoord ? (
                        <div className="p-2.5 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-purple-200 text-xs font-mono flex items-center justify-center gap-2">
                          <Crown className="w-4 h-4 text-amber-300 animate-bounce" />
                          <span className="font-bold">👑 ฮีโร่ของคุณประจำการอยู่ที่ฐานนี้</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={stationingHero}
                          onClick={() => handleStationHero(selectedCoord)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 hover:scale-[1.02] active:scale-98 cursor-pointer transition-all"
                        >
                          <Crown className="w-4 h-4 text-amber-300" />
                          <span>{stationingHero ? 'กำลังเคลื่อนย้ายฮีโร่...' : '👑 ย้ายฮีโร่มาประจำการที่ฐานนี้ (Station Hero)'}</span>
                        </button>
                      )
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

                    {/* 5.1 Guild Leader: Establish Citadel Button */}
                    {appUser?.guildId &&
                      ((allGuildsMap[appUser.guildId] || guilds[appUser.guildId])?.leaderUid === appUser.uid || isGmUser) &&
                      (isMyTile || isGuildTile) &&
                      !currentTile?.isCitadel &&
                      !currentTile?.isOutpost &&
                      selectedCoord && (() => {
                        const [tx, ty] = selectedCoord.split(',').map(Number);
                        return !isCentralVaultZone(tx, ty, activeContinent);
                      })() && (
                        <button
                          type="button"
                          disabled={establishingCitadel}
                          onClick={() => handleEstablishCitadel(selectedCoord)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:via-yellow-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/60 ring-2 ring-amber-400/80 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer animate-pulse"
                          title="สถาปนานครหลวงกิลด์ ณ บริเวณนี้"
                        >
                          <Building2 className="w-4 h-4 text-slate-950" />
                          <span>{establishingCitadel ? 'กำลังสถาปนา...' : '🏛️ สถาปนานครหลวงกิลด์ (Guild Citadel)'}</span>
                        </button>
                    )}

                    {/* 5.2 Guild Member: Donate EXP to Upgrade Guild Citadel */}
                    {appUser?.guildId && currentTile?.isCitadel && (isGuildTile || currentTile?.guildId === appUser.guildId) && (
                      <button
                        type="button"
                        disabled={donatingCitadelExp}
                        onClick={() => handleDonateCitadelExp(25)}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:via-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-950/60 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>{donatingCitadelExp ? 'กำลังบริจาค...' : `🧪 บริจาค 25 EXP พัฒนานครหลวง (LV.${currentTileGuild?.citadelLevel || 1})`}</span>
                      </button>
                    )}

                    {/* 5.3 Player with no guild: Guild invitation call-to-action */}
                    {!appUser?.guildId && (
                      <button
                        type="button"
                        onClick={() => {
                          sfx.click();
                          setShowGuildModal(true);
                        }}
                        className="w-full py-2.5 px-3 rounded-2xl bg-indigo-950/70 hover:bg-indigo-900/80 border border-indigo-500/50 text-indigo-200 text-xs font-mono flex items-center justify-between transition-all hover:scale-[1.01] active:scale-98 shadow-md cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5 font-bold">
                          <Users className="w-4 h-4 text-indigo-400 animate-pulse" />
                          <span>คุณยังไม่มีพันธมิตรกิลด์</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold">
                          เข้าร่วม / ก่อตั้งกิลด์ →
                        </span>
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
                ))}
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
                <div className="text-xl font-black text-white font-mono mt-1">
                  {(activeMapSize * activeMapSize).toLocaleString()}
                </div>
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

      {/* ── MODAL 5: GUILD ALLIANCE & RECRUITMENT MODAL ───────────────────── */}
      {showGuildModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Users className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-black uppercase tracking-wider text-white">
                  ระบบพันธมิตรกิลด์ (Alliance)
                </h2>
              </div>
              <button 
                type="button"
                onClick={() => setShowGuildModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-4 pr-1 custom-scrollbar flex-1">
              {appUser?.guildId ? (
                (() => {
                  const currentG = allGuildsMap[appUser.guildId] || guilds[appUser.guildId];
                  const isLeader = currentG?.leaderUid === appUser.uid || isGmUser;
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
                            className="text-xs px-3 py-1.5 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition-colors shrink-0 font-medium active:scale-95 cursor-pointer"
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
                                  handleJumpToCitadel();
                                  setShowGuildModal(false);
                                }}
                                className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
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
                                <ShieldCheck className="w-3.5 h-3.5" /> สิทธิประโยชน์ของนครหลวง:
                              </div>
                              <ul className="text-[10px] text-slate-400 list-disc list-inside space-y-0.5 leading-relaxed font-mono">
                                <li>สร้างรัศมีคุ้มกันรอบตัว 2 ช่อง: <strong className="text-amber-200">ไม่มีวันรกร้าง (Decay-Immune)</strong></li>
                                <li>กำแพงป้องกันหนาแน่น 2 เท่า (HP {(currentG.citadelLevel || 1) * 1000 + 2500} หน่วย) ทุกช่องในกลุ่มนครหลวง</li>
                                <li>สมาชิกสามารถร่วมบริจาค EXP ส่วนตัวเพื่ออัปเกรดความรุ่งเรืองของนครหลวงได้</li>
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
                                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs font-mono transition-all disabled:opacity-40 active:scale-95 shadow-[0_0_10px_rgba(245,158,11,0.4)] flex items-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                                <span>{donatingCitadelExp ? 'กำลังบริจาค...' : 'บริจาค 25 EXP'}</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed font-mono">
                            <p>
                              กิลด์ของคุณยังไม่มีนครหลวง! <strong className="text-white">หัวหน้ากิลด์ (👑)</strong> สามารถเลือกช่องในอาณาเขตกิลด์ที่เป็น <strong className="text-amber-300">กลุ่มบล็อก 4 ช่อง (สี่เหลี่ยม 2×2)</strong> หรือช่องใดก็ได้ แล้วกดปุ่ม <strong>[🏛️ สถาปนานครหลวงกิลด์]</strong> ในแถบด้านล่าง
                            </p>
                            <div className="text-[10px] text-amber-400/90 font-mono">
                              ⚡ สมาชิกกิลด์สามารถช่วยกันยึดขยายพื้นที่ให้ติดกันเป็นบล็อกสี่เหลี่ยม 2×2 เพื่อให้หัวหน้ากิลด์สถาปนานครหลวงมหาปราสาทได้
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Guild Color Selector (Leader can pick color, members see it) */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> สีกิลด์บนแผนที่ 3D
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
                            <div className="text-[11px] text-slate-300 mb-2 leading-relaxed font-mono">
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
                                    className={`h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
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
                            <Users className="w-3.5 h-3.5" /> รายชื่อสมาชิก ({guildMembers.length || currentG?.membersCount || 1} คน)
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">
                            พรมแดนเชื่อมถึงกัน
                          </span>
                        </div>

                        {loadingMembers ? (
                          <div className="flex items-center justify-center py-6 gap-2 text-xs font-mono text-slate-400">
                            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                            <span>กำลังโหลดข้อมูลสมาชิก...</span>
                          </div>
                        ) : (
                          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                            {guildMembers
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
                                          type={(member.pet?.family as any) || 'parvo'}
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
                        )}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-4">
                  {/* Create New Guild Form */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5 font-mono">
                      <Plus className="w-3.5 h-3.5 text-cyan-400" /> ก่อตั้งพันธมิตรใหม่ (คุณจะเป็นหัวหน้ากิลด์ 👑)
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="ชื่อกิลด์ (เช่น Phage Clan)"
                        value={newGuildName}
                        onChange={(e) => setNewGuildName(e.target.value)}
                        className="col-span-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans"
                      />
                      <input
                        type="text"
                        placeholder="แท็ก [TAG]"
                        maxLength={5}
                        value={newGuildTag}
                        onChange={(e) => setNewGuildTag(e.target.value)}
                        className="col-span-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 uppercase focus:outline-none focus:border-cyan-400 font-mono"
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
                        <span className="text-[10px] text-slate-500">แสดงบนแผนที่ 3D</span>
                      </div>
                      <div className="grid grid-cols-6 gap-2">
                        {PLAYER_PALETTE.map((c) => {
                          const isSelected = newGuildColor === c;
                          return (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewGuildColor(c)}
                              className={`h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
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
                      type="button"
                      onClick={handleCreateGuild}
                      disabled={isCreatingGuild || !newGuildName.trim() || !newGuildTag.trim()}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer font-mono"
                    >
                      <Crown className="w-4 h-4 text-slate-950" />
                      <span>{isCreatingGuild ? 'กำลังก่อตั้ง...' : 'ก่อตั้งกิลด์และเป็นหัวหน้า (Found Guild)'}</span>
                    </button>
                  </div>

                  {/* Join Existing Guild List */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-mono text-slate-400 uppercase flex items-center justify-between">
                      <span>กิลด์ที่เปิดรับสมัคร ({Object.keys(guilds).length} กิลด์)</span>
                      <span className="text-[10px] text-slate-500">คลิกเพื่อเข้าร่วมได้ทันที</span>
                    </h4>
                    <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                      {Object.values(guilds).length > 0 ? (
                        Object.values(guilds).map((g) => {
                          const isExpanded = previewGuildId === g.id;
                          const cachedMembers = previewMembersMap[g.id] || [];

                          return (
                            <div 
                              key={g.id} 
                              className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 space-y-2 hover:border-slate-700 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span 
                                    className="w-3.5 h-3.5 rounded-full border border-white/60 shrink-0 shadow-sm" 
                                    style={{ backgroundColor: g.color || '#a855f7' }}
                                  />
                                  <div className="min-w-0">
                                    <div className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
                                      <span className="font-mono text-cyan-400">[{g.tag}]</span> 
                                      <span className="truncate">{g.name}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                                      <span className="flex items-center gap-0.5 text-amber-300 font-semibold truncate">
                                        <Crown className="w-2.5 h-2.5 text-amber-400 shrink-0" /> {g.leaderName}
                                      </span>
                                      <span>•</span>
                                      <span className="shrink-0">สมาชิก {g.membersCount || 1} คน</span>
                                      <span>•</span>
                                      <span className="text-cyan-300 shrink-0">ครอง {g.totalTiles || 0} ช่อง</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePreviewGuild(g.id)}
                                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] transition-colors cursor-pointer"
                                  >
                                    {isExpanded ? 'ย่อ' : 'ดูสมาชิก'}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isJoiningGuild === g.id}
                                    onClick={() => handleJoinGuild(g)}
                                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase transition-all shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer font-mono"
                                  >
                                    {isJoiningGuild === g.id ? '...' : 'เข้าร่วม'}
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Member List for previewing prior to joining */}
                              {isExpanded && (
                                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                                  <div className="text-[10px] font-mono text-slate-400 uppercase flex items-center justify-between">
                                    <span>รายชื่อสมาชิกในกิลด์นี้:</span>
                                    {loadingPreviewId === g.id && (
                                      <span className="flex items-center gap-1 text-cyan-400">
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" /> กำลังโหลด...
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                                    {cachedMembers.length > 0 ? (
                                      cachedMembers.map((m) => (
                                        <div 
                                          key={m.uid} 
                                          className="flex items-center justify-between text-[11px] bg-slate-900/90 rounded-lg px-2.5 py-1 border border-slate-800"
                                        >
                                          <span className="text-white truncate font-medium">{m.fullname}</span>
                                          {m.uid === g.leaderUid ? (
                                            <span className="text-[9px] text-amber-300 font-mono font-bold flex items-center gap-0.5">
                                              <Crown className="w-2.5 h-2.5 text-amber-400" /> หัวหน้า
                                            </span>
                                          ) : (
                                            <span className="text-[9px] text-slate-400 font-mono">สมาชิก</span>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-[10px] text-slate-500 font-mono py-1">
                                        {loadingPreviewId === g.id ? 'กำลังค้นหาสมาชิก...' : `${g.leaderName} (หัวหน้ากิลด์)`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-xs font-mono text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                          ยังไม่มีกิลด์ในระบบ เป็นคนแรกที่ก่อตั้งเลย!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-800 shrink-0 text-center">
              <button 
                type="button"
                onClick={() => setShowGuildModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase font-mono transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
