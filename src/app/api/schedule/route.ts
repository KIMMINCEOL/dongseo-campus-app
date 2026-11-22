import { NextResponse } from 'next/server';
import { scrapeDongseoSchedule } from '@/lib/dongseo-crawler';
import { getDbAcademicSchedules, saveSchedulesToDb, getScheduleSyncMetadata } from '@/lib/supabase';
import { AcademicSchedule } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// 🛡️ 학교 서버 DoS / 과도한 크롤링 방지 쿨다운 (최소 10분)
const SYNC_COOLDOWN_MS = 10 * 60 * 1000;

// 🔒 중복 요청 방지용 서버 메모리 락 및 타임스탬프
const inFlightCrawls = new Map<number, Promise<AcademicSchedule[]>>();
const lastCrawlTimeMap = new Map<number, number>();

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

  // 2. 강제 새로고침 요청이라도 과도한 학교 사이트 트래픽을 방지하기 위한 10분 쿨다운 보호
  const now = Date.now();
  let lastSyncTime = lastCrawlTimeMap.get(targetYear) || 0;

  // 서버 재시작 직후 메모리가 비어있다면 Supabase DB의 updated_at 메타데이터 확인
  if (!lastSyncTime) {
    const meta = await getScheduleSyncMetadata(targetYear);
    if (meta.lastSyncedAt) {
      lastSyncTime = new Date(meta.lastSyncedAt).getTime();
      lastCrawlTimeMap.set(targetYear, lastSyncTime);
    }
  }

  const timeSinceLastSync = now - lastSyncTime;
  if (forceRefresh && lastSyncTime > 0 && timeSinceLastSync < SYNC_COOLDOWN_MS) {
    const dbSchedules = await getDbAcademicSchedules();
    const filtered = dbSchedules.filter(s => s.startDate.startsWith(String(targetYear)));

    if (filtered.length > 0) {
      const remainingSeconds = Math.ceil((SYNC_COOLDOWN_MS - timeSinceLastSync) / 1000);
      return NextResponse.json({
        success: true,
        data: filtered,
        source: 'database',
        throttled: true,
        message: `동서대 서버 보호를 위해 10분 쿨다운이 적용 중입니다. (${remainingSeconds}초 후 재갱신 가능)`,
        count: filtered.length,
        syncedAt: new Date(lastSyncTime).toISOString(),
      });
    }
  }

  // 3. 학교 사이트 실시간 크롤링 (동시 중복 요청은 1개의 Promise로 병합)
  let crawledSchedules: AcademicSchedule[] = [];
  let crawlError: string | null = null;

  try {
    let crawlPromise = inFlightCrawls.get(targetYear);
    if (!crawlPromise) {
      // 단 1회의 'm=all' 단일 요청으로 1년치 전체를 크롤링
      crawlPromise = scrapeDongseoSchedule(targetYear);
      inFlightCrawls.set(targetYear, crawlPromise);
    }

    crawledSchedules = await crawlPromise;
    lastCrawlTimeMap.set(targetYear, Date.now());
  } catch (err: any) {
    crawlError = err?.message || '동서대학교 일정 서버 응답 실패';
    console.error('[Schedule Crawl Exception]', err);
  } finally {
    inFlightCrawls.delete(targetYear);
  }

  // 4. 크롤링 성공 시 (1건 이상의 일정을 정상 파싱한 경우)
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

  // 5. 크롤링 실패 시: 기존 DB 데이터가 있다면 폴백으로 제공하되 success: false로 알림
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

  // 6. DB에도 데이터가 없고 크롤링도 실패한 경우: HTTP 502 에러 응답
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

