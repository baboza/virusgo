import { NextResponse } from 'next/server';
import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ContinentId, Guild, HomeContinentId, User } from '@/types';
import { CONTINENTS, resolveGuildContinent, resolveUserContinent } from '@/lib/empireConstants';
import { buildContinentTilesQuery } from '@/lib/empireWorldEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleResetEmpire(request);
}

export async function POST(request: Request) {
  return handleResetEmpire(request);
}

async function commitDeletesInChunks(refs: ReturnType<typeof doc>[]) {
  const CHUNK_SIZE = 400;
  for (let i = 0; i < refs.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    for (const ref of refs.slice(i, i + CHUNK_SIZE)) {
      batch.delete(ref);
    }
    await batch.commit();
  }
}

async function handleResetEmpire(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetParam = (searchParams.get('continent') || '').toLowerCase();
    const wipeHistory = searchParams.get('wipeHistory') === 'true';

    // Safety Guard: Never accidentally wipe Year 3 (CAPSIDIA) or all continents without explicit query parameter!
    if (!targetParam) {
      return NextResponse.json(
        {
          success: false,
          error:
            'เพื่อป้องกันข้อมูลนิสิตชั้นปีที่ 3 (CAPSIDIA) สูญหาย กรุณาระบุพารามิเตอร์ ?continent=pangaea | hemoria | synapsia (หรือ ?continent=capsidia&confirmCapsidia=true)',
        },
        { status: 400 }
      );
    }

    if (targetParam === 'capsidia' && searchParams.get('confirmCapsidia') !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'ทวีป CAPSIDIA (ชั้นปีที่ 3) มีระบบป้องกันข้อมูลเดิม กรุณาเพิ่ม &confirmCapsidia=true หากต้องการรีเซ็ตจริง',
        },
        { status: 403 }
      );
    }

    if (targetParam === 'all' && searchParams.get('confirmAll') !== 'true') {
      return NextResponse.json(
        {
          success: false,
          error: 'การรีเซ็ตทุกทวีปพร้อมกันต้องระบุ &confirmAll=true เพื่อความปลอดภัยของข้อมูลนิสิตทุกชั้นปี',
        },
        { status: 403 }
      );
    }

    let deletedTilesCount = 0;
    let deletedGuildsCount = 0;
    let clearedUsersGuildCount = 0;
    let deletedEmpireHistoriesCount = 0;

    // Case A: Reset ONLY Pangaea World Map (Preserves 100% of CAPSIDIA, HEMORIA, SYNAPSIA & all Guilds!)
    if (targetParam === 'pangaea') {
      const pangaeaSnap = await getDocs(buildContinentTilesQuery('pangaea'));
      const refs = pangaeaSnap.docs.map((d) => doc(db, 'empire_tiles', d.id));
      await commitDeletesInChunks(refs);
      deletedTilesCount = refs.length;

      await setDoc(
        doc(db, 'game_content', 'empire_world_config'),
        { pangaeaUnlocked: false, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        continent: 'pangaea',
        message: `รีเซ็ตแผนที่มหาทวีป PANGAEA สำเร็จ: ลบเซกเตอร์บน Pangaea ${deletedTilesCount} ช่อง และล็อกสถานะชั่วคราว (ข้อมูลทวีปบ้านเกิด ปี 3 • 4 • 5 ปลอดภัย 100%)`,
        deletedTilesCount,
        deletedGuildsCount: 0,
        clearedUsersGuildCount: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // Case B: Reset a specific Home Continent (or 'all' with confirmAll=true)
    const targetContinents: ContinentId[] =
      targetParam === 'all'
        ? ['capsidia', 'hemoria', 'synapsia', 'pangaea']
        : (['capsidia', 'hemoria', 'synapsia'].includes(targetParam)
            ? [targetParam as HomeContinentId]
            : []);

    if (targetContinents.length === 0) {
      return NextResponse.json(
        { success: false, error: `ไม่รู้จักชื่อทวีป "${targetParam}"` },
        { status: 400 }
      );
    }

    // 1. Delete Empire Tiles for targeted continent(s) in 400-op batches
    for (const cid of targetContinents) {
      const snap = await getDocs(buildContinentTilesQuery(cid));
      const refs = snap.docs.map((d) => doc(db, 'empire_tiles', d.id));
      await commitDeletesInChunks(refs);
      deletedTilesCount += refs.length;
    }

    // 2. Delete Guilds belonging to targeted home continent(s)
    const guildsSnap = await getDocs(collection(db, 'guilds'));
    const guildDeleteRefs: ReturnType<typeof doc>[] = [];
    guildsSnap.forEach((gDoc) => {
      const g = gDoc.data() as Guild;
      const gCont = resolveGuildContinent(g);
      if (targetParam === 'all' || targetContinents.includes(gCont)) {
        guildDeleteRefs.push(doc(db, 'guilds', gDoc.id));
      }
    });
    await commitDeletesInChunks(guildDeleteRefs);
    deletedGuildsCount = guildDeleteRefs.length;

    // 3. Clear guildId / guildName ONLY for users belonging to targeted home continent(s)
    const usersSnap = await getDocs(collection(db, 'users'));
    const userUpdates: { uid: string; clearHistory: boolean }[] = [];
    usersSnap.forEach((uDoc) => {
      const uData = uDoc.data() as User;
      const uCont = resolveUserContinent(uData);
      if (targetParam === 'all' || targetContinents.includes(uCont)) {
        if (uData.guildId || uData.guildName) {
          userUpdates.push({ uid: uDoc.id, clearHistory: wipeHistory });
        } else if (wipeHistory) {
          userUpdates.push({ uid: uDoc.id, clearHistory: true });
        }
      }
    });

    const CHUNK = 400;
    for (let i = 0; i < userUpdates.length; i += CHUNK) {
      const batch = writeBatch(db);
      for (const item of userUpdates.slice(i, i + CHUNK)) {
        batch.update(doc(db, 'users', item.uid), { guildId: null, guildName: null });
        clearedUsersGuildCount++;
      }
      await batch.commit();
    }

    // 4. Optional Empire history cleanup (Skipped by default to conserve Firestore Reads!)
    if (wipeHistory) {
      for (const item of userUpdates) {
        const histSnap = await getDocs(collection(db, 'users', item.uid, 'history'));
        const histRefs: ReturnType<typeof doc>[] = [];
        histSnap.forEach((hDoc) => {
          const h = hDoc.data();
          const gid = (h.gameId || h.gameName || '').toLowerCase();
          if (gid.includes('empire') || gid.includes('sector') || gid.includes('tile')) {
            histRefs.push(doc(db, 'users', item.uid, 'history', hDoc.id));
          }
        });
        await commitDeletesInChunks(histRefs);
        deletedEmpireHistoriesCount += histRefs.length;
      }
    }

    const label = targetParam === 'all' ? 'ทุกทวีป' : CONTINENTS[targetParam as ContinentId]?.code || targetParam;

    return NextResponse.json({
      success: true,
      continent: targetParam,
      message: `รีเซ็ตข้อมูล Virus Empire (${label}) สำเร็จ: ลบเซกเตอร์ ${deletedTilesCount} ช่อง, ลบกิลด์ ${deletedGuildsCount} กิลด์, ล้างสังกัดกิลด์ ${clearedUsersGuildCount} บัญชี`,
      deletedTilesCount,
      deletedGuildsCount,
      clearedUsersGuildCount,
      deletedEmpireHistoriesCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error resetting Empire data:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset empire data' },
      { status: 500 }
    );
  }
}
