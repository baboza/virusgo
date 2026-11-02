"use client";

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Ring } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerSentinel3DProps {
  isAttacking?: boolean;
  isDamaged?: boolean;
  className?: string;
}

function SentinelModel({ isAttacking, isDamaged }: { isAttacking?: boolean; isDamaged?: boolean }) {
  const group = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (group.current) {
      group.current.rotation.y += delta * (isAttacking ? 2.5 : 0.6);
    }
    if (coreRef.current) {
      coreRef.current.rotation.x += delta * 0.8;
      coreRef.current.rotation.z += delta * 0.5;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x -= delta * 1.2;
    }
  });

  const primaryColor = isDamaged ? '#ef4444' : isAttacking ? '#38bdf8' : '#10b981';
  const glowColor = isDamaged ? '#b91c1c' : '#34d399';

  return (
    <group ref={group}>
      {/* Central Bio-Nanobot Quantum Core */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial 
          color={primaryColor} 
          roughness={0.2} 
          metalness={0.8} 
          emissive={glowColor} 
          emissiveIntensity={isAttacking ? 0.9 : 0.4} 
        />
      </mesh>

      {/* Internal Energy Matrix Wireframe */}
      <mesh scale={0.85}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.6} />
      </mesh>

      {/* Gyroscopic Orbital Defense Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[1.05, 0.04, 16, 64]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.3} metalness={0.9} emissive="#0284c7" emissiveIntensity={0.5} />
      </mesh>

      {/* 3 Orbiting Neutralizing Antibody Nanobots */}
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(angle) * 1.1, Math.sin(angle) * 0.3, Math.sin(angle) * 1.1]}>
            {/* Y-shaped antibody stalk */}
            <mesh position={[0, -0.06, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.16, 8]} />
              <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={0.6} />
            </mesh>
            {/* Left Fab arm */}
            <mesh position={[-0.05, 0.06, 0]} rotation={[0, 0, 0.6]}>
              <cylinderGeometry args={[0.025, 0.025, 0.12, 8]} />
              <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
            </mesh>
            {/* Right Fab arm */}
            <mesh position={[0.05, 0.06, 0]} rotation={[0, 0, -0.6]}>
              <cylinderGeometry args={[0.025, 0.025, 0.12, 8]} />
              <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
            </mesh>
          </group>
        );
      })}

      {/* Base Holographic Projector Ring */}
      <group position={[0, -1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <Ring args={[0.6, 0.65, 32]}>
          <meshBasicMaterial color="#10b981" transparent opacity={0.5} />
        </Ring>
      </group>
    </group>
  );
}

export default function PlayerSentinel3D({
  isAttacking = false,
  isDamaged = false,
  className = 'w-full h-full'
}: PlayerSentinel3DProps) {
  return (
    <div className={`relative ${className} select-none`}>
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.9} />
        <pointLight position={[6, 8, 6]} intensity={1.6} color="#ffffff" />
        <pointLight position={[-6, -6, -4]} intensity={1.0} color="#10b981" />
        <directionalLight position={[0, 4, 4]} intensity={1.2} />

        <Float speed={2.2} rotationIntensity={0.3} floatIntensity={0.6}>
          <SentinelModel isAttacking={isAttacking} isDamaged={isDamaged} />
        </Float>

        <Sparkles 
          count={20} 
          scale={3.0} 
          size={2} 
          speed={0.6} 
          color={isDamaged ? '#ef4444' : '#10b981'} 
        />
      </Canvas>
    </div>
  );
}
