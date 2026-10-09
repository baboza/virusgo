import { NextResponse } from 'next/server';
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleResetEmpire();
}

export async function POST() {
  return handleResetEmpire();
}

async function handleResetEmpire() {
  try {
    let deletedTilesCount = 0;
    let deletedGuildsCount = 0;
    let clearedUsersGuildCount = 0;
    let deletedEmpireHistoriesCount = 0;

    // 1. Delete all Empire Tiles (both player captured and boss sectors)
    const tilesRef = collection(db, 'empire_tiles');
    const tilesSnap = await getDocs(tilesRef);
    if (!tilesSnap.empty) {
      await Promise.all(
        tilesSnap.docs.map(async (tDoc) => {
          await deleteDoc(doc(db, 'empire_tiles', tDoc.id));
          deletedTilesCount++;
        })
      );
    }

    // 2. Delete all Guilds
    const guildsRef = collection(db, 'guilds');
    const guildsSnap = await getDocs(guildsRef);
    if (!guildsSnap.empty) {
      await Promise.all(
        guildsSnap.docs.map(async (gDoc) => {
          await deleteDoc(doc(db, 'guilds', gDoc.id));
          deletedGuildsCount++;
        })
      );
    }

    // 3. Reset guildId and guildName from all Users
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    for (const uDoc of usersSnap.docs) {
      const uData = uDoc.data();
      const uid = uDoc.id;

      // Clear guild references from user profile
      if (uData.guildId || uData.guildName) {
        await updateDoc(doc(db, 'users', uid), {
          guildId: null,
          guildName: null,
        });
        clearedUsersGuildCount++;
      }

      // 4. Delete any Empire game history records
      const histRef = collection(db, 'users', uid, 'history');
      const histSnap = await getDocs(histRef);
      if (!histSnap.empty) {
        for (const hDoc of histSnap.docs) {
          const h = hDoc.data();
          const gid = (h.gameId || h.gameName || '').toLowerCase();
          if (gid.includes('empire') || gid.includes('sector') || gid.includes('tile')) {
            await deleteDoc(doc(db, 'users', uid, 'history', hDoc.id));
            deletedEmpireHistoriesCount++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `ลบข้อมูล Virus Empire สำเร็จเรียบร้อย: ลบเซกเตอร์แผนที่ ${deletedTilesCount} ช่อง, ลบกิลด์ ${deletedGuildsCount} กิลด์, ล้างสถานะกิลด์ในผู้ใช้ ${clearedUsersGuildCount} บัญชี, ลบประวัติการยึดเซกเตอร์ ${deletedEmpireHistoriesCount} รายการ`,
      deletedTilesCount,
      deletedGuildsCount,
      clearedUsersGuildCount,
      deletedEmpireHistoriesCount,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("Error resetting Empire data:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset empire data' },
      { status: 500 }
    );
  }
}
