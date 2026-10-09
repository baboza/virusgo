"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, doc, setDoc } from 'firebase/firestore';
import { EmpireTile, Guild, User } from '@/types';
import { SVGVirus } from '@/components/ui/SVGVirus';
import { Loader2, ArrowLeft, Swords, Crosshair, AlertTriangle, Shield, Lock, Home, Target, Flame, Sparkles, Users, Plus, Check, Crown, Gift, Radio, Building2, Zap } from 'lucide-react';
import { updateDoc, increment } from 'firebase/firestore';
import { sfx } from '@/utils/sound';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { familyToVirusType } from '@/components/ui/SVGVirus';

const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-[9px]">3D...</div>
});

const MAP_SIZE = 30; // Expanded to 30x30 = 900 tiles

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

export default function EmpireMap() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [tiles, setTiles] = useState<Record<string, EmpireTile>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);

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
  };

  // Guild / Alliance States
  const [guilds, setGuilds] = useState<Record<string, Guild>>({});
  const [showGuildModal, setShowGuildModal] = useState(false);
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildTag, setNewGuildTag] = useState('');
  const [newGuildColor, setNewGuildColor] = useState(PLAYER_PALETTE[0]);
  const [isCreatingGuild, setIsCreatingGuild] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [previewGuildId, setPreviewGuildId] = useState<string | null>(null);

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

      const hasChest = Object.values(newTiles).some((t) => t.type === 'chest');
      const hasOutpost = Object.values(newTiles).some((t) => t.isOutpost || t.type === 'outpost');
      if (bossCount < 20 || !hasChest || !hasOutpost) {
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

  // Distribute bosses, central treasure vault, and 4 farm outposts across grid sectors
  const distributeBosses = async (currentTiles: Record<string, EmpireTile>) => {
    // 1. Central Vault: 4 Golden Treasure Chests at (14,14), (14,15), (15,14), (15,15)
    const chestCoords = [
      { x: 14, y: 14 },
      { x: 14, y: 15 },
      { x: 15, y: 14 },
      { x: 15, y: 15 },
    ];

    for (const c of chestCoords) {
      const cId = `${c.x},${c.y}`;
      if (!currentTiles[cId] || currentTiles[cId].type === 'empty') {
        const chestTile: EmpireTile = {
          id: cId,
          x: c.x,
          y: c.y,
          type: 'chest',
          bonusExp: 150,
          bossHp: 150,
          maxBossHp: 150,
          ownerName: 'Ancient Virology Treasure',
          ownerFamily: 'retro',
        };
        await setDoc(doc(db, 'empire_tiles', cId), chestTile);
      }
    }

    // 2. Fortress Bosses: 2 concentric layers of Guardian Bosses surrounding the 4 central chests (perimeter of [12..17], [12..17] = 28 guardians)
    const guardianCoords: { x: number; y: number }[] = [];
    for (let gx = 12; gx <= 17; gx++) {
      for (let gy = 12; gy <= 17; gy++) {
        // Exclude the 4 center chests
        if ((gx === 14 || gx === 15) && (gy === 14 || gy === 15)) continue;
        guardianCoords.push({ x: gx, y: gy });
      }
    }

    for (const g of guardianCoords) {
      const gId = `${g.x},${g.y}`;
      if (!currentTiles[gId] || currentTiles[gId].type === 'empty') {
        const isInnerRing = (g.x === 13 || g.x === 16 || g.y === 13 || g.y === 16) && (g.x >= 13 && g.x <= 16 && g.y >= 13 && g.y <= 16);
        const guardianBoss: EmpireTile = {
          id: gId,
          x: g.x,
          y: g.y,
          type: 'boss',
          bossHp: isInnerRing ? 450 : 350,
          maxBossHp: isInnerRing ? 450 : 350,
          ownerName: isInnerRing ? 'ผู้พิทักษ์สมบัติชั้นใน (Vault Elite Guardian)' : 'ผู้พิทักษ์สมบัติชั้นนอก (Perimeter Guardian)',
          ownerFamily: ['corona', 'rabies', 'parvo', 'retro', 'orthomyxo'][Math.floor(Math.random() * 5)],
        };
        await setDoc(doc(db, 'empire_tiles', gId), guardianBoss);
      }
    }

    // 3. Regular Zone Bosses: Place 1 boss in each 5x5 zone (excluding the central vault zones)
    const zoneSize = 5;
    const zonesPerRow = MAP_SIZE / zoneSize; // 6 zones

    for (let zx = 0; zx < zonesPerRow; zx++) {
      for (let zy = 0; zy < zonesPerRow; zy++) {
        // Skip central zones that already contain the fortress
        if ((zx === 2 || zx === 3) && (zy === 2 || zy === 3)) continue;

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
              bossHp: 300,
              maxBossHp: 300,
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
      { x: 6, y: 6, name: 'ป้อมฟาร์มวิจัยตะวันตกเฉียงเหนือ (NW Outpost)' },
      { x: 23, y: 6, name: 'ป้อมฟาร์มวิจัยตะวันออกเฉียงเหนือ (NE Outpost)' },
      { x: 6, y: 23, name: 'ป้อมฟาร์มวิจัยตะวันตกเฉียงใต้ (SW Outpost)' },
      { x: 23, y: 23, name: 'ป้อมฟาร์มวิจัยตะวันออกเฉียงใต้ (SE Outpost)' },
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
          bossHp: 180,
          maxBossHp: 180,
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
    let chestCount = 0;
    let outpostCount = 0;

    Object.values(tiles).forEach((t) => {
      if (t.isOutpost || t.type === 'outpost') outpostCount++;
      if (t.type === 'boss') bossCount++;
      else if (t.type === 'chest') chestCount++;
      else if (t.type === 'player') {
        if (t.ownerUid === appUser?.uid) myCount++;
        else enemyCount++;
      }
    });

    return { myCount, enemyCount, bossCount, chestCount, outpostCount };
  }, [tiles, appUser?.uid]);

  const activeTileData = selectedTile ? tiles[`${selectedTile.x},${selectedTile.y}`] : null;
  const isMyTile = activeTileData?.ownerUid === appUser?.uid;
  // Check if active tile belongs to a guild member
  const isGuildTile = activeTileData?.guildId && appUser?.guildId && activeTileData.guildId === appUser.guildId;

  // Set of tile IDs that player can attack right now (Adjacent to player's territory OR Ally Guild's territory)
  const attackableTileIds = useMemo(() => {
    const ids = new Set<string>();
    const userGuildId = appUser?.guildId;

    // Tiles owned by me or my guild mates
    const allianceTiles = Object.values(tiles).filter((t) => 
      t.ownerUid === appUser?.uid || (userGuildId && t.guildId === userGuildId)
    );

    // If user/guild has 0 tiles, they can pick ANY empty cell across the 30x30 map to establish their first base!
    if (allianceTiles.length === 0) {
      for (let x = 0; x < MAP_SIZE; x++) {
        for (let y = 0; y < MAP_SIZE; y++) {
          const id = `${x},${y}`;
          const t = tiles[id];
          if (!t || t.type === 'empty') {
            ids.add(id);
          }
        }
      }
      return ids;
    }

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
        if (!isAlly) {
          // If the target tile is a central treasure chest, require perimeter guardians to be cleared!
          if (neighbor?.type === 'chest') {
            // Count remaining active guardian bosses around the vault
            const guardianCoords: string[] = [];
            for (let gx = 12; gx <= 17; gx++) {
              for (let gy = 12; gy <= 17; gy++) {
                if (gx >= 14 && gx <= 15 && gy >= 14 && gy <= 15) continue;
                guardianCoords.push(`${gx},${gy}`);
              }
            }
            const activeGuardians = guardianCoords.filter((gid) => tiles[gid]?.type === 'boss');
            // If more than 8 guardians are still alive, the chest remains sealed by ancient protective shields!
            if (activeGuardians.length > 8) {
              return; // Vault is still locked
            }
          }
          ids.add(nid);
        }
      });
    });

    return ids;
  }, [tiles, appUser?.uid, appUser?.guildId]);

  const canInfect = useMemo(() => {
    if (!selectedTile || isMyTile || isGuildTile) return false;
    return attackableTileIds.has(`${selectedTile.x},${selectedTile.y}`);
  }, [selectedTile, isMyTile, isGuildTile, attackableTileIds]);

  const handleTileClick = useCallback((x: number, y: number) => {
    if (hasMoved.current) return;
    setSelectedTile({ x, y });
  }, []);

  // Quick Jump to coordinates and center on screen
  const jumpToTile = (x: number, y: number) => {
    setSelectedTile({ x, y });
    if (!mapRef.current) return;
    // Estimate tile position
    const tileW = Math.min(44, Math.max(28, window.innerWidth * 0.044));
    const targetX = x * (tileW + 2.5);
    const targetY = y * (tileW + 2.5);
    mapRef.current.scrollTo({
      left: targetX - mapRef.current.clientWidth / 2 + tileW / 2,
      top: targetY - mapRef.current.clientHeight / 2 + tileW / 2,
      behavior: 'smooth',
    });
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

  // Jump to Central Treasure Vault
  const jumpToVault = () => {
    jumpToTile(14, 14);
  };

  // Jump to Outpost
  const jumpToOutpost = () => {
    const outpostList = [
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

      await setDoc(doc(db, 'guilds', gId), newGuild);
      await updateDoc(doc(db, 'users', appUser.uid), {
        guildId: gId,
        guildName: newGuild.name,
      });

      // Update current user's tiles to reflect guild
      const tileUpdates = Object.values(tiles)
        .filter((t) => t.ownerUid === appUser.uid)
        .map((t) =>
          updateDoc(doc(db, 'empire_tiles', t.id), {
            guildId: gId,
            guildName: newGuild.name,
          })
        );
      await Promise.all(tileUpdates);

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
      const joiningUserTilesCount = Object.values(tiles).filter((t) => t.ownerUid === appUser.uid).length;
      await updateDoc(doc(db, 'guilds', targetGuild.id), {
        membersCount: (targetGuild.membersCount || 1) + 1,
        totalTiles: (targetGuild.totalTiles || 0) + joiningUserTilesCount,
      });
      await updateDoc(doc(db, 'users', appUser.uid), {
        guildId: targetGuild.id,
        guildName: targetGuild.name,
      });

      // Update tiles to match new guild
      const tileUpdates = Object.values(tiles)
        .filter((t) => t.ownerUid === appUser.uid)
        .map((t) =>
          updateDoc(doc(db, 'empire_tiles', t.id), {
            guildId: targetGuild.id,
            guildName: targetGuild.name,
          })
        );
      await Promise.all(tileUpdates);

      setShowGuildModal(false);
    } catch (err) {
      console.error("Error joining guild:", err);
    }
  };

  const handleLeaveGuild = async () => {
    if (!appUser || !appUser.guildId) return;
    const currentG = guilds[appUser.guildId];
    try {
      const leavingUserTilesCount = Object.values(tiles).filter((t) => t.ownerUid === appUser.uid).length;
      if (currentG) {
        await updateDoc(doc(db, 'guilds', currentG.id), {
          membersCount: Math.max(1, (currentG.membersCount || 2) - 1),
          totalTiles: Math.max(0, (currentG.totalTiles || 0) - leavingUserTilesCount),
        });
      }
      await updateDoc(doc(db, 'users', appUser.uid), {
        guildId: null,
        guildName: null,
      });

      // Remove guild tag from tiles
      const tileUpdates = Object.values(tiles)
        .filter((t) => t.ownerUid === appUser.uid)
        .map((t) =>
          updateDoc(doc(db, 'empire_tiles', t.id), {
            guildId: null,
            guildName: null,
          })
        );
      await Promise.all(tileUpdates);
    } catch (err) {
      console.error("Error leaving guild:", err);
    }
  };

  const handleAction = () => {
    if (!selectedTile || !canInfect) return;
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      
      {/* 1. Full-Width Top Bar & Prominent Status Cards */}
      <header className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 px-3 py-2.5 backdrop-blur-md">
        {claimSuccessMsg && (
          <div className="max-w-6xl mx-auto mb-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold text-center text-xs sm:text-sm animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>{claimSuccessMsg}</span>
          </div>
        )}
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          
          {/* Title & Quick Jump Buttons */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Link 
                href="/student" 
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
                title="กลับหน้าหลัก"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-1.5">
                  <span>แผนที่อาณาจักร</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    30×30
                  </span>
                </h1>
              </div>
            </div>

            {/* Quick Tactical Jump & Guild Buttons */}
            <div className="flex items-center gap-1.5 ml-auto sm:ml-3">
              <button
                type="button"
                onClick={() => setShowGuildModal(true)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono border transition-all flex items-center gap-1 shadow-sm active:scale-95 ${
                  appUser?.guildId
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 hover:bg-amber-900/60'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
                title="ระบบพันธมิตรกิลด์"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>{appUser?.guildName ? `[${appUser.guildName}]` : 'กิลด์'}</span>
              </button>
              <button
                type="button"
                onClick={jumpToMyBase}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                title="เลื่อนไปหาฐานของคุณ"
              >
                <Home className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden xs:inline">ฐานฉัน</span>
              </button>
              <button
                type="button"
                onClick={jumpToNearestBoss}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-red-950/80 border border-red-500/50 text-red-300 hover:bg-red-900/60 transition-all flex items-center gap-1 shadow-sm active:scale-95"
                title="เลื่อนไปหาบอสที่ใกล้ที่สุด"
              >
                <Target className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden xs:inline">ล่าบอส</span>
              </button>
              <button
                type="button"
                onClick={jumpToVault}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-amber-950/80 border border-amber-500/50 text-amber-300 hover:bg-amber-900/60 transition-all flex items-center gap-1 shadow-sm active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                title="เลื่อนไปหากล่องสมบัติใจกลางแผนที่"
              >
                <Gift className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span className="hidden xs:inline">หีบสมบัติ</span>
              </button>
              <button
                type="button"
                onClick={jumpToOutpost}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold font-mono bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 transition-all flex items-center gap-1 shadow-sm active:scale-95 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                title="เลื่อนไปหาป้อมฟาร์มวิจัย (รับ 100 EXP/วัน)"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden xs:inline">ป้อมฟาร์ม</span>
              </button>
            </div>
          </div>

          {/* Prominent High-Contrast Status Cards */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full sm:w-auto">
            {/* Card 1: ของคุณ */}
            <div className="bg-cyan-950/70 border border-cyan-500/40 rounded-xl px-2 sm:px-2.5 py-1.5 flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.15)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] shrink-0" />
              <div className="min-w-0">
                <div className="text-[9px] font-mono text-cyan-300/80 leading-none">ของคุณ</div>
                <div className="text-sm sm:text-base font-black text-cyan-200 leading-tight">
                  {stats.myCount}
                </div>
              </div>
            </div>

            {/* Card 2: ศัตรู */}
            <div className="bg-purple-950/70 border border-purple-500/40 rounded-xl px-2 sm:px-2.5 py-1.5 flex items-center gap-1.5 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
              <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] shrink-0" />
              <div className="min-w-0">
                <div className="text-[9px] font-mono text-purple-300/80 leading-none">ศัตรู</div>
                <div className="text-sm sm:text-base font-black text-purple-200 leading-tight">
                  {stats.enemyCount}
                </div>
              </div>
            </div>

            {/* Card 3: บอส */}
            <div className="bg-red-950/70 border border-red-500/40 rounded-xl px-2 sm:px-2.5 py-1.5 flex items-center gap-1.5 shadow-[0_0_12px_rgba(239,68,68,0.15)]">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#f87171] shrink-0 animate-pulse" />
              <div className="min-w-0">
                <div className="text-[9px] font-mono text-red-300/80 leading-none">บอส</div>
                <div className="text-sm sm:text-base font-black text-red-200 leading-tight">
                  {stats.bossCount}
                </div>
              </div>
            </div>

            {/* Card 4: สมบัติ */}
            <div className="bg-amber-950/70 border border-amber-500/40 rounded-xl px-2 sm:px-2.5 py-1.5 flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24] shrink-0 animate-pulse" />
              <div className="min-w-0">
                <div className="text-[9px] font-mono text-amber-300/80 leading-none">สมบัติ</div>
                <div className="text-sm sm:text-base font-black text-amber-200 leading-tight">
                  {stats.chestCount}
                </div>
              </div>
            </div>

            {/* Card 5: ป้อมฟาร์ม */}
            <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl px-2 sm:px-2.5 py-1.5 flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0 animate-pulse" />
              <div className="min-w-0">
                <div className="text-[9px] font-mono text-emerald-300/80 leading-none">ป้อมฟาร์ม</div>
                <div className="text-sm sm:text-base font-black text-emerald-200 leading-tight">
                  {stats.outpostCount}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Target Action Bar: Placed directly beneath stats cards */}
        <div className="max-w-6xl mx-auto mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2.5">
          {selectedTile ? (
            <>
              {/* 3D Target Pet Hologram Preview */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-950/80 border border-slate-700/80 shrink-0 overflow-hidden relative shadow-inner flex items-center justify-center">
                {activeTileData?.type === 'chest' ? (
                  <div className="w-full h-full flex items-center justify-center bg-amber-950/60 text-amber-300 shadow-[inset_0_0_10px_rgba(245,158,11,0.4)]">
                    <Gift className="w-6 h-6 text-amber-400 animate-bounce" />
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

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                  <span>เซกเตอร์ [{selectedTile.x}, {selectedTile.y}]</span>
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
                <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                  {activeTileData?.type === 'chest' ? (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>หีบสมบัติไวรัสวิทยาโบราณ</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40 font-mono font-bold">
                          🎁 มหาสมบัติโบราณ (หารเท่าทั้งกิลด์!)
                        </span>
                      </div>
                      {/* Compact Sub-pill for Chest Status */}
                      {(() => {
                        const guardianCoords: string[] = [];
                        for (let gx = 12; gx <= 17; gx++) {
                          for (let gy = 12; gy <= 17; gy++) {
                            if (gx >= 14 && gx <= 15 && gy >= 14 && gy <= 15) continue;
                            guardianCoords.push(`${gx},${gy}`);
                          }
                        }
                        const aliveGuardians = guardianCoords.filter((gid) => tiles[gid]?.type === 'boss').length;
                        if (aliveGuardians > 8) {
                          return (
                            <span className="text-[11px] font-normal text-amber-300/90 flex items-center gap-1">
                              <span>🛡️ บาเรียคุ้มกัน (ผู้พิทักษ์คงเหลือ {aliveGuardians} ตัว) • รวมพลังกิลด์ร่วมปราบ</span>
                            </span>
                          );
                        }
                        return (
                          <span className="text-[11px] font-normal text-emerald-400 flex items-center gap-1">
                            <span>✨ บาเรียสลายแล้ว! พร้อมให้เข้าชิงสมบัติ</span>
                          </span>
                        );
                      })()}
                    </div>
                  ) : (activeTileData?.type === 'outpost' || activeTileData?.isOutpost) ? (
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
                    'เซลล์ว่างเปล่า (ยังไม่มีเจ้าของ)'
                  )}
                </div>
              </div>

              {/* Action Button: My Outpost (Daily Harvest) OR Attack/Infect */}
              {isMyTile && (activeTileData?.isOutpost || activeTileData?.type === 'outpost') ? (
                (() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const hasClaimedToday = activeTileData.lastClaimedDate === todayStr;
                  return (
                    <button
                      type="button"
                      disabled={hasClaimedToday || claimingOutpost}
                      onClick={() => handleClaimDailyExp(`${selectedTile.x},${selectedTile.y}`)}
                      className={`h-9 sm:h-10 px-3 sm:px-5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all ${
                        hasClaimedToday
                          ? 'bg-slate-800 text-emerald-400/60 border border-emerald-900/40 cursor-default'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95'
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 ${hasClaimedToday ? 'text-emerald-500/60' : 'text-slate-950 fill-current'}`} />
                      <span>{hasClaimedToday ? '✅ รับแล้ววันนี้' : '🌾 เก็บเกี่ยว (+100 EXP)'}</span>
                    </button>
                  );
                })()
              ) : !isMyTile && (
                <button
                  type="button"
                  disabled={!canInfect}
                  onClick={handleAction}
                  className={`h-9 sm:h-10 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-all ${
                    canInfect
                      ? stats.myCount === 0
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95'
                        : activeTileData?.type === 'chest'
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.6)] active:scale-95'
                        : (activeTileData?.type === 'outpost' || activeTileData?.isOutpost)
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)] active:scale-95'
                        : activeTileData?.type === 'boss'
                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] active:scale-95'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-95'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {canInfect ? (
                    <>
                      {stats.myCount === 0 ? (
                        <>
                          <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
                          <span>สถาปนาฐานแรก</span>
                        </>
                      ) : activeTileData?.type === 'chest' ? (
                        <>
                          <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 animate-bounce" />
                          <span>ชิงมหาสมบัติ</span>
                        </>
                      ) : (activeTileData?.type === 'outpost' || activeTileData?.isOutpost) ? (
                        <>
                          <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 animate-pulse" />
                          <span>ยึดป้อม (100 EXP/วัน)</span>
                        </>
                      ) : activeTileData?.type === 'boss' ? (
                        <>
                          <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>ตีบอส</span>
                        </>
                      ) : (
                        <>
                          <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span>บุกรุก</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span className="text-[11px] whitespace-nowrap">
                        {stats.myCount === 0
                          ? 'เลือกช่องว่างเพื่อวางฐาน'
                          : activeTileData?.type === 'chest'
                          ? (() => {
                              // Count active guardians
                              const guardianCoords: string[] = [];
                              for (let gx = 12; gx <= 17; gx++) {
                                for (let gy = 12; gy <= 17; gy++) {
                                  if (gx >= 14 && gx <= 15 && gy >= 14 && gy <= 15) continue;
                                  guardianCoords.push(`${gx},${gy}`);
                                }
                              }
                              const aliveGuardians = guardianCoords.filter((gid) => tiles[gid]?.type === 'boss').length;
                              if (aliveGuardians > 8) {
                                return `ติดบาเรียผู้พิทักษ์ (${aliveGuardians} ตัว)`;
                              }
                              return 'ต้องติดกับเขตคุณ';
                            })()
                          : 'ต้องติดกับเขตคุณ'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="text-xs font-mono text-slate-400 w-full text-center py-1">
              {stats.myCount === 0 
                ? '🚩 คุณยังไม่มีอาณาเขต: แตะเซลล์ว่างใดก็ได้บนแผนที่เพื่อสถาปนาฐานแรกของคุณ!' 
                : 'แตะช่องใดก็ได้บนแผนที่เพื่อดูข้อมูลและเริ่มบุกรุก'}
            </div>
          )}
        </div>
      </header>

      {/* 2. Full-Width Edge-to-Edge Drag-to-Pan Viewport (No Scrollbars) */}
      <main
        ref={mapRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 overflow-auto no-scrollbar cursor-grab active:cursor-grabbing select-none p-6 sm:p-10 bg-slate-950 touch-pan-x touch-pan-y"
      >
        <div
          className="select-none mx-auto w-max"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${MAP_SIZE}, 1fr)`,
            gap: '2.5px',
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
            const playerColor = tile?.type === 'player' && tile.ownerUid
              ? getPlayerUniqueColor(tile.ownerUid, isMyTileOnMap)
              : undefined;

            const isAllyGuildTile = tile?.guildId && appUser?.guildId && tile.guildId === appUser.guildId;
            const isChest = tile?.type === 'chest';
            const isOutpost = tile?.type === 'outpost' || tile?.isOutpost;
            const isClaimedChest = tile?.type === 'player' && (tile.bonusExp || 0) > 0;

            // Guild & Player Color Logic: If in a guild, use the guild's assigned color!
            const guildObj = tile?.guildId ? guilds[tile.guildId] : null;
            const tileBgColor = guildObj?.color
              ? guildObj.color
              : playerColor
              ? isMyTileOnMap
                ? `${playerColor}ee`
                : isAllyGuildTile
                ? `${playerColor}88`
                : `${playerColor}55`
              : isChest
              ? '#78350f'
              : isOutpost
              ? '#064e3b'
              : tile?.type === 'boss'
              ? '#b91c1c'
              : '#0f172a';

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
                    ? isClaimedChest
                      ? '2.5px solid #fbbf24'
                      : isOutpost
                      ? '2.5px solid #34d399'
                      : '2px solid #ffffff'
                    : isAllyGuildTile
                    ? '2px solid #fbbf24' // Gold border for Guild Allies!
                    : guildObj?.color
                    ? `1.5px solid ${guildObj.color}`
                    : playerColor
                    ? `1.5px solid ${playerColor}`
                    : isChest
                    ? '2px solid #fbbf24'
                    : isOutpost
                    ? '2px solid #10b981'
                    : !hasBase && isSelected
                    ? '2px solid #10b981'
                    : hasBase && isAttackable
                    ? '1.5px dashed #22c55e'
                    : tile?.type === 'boss'
                    ? '1.5px solid #f87171'
                    : '1px solid #1e293b',
                  boxShadow: isChest
                    ? '0 0 12px rgba(245,158,11,0.7)'
                    : isOutpost
                    ? '0 0 12px rgba(16,185,129,0.7)'
                    : isMyTileOnMap
                    ? `0 0 10px rgba(255,255,255,0.7)`
                    : isAllyGuildTile
                    ? `0 0 8px rgba(251,191,36,0.6)`
                    : guildObj?.color
                    ? `0 0 6px ${guildObj.color}50`
                    : playerColor
                    ? `0 0 6px ${playerColor}40`
                    : !hasBase && isSelected
                    ? '0 0 12px rgba(16,185,129,0.8)'
                    : hasBase && isAttackable
                    ? '0 0 6px rgba(34,197,94,0.45)'
                    : undefined,
                }}
              >
                {/* Attackable Reach Indicator Dot (Only when player already has a base) */}
                {hasBase && isAttackable && !isMyTileOnMap && !isChest && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse pointer-events-none" />
                )}

                {/* Chest Icon */}
                {isChest && (
                  <div className="w-full h-full p-1 flex items-center justify-center text-amber-300 relative">
                    <Gift className="w-full h-full animate-bounce" />
                    {!isAttackable && (
                      <div className="absolute inset-0 bg-slate-950/60 rounded flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                    )}
                  </div>
                )}

                {/* Outpost Icon (Unclaimed or Claimed) */}
                {isOutpost && !tile?.ownerFamily && (
                  <div className="w-full h-full p-1 flex items-center justify-center text-emerald-300">
                    <Radio className="w-full h-full animate-pulse text-emerald-400" />
                  </div>
                )}

                {/* Boss Icon */}
                {tile?.type === 'boss' && (
                  <div className="w-full h-full p-0.5 flex items-center justify-center text-white">
                    <SVGVirus type={tile.ownerFamily as any || 'corona'} className="w-full h-full" />
                  </div>
                )}

                {/* Player Icon */}
                {tile?.type === 'player' && tile.ownerFamily && (
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

      {/* 3. Guild / Alliance Modal */}
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

                    {/* 2. Guild Color Selector (Leader can pick color, members see it) */}
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
                          ดินแดนทั้งหมดของกิลด์จะเปล่งแสงเป็นสีนี้บนแผนที่ขนาด 30×30 เพื่อแสดงอาณาเขตพันธมิตร
                        </div>
                      )}
                    </div>

                    {/* 3. Guild Members List */}
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

    </div>
  );
}
