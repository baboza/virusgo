import {
  collection,
  doc,
  documentId,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ContinentId, EmpireTile, Guild, HomeContinentId } from '@/types';
import {
  CONTINENTS,
  HOME_CONTINENT_ORDER,
  stripTileDocPrefix,
  toTileDocId,
  translateHomeCoordToPangaea,
} from '@/lib/empireConstants';

export function buildContinentTilesQuery(continentId: ContinentId) {
  const colRef = collection(db, 'empire_tiles');
  if (continentId === 'capsidia') {
    // Matches 100% of legacy & new Year 3 "x,y" doc IDs ("0,0" .. "49,49") with built-in __name__ index
    return query(colRef, where(documentId(), '>=', '0'), where(documentId(), '<=', '9~'));
  }
  return query(colRef, where('continentId', '==', continentId));
}

/**
 * Seeds the 32 Central Vault Guardians + 4 Bio-Farm Outposts on a 50x50 Home Continent (<=36 Writes total).
 * Skips any coordinate already conquered by a student (`type === 'player'`) so Year 3 / active continents are 100% protected.
 */
export async function seedContinentVaultAndOutposts(
  continentId: HomeContinentId,
  skipExistingCheck: boolean = false
) {
  const playerOwnedCoords = new Set<string>();
  if (!skipExistingCheck) {
    const existingSnap = await getDocs(buildContinentTilesQuery(continentId));
    existingSnap.forEach((docSnap) => {
      const raw = docSnap.data() as EmpireTile;
      if (raw?.type === 'player') {
        playerOwnedCoords.add(stripTileDocPrefix(raw.id || docSnap.id));
      }
    });
  }

  const batch = writeBatch(db);
  const cMeta = CONTINENTS[continentId];
  const bossFamilies = ['corona', 'rabies', 'parvo', 'retro', 'orthomyxo'];
  let seededGuardians = 0;

  for (let gx = 22; gx <= 27; gx++) {
    for (let gy = 22; gy <= 27; gy++) {
      if ((gx === 24 || gx === 25) && (gy === 24 || gy === 25)) continue;
      const coord = `${gx},${gy}`;
      if (playerOwnedCoords.has(coord)) continue;
      const docId = toTileDocId(continentId, coord);
      const isInnerRing = gx >= 23 && gx <= 26 && gy >= 23 && gy <= 26;

      const guardianTile: EmpireTile = {
        id: coord,
        x: gx,
        y: gy,
        continentId,
        type: 'boss',
        bossHp: isInnerRing ? 2000 : 1400,
        maxBossHp: isInnerRing ? 2000 : 1400,
        ownerName: isInnerRing
          ? `ผู้พิทักษ์ชั้นในแห่ง ${cMeta.code}`
          : `ผู้พิทักษ์ชั้นนอกแห่ง ${cMeta.code}`,
        ownerFamily: bossFamilies[(gx * 7 + gy * 3) % bossFamilies.length],
      };

      batch.set(doc(db, 'empire_tiles', docId), guardianTile);
      seededGuardians++;
    }
  }

  const outpostCoords = [
    { x: 10, y: 10, name: `ป้อมฟาร์มวิจัย NW (${cMeta.code})` },
    { x: 39, y: 10, name: `ป้อมฟาร์มวิจัย NE (${cMeta.code})` },
    { x: 10, y: 39, name: `ป้อมฟาร์มวิจัย SW (${cMeta.code})` },
    { x: 39, y: 39, name: `ป้อมฟาร์มวิจัย SE (${cMeta.code})` },
  ];

  let seededOutposts = 0;
  for (const o of outpostCoords) {
    const coord = `${o.x},${o.y}`;
    if (playerOwnedCoords.has(coord)) continue;
    const docId = toTileDocId(continentId, coord);
    const outpostTile: EmpireTile = {
      id: coord,
      x: o.x,
      y: o.y,
      continentId,
      type: 'outpost',
      isOutpost: true,
      dailyExp: 100,
      bossHp: 800,
      maxBossHp: 800,
      ownerName: o.name,
      ownerFamily: 'corona',
    };
    batch.set(doc(db, 'empire_tiles', docId), outpostTile);
    seededOutposts++;
  }

  if (seededGuardians > 0 || seededOutposts > 0) {
    await batch.commit();
  }
  return { seededGuardians, seededOutposts };
}

/**
 * Civilization-Style Option A: Tectonic World Merge
 * Translates all player bases, structures, outposts, and 2x2 Guild Citadels from
 * CAPSIDIA (Year 3), HEMORIA (Year 4), and SYNAPSIA (Year 5) onto the 120x120 PANGAEA World Map,
 * connected by 3 strategic land bridges into the Central Pangaea World Core.
 */
export async function executePangaeaTectonicMerge(unlockForStudents: boolean = true) {
  const operations: { collectionName: 'empire_tiles' | 'guilds'; docId: string; data: any; merge?: boolean }[] = [];
  let copiedPlayerTiles = 0;

  // 1. Lift & Translate all 3 Home Continents onto Pangaea
  for (const homeId of HOME_CONTINENT_ORDER) {
    const snap = await getDocs(buildContinentTilesQuery(homeId));
    snap.forEach((docSnap) => {
      const raw = docSnap.data() as EmpireTile;
      if (!raw || raw.type === 'empty') return;

      const cleanCoord = stripTileDocPrefix(raw.id || docSnap.id);
      const pangaeaCoord = translateHomeCoordToPangaea(homeId, cleanCoord);
      const [px, py] = pangaeaCoord.split(',').map(Number);
      if (isNaN(px) || isNaN(py)) return;

      const mergedTile: Record<string, any> = {
        ...raw,
        id: pangaeaCoord,
        x: px,
        y: py,
        continentId: 'pangaea',
        originContinent: homeId,
        terrain: 'continent',
      };

      // Grant 24h Homeland Convergence Shield on Capital bases when Tectonic Merge happens
      if (raw.type === 'player' && raw.isCapital) {
        mergedTile.shieldUntil = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      }

      Object.keys(mergedTile).forEach((k) => {
        if (mergedTile[k] === undefined) delete mergedTile[k];
      });

      operations.push({
        collectionName: 'empire_tiles',
        docId: toTileDocId('pangaea', pangaeaCoord),
        data: mergedTile,
      });

      if (raw.type === 'player') copiedPlayerTiles++;
    });
  }

  // 2. Translate Guild 2x2 Citadel Coordinates for Pangaea
  const guildSnap = await getDocs(collection(db, 'guilds'));
  guildSnap.forEach((gDoc) => {
    const g = gDoc.data() as Guild;
    const homeCont: HomeContinentId =
      g.continentId === 'hemoria' || g.continentId === 'synapsia' ? g.continentId : 'capsidia';

    if (g.citadelCoord || (Array.isArray(g.citadelCoords) && g.citadelCoords.length > 0)) {
      const pangaeaCitadelCoord = g.citadelCoord
        ? translateHomeCoordToPangaea(homeCont, g.citadelCoord)
        : undefined;
      const pangaeaCitadelCoords = Array.isArray(g.citadelCoords)
        ? g.citadelCoords.map((c) => translateHomeCoordToPangaea(homeCont, c))
        : undefined;

      operations.push({
        collectionName: 'guilds',
        docId: gDoc.id,
        data: {
          continentId: homeCont,
          ...(pangaeaCitadelCoord ? { pangaeaCitadelCoord } : {}),
          ...(pangaeaCitadelCoords ? { pangaeaCitadelCoords } : {}),
        },
        merge: true,
      });
    }
  });

  // 3. Seed the Central Pangaea World Core (57..62, 57..62) & 4 Heartland Bridge Outposts
  const bossFamilies = ['rabies', 'corona', 'parvo', 'retro', 'asfar'];
  for (let gx = 57; gx <= 62; gx++) {
    for (let gy = 57; gy <= 62; gy++) {
      const coord = `${gx},${gy}`;
      const isApexCore = gx >= 59 && gx <= 60 && gy >= 59 && gy <= 60;
      operations.push({
        collectionName: 'empire_tiles',
        docId: toTileDocId('pangaea', coord),
        data: {
          id: coord,
          x: gx,
          y: gy,
          continentId: 'pangaea',
          terrain: 'core',
          type: 'boss',
          bossHp: isApexCore ? 4500 : 2600,
          maxBossHp: isApexCore ? 4500 : 2600,
          ownerName: isApexCore
            ? '👑 จักรพรรดิไวรัสบรรพกาล (Pangaea World Core)'
            : '⚡ ผู้พิทักษ์มหาวิหารกลางโลก (Pangaea Guardian)',
          ownerFamily: bossFamilies[(gx + gy) % bossFamilies.length],
        },
      });
    }
  }

  const coreOutposts = [
    { x: 54, y: 54, name: 'ป้อมยุทธศาสตร์เกาะกลาง NW (+150 EXP)' },
    { x: 65, y: 54, name: 'ป้อมยุทธศาสตร์เกาะกลาง NE (+150 EXP)' },
    { x: 54, y: 65, name: 'ป้อมยุทธศาสตร์เกาะกลาง SW (+150 EXP)' },
    { x: 65, y: 65, name: 'ป้อมยุทธศาสตร์เกาะกลาง SE (+150 EXP)' },
  ];
  for (const co of coreOutposts) {
    const coord = `${co.x},${co.y}`;
    operations.push({
      collectionName: 'empire_tiles',
      docId: toTileDocId('pangaea', coord),
      data: {
        id: coord,
        x: co.x,
        y: co.y,
        continentId: 'pangaea',
        terrain: 'core',
        type: 'outpost',
        isOutpost: true,
        dailyExp: 150,
        bossHp: 1400,
        maxBossHp: 1400,
        ownerName: co.name,
        ownerFamily: 'rabies',
      },
    });
  }

  // 4. Commit in safe chunks of 400 operations per Firestore WriteBatch
  const CHUNK_SIZE = 400;
  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    const slice = operations.slice(i, i + CHUNK_SIZE);
    for (const op of slice) {
      const ref = doc(db, op.collectionName, op.docId);
      if (op.merge) {
        batch.set(ref, op.data, { merge: true });
      } else {
        batch.set(ref, op.data);
      }
    }
    await batch.commit();
  }

  // 5. Update Global World Config in game_content/empire_world_config
  await setDoc(
    doc(db, 'game_content', 'empire_world_config'),
    {
      pangaeaUnlocked: unlockForStudents,
      lastMergedAt: new Date().toISOString(),
      totalMergedTiles: operations.length,
      copiedPlayerTiles,
    },
    { merge: true }
  );

  return {
    totalOperations: operations.length,
    copiedPlayerTiles,
    pangaeaUnlocked: unlockForStudents,
  };
}

/**
 * 1-Click Safe Revert / Reset of PANGAEA Test or Event:
 * - Deletes ONLY `pangaea_*` documents (`continentId == 'pangaea'`) in 400-op batches.
 * - Locks `pangaeaUnlocked: false` in `game_content/empire_world_config`.
 * - Leaves 100% of CAPSIDIA (Year 3), HEMORIA (Year 4), SYNAPSIA (Year 5), Guilds, and Users untouched!
 */
export async function revertPangaeaTectonicMerge() {
  const pangaeaSnap = await getDocs(buildContinentTilesQuery('pangaea'));
  const docs = pangaeaSnap.docs;

  const CHUNK_SIZE = 400;
  for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
    const batch = writeBatch(db);
    for (const d of docs.slice(i, i + CHUNK_SIZE)) {
      batch.delete(doc(db, 'empire_tiles', d.id));
    }
    await batch.commit();
  }

  await setDoc(
    doc(db, 'game_content', 'empire_world_config'),
    {
      pangaeaUnlocked: false,
      totalMergedTiles: 0,
      copiedPlayerTiles: 0,
      lastRevertedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  return {
    deletedTilesCount: docs.length,
  };
}
