import { NextResponse } from 'next/server';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleRecalculation();
}

export async function POST() {
  return handleRecalculation();
}

/**
 * Normalizes any game's raw score/EXP to realistic balanced EXP values.
 * Catches all variants of gameId, casing, and raw Kahoot/Boss point inflations.
 */
function normalizeGameExp(gameId: string, rawExp: number): number {
  const gid = (gameId || '').toLowerCase().trim();

  // 1. Classroom battle / Kahoot:
  // Placement rewards: 1st=150, 2nd=120, 3rd=100, Top 10=75, Participation=50
  if (gid.includes('classroom') || gid.includes('kahoot') || gid.includes('class')) {
    if (rawExp >= 5000) return 150; // 1st place
    if (rawExp >= 3000) return 120; // 2nd place
    if (rawExp >= 1000) return 100; // 3rd place
    if (rawExp >= 150) return 150;
    if (rawExp > 50) return Math.min(rawExp, 150);
    return 50;
  }

  // 2. Empire sector / tile captures
  if (gid.includes('empire') || gid.includes('tile') || gid.includes('sector')) {
    if (rawExp >= 300) return 35; // Boss sector (balanced 35 EXP)
    if (rawExp > 60) return 30;   // Player sector
    return Math.min(rawExp, 35);
  }

  // 3. Raid Boss Battle (beating 5 bosses max)
  if (gid.includes('boss')) {
    return Math.min(rawExp, 300);
  }

  // 4. Lab Detective (6 clinical cases max)
  if (gid.includes('lab') || gid.includes('detective')) {
    return Math.min(rawExp, 300);
  }

  // 5. Virus Identification (25 questions max)
  if (gid.includes('ident')) {
    return Math.min(rawExp, 250);
  }

  // 6. Matching Game (6 pairs max)
  if (gid.includes('match')) {
    return Math.min(rawExp, 60);
  }

  // 7. Time Attack 60s
  if (gid.includes('time') || gid.includes('attack')) {
    return Math.min(rawExp, 200);
  }

  // 8. Outbreak Simulator (5 steps max)
  if (gid.includes('outbreak')) {
    return Math.min(rawExp, 100);
  }

  // 9. Other / unspecified games:
  if (rawExp > 150) return 100;
  return Math.max(0, rawExp);
}

async function handleRecalculation() {
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);

    const report: any[] = [];
    let totalUpdated = 0;
    let totalDuplicatesRemoved = 0;

    for (const uDoc of usersSnap.docs) {
      const uData = uDoc.data();
      const uid = uDoc.id;

      const oldExp = Number(uData.exp || 0);
      const oldLevel = Number(uData.level || 1);

      // 1. Fetch History Subcollection for this user
      const histRef = collection(db, 'users', uid, 'history');
      const histSnap = await getDocs(histRef);

      const parsedDocs: any[] = [];
      const duplicatesToDelete: string[] = [];

      if (!histSnap.empty) {
        for (const hDoc of histSnap.docs) {
          const h = hDoc.data();
          const gameId = (h.gameId || h.gameName || 'unknown').toLowerCase().trim();
          const rawExp = Number(h.expEarned !== undefined ? h.expEarned : (h.score || 0));
          const correctedExp = normalizeGameExp(gameId, rawExp);

          let timeMs = 0;
          if (h.playedAt) {
            if (typeof h.playedAt.toMillis === 'function') {
              timeMs = h.playedAt.toMillis();
            } else {
              timeMs = new Date(h.playedAt).getTime() || 0;
            }
          } else if (h.createdAt) {
            if (typeof h.createdAt.toMillis === 'function') {
              timeMs = h.createdAt.toMillis();
            } else {
              timeMs = new Date(h.createdAt).getTime() || 0;
            }
          }

          parsedDocs.push({
            id: hDoc.id,
            gameId,
            rawExp,
            correctedExp,
            timeMs
          });
        }
      }

      // 2. Intelligent Deduplication:
      // Group history items by game
      const validSessions: any[] = [];
      const gameGroups: Record<string, any[]> = {};

      for (const item of parsedDocs) {
        const key = item.gameId.includes('classroom') || item.gameId.includes('class') || item.gameId.includes('kahoot')
          ? 'classroom-battle'
          : item.gameId;
        if (!gameGroups[key]) gameGroups[key] = [];
        gameGroups[key].push(item);
      }

      for (const [key, items] of Object.entries(gameGroups)) {
        if (key === 'classroom-battle') {
          // Classroom Battle deduplication:
          // In the live test today, students played at most 1 or 2 matches.
          // Because of the snapshot loop bug, 20-40 duplicate documents were generated for that single match.
          // Sort items descending by correctedExp and keep at most the top 2 sessions.
          items.sort((a, b) => b.correctedExp - a.correctedExp);
          
          const kept = items.slice(0, 2);
          const dropped = items.slice(2);

          for (const k of kept) {
            validSessions.push(k);
          }
          for (const d of dropped) {
            duplicatesToDelete.push(d.id);
          }
        } else {
          // Other games: cluster entries occurring within 2 minutes into 1 session
          items.sort((a, b) => a.timeMs - b.timeMs);
          let lastTime = -1;
          for (const it of items) {
            if (it.timeMs > 0 && lastTime > 0 && Math.abs(it.timeMs - lastTime) < 120000) {
              duplicatesToDelete.push(it.id);
            } else {
              validSessions.push(it);
              lastTime = it.timeMs;
            }
          }
        }
      }

      // Delete duplicate history records from Firestore
      if (duplicatesToDelete.length > 0) {
        totalDuplicatesRemoved += duplicatesToDelete.length;
        await Promise.all(
          duplicatesToDelete.map(docId => deleteDoc(doc(db, 'users', uid, 'history', docId)).catch(() => {}))
        );
      }

      // Update remaining valid sessions with their corrected EXP if needed
      await Promise.all(
        validSessions.map(v => {
          if (v.rawExp !== v.correctedExp) {
            return updateDoc(doc(db, 'users', uid, 'history', v.id), {
              expEarned: v.correctedExp
            }).catch(() => {});
          }
          return Promise.resolve();
        })
      );

      // 3. Compute final EXP
      let calculatedExp = validSessions.reduce((sum, s) => sum + s.correctedExp, 0);
      let finalExp = calculatedExp;

      // Fallback if user had no history records at all
      if (validSessions.length === 0) {
        if (oldExp >= 5000) {
          finalExp = 175; // 1st place in classroom battle (150 + 25)
        } else if (oldExp >= 1000) {
          finalExp = 120;
        } else {
          finalExp = Math.max(0, oldExp);
        }
      }

      // Realistic Cap for 1-day testing session: max 800 EXP
      if (finalExp > 800) {
        finalExp = 800;
      }

      // 4. Calculate Level using Progressive RPG formula:
      // Level = Math.floor(Math.sqrt(finalExp / 40)) + 1
      const newLevel = Math.max(1, Math.floor(Math.sqrt(finalExp / 40)) + 1);

      // 5. Rebalance Pet Stats if allocated beyond new limit
      let updatedPet = undefined;
      if (uData.pet && uData.pet.stats) {
        const pet = uData.pet;
        const maxPoints = Math.floor(finalExp / 100);
        const currentSpent = Number(pet.stats.spentPoints || 0);

        if (currentSpent > maxPoints) {
          const ratio = maxPoints / Math.max(1, currentSpent);
          const newStr = 1 + Math.floor((Number(pet.stats.str || 1) - 1) * ratio);
          const newVit = 1 + Math.floor((Number(pet.stats.vit || 1) - 1) * ratio);
          const newAgi = 1 + Math.floor((Number(pet.stats.agi || 1) - 1) * ratio);
          const newDex = 1 + Math.floor((Number(pet.stats.dex || 1) - 1) * ratio);
          const actualSpent = (newStr - 1) + (newVit - 1) + (newAgi - 1) + (newDex - 1);

          updatedPet = {
            ...pet,
            stats: {
              ...pet.stats,
              str: newStr,
              vit: newVit,
              agi: newAgi,
              dex: newDex,
              spentPoints: actualSpent
            }
          };
        }
      }

      // 6. Update User Document in Firestore
      const userDocRef = doc(db, 'users', uid);
      const updatePayload: any = {
        exp: finalExp,
        score: finalExp,
        level: newLevel
      };
      if (updatedPet) {
        updatePayload.pet = updatedPet;
      }

      await updateDoc(userDocRef, updatePayload);
      totalUpdated++;

      report.push({
        uid,
        fullname: uData.fullname || uData.displayName || 'Student',
        email: uData.email,
        role: uData.role || 'student',
        oldExp,
        newExp: finalExp,
        expDiff: finalExp - oldExp,
        oldLevel,
        newLevel,
        historyCount: validSessions.length,
        duplicatesRemoved: duplicatesToDelete.length
      });
    }

    // 7. Sync Guild Total Tiles
    let guildsUpdated = 0;
    try {
      const [guildSnap, tilesSnap] = await Promise.all([
        getDocs(collection(db, 'guilds')),
        getDocs(collection(db, 'empire_tiles'))
      ]);

      const guildTilesCount: Record<string, number> = {};
      tilesSnap.forEach(tDoc => {
        const t = tDoc.data();
        if (t.type === 'player' && t.guildId) {
          guildTilesCount[t.guildId] = (guildTilesCount[t.guildId] || 0) + 1;
        }
      });

      for (const gDoc of guildSnap.docs) {
        const count = guildTilesCount[gDoc.id] || 0;
        await updateDoc(doc(db, 'guilds', gDoc.id), {
          totalTiles: count
        });
        guildsUpdated++;
      }
    } catch (ge) {
      console.error("Failed to sync guild tiles:", ge);
    }

    return NextResponse.json({
      success: true,
      message: `ปรับปรุงคะแนนและเลเวลสำเร็จสำหรับ ${totalUpdated} บัญชี (ลบประวัติซ้ำซ้อน ${totalDuplicatesRemoved} รายการ, ซิงค์กิลด์ ${guildsUpdated} กิลด์)`,
      timestamp: new Date().toISOString(),
      totalUsersProcessed: totalUpdated,
      totalDuplicatesRemoved,
      users: report
    });

  } catch (error: any) {
    console.error("Recalculation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
