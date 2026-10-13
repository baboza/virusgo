"use client";

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Lightweight Floating Viral Particle in the background
function FloatingParticle({ 
  position, 
  scale, 
  color, 
  geometryType,
  speed 
}: { 
  position: [number, number, number]; 
  scale: number; 
  color: string; 
  geometryType: 'icosa' | 'torus' | 'capsule';
  speed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * speed * 0.3;
      meshRef.current.rotation.y += delta * speed * 0.5;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.6} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {geometryType === 'icosa' ? (
          <icosahedronGeometry args={[1, 0]} />
        ) : geometryType === 'torus' ? (
          <torusGeometry args={[1, 0.25, 12, 32]} />
        ) : (
          <capsuleGeometry args={[0.6, 1, 8, 16]} />
        )}
        <meshBasicMaterial 
          color={color} 
          wireframe 
          transparent 
          opacity={0.25} 
        />
      </mesh>
    </Float>
  );
}

function Scene() {
  const particles = useMemo(() => [
    { pos: [-6, 3, -6] as [number, number, number], scale: 1.6, color: '#3b82f6', type: 'icosa' as const, speed: 0.8 },
    { pos: [7, 4, -8] as [number, number, number], scale: 2.2, color: '#06b6d4', type: 'torus' as const, speed: 0.6 },
    { pos: [-8, -4, -7] as [number, number, number], scale: 1.8, color: '#8b5cf6', type: 'capsule' as const, speed: 0.9 },
    { pos: [8, -5, -6] as [number, number, number], scale: 1.4, color: '#10b981', type: 'icosa' as const, speed: 0.7 },
    { pos: [0, 6, -10] as [number, number, number], scale: 2.5, color: '#0ea5e9', type: 'icosa' as const, speed: 0.5 },
    { pos: [-3, -6, -8] as [number, number, number], scale: 1.5, color: '#ec4899', type: 'torus' as const, speed: 0.7 },
  ], []);

  return (
    <>
      <ambientLight intensity={0.4} />
      {particles.map((p, idx) => (
        <FloatingParticle
          key={idx}
          position={p.pos}
          scale={p.scale}
          color={p.color}
          geometryType={p.type}
          speed={p.speed}
        />
      ))}
      {/* Deep Cybernetic Ambient Glow Sparkles */}
      <Sparkles count={40} scale={15} size={2} speed={0.2} color="#38bdf8" opacity={0.3} />
      <Sparkles count={25} scale={12} size={2.5} speed={0.15} color="#818cf8" opacity={0.25} />
    </>
  );
}

export default function AmbientBioCanvas3D() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}
        dpr={[1, 1.5]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

export { AmbientBioCanvas3D };
