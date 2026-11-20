import { NextResponse } from 'next/server';
import { scrapeDongseoSchedule } from '@/lib/dongseo-crawler';
import { getDbAcademicSchedules, saveSchedulesToDb } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get('year');
  const targetYear = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
  const forceRefresh = searchParams.get('refresh') === 'true';

  // 1. 강제 새로고침이 아닐 때는 먼저 초고속 Supabase DB에서 조회
  if (!forceRefresh) {
    const dbSchedules = await getDbAcademicSchedules();
    const filtered = dbSchedules.filter(s => s.startDate.startsWith(String(targetYear)));

    if (filtered.length > 0) {
      return NextResponse.json({
        success: true,
        data: filtered,
        source: 'database',
        count: filtered.length,
      });
    }
  }

  // 2. DB에 데이터가 없거나 새로고침 요청일 경우 동서대 공식 홈페이지 실시간 크롤링
  const crawledSchedules = await scrapeDongseoSchedule(targetYear);

  // 3. 크롤링 성공 시 Supabase DB에 자동 저장(UPSERT 최신화)
  if (crawledSchedules.length > 0) {
    saveSchedulesToDb(crawledSchedules).catch(err => {
      console.warn('[Background DB Save Failed]', err);
    });
  }

  return NextResponse.json(
    {
      success: true,
      data: crawledSchedules,
      source: 'crawled',
      count: crawledSchedules.length,
      syncedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

