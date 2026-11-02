"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Sparkles, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { VirusType } from './SVGVirus';

export interface VirusViewer3DProps {
  type?: VirusType;
  color?: string;
  isSick?: boolean;
  className?: string;
  interactive?: boolean;
  showScanGrid?: boolean;
}

interface VirusModelProps {
  type?: VirusType;
  color?: string;
  isSick?: boolean;
}

// Generates points around a sphere using Fibonacci spiral for realistic viral spike distribution
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

// Component for Individual Peplomer / Spike Protein
function Spike({ 
  position, 
  color, 
  isCorona = false,
  isOrthomyxo = false,
  index = 0
}: { 
  position: [number, number, number]; 
  color: string;
  isCorona?: boolean;
  isOrthomyxo?: boolean;
  index?: number;
}) {
  const rotation = useMemo(() => {
    const dir = new THREE.Vector3(...position).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const euler = new THREE.Euler().setFromQuaternion(quaternion);
    return [euler.x, euler.y, euler.z] as [number, number, number];
  }, [position]);

  // Orthomyxo has HA (rod trimer) and NA (mushroom tetramer)
  const isNA = isOrthomyxo && index % 3 === 0;

  return (
    <group position={position} rotation={rotation}>
      {/* Stalk */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.44, 8]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Head / Receptor Binding Domain */}
      {isCorona ? (
        // Club-shaped trimer head of Coronaviridae peplomer
        <group position={[0, 0.46, 0]}>
          <mesh position={[0.06, 0.04, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[-0.06, 0.04, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0, 0.04, 0.06]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
          </mesh>
        </group>
      ) : isNA ? (
        // Mushroom-shaped tetramer of Neuraminidase
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.16, 0.08, 0.16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.5} roughness={0.2} />
        </mesh>
      ) : (
        // Standard globular spike head
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={0.5} 
            roughness={0.25} 
          />
        </mesh>
      )}
    </group>
  );
}

// Main 3D Viral Specimen Model based on authentic morphological taxonomy
function VirusModel({ type = 'default', color = '#06b6d4', isSick = false }: VirusModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);

  // Subtle continuous anatomical inspection rotation
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.45;
      groupRef.current.rotation.x += delta * 0.15;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.6;
    }
  });

  const primaryColor = isSick ? '#ef4444' : color;
  const secondaryColor = isSick ? '#b91c1c' : '#38bdf8';

  // Calculate surface peplomers
  const spikePositions = useMemo(() => {
    if (type === 'corona') return generateSpikePositions(38, 1.25);
    if (type === 'orthomyxo') return generateSpikePositions(34, 1.22);
    if (type === 'retro') return generateSpikePositions(26, 1.2);
    if (type === 'flavi') return generateSpikePositions(20, 1.15);
    if (type === 'paramyxo') return generateSpikePositions(28, 1.28);
    if (type === 'arterivirus') return generateSpikePositions(18, 1.15);
    return [];
  }, [type]);

  // 1. Rabies (Rhabdoviridae) -> Bullet/Cylinder with flat base & coiled RNP
  if (type === 'rabies') {
    return (
      <group ref={groupRef}>
        {/* Outer Bullet-shaped membrane */}
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.7, 1.1, 16, 32]} />
          <meshStandardMaterial 
            color={primaryColor} 
            roughness={0.3} 
            metalness={0.4} 
            emissive={primaryColor} 
            emissiveIntensity={0.35} 
          />
        </mesh>
        
        {/* Helical Ribonucleoprotein (RNP) interior core */}
        <group ref={innerRef}>
          {[-0.5, -0.25, 0, 0.25, 0.5].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.42, 0.04, 8, 32]} />
              <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.7} />
            </mesh>
          ))}
        </group>

        {/* Outer Surface Glycoprotein Spikes */}
        {[-0.4, 0, 0.4].map((y, ringIdx) => (
          <group key={ringIdx} position={[0, y, 0]}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const angle = (i / 8) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(angle) * 0.78, 0, Math.sin(angle) * 0.78]}>
                  <sphereGeometry args={[0.07, 8, 8]} />
                  <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.6} />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>
    );
  }

  // 2. Parvoviridae & Circoviridae (Small naked icosahedral T=1 capsid)
  if (type === 'parvo' || type === 'picorna' || type === 'birna') {
    return (
      <group ref={groupRef}>
        {/* Icosahedral Capsid Core */}
        <mesh>
          <icosahedronGeometry args={[1.35, 0]} />
          <meshStandardMaterial 
            color={primaryColor} 
            roughness={0.2} 
            metalness={0.5} 
            flatShading 
            emissive={primaryColor} 
            emissiveIntensity={0.4} 
          />
        </mesh>

        {/* Capsid Facet Ridge Wireframe Highlights */}
        <mesh>
          <icosahedronGeometry args={[1.37, 0]} />
          <meshBasicMaterial color="#ffffff" wireframe opacity={0.4} transparent />
        </mesh>

        {/* 12 Five-fold Capsomeric Vertices */}
        <group ref={innerRef}>
          <mesh scale={0.75}>
            <dodecahedronGeometry args={[1, 0]} />
            <meshBasicMaterial color={secondaryColor} wireframe opacity={0.6} transparent />
          </mesh>
        </group>
      </group>
    );
  }

  // 3. Herpesviridae (Enveloped icosahedral capsid surrounded by thick amorphous tegument)
  if (type === 'herpes') {
    return (
      <group ref={groupRef}>
        {/* Outer Lipid Envelope */}
        <mesh>
          <sphereGeometry args={[1.35, 32, 32]} />
          <meshStandardMaterial 
            color={primaryColor} 
            transparent 
            opacity={0.35} 
            roughness={0.4} 
            metalness={0.2} 
          />
        </mesh>

        {/* Amorphous Protein Tegument Layer */}
        <mesh>
          <sphereGeometry args={[1.15, 16, 16]} />
          <meshBasicMaterial color={secondaryColor} wireframe opacity={0.3} transparent />
        </mesh>

        {/* Inner Crystalline Icosahedral Capsid Core */}
        <mesh ref={innerRef}>
          <icosahedronGeometry args={[0.85, 0]} />
          <meshStandardMaterial 
            color="#ffffff" 
            flatShading 
            roughness={0.2} 
            metalness={0.6} 
            emissive={primaryColor} 
            emissiveIntensity={0.6} 
          />
        </mesh>
      </group>
    );
  }

  // 4. Asfarviridae & Poxviridae (Large complex multi-layered virion)
  if (type === 'asfar') {
    return (
      <group ref={groupRef}>
        {/* Large Outer Hexagonal / Complex Capsid */}
        <mesh>
          <icosahedronGeometry args={[1.4, 1]} />
          <meshStandardMaterial 
            color={primaryColor} 
            roughness={0.4} 
            metalness={0.3} 
            flatShading 
            emissive={primaryColor} 
            emissiveIntensity={0.35} 
          />
        </mesh>

        {/* Inner Core Shell with Genome Dumbbell */}
        <group ref={innerRef}>
          <mesh position={[0.3, 0, 0]}>
            <sphereGeometry args={[0.45, 12, 12]} />
            <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[-0.3, 0, 0]}>
            <sphereGeometry args={[0.45, 12, 12]} />
            <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.5} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.7, 8]} />
            <meshStandardMaterial color="#ffffff" wireframe />
          </mesh>
        </group>
      </group>
    );
  }

  // 5. Reoviridae / Rotavirus (Triple-layered wheel-like structure with 60 radiating spokes)
  if (type === 'reo') {
    return (
      <group ref={groupRef}>
        {/* Outer Wheel Rim */}
        <mesh>
          <torusGeometry args={[1.2, 0.15, 16, 32]} />
          <meshStandardMaterial color={primaryColor} roughness={0.3} emissive={primaryColor} emissiveIntensity={0.4} />
        </mesh>

        {/* Middle Shell Capsid */}
        <mesh>
          <icosahedronGeometry args={[1.05, 1]} />
          <meshStandardMaterial color={secondaryColor} flatShading roughness={0.4} metalness={0.3} />
        </mesh>

        {/* Inner Core Containing 11 dsRNA segments */}
        <mesh ref={innerRef}>
          <dodecahedronGeometry args={[0.65, 0]} />
          <meshBasicMaterial color="#ffffff" wireframe opacity={0.8} transparent />
        </mesh>
      </group>
    );
  }

  // 6. Spherical Enveloped Virions (Coronaviridae, Retroviridae, Orthomyxoviridae, Flaviviridae, Paramyxoviridae)
  return (
    <group ref={groupRef}>
      {/* Viral Lipid Bilayer Envelope */}
      <mesh>
        <sphereGeometry args={[1.18, 32, 32]} />
        <MeshDistortMaterial
          color={primaryColor}
          distort={isSick ? 0.35 : 0.12}
          speed={isSick ? 1.4 : 1.8}
          roughness={0.25}
          metalness={0.3}
          emissive={primaryColor}
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Internal Genetic Core Material */}
      <group ref={innerRef}>
        {type === 'retro' ? (
          // Retrovirus conical/tubular core
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <cylinderGeometry args={[0.25, 0.5, 0.9, 8]} />
            <meshStandardMaterial color="#ffffff" wireframe roughness={0.2} emissive={secondaryColor} emissiveIntensity={0.7} />
          </mesh>
        ) : (
          // Spherical ribonucleoprotein lattice
          <mesh scale={0.72}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color={secondaryColor} wireframe opacity={0.65} transparent />
          </mesh>
        )}
      </group>

      {/* Surface Glycoprotein Spikes (Club peplomers / HA / NA / SU knobs) */}
      {spikePositions.map((pos, idx) => (
        <Spike 
          key={idx} 
          index={idx}
          position={pos} 
          color={isSick ? '#f87171' : secondaryColor} 
          isCorona={type === 'corona'}
          isOrthomyxo={type === 'orthomyxo'}
        />
      ))}
    </group>
  );
}

export default function VirusViewer3D({
  type = 'default',
  color = '#06b6d4',
  isSick = false,
  className = 'w-full h-full',
  interactive = true,
  showScanGrid = true,
}: VirusViewer3DProps) {
  return (
    <div className={`relative ${className} select-none`}>
      <Canvas
        camera={{ position: [0, 0, 4.2], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.8} />
        <pointLight position={[10, 10, 10]} intensity={1.8} color="#ffffff" />
        <pointLight position={[-10, -10, -5]} intensity={1.0} color={color} />
        <directionalLight position={[0, 6, 6]} intensity={1.2} />

        <Suspense fallback={null}>
          <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
            <VirusModel type={type} color={color} isSick={isSick} />
          </Float>
        </Suspense>

        {/* Ambient Holographic Bio-fluorescent Particles */}
        <Sparkles 
          count={28} 
          scale={4.2} 
          size={2.2} 
          speed={0.5} 
          color={isSick ? '#ef4444' : color} 
        />

        {interactive && (
          <OrbitControls 
            enableZoom={false} 
            enablePan={false} 
            autoRotate={false} 
            rotateSpeed={0.9}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={(Math.PI * 3) / 4}
          />
        )}
      </Canvas>

      {/* Futuristic Scanner HUD overlays */}
      {showScanGrid && (
        <div className="absolute top-2 right-2 pointer-events-none">
          <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400/90 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-full">
            3D WEBGL ENGINE
          </span>
        </div>
      )}

      {interactive && (
        <div className="absolute bottom-2 inset-x-0 text-center pointer-events-none">
          <span className="text-[9px] font-mono tracking-wider text-slate-300 bg-slate-950/80 px-2.5 py-0.5 rounded-full border border-slate-700/60 shadow-lg">
            หมุน 360° ด้วยเมาส์หรือสัมผัส
          </span>
        </div>
      )}
    </div>
  );
}
