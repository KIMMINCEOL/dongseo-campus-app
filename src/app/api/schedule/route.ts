import { NextResponse } from 'next/server';
import { MOCK_SCHEDULE } from '@/lib/dongseo-crawler';

export async function GET() {
  return NextResponse.json({
    success: true,
    data: MOCK_SCHEDULE,
  });
}
