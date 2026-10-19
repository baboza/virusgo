"use client";

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MapControls, Float, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { EmpireTile, Guild } from '@/types';
import { MAP_SIZE, isSanctuaryZone, isCentralVaultZone, getPlayerUniqueColor } from '@/lib/empireConstants';
import { familyToVirusType } from '@/components/ui/SVGVirus';

// ── Hexagonal Grid Math & Constants (Pointy-Topped, Civilization Style) ──
export const HEX_RADIUS = 0.58;
export const HEX_GAP = 0.02; // Minimal clean gap between tiles
export const HEX_MESH_RADIUS = HEX_RADIUS - HEX_GAP; // ~0.56
export const HEX_STEP_X = Math.sqrt(3) * HEX_RADIUS; // ~1.00459
export const HEX_STEP_Z = 1.5 * HEX_RADIUS; // 0.87000
export const TOTAL_GRID_WIDTH = (MAP_SIZE - 1 + 0.5) * HEX_STEP_X; // ~49.73
export const TOTAL_GRID_HEIGHT = (MAP_SIZE - 1) * HEX_STEP_Z; // ~42.63

/**
 * Calculates world coordinates for a given (x, y) grid tile
 */
export function getHexWorldPos(
  x: number, 
  y: number, 
  elevation = 0
): { worldX: number; worldY: number; worldZ: number } {
  const rowOffset = (Math.round(y) % 2 === 1) ? 0.5 * HEX_STEP_X : 0;
  const worldX = (x * HEX_STEP_X + rowOffset) - TOTAL_GRID_WIDTH / 2;
  const worldZ = (y * HEX_STEP_Z) - TOTAL_GRID_HEIGHT / 2;
  return { worldX, worldY: elevation, worldZ };
}

/**
 * Pure math O(1) converter: converts world (wx, wz) to grid (x, y)
 * Zero raycasting against geometry = 100% fluid 60-144 FPS
 */
export function worldToHexCoord(wx: number, wz: number): { x: number; y: number } | null {
  const shiftedZ = wz + TOTAL_GRID_HEIGHT / 2;
  const rawY = Math.round(shiftedZ / HEX_STEP_Z);
  const y = Math.max(0, Math.min(MAP_SIZE - 1, rawY));

  const rowOffset = (y % 2 === 1) ? 0.5 * HEX_STEP_X : 0;
  const shiftedX = wx + TOTAL_GRID_WIDTH / 2 - rowOffset;
  const rawX = Math.round(shiftedX / HEX_STEP_X);
  const x = Math.max(0, Math.min(MAP_SIZE - 1, rawX));

  // Test candidate and 6 adjacent neighbors for the exact closest center
  let bestX = x;
  let bestY = y;
  let bestDistSq = Infinity;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
        const { worldX: cx, worldZ: cz } = getHexWorldPos(nx, ny);
        const dSq = (wx - cx) * (wx - cx) + (wz - cz) * (wz - cz);
        if (dSq < bestDistSq) {
          bestDistSq = dSq;
          bestX = nx;
          bestY = ny;
        }
      }
    }
  }

  if (bestDistSq > HEX_STEP_X * HEX_STEP_X * 1.5) return null;
  return { x: bestX, y: bestY };
}

export interface MarchOrder {
  fromCoord: string;
  toCoord: string;
  petFamily?: string;
  ownerName?: string;
  onArrival: () => void;
}

interface EmpireCanvas3DProps {
  tiles: Record<string, EmpireTile>;
  guilds: Record<string, Guild>;
  exploredTiles: Set<string>;
  myUid?: string;
  myGuildId?: string;
  selectedCoord: string | null;
  onSelectCoord: (coord: string) => void;
  targetFocus: { x: number; y: number } | null;
  cameraMode: 'iso' | 'top';
  isGmUser?: boolean;
  petCoord?: string | null;
  petFamily?: string;
  ownerName?: string;
  marchOrder?: MarchOrder | null;
}

const tempColor = new THREE.Color();
const tempMatrix = new THREE.Matrix4();
const tempPosition = new THREE.Vector3();
const tempScale = new THREE.Vector3();
const IDENTITY_QUAT = new THREE.Quaternion(); // Permanently (0,0,0,1) for ground hexes
const DECAL_ROTATION_QUAT = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

// ── 3D Landmark: Sleek Low-Profile Boss Virus ───────────────────────
function BossVirusMesh({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.7;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={position}>
        <group ref={meshRef}>
          <mesh>
            <icosahedronGeometry args={[0.28, 1]} />
            <meshStandardMaterial 
              color="#ef4444" 
              emissive="#991b1b" 
              emissiveIntensity={0.9} 
              roughness={0.2} 
              metalness={0.6} 
            />
          </mesh>
        </group>
        <Billboard position={[0, 0.45, 0]}>
          <Text
            fontSize={0.12}
            color="#fca5a5"
            outlineWidth={0.02}
            outlineColor="#000000"
            anchorX="center"
            anchorY="middle"
          >
            👾 บอสไวรัส
          </Text>
        </Billboard>
      </group>
    </Float>
  );
}

// ── 3D Landmark: Grand Guild Capital Citadel (HQ-Style Castle Landmark) ─────
function GuildCitadelMesh({ 
  position, 
  color, 
  guildName 
}: { 
  position: [number, number, number]; 
  color: string; 
  guildName?: string;
}) {
  const castleRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (castleRef.current) {
      castleRef.current.rotation.y += delta * 0.5;
      castleRef.current.position.y = 0.40 + Math.sin(state.clock.elapsedTime * 2.0) * 0.03;
    }
  });

  return (
    <group position={position}>
      {/* 1. Solid High-Tech Raised Hexagonal Pedestal (HQ Style) */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.36, 0.44, 0.08, 6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 2. Glowing Neon Guild Energy Ring */}
      <mesh position={[0, 0.082, 0]}>
        <cylinderGeometry args={[0.32, 0.34, 0.02, 6]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={1.4} 
          roughness={0.2} 
        />
      </mesh>

      {/* 3. Holographic Vertical Beacon Light Beam */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.08, 0.22, 1.0, 12, 1, true]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.35} 
          side={THREE.DoubleSide} 
          depthWrite={false} 
        />
      </mesh>

      {/* 4. Majestic 3D Castle Mascot (HQ Mascot Style) */}
      <group ref={castleRef} position={[0, 0.40, 0]} scale={1.4}>
        {/* Central Castle Keep Tower */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.20, 0.30, 6]} />
          <meshStandardMaterial 
            color="#1e293b" 
            roughness={0.25} 
            metalness={0.7} 
          />
        </mesh>
        {/* Castle Crown Battlements */}
        <mesh position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.22, 0.18, 0.08, 6]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={0.8} 
            roughness={0.2} 
            metalness={0.5} 
          />
        </mesh>
        {/* Golden Central Imperial Spire */}
        <mesh position={[0, 0.28, 0]}>
          <coneGeometry args={[0.12, 0.22, 6]} />
          <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#f59e0b" 
            emissiveIntensity={0.9} 
            metalness={0.8} 
            roughness={0.2} 
          />
        </mesh>
      </group>

      {/* 5. Floating Guild Name Billboard */}
      <Billboard position={[0, 0.95, 0]}>
        <Text
          fontSize={0.16}
          color="#fef08a"
          outlineWidth={0.03}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {`🏰 ${guildName || 'นครหลวงกิลด์'}`}
        </Text>
      </Billboard>
    </group>
  );
}

// ── 3D Landmark: Defense Structures (HQ-Style Compact Landmarks) ─────
function DefenseStructureMesh({
  position,
  buildingType,
  color = '#06b6d4',
  isMine = false,
}: {
  position: [number, number, number];
  buildingType?: 'bio_wall' | 'spike_wall' | 'sentry_tower' | 'regen_depot';
  color?: string;
  isMine?: boolean;
}) {
  const iconRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (iconRef.current) {
      if (buildingType === 'sentry_tower') {
        iconRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.7;
      } else {
        iconRef.current.rotation.y += delta * 0.6;
      }
    }
  });

  const label = useMemo(() => {
    if (buildingType === 'sentry_tower') return '🏹 ป้อมยิง';
    if (buildingType === 'spike_wall') return '🧱 กำแพงหนาม';
    if (buildingType === 'regen_depot') return '💚 ฟื้นฟู';
    return '🛡️ กำแพง';
  }, [buildingType]);

  return (
    <group position={position}>
      {/* 1. Compact Hexagonal Pedestal (HQ Style) */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.06, 6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 2. Glowing Energy Trim Ring */}
      <mesh position={[0, 0.062, 0]}>
        <cylinderGeometry args={[0.19, 0.20, 0.015, 6]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={1.0} 
          roughness={0.2} 
        />
      </mesh>

      {/* 3. Sleek HQ-Style Structure Mascot Model */}
      <group ref={iconRef} position={[0, 0.20, 0]} scale={1.1}>
        {/* SENTRY TOWER: Compact Rotating Dual-Cannon Turret */}
        {buildingType === 'sentry_tower' && (
          <group>
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.10, 0.13, 0.16, 6]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.10, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.05, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
            </mesh>
            {/* Dual mini barrels */}
            <mesh position={[-0.04, 0.10, 0.10]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.022, 0.14, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} />
            </mesh>
            <mesh position={[0.04, 0.10, 0.10]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.018, 0.022, 0.14, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.9} />
            </mesh>
          </group>
        )}

        {/* BIO-WALL: Compact Defensive Shield Rampart */}
        {buildingType === 'bio_wall' && (
          <group>
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.14, 0.16, 0.14, 6]} />
              <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.6} />
            </mesh>
            {/* Energy Shield Crest */}
            <mesh position={[0, 0.10, 0]}>
              <cylinderGeometry args={[0.16, 0.14, 0.06, 6]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.0} />
            </mesh>
          </group>
        )}

        {/* SPIKE WALL: Spiked Fortified Rampart */}
        {buildingType === 'spike_wall' && (
          <group>
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.14, 0.16, 0.14, 6]} />
              <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* 3 Golden Spikes */}
            {[-0.08, 0, 0.08].map((sx, i) => (
              <mesh key={i} position={[sx, 0.14, 0]}>
                <coneGeometry args={[0.035, 0.14, 5]} />
                <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} />
              </mesh>
            ))}
          </group>
        )}

        {/* REGEN DEPOT: Glowing Emerald Healing Vat */}
        {buildingType === 'regen_depot' && (
          <group>
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.11, 0.14, 0.14, 8]} />
              <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
            </mesh>
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.09, 10, 10]} />
              <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={1.4} />
            </mesh>
          </group>
        )}
      </group>

      {/* 4. Compact Billboard Label */}
      <Billboard position={[0, 0.48, 0]}>
        <Text
          fontSize={0.11}
          color="#f1f5f9"
          outlineWidth={0.02}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      </Billboard>
    </group>
  );
}

// ── 2D-on-3D Instanced Virus Decal System (Classic Version Clarity + 60-144 FPS) ──
export type DecalArchetype = 'parvo' | 'corona' | 'rabies' | 'retro';

export function familyToDecalArchetype(family?: string): DecalArchetype {
  const vType = familyToVirusType(family || 'parvo');
  if (vType === 'rabies') return 'rabies';
  if (vType === 'corona' || vType === 'orthomyxo' || vType === 'asfar') return 'corona';
  if (vType === 'parvo' || vType === 'picorna' || vType === 'birna') return 'parvo';
  return 'retro';
}

let cachedDecalTextures: Record<DecalArchetype, THREE.CanvasTexture> | null = null;

function createVirusDecalTexture(type: DecalArchetype): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as any);
  }
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (type === 'parvo') {
    // ── 1. Parvo / Icosahedral: Faceted Hexagonal Gem with Inner Geometric Lines ──
    const r = 38;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 6;
      const x = cx + r * Math.cos(a);
      const y = cy + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.globalAlpha = 0.88;
    ctx.fill();

    // Internal facet lines
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 - Math.PI / 6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      ctx.stroke();
    }
    // Inner diamond core
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();

  } else if (type === 'corona') {
    // ── 2. Corona / Orthomyxo: Spherical Core + Radiating Club Spikes ──
    const coreR = 24;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
    ctx.fill();

    // Radiating spikes with club heads
    const numSpikes = 10;
    const spikeLen = 46;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    for (let i = 0; i < numSpikes; i++) {
      const a = (i * 2 * Math.PI) / numSpikes;
      const x1 = cx + coreR * Math.cos(a);
      const y1 = cy + coreR * Math.sin(a);
      const x2 = cx + (spikeLen - 4) * Math.cos(a);
      const y2 = cy + (spikeLen - 4) * Math.sin(a);
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Club ball at tip
      const bx = cx + spikeLen * Math.cos(a);
      const by = cy + spikeLen * Math.sin(a);
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner detail ring
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();

  } else if (type === 'rabies') {
    // ── 3. Rabies: Bullet / Bacilliform Capsule with Ribs ──
    ctx.globalAlpha = 0.9;
    const w = 36;
    const h = 62;
    const top = cy - h / 2;
    const bottom = cy + h / 2;
    const left = cx - w / 2;
    const right = cx + w / 2;

    ctx.beginPath();
    ctx.moveTo(left, top + w / 2);
    ctx.arc(cx, top + w / 2, w / 2, Math.PI, 0);
    ctx.lineTo(right, bottom - 6);
    ctx.arcTo(right, bottom, cx, bottom, 6);
    ctx.arcTo(left, bottom, left, bottom - 6, 6);
    ctx.closePath();
    ctx.fill();

    // Internal helix/rib stripes
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5;
    for (let y = top + 22; y < bottom - 8; y += 10) {
      ctx.beginPath();
      ctx.moveTo(left + 5, y);
      ctx.lineTo(right - 5, y);
      ctx.stroke();
    }

  } else {
    // ── 4. Retro / Flavi / Arteri / Reo: Double Ring Envelope + Knobs ──
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();

    // Outer concentric ring
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.stroke();

    // 8 Knobs around the ring
    for (let i = 0; i < 8; i++) {
      const a = (i * 2 * Math.PI) / 8;
      const kx = cx + 44 * Math.cos(a);
      const ky = cy + 44 * Math.sin(a);
      ctx.beginPath();
      ctx.arc(kx, ky, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Inner core cut
    ctx.fillStyle = '#0f172a';
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function getVirusDecalTextures(): Record<DecalArchetype, THREE.CanvasTexture> {
  if (cachedDecalTextures) return cachedDecalTextures;
  cachedDecalTextures = {
    parvo: createVirusDecalTexture('parvo'),
    corona: createVirusDecalTexture('corona'),
    rabies: createVirusDecalTexture('rabies'),
    retro: createVirusDecalTexture('retro'),
  };
  return cachedDecalTextures;
}

function VirusArchetypeDecalMesh({
  texture,
  items,
}: {
  texture: THREE.CanvasTexture;
  items: { x: number; y: number; topY: number; isMine: boolean; color: string }[];
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!meshRef.current) return;
    items.forEach((item, idx) => {
      const { worldX, worldZ } = getHexWorldPos(item.x, item.y);
      tempPosition.set(worldX, item.topY + 0.003, worldZ);
      const s = item.isMine ? 1.08 : 0.96;
      tempScale.set(s, s, 1);
      tempMatrix.compose(tempPosition, DECAL_ROTATION_QUAT, tempScale);
      meshRef.current!.setMatrixAt(idx, tempMatrix);
      tempColor.set(item.color);
      meshRef.current!.setColorAt(idx, tempColor);
    });
    meshRef.current.count = items.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [items]);

  const maxInstances = MAP_SIZE * MAP_SIZE;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined as any, undefined as any, maxInstances]}
      frustumCulled={false}
    >
      <planeGeometry args={[HEX_MESH_RADIUS * 0.92, HEX_MESH_RADIUS * 0.92]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.88}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
}

function HexInstancedVirusDecals({
  tiles,
  exploredTiles,
  myUid,
  isGmUser,
}: {
  tiles: Record<string, EmpireTile>;
  exploredTiles: Set<string>;
  myUid?: string;
  isGmUser?: boolean;
}) {
  const textures = useMemo(() => getVirusDecalTextures(), []);

  const grouped = useMemo(() => {
    const map: Record<DecalArchetype, { x: number; y: number; topY: number; isMine: boolean; color: string }[]> = {
      parvo: [],
      corona: [],
      rabies: [],
      retro: [],
    };

    Object.values(tiles).forEach((t) => {
      const coord = `${t.x},${t.y}`;
      if (!isGmUser && !exploredTiles.has(coord)) return;
      if (t.type !== 'player' || !t.ownerUid || t.isCitadel) return;

      const isMine = Boolean(myUid && t.ownerUid === myUid);

      // Top surface of the cylinder in HexInstancedBoard:
      // isMine: 0.12/2 + 0.12*1.5/2 = 0.150
      // other with guild: 0.10/2 + 0.12*1.3/2 = 0.128
      // other without guild: 0.09/2 + 0.12*1.2/2 = 0.117
      const topY = isMine ? 0.150 : (t.guildId ? 0.128 : 0.117);

      const archetype = familyToDecalArchetype(t.ownerFamily);
      const color = isMine ? '#38bdf8' : '#ffffff';

      map[archetype].push({
        x: t.x,
        y: t.y,
        topY,
        isMine,
        color,
      });
    });

    return map;
  }, [tiles, exploredTiles, myUid, isGmUser]);

  return (
    <group>
      <VirusArchetypeDecalMesh texture={textures.parvo} items={grouped.parvo} />
      <VirusArchetypeDecalMesh texture={textures.corona} items={grouped.corona} />
      <VirusArchetypeDecalMesh texture={textures.rabies} items={grouped.rabies} />
      <VirusArchetypeDecalMesh texture={textures.retro} items={grouped.retro} />
    </group>
  );
}

// ── Virus Hero 3D Geometry (Shared between HQ Base & Marching Hero) ──
export function VirusHero3DGeometry({
  virusType,
  color,
  hasCrown = true,
  isMine = true,
}: {
  virusType: string;
  color: string;
  hasCrown?: boolean;
  isMine?: boolean;
}) {
  return (
    <group>
      {/* Rabies Bullet */}
      {virusType === 'rabies' && (
        <mesh>
          <capsuleGeometry args={[0.10, 0.18, 10, 16]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={isMine ? 0.85 : 0.55} 
            roughness={0.25} 
            metalness={0.4} 
          />
        </mesh>
      )}

      {/* Parvo / Picorna / Birna (Icosahedron) */}
      {(virusType === 'parvo' || virusType === 'picorna' || virusType === 'birna') && (
        <group>
          <mesh>
            <icosahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={isMine ? 0.85 : 0.55} 
              roughness={0.2} 
              metalness={0.5} 
              flatShading 
            />
          </mesh>
          <mesh>
            <icosahedronGeometry args={[0.168, 0]} />
            <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.35} />
          </mesh>
        </group>
      )}

      {/* Corona / Retro / Orthomyxo (Spiked Sphere with 3D Spike Rods) */}
      {virusType !== 'rabies' && virusType !== 'parvo' && virusType !== 'picorna' && virusType !== 'birna' && (
        <group>
          <mesh>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={isMine ? 0.85 : 0.55} 
              roughness={0.25} 
              metalness={0.35} 
            />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.024, 0.34, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.018, 0.024, 0.34, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.024, 0.34, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
          </mesh>
          <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
            <cylinderGeometry args={[0.016, 0.022, 0.32, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
          </mesh>
          <mesh rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
            <cylinderGeometry args={[0.016, 0.022, 0.32, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
          </mesh>
        </group>
      )}

      {/* Golden Crown on Player's Personal Base */}
      {hasCrown && (
        <group position={[0, 0.22, 0]}>
          <mesh>
            <cylinderGeometry args={[0.09, 0.05, 0.07, 5]} />
            <meshStandardMaterial 
              color="#f59e0b" 
              emissive="#d97706" 
              emissiveIntensity={0.9} 
              metalness={0.9} 
              roughness={0.2} 
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ── Hex Grid Coordinate Helpers for Marching (Pointy-Topped, odd-r) ──
function offsetToCube(col: number, row: number) {
  const q = col - (row - (row & 1)) / 2;
  const r = row;
  return { q, r, s: -q - r };
}

function cubeToOffset(q: number, r: number) {
  const col = q + (r - (r & 1)) / 2;
  const row = r;
  return { x: col, y: row };
}

function cubeRound(cube: { q: number; r: number; s: number }) {
  let q = Math.round(cube.q);
  let r = Math.round(cube.r);
  let s = Math.round(cube.s);
  const qDiff = Math.abs(q - cube.q);
  const rDiff = Math.abs(r - cube.r);
  const sDiff = Math.abs(s - cube.s);
  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  } else {
    s = -q - r;
  }
  return { q, r, s };
}

export function getHexPathWaypoints(from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number }[] {
  const a = offsetToCube(from.x, from.y);
  const b = offsetToCube(to.x, to.y);
  const dist = Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.s - b.s));
  if (dist === 0) return [from];
  const list: { x: number; y: number }[] = [];
  for (let i = 0; i <= dist; i++) {
    const t = i / dist;
    const q = a.q + (b.q - a.q) * t;
    const r = a.r + (b.r - a.r) * t;
    const s = a.s + (b.s - a.s) * t;
    const rounded = cubeRound({ q, r, s });
    const offset = cubeToOffset(rounded.q, rounded.r);
    const clampedX = Math.max(0, Math.min(MAP_SIZE - 1, offset.x));
    const clampedY = Math.max(0, Math.min(MAP_SIZE - 1, offset.y));
    list.push({ x: clampedX, y: clampedY });
  }
  return list;
}

// ── March Trajectory Path (Glow line + Waypoint Dots) ────────────────
function MarchTrajectoryPath({ waypoints }: { waypoints: { worldX: number; worldZ: number }[] }) {
  const lineObj = useMemo(() => {
    const points = waypoints.map(w => new THREE.Vector3(w.worldX, 0.17, w.worldZ));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      linewidth: 3,
      transparent: true,
      opacity: 0.85,
    });
    return new THREE.Line(geometry, material);
  }, [waypoints]);

  return (
    <group>
      {/* Continuous glowing trajectory line */}
      <primitive object={lineObj} />

      {/* Dotted waypoint markers at each hex center along the path */}
      {waypoints.map((wp, idx) => {
        const isDestination = idx === waypoints.length - 1;
        const isOrigin = idx === 0;
        return (
          <group key={idx} position={[wp.worldX, 0.165, wp.worldZ]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[isDestination ? 0.22 : 0.08, isDestination ? 0.32 : 0.14, 16]} />
              <meshBasicMaterial 
                color={isDestination ? '#ef4444' : isOrigin ? '#38bdf8' : '#22d3ee'} 
                transparent 
                opacity={isDestination ? 0.9 : 0.6}
                side={THREE.DoubleSide}
              />
            </mesh>
            {isDestination && (
              <Billboard position={[0, 0.35, 0]}>
                <Text
                  fontSize={0.14}
                  color="#ef4444"
                  outlineWidth={0.03}
                  outlineColor="#000000"
                  anchorX="center"
                  anchorY="middle"
                >
                  🎯 เป้าหมายโจมตี
                </Text>
              </Billboard>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ── 3D Marching Hero Virus (HoMM Travel Animation) ───────────────────
function HeroVirusMarcher({
  fromCoord,
  toCoord,
  petFamily,
  ownerName,
  onArrival,
  onPositionUpdate,
}: {
  fromCoord: string;
  toCoord: string;
  petFamily?: string;
  ownerName?: string;
  onArrival?: () => void;
  onPositionUpdate?: (pos: { worldX: number; worldZ: number }) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const virusType = useMemo(() => familyToVirusType(petFamily || 'parvo'), [petFamily]);

  const waypoints = useMemo(() => {
    const [fx, fy] = fromCoord.split(',').map(Number);
    const [tx, ty] = toCoord.split(',').map(Number);
    const pts = getHexPathWaypoints({ x: fx, y: fy }, { x: tx, y: ty });
    return pts.map(p => {
      const pos = getHexWorldPos(p.x, p.y);
      return { x: p.x, y: p.y, worldX: pos.worldX, worldZ: pos.worldZ };
    });
  }, [fromCoord, toCoord]);

  const startTimeRef = useRef<number | null>(null);
  const arrivedRef = useRef(false);
  const duration = useMemo(() => {
    const steps = Math.max(1, waypoints.length - 1);
    return Math.min(1.0, Math.max(0.5, steps * 0.08));
  }, [waypoints]);

  useFrame((state) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const progress = Math.min(1, elapsed / duration);

    if (waypoints.length <= 1) {
      if (!arrivedRef.current) {
        arrivedRef.current = true;
        onArrival?.();
      }
      return;
    }

    const totalSegs = waypoints.length - 1;
    const currentSegFloat = progress * totalSegs;
    const segIdx = Math.min(totalSegs - 1, Math.floor(currentSegFloat));
    const subT = currentSegFloat - segIdx;

    const p0 = waypoints[segIdx];
    const p1 = waypoints[Math.min(totalSegs, segIdx + 1)];

    const curX = THREE.MathUtils.lerp(p0.worldX, p1.worldX, subT);
    const curZ = THREE.MathUtils.lerp(p0.worldZ, p1.worldZ, subT);
    // HoMM bouncy galloping trajectory
    const hopY = 0.38 + Math.sin(subT * Math.PI) * 0.25;

    if (groupRef.current) {
      groupRef.current.position.set(curX, hopY, curZ);
      groupRef.current.lookAt(p1.worldX, hopY, p1.worldZ);
    }

    onPositionUpdate?.({ worldX: curX, worldZ: curZ });

    if (progress >= 1 && !arrivedRef.current) {
      arrivedRef.current = true;
      onArrival?.();
    }
  });

  return (
    <group>
      <MarchTrajectoryPath waypoints={waypoints} />
      <group ref={groupRef} scale={1.6}>
        <VirusHero3DGeometry virusType={virusType} color="#06b6d4" hasCrown={true} isMine={true} />
        <Billboard position={[0, 0.48, 0]}>
          <Text
            fontSize={0.13}
            color="#38bdf8"
            outlineWidth={0.03}
            outlineColor="#000000"
            anchorX="center"
            anchorY="middle"
          >
            {`👑 ${ownerName || 'ไวรัสฮีโร่'} (กำลังเคลื่อนทัพ)`}
          </Text>
        </Billboard>
        {/* Glow halo under hero */}
        <mesh position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
        </mesh>
      </group>
    </group>
  );
}

// ── 3D Stationed Hero Virus (Stationed at current tile) ──────────────
function HeroVirusPetStationed({
  coord,
  petFamily,
  ownerName,
  isMine = true,
}: {
  coord: string;
  petFamily?: string;
  ownerName?: string;
  isMine?: boolean;
}) {
  const [x, y] = coord.split(',').map(Number);
  const { worldX, worldZ } = getHexWorldPos(x, y);
  const virusType = useMemo(() => familyToVirusType(petFamily || 'parvo'), [petFamily]);
  const groupRef = useRef<THREE.Group>(null);
  const color = isMine ? '#06b6d4' : '#f59e0b';
  const labelColor = isMine ? '#38bdf8' : '#fbbf24';

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 1.2;
      groupRef.current.position.y = 0.42 + Math.sin(state.clock.elapsedTime * 2.5) * 0.04;
    }
  });

  return (
    <group position={[worldX, 0, worldZ]}>
      {/* Stationed Royal Beacon Beam */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.07, 0.22, 0.95, 12, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* 3D Model with Crown */}
      <group ref={groupRef} scale={1.6}>
        <VirusHero3DGeometry virusType={virusType} color={color} hasCrown={true} isMine={isMine} />
      </group>

      {/* Billboard label */}
      <Billboard position={[0, 0.95, 0]}>
        <Text
          fontSize={0.14}
          color={labelColor}
          outlineWidth={0.03}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {isMine ? `👑 ${ownerName || 'ฮีโร่ของคุณ'} (ประจำการ)` : `👑 จอมทัพ ${ownerName || 'ศัตรู'}`}
        </Text>
      </Billboard>
    </group>
  );
}

// ── 3D Landmark: Player HQ Capital Base (Majestic 3D Mascot Landmark) ──
function PlayerHQMesh({
  position,
  ownerName,
  ownerFamily,
  isMine,
  color,
}: {
  position: [number, number, number];
  ownerName?: string;
  ownerFamily?: string;
  isMine: boolean;
  color: string;
}) {
  const mascotRef = useRef<THREE.Group>(null);
  const virusType = useMemo(() => familyToVirusType(ownerFamily || 'parvo'), [ownerFamily]);

  const shortName = useMemo(() => {
    if (isMine) return '👑 ฐานหลักของคุณ (HQ)';
    if (!ownerName) return '🏰 ผู้เล่น (HQ)';
    const clean = ownerName.length > 8 ? `${ownerName.slice(0, 7)}…` : ownerName;
    return `🏰 ${clean} (HQ)`;
  }, [isMine, ownerName]);

  // Gentle float & rotation for the HQ commander
  useFrame((state, delta) => {
    if (mascotRef.current) {
      mascotRef.current.rotation.y += delta * (isMine ? 1.0 : 0.6);
      mascotRef.current.position.y = 0.40 + Math.sin(state.clock.elapsedTime * 2.2 + (isMine ? 0 : 1.2)) * 0.035;
    }
  });

  return (
    <group position={position}>
      {/* 1. Solid High-Tech Raised Hexagonal Pedestal (Lifts mascot cleanly above hex surface) */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.30, 0.36, 0.08, 6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* 2. Glowing Neon Energy Ring on Pedestal */}
      <mesh position={[0, 0.082, 0]}>
        <cylinderGeometry args={[0.26, 0.28, 0.02, 6]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={isMine ? 1.2 : 0.8} 
          roughness={0.2} 
        />
      </mesh>

      {/* 3. Holographic Vertical Beacon Light Beam */}
      <mesh position={[0, 0.50, 0]}>
        <cylinderGeometry args={[0.06, 0.18, 0.85, 12, 1, true]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={isMine ? 0.35 : 0.22} 
          side={THREE.DoubleSide} 
          depthWrite={false} 
        />
      </mesh>

      {/* 4. Majestic 3D Virus Mascot */}
      <group ref={mascotRef} position={[0, 0.40, 0]} scale={1.5}>
        <VirusHero3DGeometry virusType={virusType} color={color} hasCrown={isMine} isMine={isMine} />
      </group>

      {/* 5. Floating High-Contrast HQ Name Tag */}
      <Billboard position={[0, 0.88, 0]}>
        <Text
          fontSize={0.13}
          color={isMine ? "#38bdf8" : "#f1f5f9"}
          outlineWidth={0.025}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {shortName}
        </Text>
      </Billboard>
    </group>
  );
}

// ── Single Selected Sector Billboard (On-Demand for Non-HQ Sectors) ──
function SelectedSectorBadge({
  coord,
  tile,
  isMine,
  isHQ,
}: {
  coord: string;
  tile?: EmpireTile | null;
  isMine?: boolean;
  isHQ?: boolean;
}) {
  // If it's already an HQ, or non-player: return null
  if (isHQ || !tile || tile.type !== 'player' || !tile.ownerUid) return null;
  const [x, y] = coord.split(',').map(Number);
  const { worldX, worldZ } = getHexWorldPos(x, y);

  return (
    <Billboard position={[worldX, 0.58, worldZ]}>
      <Text
        fontSize={0.13}
        color={isMine ? "#38bdf8" : "#f1f5f9"}
        outlineWidth={0.025}
        outlineColor="#000000"
        anchorX="center"
        anchorY="middle"
      >
        {isMine ? `👑 เซกเตอร์ของคุณ` : `👤 ${tile.ownerName || 'ผู้เล่น'}`}
      </Text>
    </Billboard>
  );
}

// ── High Performance Instanced Hexagonal Grid (Seamless, Edge-to-Edge)
function HexInstancedBoard({
  tiles,
  guilds,
  exploredTiles,
  myUid,
  myGuildId,
  isGmUser,
}: {
  tiles: Record<string, EmpireTile>;
  guilds: Record<string, Guild>;
  exploredTiles: Set<string>;
  myUid?: string;
  myGuildId?: string;
  isGmUser?: boolean;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const totalCount = MAP_SIZE * MAP_SIZE;

  // Build matrix & colors ONCE or whenever data changes
  useEffect(() => {
    if (!meshRef.current) return;

    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        const idx = y * MAP_SIZE + x;
        const coord = `${x},${y}`;
        const tile = tiles[coord];

        const isExplored = isGmUser || exploredTiles.has(coord);
        const isSanctuary = isSanctuaryZone(x, y);
        const isVault = isCentralVaultZone(x, y);
        const isMine = Boolean(myUid && tile?.ownerUid === myUid);
        const hasBoss = tile?.type === 'boss';
        const isOutpost = Boolean(tile?.isOutpost || tile?.type === 'outpost');

        // Resolve the actual guild object for this tile:
        // 1. tile.guildId
        // 2. If it's my tile and I have a guild, fallback to myGuildId
        const effectiveGuildId = tile?.guildId || (isMine && myGuildId ? myGuildId : undefined);
        const guildObj = effectiveGuildId ? guilds[effectiveGuildId] : undefined;
        const actualGuildColor = guildObj?.color;

        let elevation = 0.08;
        let scaleY = 1.0;

        // Clean, high-contrast tactical color palette matching REAL guild colors
        if (!isExplored) {
          tempColor.set('#0b1324'); // Sleek dark cyber fog
          elevation = 0.05;
          scaleY = 0.6;
        } else if (hasBoss) {
          tempColor.set('#dc2626'); // Boss warning crimson
          elevation = 0.14;
          scaleY = 1.8;
        } else if (tile?.isCitadel) {
          // Citadel uses its guild's real color, or gold fallback
          tempColor.set(actualGuildColor || '#f59e0b');
          elevation = 0.15;
          scaleY = 2.0;
        } else if (actualGuildColor) {
          // 🏆 TILE BELONGS TO A GUILD: USE THE REAL GUILD COLOR (EVEN WHEN DECAYED)!
          tempColor.set(actualGuildColor);
          if (isMine) {
            elevation = 0.12;
            scaleY = 1.5; // Slightly elevated so player's personal base stands out
          } else {
            elevation = 0.10;
            scaleY = 1.3;
          }
        } else if (tile?.ownerUid) {
          // Player tile without a guild: use player's unique color
          const pColor = tile.color || getPlayerUniqueColor(tile.ownerUid, isMine);
          tempColor.set(pColor);
          elevation = isMine ? 0.12 : 0.09;
          scaleY = isMine ? 1.5 : 1.2;
        } else if (isOutpost) {
          tempColor.set('#059669'); // Unclaimed Outpost emerald
          elevation = 0.09;
          scaleY = 1.2;
        } else if (isVault) {
          tempColor.set('#1e293b'); // Central Core
          elevation = 0.08;
          scaleY = 1.1;
        } else if (isSanctuary) {
          tempColor.set('#16253b'); // Sanctuary safe zone
          elevation = 0.06;
          scaleY = 0.8;
        } else {
          tempColor.set('#111c30'); // Explored neutral
          elevation = 0.07;
          scaleY = 1.0;
        }

        const { worldX, worldZ } = getHexWorldPos(x, y);
        tempPosition.set(worldX, elevation / 2, worldZ);
        tempScale.set(1, scaleY, 1);
        tempMatrix.compose(tempPosition, IDENTITY_QUAT, tempScale);

        meshRef.current.setMatrixAt(idx, tempMatrix);
        meshRef.current.setColorAt(idx, tempColor);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [tiles, guilds, exploredTiles, myUid, myGuildId, isGmUser]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined as any, undefined as any, totalCount]}
      frustumCulled={false}
    >
      <cylinderGeometry args={[HEX_MESH_RADIUS, HEX_MESH_RADIUS, 0.12, 6]} />
      <meshStandardMaterial 
        roughness={0.35} 
        metalness={0.4} 
        toneMapped={false} 
      />
    </instancedMesh>
  );
}

// ── Zero-Lag Interaction Controller (Math Plane Raycasting) ─────────
function HexInteractionController({
  selectedCoord,
  onSelectCoord,
}: {
  selectedCoord: string | null;
  onSelectCoord: (coord: string) => void;
}) {
  const { camera, gl } = useThree();
  const hoverReticleRef = useRef<THREE.Group>(null);
  const selectedReticleRef = useRef<THREE.Group>(null);

  const isPointerDownRef = useRef(false);
  const pointerDownPosRef = useRef({ x: 0, y: 0 });

  // Update selected reticle position when selectedCoord changes
  useEffect(() => {
    if (!selectedReticleRef.current) return;
    if (selectedCoord) {
      const [sx, sy] = selectedCoord.split(',').map(Number);
      if (!isNaN(sx) && !isNaN(sy)) {
        const { worldX, worldZ } = getHexWorldPos(sx, sy);
        selectedReticleRef.current.position.set(worldX, 0.12, worldZ);
        selectedReticleRef.current.visible = true;
        return;
      }
    }
    selectedReticleRef.current.visible = false;
  }, [selectedCoord]);

  // Pointer event listeners on canvas DOM element
  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    const onPointerDown = (e: PointerEvent) => {
      isPointerDownRef.current = true;
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseNDC, camera);
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const hex = worldToHexCoord(hitPoint.x, hitPoint.z);
        if (hex && hoverReticleRef.current) {
          const { worldX, worldZ } = getHexWorldPos(hex.x, hex.y);
          hoverReticleRef.current.position.set(worldX, 0.11, worldZ);
          hoverReticleRef.current.visible = true;
          return;
        }
      }
      if (hoverReticleRef.current) {
        hoverReticleRef.current.visible = false;
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      // Only select if not dragging/panning the camera (larger tolerance for mobile finger touch)
      const maxDrag = e.pointerType === 'touch' ? 20 : 6;
      const dx = Math.abs(e.clientX - pointerDownPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerDownPosRef.current.y);
      if (dx > maxDrag || dy > maxDrag) return;

      const rect = canvas.getBoundingClientRect();
      mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseNDC, camera);
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        const hex = worldToHexCoord(hitPoint.x, hitPoint.z);
        if (hex) {
          onSelectCoord(`${hex.x},${hex.y}`);
        }
      }
    };

    const onPointerLeave = () => {
      if (hoverReticleRef.current) {
        hoverReticleRef.current.visible = false;
      }
      isPointerDownRef.current = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove, { passive: true });
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [camera, gl, onSelectCoord]);

  // Gentle rotation for selected target reticle
  useFrame((_, delta) => {
    if (selectedReticleRef.current && selectedReticleRef.current.visible) {
      selectedReticleRef.current.rotation.y += delta * 1.5;
    }
  });

  return (
    <>
      {/* 1. Hover Reticle (Hex Ring Outline) */}
      <group ref={hoverReticleRef} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[HEX_MESH_RADIUS * 0.90, HEX_MESH_RADIUS * 1.02, 6]} />
          <meshBasicMaterial 
            color="#67e8f9" 
            transparent 
            opacity={0.65} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      </group>

      {/* 2. Selected Reticle (Tactical Double Ring with Brackets) */}
      <group ref={selectedReticleRef} visible={false}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[HEX_MESH_RADIUS * 0.75, HEX_MESH_RADIUS * 0.96, 6]} />
          <meshBasicMaterial 
            color="#38bdf8" 
            transparent 
            opacity={0.95} 
            side={THREE.DoubleSide} 
          />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.01, 0]}>
          <ringGeometry args={[HEX_MESH_RADIUS * 1.04, HEX_MESH_RADIUS * 1.15, 4]} />
          <meshBasicMaterial 
            color="#06b6d4" 
            transparent 
            opacity={0.8} 
            side={THREE.DoubleSide} 
          />
        </mesh>
      </group>
    </>
  );
}

// ── Smooth Camera Rig (Immersive View filling the Display) ──────────
function CameraRig({
  targetFocus,
  cameraMode,
  marchingPos,
}: {
  targetFocus: { x: number; y: number } | null;
  cameraMode: 'iso' | 'top';
  marchingPos?: { worldX: number; worldZ: number } | null;
}) {
  const { camera, size } = useThree();
  const controlsRef = useRef<any>(null);

  const isMobile = size.width < 768 || size.width < size.height;

  useFrame(() => {
    if (marchingPos && controlsRef.current) {
      controlsRef.current.target.lerp(new THREE.Vector3(marchingPos.worldX, 0, marchingPos.worldZ), 0.12);
      const elevation = isMobile ? 18 : 20;
      const zOffset = isMobile ? 12 : 14;
      camera.position.lerp(new THREE.Vector3(marchingPos.worldX, elevation, marchingPos.worldZ + zOffset), 0.12);
      controlsRef.current.update();
    }
  });

  useEffect(() => {
    if (!controlsRef.current || marchingPos) return;
    const targetX = targetFocus ? targetFocus.x : 25;
    const targetY = targetFocus ? targetFocus.y : 25;
    const { worldX, worldZ } = getHexWorldPos(targetX, targetY);

    controlsRef.current.target.set(worldX, 0, worldZ);

    if (cameraMode === 'iso') {
      const elevation = isMobile ? 18 : 20;
      const zOffset = isMobile ? 12 : 14;
      camera.position.set(worldX, elevation, worldZ + zOffset);
    } else {
      // 2D Tactical View: Steep 85-degree top-down bird's eye view
      const elevation = isMobile ? 26 : 34;
      camera.position.set(worldX, elevation, worldZ + 2.5);
    }
    camera.up.set(0, 1, 0);
    camera.lookAt(worldX, 0, worldZ);
    controlsRef.current.update();
  }, [targetFocus, cameraMode, camera, isMobile, marchingPos]);

  return (
    <MapControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      enableRotate={false}
      minDistance={isMobile ? 8 : 10}
      maxDistance={isMobile ? 38 : 55}
      panSpeed={isMobile ? 1.2 : 1.0}
      zoomSpeed={isMobile ? 1.2 : 1.1}
      touches={{
        ONE: THREE.TOUCH.PAN,
        TWO: THREE.TOUCH.DOLLY_PAN
      }}
    />
  );
}

// ── Main Empire 3D Tactical Canvas (Edge-to-Edge Full Screen) ───────
export default function EmpireCanvas3D({
  tiles,
  guilds,
  exploredTiles,
  myUid,
  myGuildId,
  selectedCoord,
  onSelectCoord,
  targetFocus,
  cameraMode,
  isGmUser,
  petCoord,
  petFamily,
  ownerName,
  marchOrder,
}: EmpireCanvas3DProps) {
  const [marchingWorldPos, setMarchingWorldPos] = useState<{ worldX: number; worldZ: number } | null>(null);

  // Deduplicate and group landmarks
  const landmarks = useMemo(() => {
    const bossGroups: { x: number; y: number; count: number }[] = [];
    const citadelGroups: Record<string, { tiles: { x: number; y: number }[]; color: string; name?: string }> = {};
    const structures: { 
      id: string; 
      x: number; 
      y: number; 
      buildingType: 'bio_wall' | 'spike_wall' | 'sentry_tower' | 'regen_depot';
      guildColor: string;
      isMine: boolean;
    }[] = [];

    Object.values(tiles).forEach((t) => {
      const coord = `${t.x},${t.y}`;
      if (!isGmUser && !exploredTiles.has(coord)) return;

      if (t.type === 'boss') {
        const existing = bossGroups.find((g) => Math.hypot(g.x / g.count - t.x, g.y / g.count - t.y) <= 2.5);
        if (existing) {
          existing.x += t.x;
          existing.y += t.y;
          existing.count += 1;
        } else {
          bossGroups.push({ x: t.x, y: t.y, count: 1 });
        }
      }
      if (t.isCitadel) {
        const gid = t.guildId || 'citadel-default';
        if (!citadelGroups[gid]) {
          const gColor = (t.guildId && guilds[t.guildId]?.color) || '#f59e0b';
          const gName = t.guildId ? guilds[t.guildId]?.name : 'นครหลวงกิลด์';
          citadelGroups[gid] = { tiles: [], color: gColor, name: gName };
        }
        citadelGroups[gid].tiles.push({ x: t.x, y: t.y });
      }
      if (t.buildingType) {
        const isMine = Boolean(myUid && t.ownerUid === myUid);
        const gColor = (t.guildId && guilds[t.guildId]?.color) || (isMine ? '#06b6d4' : '#f59e0b');
        structures.push({
          id: coord,
          x: t.x,
          y: t.y,
          buildingType: t.buildingType,
          guildColor: gColor,
          isMine,
        });
      }
    });

    const bosses = bossGroups.map((g, i) => ({
      id: `boss-cluster-${i}`,
      x: g.x / g.count,
      y: g.y / g.count,
    }));

    // Compute single average center for each 2x2 citadel cluster
    const citadels = Object.entries(citadelGroups).map(([gid, group]) => {
      const avgX = group.tiles.reduce((acc, cur) => acc + cur.x, 0) / group.tiles.length;
      const avgY = group.tiles.reduce((acc, cur) => acc + cur.y, 0) / group.tiles.length;
      return {
        id: gid,
        x: avgX,
        y: avgY,
        color: group.color,
        name: group.name
      };
    });

    return { bosses, citadels, structures };
  }, [tiles, guilds, exploredTiles, isGmUser, myUid]);

  // Approach 2: Compute exactly 1 HQ Base Landmark per Student (Prioritize isCapital or fortified outpost)
  const playerHQs = useMemo(() => {
    const map: Record<string, {
      coord: string;
      x: number;
      y: number;
      elevation: number;
      ownerUid: string;
      ownerName?: string;
      ownerFamily?: string;
      isMine: boolean;
      color: string;
      isCapital?: boolean;
      hasBuilding?: boolean;
    }> = {};

    Object.values(tiles).forEach((t) => {
      const coord = `${t.x},${t.y}`;
      if (!isGmUser && !exploredTiles.has(coord)) return;
      if (t.type !== 'player' || !t.ownerUid || t.isCitadel) return;

      const isMine = Boolean(myUid && t.ownerUid === myUid);
      const color = getPlayerUniqueColor(t.ownerUid, isMine);
      // Place right on the solid upper surface of the hex cylinder
      const elevation = isMine ? 0.15 : 0.13;

      if (!map[t.ownerUid]) {
        map[t.ownerUid] = {
          coord,
          x: t.x,
          y: t.y,
          elevation,
          ownerUid: t.ownerUid,
          ownerName: t.ownerName,
          ownerFamily: t.ownerFamily,
          isMine,
          color,
          isCapital: Boolean(t.isCapital),
          hasBuilding: Boolean(t.buildingType),
        };
      } else {
        const cur = map[t.ownerUid];
        if (!cur.isCapital && t.isCapital) {
          map[t.ownerUid] = {
            coord,
            x: t.x,
            y: t.y,
            elevation,
            ownerUid: t.ownerUid,
            ownerName: t.ownerName,
            ownerFamily: t.ownerFamily,
            isMine,
            color,
            isCapital: true,
            hasBuilding: Boolean(t.buildingType),
          };
        } else if (!cur.isCapital && !cur.hasBuilding && t.buildingType) {
          map[t.ownerUid] = {
            coord,
            x: t.x,
            y: t.y,
            elevation,
            ownerUid: t.ownerUid,
            ownerName: t.ownerName,
            ownerFamily: t.ownerFamily,
            isMine,
            color,
            isCapital: false,
            hasBuilding: true,
          };
        }
      }
    });

    return Object.values(map);
  }, [tiles, exploredTiles, myUid, isGmUser]);

  const selectedTile = selectedCoord ? tiles[selectedCoord] : null;
  const isSelectedMine = Boolean(myUid && selectedTile?.ownerUid === myUid);
  const isSelectedHQ = useMemo(() => {
    return Boolean(selectedCoord && playerHQs.some((hq) => hq.coord === selectedCoord));
  }, [selectedCoord, playerHQs]);

  return (
    <div className="w-full h-full select-none cursor-grab active:cursor-grabbing bg-slate-950">
      <Canvas
        camera={{ position: [0, 20, 14], fov: 46 }}
        gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#020617']} />
        <fog attach="fog" args={['#020617', 26, 60]} />

        {/* Crisp, clean ambient & directional lighting */}
        <ambientLight intensity={0.85} />
        <directionalLight 
          position={[25, 45, 25]} 
          intensity={1.4} 
          color="#f0f9ff" 
        />

        {/* 1. 2,500 Hexagonal Sectors (Seamless, Full-Screen, No Box Frame) */}
        <HexInstancedBoard
          tiles={tiles}
          guilds={guilds}
          exploredTiles={exploredTiles}
          myUid={myUid}
          myGuildId={myGuildId}
          isGmUser={isGmUser}
        />

        {/* 2. Instanced Virus Decals (Flat Stenciled 2D Decals on Hex Top, 4 Draw Calls Total) */}
        <HexInstancedVirusDecals
          tiles={tiles}
          exploredTiles={exploredTiles}
          myUid={myUid}
          isGmUser={isGmUser}
        />

        {/* 2. Zero-Lag Picking & Reticles */}
        <HexInteractionController
          selectedCoord={selectedCoord}
          onSelectCoord={onSelectCoord}
        />

        {/* 3. 3D Bosses (Low-Profile Viruses) */}
        {landmarks.bosses.map((b) => {
          const { worldX, worldZ } = getHexWorldPos(b.x, b.y);
          return (
            <BossVirusMesh
              key={b.id}
              position={[worldX, 0.45, worldZ]}
            />
          );
        })}

        {/* 4. 3D Guild Citadels (Deduplicated Single Monument per Guild) */}
        {landmarks.citadels.map((c) => {
          const { worldX, worldZ } = getHexWorldPos(c.x, c.y);
          return (
            <GuildCitadelMesh
              key={c.id}
              position={[worldX, 0.35, worldZ]}
              color={c.color}
              guildName={c.name}
            />
          );
        })}

        {/* 5. 3D Defense Structures & Fortifications (Walls, Turrets, Bio-Depots) */}
        {landmarks.structures.map((s) => {
          const { worldX, worldZ } = getHexWorldPos(s.x, s.y);
          return (
            <DefenseStructureMesh
              key={s.id}
              position={[worldX, 0.14, worldZ]}
              buildingType={s.buildingType}
              color={s.guildColor}
              isMine={s.isMine}
            />
          );
        })}

        {/* 6. Player HQ Landmarks (1 Majestic 3D Virus Mascot per Player) */}
        {playerHQs.map((hq) => {
          // If this is my HQ and I have a stationed or marching hero, don't double render my hero at the same spot
          const isMyStationedHere = Boolean(hq.isMine && (petCoord === hq.coord || (!petCoord && hq.isCapital)));
          if (isMyStationedHere && (marchOrder || petCoord)) {
            return null;
          }
          const { worldX, worldZ } = getHexWorldPos(hq.x, hq.y);
          return (
            <PlayerHQMesh
              key={hq.coord}
              position={[worldX, hq.elevation, worldZ]}
              ownerName={hq.ownerName}
              ownerFamily={hq.ownerFamily}
              isMine={hq.isMine}
              color={hq.color}
            />
          );
        })}

        {/* 6.1 HoMM Stationed Hero Virus Pet (When not marching) */}
        {!marchOrder && petCoord && (
          <HeroVirusPetStationed
            coord={petCoord}
            petFamily={petFamily}
            ownerName={ownerName}
            isMine={true}
          />
        )}

        {/* 6.1.1 Rival Player Stationed Hero Virus Pets on the Field */}
        {Object.values(tiles)
          .filter(t => t.heroStationedUid && t.heroStationedUid !== myUid && t.id !== petCoord)
          .map(t => (
            <HeroVirusPetStationed
              key={`rival_hero_${t.id}`}
              coord={t.id}
              petFamily={t.ownerFamily}
              ownerName={t.ownerName}
              isMine={false}
            />
          ))}

        {/* 6.2 HoMM Marching Hero Virus Pet (Traveling towards attacked tile!) */}
        {marchOrder && (
          <HeroVirusMarcher
            fromCoord={marchOrder.fromCoord}
            toCoord={marchOrder.toCoord}
            petFamily={marchOrder.petFamily || petFamily}
            ownerName={marchOrder.ownerName || ownerName}
            onArrival={marchOrder.onArrival}
            onPositionUpdate={setMarchingWorldPos}
          />
        )}

        {/* 7. Selected Sector Floating Billboard (On-Demand for Non-HQ Sectors) */}
        {selectedCoord && (
          <SelectedSectorBadge
            coord={selectedCoord}
            tile={selectedTile}
            isMine={isSelectedMine}
            isHQ={isSelectedHQ}
          />
        )}

        {/* 9. Smooth Camera Rig with March Tracking */}
        <CameraRig targetFocus={targetFocus} cameraMode={cameraMode} marchingPos={marchingWorldPos} />
      </Canvas>
    </div>
  );
}
