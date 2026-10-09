import { NextResponse } from 'next/server';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { EmpireTile } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleSeedVault();
}

export async function POST() {
  return handleSeedVault();
}

async function handleSeedVault() {
  try {
    const batch = writeBatch(db);
    let seededGuardians = 0;

    // 1. Central Fortress Perimeter: Guardian Bosses in central area (50x50 map)
    const guardianCoords: { x: number; y: number }[] = [];
    for (let gx = 22; gx <= 27; gx++) {
      for (let gy = 22; gy <= 27; gy++) {
        // Exclude the 4 center chests
        if ((gx === 24 || gx === 25) && (gy === 24 || gy === 25)) continue;
        guardianCoords.push({ x: gx, y: gy });
      }
    }

    const bossFamilies = ['corona', 'rabies', 'parvo', 'retro', 'orthomyxo'];

    for (const g of guardianCoords) {
      const gId = `${g.x},${g.y}`;
      const isInnerRing = (g.x >= 23 && g.x <= 26 && g.y >= 23 && g.y <= 26);
      const guardianBoss: EmpireTile = {
        id: gId,
        x: g.x,
        y: g.y,
        type: 'boss',
        bossHp: isInnerRing ? 2000 : 1400,
        maxBossHp: isInnerRing ? 2000 : 1400,
        ownerName: isInnerRing ? 'ผู้พิทักษ์สมบัติชั้นใน (Vault Elite Guardian)' : 'ผู้พิทักษ์สมบัติชั้นนอก (Perimeter Guardian)',
        ownerFamily: bossFamilies[Math.floor(Math.random() * bossFamilies.length)],
      };
      batch.set(doc(db, 'empire_tiles', gId), guardianBoss);
      seededGuardians++;
    }

    // 3. Outposts: 4 Bio-Farm Outposts across 4 quadrants in 50x50 map
    const outpostCoords = [
      { x: 10, y: 10, name: 'ป้อมฟาร์มวิจัย (NW Outpost)' },
      { x: 39, y: 10, name: 'ป้อมฟาร์มวิจัย (NE Outpost)' },
      { x: 10, y: 39, name: 'ป้อมฟาร์มวิจัย (SW Outpost)' },
      { x: 39, y: 39, name: 'ป้อมฟาร์มวิจัย (SE Outpost)' },
    ];
    let seededOutposts = 0;

    for (const o of outpostCoords) {
      const oId = `${o.x},${o.y}`;
      const outpostTile: EmpireTile = {
        id: oId,
        x: o.x,
        y: o.y,
        type: 'outpost',
        isOutpost: true,
        dailyExp: 100,
        bossHp: 800,
        maxBossHp: 800,
        ownerName: o.name,
        ownerFamily: 'corona',
      };
      batch.set(doc(db, 'empire_tiles', oId), outpostTile);
      seededOutposts++;
    }

    // Commit all writes at once in a single round-trip!
    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `สร้างบอสผู้พิทักษ์ใจกลางแผนที่ ${seededGuardians} ตัว และป้อมฟาร์มวิจัย ${seededOutposts} แห่งสำเร็จ!`,
      seededGuardians,
      seededOutposts
    });
  } catch (error: any) {
    console.error("Error seeding vault:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed vault' },
      { status: 500 }
    );
  }
}
