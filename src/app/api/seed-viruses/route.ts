import { NextResponse } from 'next/server';
import { seedViruses } from '@/lib/firebase/seedViruses';

export async function GET() {
  try {
    await seedViruses();
    return NextResponse.json({ success: true, message: 'Virus database seeded successfully!' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
