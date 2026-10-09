import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';

export const DAILY_EXP_CAPS: Record<string, number> = {
  matching: 120,        // 2 ชนะเต็มรอบ (60x2)
  'time-attack': 150,   // ~15 ข้อถูก
  identification: 150,  // ~15 ข้อถูก
  'lab-detective': 150, // 3 เคสแล็บ (50x3)
  outbreak: 150,        // 1-2 ครั้ง
  'boss-battle': 150,   // พิชิต 3 บอส (50x3)
};

export interface DailyExpInfo {
  date: string;
  earnedToday: number;
  cap: number;
  remainingToday: number;
  isCapped: boolean;
}

export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Fetch the daily EXP progress for a specific user and game
 */
export const getDailyExpInfo = async (uid: string, gameId: string): Promise<DailyExpInfo> => {
  const cap = DAILY_EXP_CAPS[gameId] || 150;
  const today = getTodayDateString();
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) {
      return { date: today, earnedToday: 0, cap, remainingToday: cap, isCapped: false };
    }
    const data = userSnap.data();
    const dailyRecord = data.dailyGameExp;
    
    let earnedToday = 0;
    if (dailyRecord && dailyRecord.date === today) {
      earnedToday = Number(dailyRecord[gameId]) || 0;
    }
    
    const remainingToday = Math.max(0, cap - earnedToday);
    return {
      date: today,
      earnedToday,
      cap,
      remainingToday,
      isCapped: remainingToday <= 0,
    };
  } catch (err) {
    console.error("Failed to get daily EXP info:", err);
    return { date: today, earnedToday: 0, cap, remainingToday: cap, isCapped: false };
  }
};

/**
 * Safely awards EXP capped by the daily limit per mode.
 * Excess plays become Practice Mode (+0 EXP) while still recording score and history.
 */
export const awardDailyCappedExp = async (
  uid: string,
  gameId: string,
  gameName: string,
  rawScore: number,
  intendedExp: number
): Promise<{ awardedExp: number; isCapped: boolean; remainingCap: number }> => {
  const cap = DAILY_EXP_CAPS[gameId] || 150;
  const today = getTodayDateString();

  if (intendedExp <= 0) {
    return { awardedExp: 0, isCapped: false, remainingCap: cap };
  }

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return { awardedExp: 0, isCapped: false, remainingCap: cap };

    const data = userSnap.data();
    const dailyRecord = data.dailyGameExp || {};
    
    // Check if the record is from today or a new day
    const isToday = dailyRecord.date === today;
    const currentEarned = isToday ? (Number(dailyRecord[gameId]) || 0) : 0;
    
    const remainingCap = Math.max(0, cap - currentEarned);
    const actualExp = Math.min(intendedExp, remainingCap);
    const newEarned = currentEarned + actualExp;

    const updates: any = {};
    if (actualExp > 0) {
      updates.exp = increment(actualExp);
    }

    if (isToday) {
      updates[`dailyGameExp.${gameId}`] = newEarned;
    } else {
      // New day: re-initialize with today's date
      updates.dailyGameExp = {
        date: today,
        [gameId]: newEarned,
      };
    }

    await updateDoc(userRef, updates);

    // Save history log
    const historyCol = collection(db, 'users', uid, 'history');
    await addDoc(historyCol, {
      gameId,
      gameName,
      score: rawScore,
      expEarned: actualExp,
      playedAt: new Date().toISOString(),
      isPracticeMode: actualExp === 0 && intendedExp > 0,
    });

    return {
      awardedExp: actualExp,
      isCapped: newEarned >= cap,
      remainingCap: Math.max(0, cap - newEarned),
    };
  } catch (err) {
    console.error("Failed to award daily capped EXP:", err);
    return { awardedExp: 0, isCapped: false, remainingCap: cap };
  }
};
