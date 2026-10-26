import { NextResponse } from 'next/server';
import { ContinentId, HomeContinentId } from '@/types';
import { CONTINENTS } from '@/lib/empireConstants';
import { executePangaeaTectonicMerge, seedContinentVaultAndOutposts } from '@/lib/empireWorldEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleSeedVault(request);
}

export async function POST(request: Request) {
  return handleSeedVault(request);
}

async function handleSeedVault(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawContinent = (searchParams.get('continent') || 'capsidia').toLowerCase() as ContinentId;

    if (rawContinent === 'pangaea') {
      const mergeResult = await executePangaeaTectonicMerge(true);
      return NextResponse.json({
        success: true,
        continent: 'pangaea',
        message: `เปิดศึกมหาทวีป PANGAEA สำเร็จ! รวมแผ่นดินและฐานทัพผู้เล่น ${mergeResult.copiedPlayerTiles} ช่อง (ทั้งหมด ${mergeResult.totalOperations} รายการ)`,
        ...mergeResult,
      });
    }

    const validContinents: HomeContinentId[] = ['capsidia', 'hemoria', 'synapsia'];
    const targetContinent: HomeContinentId = validContinents.includes(rawContinent as HomeContinentId)
      ? (rawContinent as HomeContinentId)
      : 'capsidia';

    const { seededGuardians, seededOutposts } = await seedContinentVaultAndOutposts(targetContinent);
    const meta = CONTINENTS[targetContinent];

    return NextResponse.json({
      success: true,
      continent: targetContinent,
      message: `สร้างบอสผู้พิทักษ์ใจกลางทวีป ${meta.code} (ปี ${meta.year}) จำนวน ${seededGuardians} ตัว และป้อมฟาร์มวิจัย ${seededOutposts} แห่งสำเร็จ!`,
      seededGuardians,
      seededOutposts,
    });
  } catch (error: any) {
    console.error("Error seeding vault:", error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed vault' },
      { status: 500 }
    );
  }
}
