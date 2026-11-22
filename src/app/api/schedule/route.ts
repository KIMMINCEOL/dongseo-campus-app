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

  // 2. DB에 데이터가 없거나 새로고침 요청일 경우 동서대 공식 홈페이지 실시간 크롤링 시도
  let crawledSchedules: any[] = [];
  let crawlError: string | null = null;

  try {
    crawledSchedules = await scrapeDongseoSchedule(targetYear);
  } catch (err: any) {
    crawlError = err?.message || '동서대학교 일정 서버 응답 실패';
    console.error('[Schedule Crawl Exception]', err);
  }

  // 3. 크롤링 성공 시 (1건 이상의 일정을 정상 파싱한 경우)
  if (crawledSchedules && crawledSchedules.length > 0) {
    saveSchedulesToDb(crawledSchedules).catch(err => {
      console.warn('[Background DB Save Failed]', err);
    });

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

  // 4. 크롤링 실패 시 (결과가 0건이거나 네트워크/타임아웃 에러 발생):
  // 실패를 성공으로 처리하지 않고, 기존 DB 데이터가 있다면 폴백으로 제공하되 success: false로 알림
  const dbSchedules = await getDbAcademicSchedules();
  const fallback = dbSchedules.filter(s => s.startDate.startsWith(String(targetYear)));

  if (fallback.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: crawlError || '동서대학교 학사일정 서버 응답이 없어 기존 저장된 일정을 표시합니다.',
        data: fallback,
        source: 'fallback_database',
        count: fallback.length,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  }

  // 5. DB에도 데이터가 없고 크롤링도 실패한 경우: HTTP 502 에러 응답
  return NextResponse.json(
    {
      success: false,
      error: crawlError || '동서대학교 학사일정 서버가 응답하지 않아 일정을 불러올 수 없습니다.',
      data: [],
      source: 'failed',
      count: 0,
    },
    {
      status: 502,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

