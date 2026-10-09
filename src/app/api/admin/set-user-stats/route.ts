import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handleSetStats();
}

export async function POST() {
  return handleSetStats();
}

async function handleSetStats() {
  try {
    const uid = 'BgA7VanRmwYFd8KEABoUV69ixIE2'; // Baboza never.away@gmail.com
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const userData = userSnap.data();

    await updateDoc(userRef, {
      exp: 1000,
      score: 1000,
      level: 6,
    });

    return NextResponse.json({
      success: true,
      message: `ปรับแต่งผู้ใช้ ${userData.fullname || 'Baboza'} (${userData.email}) สำเร็จ: เลเวล 6, 1,000 EXP`,
      user: {
        uid,
        fullname: userData.fullname,
        email: userData.email,
        level: 6,
        exp: 1000
      }
    });
  } catch (error: any) {
    console.error("Error setting user stats:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user' },
      { status: 500 }
    );
  }
}
