"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, setDoc, doc } from 'firebase/firestore';
import { EmpireTile } from '@/types';
import { SVGVirus } from '@/components/ui/SVGVirus';
import { Loader2, Crosshair, Map, Shield, Swords, Info, AlertTriangle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MAP_SIZE = 20;

// Generate a color based on UID
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Terrain background for empty tiles based on position
const getTerrainStyle = (x: number, y: number): React.CSSProperties => {
  const seed = (x * 7 + y * 13) % 5;
  const terrains: React.CSSProperties[] = [
    { background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' },
    { background: 'linear-gradient(135deg, #0c1a2e 0%, #162032 100%)' },
    { background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' },
    { background: 'linear-gradient(135deg, #0a1628 0%, #152030 100%)' },
    { background: 'linear-gradient(135deg, #0d1b2a 0%, #1a2540 100%)' },
  ];
  return terrains[seed];
};

// Calculate territory borders for player tiles
const getTerritoryBorders = (
  tile: EmpireTile | undefined,
  x: number,
  y: number,
  tiles: Record<string, EmpireTile>
): React.CSSProperties => {
  if (!tile || tile.type !== 'player') return {};
  const color = tile.color || stringToColor(tile.ownerUid || '');
  const bw = '3px';
  const sameOwner = (nx: number, ny: number) =>
    tiles[`${nx},${ny}`]?.ownerUid === tile.ownerUid;
  return {
    borderTop:    sameOwner(x, y - 1) ? '1px solid transparent' : `${bw} solid ${color}`,
    borderBottom: sameOwner(x, y + 1) ? '1px solid transparent' : `${bw} solid ${color}`,
    borderLeft:   sameOwner(x - 1, y) ? '1px solid transparent' : `${bw} solid ${color}`,
    borderRight:  sameOwner(x + 1, y) ? '1px solid transparent' : `${bw} solid ${color}`,
  };
};

export default function EmpireMap() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [tiles, setTiles] = useState<Record<string, EmpireTile>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTile, setSelectedTile] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    if (!appUser) return;

    // Check if user has pet
    if ((appUser.exp || 0) < 1000) {
      router.push('/student');
      return;
    }

    const q = query(collection(db, 'empire_tiles'));
    const unsub = onSnapshot(q, (snap) => {
      const newTiles: Record<string, EmpireTile> = {};
      let bossCount = 0;
      snap.forEach(d => {
        const t = d.data() as EmpireTile;
        newTiles[d.id] = t;
        if (t.type === 'boss') bossCount++;
      });
      setTiles(newTiles);
      setLoading(false);

      // Auto-spawn bosses if needed
      if (bossCount < 10) {
        spawnBosses(10 - bossCount, newTiles);
      }
    });

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser, router]);

  const spawnBosses = async (count: number, currentTiles: Record<string, EmpireTile>) => {
    const families = ['rabies', 'corona', 'parvo', 'herpes', 'pox'];
    let spawned = 0;
    for (let i = 0; i < 50; i++) {
      if (spawned >= count) break;
      const x = Math.floor(Math.random() * MAP_SIZE);
      const y = Math.floor(Math.random() * MAP_SIZE);
      const id = `${x},${y}`;
      if (!currentTiles[id]) {
        const family = families[Math.floor(Math.random() * families.length)];
        const tileRef = doc(db, 'empire_tiles', id);
        const newBoss: EmpireTile = { id, x, y, type: 'boss', ownerFamily: family };
        setDoc(tileRef, newBoss);
        currentTiles[id] = newBoss; // prevent dupes in same loop
        spawned++;
      }
    }
  };

  const handleInfect = () => {
    if (!selectedTile || !canInfect) return;
    const tileId = `${selectedTile.x},${selectedTile.y}`;
    // Navigate to battle page with tileId
    router.push(`/student/empire/battle?tile=${tileId}`);
  };

  const activeTileData = selectedTile ? tiles[`${selectedTile.x},${selectedTile.y}`] : null;
  const isMyTile = activeTileData?.ownerUid === appUser?.uid;

  // Adjacency Check
  const checkAdjacency = () => {
    if (!selectedTile || !appUser) return false;
    const myTiles = Object.values(tiles).filter(t => t.ownerUid === appUser.uid);
    if (myTiles.length === 0) return true; // First tile can be anywhere
    const { x, y } = selectedTile;
    // 4-way adjacency
    return myTiles.some(t => Math.abs(t.x - x) + Math.abs(t.y - y) === 1);
  };
  const canInfect = checkAdjacency();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative overflow-hidden bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-cyan-400 uppercase tracking-widest text-glow flex items-center gap-3">
              <Map className="w-8 h-8" />
              เขตการติดเชื้อ
            </h1>
            <p className="text-slate-400 font-mono mt-1">ยึดครองเซลล์และขยายอาณาจักรไวรัสของคุณ</p>
          </div>
          <Link href="/student">
            <Button variant="secondary" className="font-black uppercase tracking-widest">
              กลับหน้าหลัก
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          
          {/* Map Area */}
          <div className="lg:col-span-2 glass rounded-3xl p-4 border-slate-700/50 relative overflow-hidden">
            {/* Legend */}
            <div className="flex items-center gap-4 mb-3 px-2 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700" />
                <span>ว่าง</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-purple-600/70 border border-purple-400" />
                <span>ผู้เล่น</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-red-700 border border-red-400 animate-pulse" />
                <span>บอส ⚠️</span>
              </div>
              {appUser?.pet?.family && (
                <div className="ml-auto flex items-center gap-1.5 text-cyan-400">
                  <div className="w-3 h-3 rounded-sm border-2 border-cyan-400" />
                  <span>อาณาเขตของคุณ</span>
                </div>
              )}
            </div>

            <div className="overflow-auto custom-scrollbar h-[580px] w-full rounded-2xl bg-slate-950 border border-slate-800/80 shadow-inner">
              <div
                className="relative p-3 w-max"
                style={{ display: 'grid', gridTemplateColumns: `repeat(${MAP_SIZE}, 1fr)`, gap: '2px' }}
              >
                {Array.from({ length: MAP_SIZE * MAP_SIZE }).map((_, i) => {
                  const x = i % MAP_SIZE;
                  const y = Math.floor(i / MAP_SIZE);
                  const id = `${x},${y}`;
                  const tile = tiles[id];
                  const isSelected = selectedTile?.x === x && selectedTile?.y === y;
                  const isMyTileOnMap = tile?.ownerUid === appUser?.uid;
                  const tileColor = tile?.type === 'player' ? (tile.color || stringToColor(tile.ownerUid!)) : undefined;
                  const territoryBorders = getTerritoryBorders(tile, x, y, tiles);

                  return (
                    <motion.div
                      key={id}
                      whileHover={{ scale: 1.15, zIndex: 20 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => setSelectedTile({ x, y })}
                      className="relative cursor-pointer rounded-sm overflow-hidden"
                      style={{
                        width: 44,
                        height: 44,
                        ...(!tile ? getTerrainStyle(x, y) : {}),
                        ...(tileColor ? {
                          backgroundColor: tileColor,
                          boxShadow: isMyTileOnMap
                            ? `0 0 12px ${tileColor}, 0 0 4px ${tileColor}`
                            : `0 0 6px ${tileColor}60`,
                        } : {}),
                        ...(tile?.type === 'boss' ? {
                          background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)',
                          boxShadow: '0 0 14px rgba(239,68,68,0.7), 0 0 4px rgba(239,68,68,0.4)',
                        } : {}),
                        ...(isSelected ? {
                          outline: '2px solid white',
                          outlineOffset: '1px',
                          zIndex: 30,
                          boxShadow: '0 0 20px rgba(255,255,255,0.6)',
                        } : {}),
                        ...territoryBorders,
                      }}
                    >
                      {/* Empty tile subtle grid dot */}
                      {!tile && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-20">
                          <div className="w-1 h-1 rounded-full bg-slate-600" />
                        </div>
                      )}

                      {/* Boss tile */}
                      {tile?.type === 'boss' && (
                        <motion.div
                          className="w-full h-full p-1.5 flex items-center justify-center"
                          animate={{ opacity: [0.7, 1, 0.7], scale: [0.92, 1, 0.92] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <SVGVirus
                            type={tile.ownerFamily as any}
                            className="w-full h-full text-white drop-shadow-[0_0_8px_rgba(255,100,100,1)]"
                          />
                        </motion.div>
                      )}

                      {/* Player tile */}
                      {tile?.type === 'player' && tile.ownerFamily && (
                        <motion.div
                          className="w-full h-full p-1.5 flex items-center justify-center bg-black/20"
                          animate={isMyTileOnMap ? { opacity: [0.8, 1, 0.8] } : {}}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <SVGVirus
                            type={tile.ownerFamily as any}
                            className="w-full h-full drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]"
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedTile ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="glass p-6 border-slate-700/50 backdrop-blur-md sticky top-24">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest border-b border-slate-700 pb-4 mb-4 flex items-center justify-between">
                      เซกเตอร์ [{selectedTile.x}, {selectedTile.y}]
                      {isMyTile && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md">ของคุณ</span>}
                    </h3>
                    
                    {!activeTileData && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-300">
                          <Info className="text-cyan-400" />
                          <span>เซลล์ว่างเปล่า (ยังไม่มีเจ้าของ)</span>
                        </div>
                        <p className="text-sm text-slate-400">
                          เซลล์อ่อนแอที่พร้อมถูกบุกรุก ยึดครองเซกเตอร์นี้เพื่อขยายอาณาจักร
                        </p>
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-sm font-mono text-slate-400 flex justify-between">
                          <span>ความแข็งแกร่งการป้องกัน:</span>
                          <span className="text-white">ต่ำมาก</span>
                        </div>
                        {!canInfect && (
                          <div className="text-xs text-orange-400 bg-orange-900/20 p-2 rounded-lg flex items-center gap-2">
                            <Lock className="w-4 h-4" /> ต้องครองเซกเตอร์ที่ติดกันก่อนถึงจะรุกรานที่นี่ได้
                          </div>
                        )}
                        <Button 
                          onClick={handleInfect}
                          disabled={!canInfect}
                          className={`w-full mt-4 font-black py-4 uppercase tracking-widest ${canInfect ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-slate-800 text-slate-500'}`}
                        >
                          <Crosshair className="w-5 h-5 mr-2" />
                          บุกรุกเซกเตอร์
                        </Button>
                      </div>
                    )}

                    {activeTileData?.type === 'player' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-300">
                          <Shield className="text-purple-400" />
                          <span>ครอบครองโดย:</span>
                        </div>
                        <div className="text-2xl font-black text-white" style={{ color: activeTileData.color || stringToColor(activeTileData.ownerUid!) }}>
                          {activeTileData.ownerName}
                        </div>
                        <p className="text-sm text-slate-400">
                          ป้องกันโดยไวรัส {activeTileData.ownerFamily}
                        </p>
                        
                        {!isMyTile && (
                          <>
                            {!canInfect && (
                              <div className="text-xs text-orange-400 bg-orange-900/20 p-2 rounded-lg flex items-center gap-2">
                                <Lock className="w-4 h-4" /> ต้องครองเซกเตอร์ที่ติดกันก่อนถึงจะโจมตีได้
                              </div>
                            )}
                            <Button 
                              onClick={handleInfect}
                              disabled={!canInfect}
                              className={`w-full mt-4 font-black py-4 uppercase tracking-widest ${canInfect ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-slate-800 text-slate-500'}`}
                            >
                              <Swords className="w-5 h-5 mr-2" />
                              โจมตีเซกเตอร์
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {activeTileData?.type === 'boss' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-red-400">
                          <AlertTriangle className="text-red-500" />
                          <span className="font-black uppercase">บอส — ระบบภูมิคุ้มกัน</span>
                        </div>
                        <p className="text-sm text-slate-400">
                          เป้าหมายมูลค่าสูง มี EXP รางวัลมหาศาล ตีชนะแล้วได้รับ +500 EXP!
                        </p>
                        <div className="bg-red-900/20 p-3 rounded-xl border border-red-900/50 text-sm font-mono text-slate-400 flex justify-between">
                          <span>ความแข็งแกร่งการป้องกัน:</span>
                          <span className="text-red-400 font-bold">สุดขีด ⚠️</span>
                        </div>
                        {!canInfect && (
                          <div className="text-xs text-orange-400 bg-orange-900/20 p-2 rounded-lg flex items-center gap-2">
                            <Lock className="w-4 h-4" /> ต้องครองเซกเตอร์ที่ติดกันก่อนถึงจะสู้บอสได้
                          </div>
                        )}
                        <Button 
                          onClick={handleInfect}
                          disabled={!canInfect}
                          className={`w-full mt-4 font-black py-4 uppercase tracking-widest ${canInfect ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-slate-800 text-slate-500'}`}
                        >
                          <Swords className="w-5 h-5 mr-2" />
                          สู้กับบอส
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center p-6 text-center text-slate-500 font-mono"
                >
                  <p>กดเลือกเซกเตอร์บนแผนที่เพื่อดูรายละเอียด หรือเริ่มการบุกรุก</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
