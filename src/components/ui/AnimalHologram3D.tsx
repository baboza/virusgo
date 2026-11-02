"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles, Ring } from '@react-three/drei';
import * as THREE from 'three';

export interface AnimalHologram3DProps {
  speciesGroup?: string;
  animalType?: string;
  caseId?: string;
  farmHp?: number;
  className?: string;
  interactive?: boolean;
}

type AnimalKind = 'swine' | 'poultry' | 'bovine' | 'canine' | 'feline' | 'equine' | 'zoonosis';

export function resolveAnimalKind(speciesGroup?: string, animalType?: string, caseId?: string): AnimalKind {
  const combined = `${speciesGroup || ''} ${animalType || ''} ${caseId || ''}`.toLowerCase();
  if (combined.includes('swine') || combined.includes('pig') || combined.includes('สุกร') || combined.includes('asf') || combined.includes('prrs')) {
    return 'swine';
  }
  if (combined.includes('poultry') || combined.includes('chicken') || combined.includes('avian') || combined.includes('ไก่') || combined.includes('สัตว์ปีก')) {
    return 'poultry';
  }
  if (combined.includes('bovine') || combined.includes('cow') || combined.includes('cattle') || combined.includes('โค') || combined.includes('bvdv')) {
    return 'bovine';
  }
  if (combined.includes('feline') || combined.includes('cat') || combined.includes('แมว')) {
    return 'feline';
  }
  if (combined.includes('canine') || combined.includes('dog') || combined.includes('สุนัข') || combined.includes('cirdc')) {
    return 'canine';
  }
  if (combined.includes('equine') || combined.includes('horse') || combined.includes('ม้า') || combined.includes('ahsv')) {
    return 'equine';
  }
  if (combined.includes('rabies') || combined.includes('zoonosis') || combined.includes('one health')) {
    return 'zoonosis';
  }
  return 'swine';
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. SWINE 3D MESH (Porcine Morphology)
// ─────────────────────────────────────────────────────────────────────────────
function SwineMesh({ color, isSick }: { color: string; isSick: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
  });

  return (
    <group ref={group} position={[0, -0.1, 0]}>
      {/* Barrel Torso */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.55, 0.9, 16, 24]} />
        <meshStandardMaterial color={color} wireframe={isSick} roughness={0.3} metalness={0.7} transparent opacity={0.88} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.25, 0.65]}>
        <sphereGeometry args={[0.42, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} transparent opacity={0.85} />
      </mesh>

      {/* Porcine Snout Disk */}
      <mesh position={[0, 0.2, 1.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.12, 16]} />
        <meshStandardMaterial color="#f472b6" roughness={0.2} emissive="#f472b6" emissiveIntensity={0.4} />
      </mesh>
      {/* Nostrils */}
      <mesh position={[0.06, 0.2, 1.09]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      <mesh position={[-0.06, 0.2, 1.09]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* Floppy Porcine Ears */}
      <mesh position={[0.32, 0.52, 0.6]} rotation={[-0.2, 0.3, -0.6]}>
        <coneGeometry args={[0.16, 0.32, 4]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[-0.32, 0.52, 0.6]} rotation={[-0.2, -0.3, 0.6]}>
        <coneGeometry args={[0.16, 0.32, 4]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>

      {/* 4 Sturdy Trotter Legs */}
      {[
        [0.32, -0.5, 0.35],
        [-0.32, -0.5, 0.35],
        [0.32, -0.5, -0.35],
        [-0.32, -0.5, -0.35],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <cylinderGeometry args={[0.11, 0.09, 0.45, 12]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}

      {/* Curled Corkscrew Tail */}
      <mesh position={[0, 0.2, -0.65]} rotation={[0, 0, Math.PI / 3]}>
        <torusGeometry args={[0.12, 0.03, 8, 24, Math.PI * 1.5]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Gastrointestinal Target Pulse Ring (PEDV / PRRS / ASF focus) */}
      <mesh position={[0, -0.05, 0]}>
        <torusGeometry args={[0.62, 0.025, 8, 32]} />
        <meshBasicMaterial color={isSick ? '#ef4444' : '#38bdf8'} wireframe transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. POULTRY 3D MESH (Avian Morphology)
// ─────────────────────────────────────────────────────────────────────────────
function PoultryMesh({ color, isSick }: { color: string; isSick: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
  });

  return (
    <group ref={group} position={[0, -0.15, 0]}>
      {/* Streamlined Body */}
      <mesh position={[0, 0, 0]} rotation={[0.3, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color={color} wireframe={isSick} roughness={0.3} metalness={0.6} transparent opacity={0.85} />
      </mesh>

      {/* Upright Neck & Head */}
      <mesh position={[0, 0.45, 0.3]}>
        <cylinderGeometry args={[0.16, 0.22, 0.45, 12]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.75, 0.38]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>

      {/* Sharp Beak */}
      <mesh position={[0, 0.72, 0.62]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.08, 0.22, 4]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
      </mesh>

      {/* Red Crown / Comb (Cyanotic in Avian Flu!) */}
      <mesh position={[0, 0.98, 0.35]}>
        <boxGeometry args={[0.06, 0.22, 0.32]} />
        <meshStandardMaterial color={isSick ? '#991b1b' : '#ef4444'} emissive={isSick ? '#ef4444' : '#b91c1c'} emissiveIntensity={0.6} />
      </mesh>

      {/* Wattles under beak */}
      <mesh position={[0, 0.58, 0.48]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color={isSick ? '#991b1b' : '#ef4444'} />
      </mesh>

      {/* Lateral Wings */}
      <mesh position={[0.45, 0.05, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.1, 0.42, 0.6]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} />
      </mesh>
      <mesh position={[-0.45, 0.05, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.1, 0.42, 0.6]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} />
      </mesh>

      {/* Tail Feathers Fan */}
      <mesh position={[0, 0.35, -0.55]} rotation={[-0.6, 0, 0]}>
        <coneGeometry args={[0.25, 0.55, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Slender Avian Legs */}
      <mesh position={[0.18, -0.52, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.55, 8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[-0.18, -0.52, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.55, 8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>

      {/* Tracheal / Air Sacs Hologram Ring (Avian Influenza focus) */}
      <mesh position={[0, 0.4, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.02, 8, 24]} />
        <meshBasicMaterial color={isSick ? '#ef4444' : '#06b6d4'} wireframe transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. BOVINE 3D MESH (Cattle / Cow Morphology)
// ─────────────────────────────────────────────────────────────────────────────
function BovineMesh({ color, isSick }: { color: string; isSick: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
  });

  return (
    <group ref={group} position={[0, -0.15, 0]}>
      {/* Broad Ruminant Torso */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.7, 0.75, 1.3]} />
        <meshStandardMaterial color={color} wireframe={isSick} roughness={0.3} metalness={0.7} transparent opacity={0.85} />
      </mesh>

      {/* Heavy Neck & Bovine Head */}
      <mesh position={[0, 0.45, 0.7]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.26, 0.36, 0.5, 12]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0.95]}>
        <boxGeometry args={[0.42, 0.4, 0.45]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>

      {/* Broad Muzzle (FMD Vesicle focus!) */}
      <mesh position={[0, 0.42, 1.2]}>
        <boxGeometry args={[0.32, 0.22, 0.18]} />
        <meshStandardMaterial color={isSick ? '#ef4444' : '#fbcfe8'} emissive={isSick ? '#ef4444' : '#f472b6'} emissiveIntensity={0.3} />
      </mesh>

      {/* Curved Horns */}
      <mesh position={[0.28, 0.78, 0.9]} rotation={[0, 0, -0.7]}>
        <coneGeometry args={[0.07, 0.35, 8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.6} />
      </mesh>
      <mesh position={[-0.28, 0.78, 0.9]} rotation={[0, 0, 0.7]}>
        <coneGeometry args={[0.07, 0.35, 8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.6} />
      </mesh>

      {/* 4 Sturdy Columnar Legs with Hooves */}
      {[
        [0.26, -0.45, 0.45],
        [-0.26, -0.45, 0.45],
        [0.26, -0.45, -0.45],
        [-0.26, -0.45, -0.45],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <cylinderGeometry args={[0.11, 0.1, 0.55, 12]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {/* Coronary Band / Hoof (FMD & BVDV mucosal lesions!) */}
          <mesh position={[0, -0.28, 0]}>
            <cylinderGeometry args={[0.11, 0.12, 0.1, 12]} />
            <meshStandardMaterial color={isSick ? '#ef4444' : '#334155'} emissive={isSick ? '#ef4444' : '#000000'} emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}

      {/* Udder assembly */}
      <mesh position={[0, -0.28, -0.25]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#fbcfe8" />
      </mesh>

      {/* Switch Tail */}
      <mesh position={[0, 0.2, -0.7]} rotation={[-0.2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.05, 0.65, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CANINE 3D MESH (Dog Morphology)
// ─────────────────────────────────────────────────────────────────────────────
function CanineMesh({ color, isSick }: { color: string; isSick: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
  });

  return (
    <group ref={group} position={[0, -0.15, 0]}>
      {/* Athletic Deep Chest & Tapered Flank */}
      <mesh position={[0, 0.12, 0.15]}>
        <capsuleGeometry args={[0.38, 0.55, 12, 20]} />
        <meshStandardMaterial color={color} wireframe={isSick} roughness={0.3} metalness={0.6} transparent opacity={0.88} />
      </mesh>
      <mesh position={[0, 0.08, -0.25]}>
        <capsuleGeometry args={[0.3, 0.45, 12, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} transparent opacity={0.8} />
      </mesh>

      {/* Neck & Canine Head */}
      <mesh position={[0, 0.48, 0.48]} rotation={[0.45, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.24, 0.42, 12]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.68, 0.68]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>

      {/* Elongated Muzzle */}
      <mesh position={[0, 0.62, 0.95]}>
        <boxGeometry args={[0.2, 0.16, 0.32]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.68, 1.1]}>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>

      {/* Alert Pricked Canine Ears */}
      <mesh position={[0.18, 0.96, 0.62]} rotation={[-0.2, 0.2, -0.3]}>
        <coneGeometry args={[0.1, 0.3, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.18, 0.96, 0.62]} rotation={[-0.2, -0.2, 0.3]}>
        <coneGeometry args={[0.1, 0.3, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* 4 Athletic Legs with Paws */}
      {[
        [0.22, -0.42, 0.35],
        [-0.22, -0.42, 0.35],
        [0.2, -0.42, -0.4],
        [-0.2, -0.42, -0.4],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <cylinderGeometry args={[0.08, 0.07, 0.62, 8]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      ))}

      {/* Upright Wagging Tail */}
      <mesh position={[0, 0.35, -0.55]} rotation={[0.6, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.06, 0.45, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Enteric Lymphoid & Heart Telemetry Ring (Parvo / Distemper focus) */}
      <mesh position={[0, 0.05, 0]}>
        <torusGeometry args={[0.48, 0.02, 8, 32]} />
        <meshBasicMaterial color={isSick ? '#ef4444' : '#38bdf8'} wireframe transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. FELINE 3D MESH (Cat Morphology)
// ─────────────────────────────────────────────────────────────────────────────
function FelineMesh({ color, isSick }: { color: string; isSick: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
  });

  return (
    <group ref={group} position={[0, -0.15, 0]}>
      {/* Graceful Supple Torso */}
      <mesh position={[0, 0.08, 0]} rotation={[0.1, 0, 0]}>
        <capsuleGeometry args={[0.3, 0.75, 12, 16]} />
        <meshStandardMaterial color={color} wireframe={isSick} roughness={0.3} metalness={0.6} transparent opacity={0.88} />
      </mesh>

      {/* Rounded Head */}
      <mesh position={[0, 0.48, 0.5]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>

      {/* Delicate Muzzle & Whiskers Node */}
      <mesh position={[0, 0.42, 0.7]}>
        <boxGeometry args={[0.15, 0.1, 0.12]} />
        <meshStandardMaterial color="#fbcfe8" />
      </mesh>

      {/* Pointed Triangular Feline Ears */}
      <mesh position={[0.16, 0.72, 0.48]} rotation={[-0.1, 0.2, -0.2]}>
        <coneGeometry args={[0.1, 0.22, 3]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.16, 0.72, 0.48]} rotation={[-0.1, -0.2, 0.2]}>
        <coneGeometry args={[0.1, 0.22, 3]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* 4 Slender Legs */}
      {[
        [0.18, -0.42, 0.3],
        [-0.18, -0.42, 0.3],
        [0.16, -0.42, -0.3],
        [-0.16, -0.42, -0.3],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <cylinderGeometry args={[0.06, 0.05, 0.58, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}

      {/* Curved Expressive S-Tail */}
      <mesh position={[0, 0.25, -0.5]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.65, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Peritoneal Effusion Telemetry (FIP / Panleukopenia focus) */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.42, 0.02, 8, 32]} />
        <meshBasicMaterial color={isSick ? '#ef4444' : '#a855f7'} wireframe transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. EQUINE 3D MESH (Horse Morphology - AHSV Crisis)
// ─────────────────────────────────────────────────────────────────────────────
function EquineMesh({ color, isSick }: { color: string; isSick: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.4;
  });

  return (
    <group ref={group} position={[0, -0.2, 0]}>
      {/* Deep Barrel Muscular Torso */}
      <mesh position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.45, 0.95, 12, 20]} />
        <meshStandardMaterial color={color} wireframe={isSick} roughness={0.3} metalness={0.7} transparent opacity={0.88} />
      </mesh>

      {/* High Arched Equine Neck */}
      <mesh position={[0, 0.72, 0.55]} rotation={[0.55, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.28, 0.75, 12]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>

      {/* Chiseled Equine Head */}
      <mesh position={[0, 1.05, 0.8]}>
        <boxGeometry args={[0.25, 0.32, 0.45]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>

      {/* Muzzle & Nostrils */}
      <mesh position={[0, 0.95, 1.05]}>
        <boxGeometry args={[0.2, 0.18, 0.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* Supraorbital Fossa (Classic AHSV Oedema bulging!) */}
      <mesh position={[0.12, 1.15, 0.75]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={isSick ? '#ef4444' : color} emissive={isSick ? '#ef4444' : '#000000'} emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-0.12, 1.15, 0.75]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={isSick ? '#ef4444' : color} emissive={isSick ? '#ef4444' : '#000000'} emissiveIntensity={0.6} />
      </mesh>

      {/* Alert Pricked Ears */}
      <mesh position={[0.12, 1.3, 0.68]} rotation={[-0.1, 0.1, -0.1]}>
        <coneGeometry args={[0.07, 0.22, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[-0.12, 1.3, 0.68]} rotation={[-0.1, -0.1, 0.1]}>
        <coneGeometry args={[0.07, 0.22, 4]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Dorsal Mane Ridge */}
      <mesh position={[0, 0.85, 0.48]} rotation={[0.55, 0, 0]}>
        <boxGeometry args={[0.04, 0.65, 0.15]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Long Slender Equine Limbs with Hooves */}
      {[
        [0.22, -0.5, 0.42],
        [-0.22, -0.5, 0.42],
        [0.2, -0.5, -0.45],
        [-0.2, -0.5, -0.45],
      ].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.07, 0.85, 8]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <cylinderGeometry args={[0.09, 0.1, 0.08, 8]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      ))}

      {/* Flowing Dock Tail */}
      <mesh position={[0, 0.35, -0.6]} rotation={[-0.2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 0.75, 8]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Pulmonary / Hydrothorax Inspection Ring (AHSV focus) */}
      <mesh position={[0, 0.3, 0.2]}>
        <torusGeometry args={[0.56, 0.02, 8, 32]} />
        <meshBasicMaterial color={isSick ? '#ef4444' : '#f59e0b'} wireframe transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. ZOONOSIS / ONE HEALTH NEXUS 3D MESH
// ─────────────────────────────────────────────────────────────────────────────
function ZoonosisMesh({ color, isSick }: { color: string; isSick: boolean }) {
  const group = useRef<THREE.Group>(null);
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.3;
    if (ring1.current) ring1.current.rotation.x += delta * 0.7;
    if (ring2.current) ring2.current.rotation.z -= delta * 0.6;
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Central Host Reservoir Shield (Canine/Bat host) */}
      <mesh>
        <dodecahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial color={color} wireframe={isSick} roughness={0.2} metalness={0.7} emissive={color} emissiveIntensity={0.4} />
      </mesh>

      {/* Outer Biohazard Cross-Species Rings */}
      <mesh ref={ring1}>
        <torusGeometry args={[1.05, 0.03, 16, 64]} />
        <meshBasicMaterial color={isSick ? '#ef4444' : '#38bdf8'} wireframe transparent opacity={0.8} />
      </mesh>
      <mesh ref={ring2} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.03, 16, 64]} />
        <meshBasicMaterial color={isSick ? '#f87171' : '#a855f7'} wireframe transparent opacity={0.7} />
      </mesh>

      {/* 3 Orbiting Virions / Spillover Vectors */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 1.05, Math.sin(angle) * 0.4, Math.sin(angle) * 1.05]}>
            <sphereGeometry args={[0.14, 12, 12]} />
            <meshStandardMaterial color={isSick ? '#ef4444' : '#f59e0b'} emissive={isSick ? '#ef4444' : '#f59e0b'} emissiveIntensity={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HOLOGRAM WRAPPER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AnimalHologram3D({
  speciesGroup,
  animalType,
  caseId,
  farmHp = 80,
  className = 'w-full h-full',
  interactive = true,
}: AnimalHologram3DProps) {
  const animalKind = resolveAnimalKind(speciesGroup, animalType, caseId);
  const isSick = farmHp <= 50;

  // Primary holographic tint by species
  const themeColor = useMemo(() => {
    if (isSick) return '#ef4444';
    switch (animalKind) {
      case 'swine': return '#f472b6';   // Neon Porcine Rose
      case 'poultry': return '#38bdf8'; // Sky Blue Avian
      case 'bovine': return '#10b981';  // Emerald Bovine
      case 'canine': return '#06b6d4';  // Cyan Canine
      case 'feline': return '#a855f7';  // Violet Feline
      case 'equine': return '#f59e0b';  // Amber Equine
      case 'zoonosis': return '#e11d48';// Crimson Biohazard
      default: return '#06b6d4';
    }
  }, [animalKind, isSick]);

  return (
    <div className={`relative ${className} select-none overflow-hidden`}>
      <Canvas
        camera={{ position: [0, 0.5, 3.2], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.9} />
        <pointLight position={[6, 8, 6]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-6, -6, -4]} intensity={0.9} color={themeColor} />
        <directionalLight position={[0, 4, 4]} intensity={1.2} />

        <Suspense fallback={null}>
          <Float speed={1.8} rotationIntensity={0.2} floatIntensity={0.4}>
            {animalKind === 'swine' && <SwineMesh color={themeColor} isSick={isSick} />}
            {animalKind === 'poultry' && <PoultryMesh color={themeColor} isSick={isSick} />}
            {animalKind === 'bovine' && <BovineMesh color={themeColor} isSick={isSick} />}
            {animalKind === 'canine' && <CanineMesh color={themeColor} isSick={isSick} />}
            {animalKind === 'feline' && <FelineMesh color={themeColor} isSick={isSick} />}
            {animalKind === 'equine' && <EquineMesh color={themeColor} isSick={isSick} />}
            {animalKind === 'zoonosis' && <ZoonosisMesh color={themeColor} isSick={isSick} />}
          </Float>
        </Suspense>

        {/* Hologram Base Projector Rings */}
        <group position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <Ring args={[0.5, 0.54, 32]}>
            <meshBasicMaterial color={themeColor} transparent opacity={0.6} />
          </Ring>
          <Ring args={[0.85, 0.88, 32]}>
            <meshBasicMaterial color={themeColor} transparent opacity={0.3} />
          </Ring>
        </group>

        {/* Ambient Holographic Sparkles */}
        <Sparkles 
          count={24} 
          scale={3.2} 
          size={1.8} 
          speed={0.4} 
          color={themeColor} 
        />

        {interactive && (
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            rotateSpeed={0.8}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={(Math.PI * 5) / 6}
          />
        )}
      </Canvas>

      {/* Cyber Hologram Scanner Overlays */}
      <div className="absolute top-2 left-2 pointer-events-none flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${isSick ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
        <span className="text-[9px] font-mono font-bold tracking-widest text-slate-300 uppercase bg-slate-950/70 border border-slate-700/60 px-2 py-0.5 rounded-full">
          {animalKind.toUpperCase()} SPECIMEN SCAN
        </span>
      </div>

      <div className="absolute top-2 right-2 pointer-events-none">
        <span className={`text-[9px] font-mono font-bold tracking-widest px-2 py-0.5 rounded-full border ${
          isSick 
            ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' 
            : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
        }`}>
          {isSick ? '⚠️ BIOSECURITY ALERT' : '🛡️ STABLE TELEMETRY'}
        </span>
      </div>

      {interactive && (
        <div className="absolute bottom-1.5 inset-x-0 text-center pointer-events-none">
          <span className="text-[9px] font-mono tracking-wider text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-800">
            แตะหรือลากเพื่อหมุน 3D 360°
          </span>
        </div>
      )}
    </div>
  );
}
