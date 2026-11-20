import { NextResponse } from 'next/server';
import { scrapeDongseoSchedule } from '@/lib/dongseo-crawler';

// Next.js 동적 라우트 설정 (캐시를 타지 않고 항상 실시간 최신 일정 반영)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const targetYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  // 2026년과 2027년 일정 모두 지원
  const schedules = await scrapeDongseoSchedule(targetYear);

  return NextResponse.json(
    {
      success: true,
      data: schedules,
      crawledAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

