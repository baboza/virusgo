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
    let seededChests = 0;
    let seededGuardians = 0;

    // 1. Central Vault: 4 Golden Treasure Chests at (14,14), (14,15), (15,14), (15,15)
    const chestCoords = [
      { x: 14, y: 14 },
      { x: 14, y: 15 },
      { x: 15, y: 14 },
      { x: 15, y: 15 },
    ];

    for (const c of chestCoords) {
      const cId = `${c.x},${c.y}`;
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
      batch.set(doc(db, 'empire_tiles', cId), chestTile);
      seededChests++;
    }

    // 2. Fortress Perimeter: 2 concentric layers of Guardian Bosses surrounding the 4 central chests (perimeter of [12..17], [12..17] = 28 guardians)
    const guardianCoords: { x: number; y: number }[] = [];
    for (let gx = 12; gx <= 17; gx++) {
      for (let gy = 12; gy <= 17; gy++) {
        // Exclude the 4 center chests
        if ((gx === 14 || gx === 15) && (gy === 14 || gy === 15)) continue;
        guardianCoords.push({ x: gx, y: gy });
      }
    }

    const bossFamilies = ['corona', 'rabies', 'parvo', 'retro', 'orthomyxo'];

    for (const g of guardianCoords) {
      const gId = `${g.x},${g.y}`;
      const isInnerRing = (g.x === 13 || g.x === 16 || g.y === 13 || g.y === 16) && (g.x >= 13 && g.x <= 16 && g.y >= 13 && g.y <= 16);
      const guardianBoss: EmpireTile = {
        id: gId,
        x: g.x,
        y: g.y,
        type: 'boss',
        bossHp: isInnerRing ? 450 : 350,
        maxBossHp: isInnerRing ? 450 : 350,
        ownerName: isInnerRing ? 'ผู้พิทักษ์สมบัติชั้นใน (Vault Elite Guardian)' : 'ผู้พิทักษ์สมบัติชั้นนอก (Perimeter Guardian)',
        ownerFamily: bossFamilies[Math.floor(Math.random() * bossFamilies.length)],
      };
      batch.set(doc(db, 'empire_tiles', gId), guardianBoss);
      seededGuardians++;
    }

    // 3. Outposts: 4 Bio-Farm Outposts at (6,6), (23,6), (6,23), (23,23)
    const outpostCoords = [
      { x: 6, y: 6, name: 'ป้อมฟาร์มวิจัย (NW Outpost)' },
      { x: 23, y: 6, name: 'ป้อมฟาร์มวิจัย (NE Outpost)' },
      { x: 6, y: 23, name: 'ป้อมฟาร์มวิจัย (SW Outpost)' },
      { x: 23, y: 23, name: 'ป้อมฟาร์มวิจัย (SE Outpost)' },
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
        bossHp: 180,
        maxBossHp: 180,
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
      message: `สร้างหีบสมบัติใจกลางแผนที่ ${seededChests} กล่อง พร้อมบอสล้อมรอบ 2 ชั้น ${seededGuardians} ตัว และป้อมฟาร์มวิจัย ${seededOutposts} แห่งสำเร็จ!`,
      seededChests,
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
