"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { VirusType } from './SVGVirus';

interface Virus3DProps {
  type?: VirusType;
  color?: string;
  isSick?: boolean;
}

// Generates points around a sphere to position spike proteins
function generateSpikePositions(count: number, radius: number): [number, number, number][] {
  const points: [number, number, number][] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2; // y from 1 to -1
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = phi * i;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    points.push([x * radius, y * radius, z * radius]);
  }
  return points;
}

// Component for Individual Spikes
function Spike({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Group>(null);

  // Calculate rotation to point outward from center
  const rotation = useMemo(() => {
    const dir = new THREE.Vector3(...position).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    return [euler.x, euler.y, euler.z] as [number, number, number];
  }, [position]);

  return (
    <group ref={meshRef} position={position} rotation={rotation}>
      {/* Spike Stalk */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.5, 8]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Spike Head / Receptor */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.6} 
          roughness={0.2} 
        />
      </mesh>
    </group>
  );
}

// Main 3D Model Body based on Virus Structure
function VirusModel({ type = 'default', color = '#a855f7', isSick = false }: Virus3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  // Subtle rotation animation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (isSick ? 0.2 : 0.6);
      groupRef.current.rotation.x += delta * (isSick ? 0.1 : 0.2);
    }
  });

  const spikePositions = useMemo(() => {
    if (type === 'corona') return generateSpikePositions(36, 1.25);
    if (type === 'retro' || type === 'flavi' || type === 'orthomyxo') return generateSpikePositions(24, 1.2);
    if (type === 'paramyxo') return generateSpikePositions(18, 1.3);
    return []; // Naked or bullet viruses don't have classical coronavirus-style spikes
  }, [type]);

  const primaryColor = isSick ? '#ef4444' : color;
  const secondaryColor = isSick ? '#991b1b' : '#38bdf8';

  // 1. Rabies (Rhabdoviridae) -> Bullet / Capsule Shaped
  if (type === 'rabies') {
    return (
      <group ref={groupRef}>
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.8, 1.2, 16, 32]} />
          <meshStandardMaterial 
            color={primaryColor} 
            roughness={0.3} 
            metalness={0.4} 
            emissive={primaryColor} 
            emissiveIntensity={0.3} 
          />
        </mesh>
        {/* RNA Spiral Inside / Glow Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.9, 0.05, 16, 64]} />
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      </group>
    );
  }

  // 2. Parvovirus / Picornavirus -> Icosahedral (Non-enveloped)
  if (type === 'parvo' || type === 'picorna' || type === 'birna') {
    return (
      <group ref={groupRef}>
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[1.3, 0]} />
          <meshStandardMaterial 
            color={primaryColor} 
            roughness={0.2} 
            metalness={0.5} 
            flatShading 
            emissive={primaryColor} 
            emissiveIntensity={0.4} 
          />
        </mesh>
        {/* Capsid Edge Highlights */}
        <mesh>
          <icosahedronGeometry args={[1.32, 0]} />
          <meshBasicMaterial color="#ffffff" wireframe opacity={0.3} transparent />
        </mesh>
      </group>
    );
  }

  // 3. Spherical Enveloped with Spikes (Coronavirus, Retrovirus, Orthomyxovirus, etc.)
  return (
    <group ref={groupRef}>
      {/* Viral Core / Envelope */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <MeshDistortMaterial
          color={primaryColor}
          distort={isSick ? 0.4 : 0.15}
          speed={isSick ? 1.5 : 2}
          roughness={0.25}
          metalness={0.3}
          emissive={primaryColor}
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Internal Genetic Material Glow */}
      <mesh scale={0.7}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={secondaryColor} wireframe opacity={0.6} transparent />
      </mesh>

      {/* Surface Spikes */}
      {spikePositions.map((pos, idx) => (
        <Spike key={idx} position={pos} color={isSick ? '#f87171' : secondaryColor} />
      ))}
    </group>
  );
}

export interface VirusViewer3DProps {
  type?: VirusType;
  color?: string;
  isSick?: boolean;
  className?: string;
  interactive?: boolean;
}

export default function VirusViewer3D({
  type = 'default',
  color = '#a855f7',
  isSick = false,
  className = 'w-full h-full',
  interactive = true,
}: VirusViewer3DProps) {
  return (
    <div className={`relative ${className} select-none`}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-10, -10, -5]} intensity={0.8} color={color} />
        <directionalLight position={[0, 5, 5]} intensity={1} />

        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
          <VirusModel type={type} color={color} isSick={isSick} />
        </Float>

        {/* Ambient Holographic Particles */}
        <Sparkles 
          count={35} 
          scale={4} 
          size={2.5} 
          speed={0.4} 
          color={isSick ? '#ef4444' : color} 
        />

        {interactive && (
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate={false} 
            rotateSpeed={0.8}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={(Math.PI * 3) / 4}
          />
        )}
      </Canvas>

      {interactive && (
        <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-800">
            DRAG TO ROTATE 3D
          </span>
        </div>
      )}
    </div>
  );
}
