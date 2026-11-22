import { createClient } from '@supabase/supabase-js';
import { MealReview, AcademicSchedule } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('your_supabase_project_url')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 서버 사이드 전용 어드민 클라이언트 (RLS 우회 및 안전한 UPSERT 보장)
export const supabaseAdmin = (isSupabaseConfigured && supabaseUrl && supabaseServiceRoleKey && (supabaseServiceRoleKey.startsWith('ey') || supabaseServiceRoleKey.startsWith('sb_secret_')))
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : supabase;

// 로컬 인메모리 리뷰 저장소 (Supabase 키가 설정되지 않았을 때 폴백 - 날짜 동적 생성)
const todayDateStr = new Date().toISOString().slice(0, 10);
const nowIso = new Date().toISOString();

let localReviews: MealReview[] = [
  {
    id: 'rev-1',
    menuId: 'caf-1',
    restaurant: '학생식당',
    date: todayDateStr,
    studentEmailMasked: 'kim***@dongseo.ac.kr',
    rating: 5,
    comment: '돈까스 바삭하고 소스도 진해서 오늘 완전 최고였습니다! 가성비 짱',
    createdAt: nowIso,
  },
  {
    id: 'rev-2',
    menuId: 'caf-1',
    restaurant: '학생식당',
    date: todayDateStr,
    studentEmailMasked: 'lee***@dongseo.ac.kr',
    rating: 4,
    comment: '미니 우동 국물이 조금 짰지만 돈까스는 매우 만족스러웠어요.',
    createdAt: nowIso,
  },
  {
    id: 'rev-3',
    menuId: 'caf-2',
    restaurant: '학생식당',
    date: todayDateStr,
    studentEmailMasked: 'park***@dongseo.ac.kr',
    rating: 4,
    comment: '김치찌개 고기 듬뿍 들어있어서 든든하게 먹었습니다.',
    createdAt: nowIso,
  }
];

// ==============================================================
// 🍽️ 학식 리뷰 타입 매핑 헬퍼 (DB snake_case <-> App camelCase)
// ==============================================================
function mapRowToMealReview(row: any): MealReview {
  return {
    id: row.id,
    menuId: row.menu_id ?? row.menuId,
    restaurant: row.restaurant,
    date: row.date,
    studentEmailMasked: row.student_email_masked ?? row.studentEmailMasked,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at ?? row.createdAt,
  };
}

function mapMealReviewToDbRow(review: MealReview) {
  return {
    id: review.id,
    menu_id: review.menuId,
    restaurant: review.restaurant,
    date: review.date,
    student_email_masked: review.studentEmailMasked,
    rating: review.rating,
    comment: review.comment,
    created_at: review.createdAt,
  };
}

export async function getMealReviews(menuId?: string, restaurant?: string): Promise<MealReview[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('meal_reviews').select('*').order('created_at', { ascending: false });
      if (menuId) query = query.eq('menu_id', menuId);
      if (restaurant) query = query.eq('restaurant', restaurant);
      const { data, error } = await query;
      if (!error && data) {
        return data.map(mapRowToMealReview);
      }
    } catch (e) {
      console.warn('Supabase fetch failed, using local reviews', e);
    }
  }

  // 폴백 반환
  let filtered = [...localReviews];
  if (menuId) filtered = filtered.filter(r => r.menuId === menuId);
  if (restaurant) filtered = filtered.filter(r => r.restaurant === restaurant);
  return filtered;
}

export async function addMealReview(review: Omit<MealReview, 'id' | 'createdAt'>): Promise<MealReview> {
  const newReview: MealReview = {
    ...review,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const dbRow = mapMealReviewToDbRow(newReview);
      const { data, error } = await supabase
        .from('meal_reviews')
        .insert([dbRow])
        .select()
        .single();
      if (!error && data) {
        return mapRowToMealReview(data);
      }
    } catch (e) {
      console.warn('Supabase insert failed, storing locally', e);
    }
  }

  localReviews.unshift(newReview);
  return newReview;
}

// ==============================================================
// 📅 학사일정 Supabase DB 함수 (초고속 DB 조회 & 스마트 동기화)
// ==============================================================

export async function getDbAcademicSchedules(): Promise<AcademicSchedule[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('academic_schedules')
        .select('*')
        .order('start_date', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          title: row.title,
          startDate: row.start_date,
          endDate: row.end_date,
          category: row.category,
          isImportant: row.is_important,
        }));
      }
    } catch (e) {
      console.warn('[Supabase Schedule fetch failed]', e);
    }
  }
  return [];
}

export async function saveSchedulesToDb(schedules: AcademicSchedule[]): Promise<boolean> {
  const client = supabaseAdmin || supabase;
  if (!isSupabaseConfigured || !client || schedules.length === 0) return false;

  try {
    const rows = schedules.map(s => ({
      id: s.id,
      title: s.title,
      start_date: s.startDate,
      end_date: s.endDate,
      category: s.category,
      is_important: s.isImportant ?? false,
      updated_at: new Date().toISOString(),
    }));

    // id 기준으로 중복 없이 UPSERT 갱신
    const { error } = await client
      .from('academic_schedules')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('[Supabase Schedule Upsert Error]', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[Supabase Schedule Save Exception]', e);
    return false;
  }
}

// 🕒 연도별 마지막 동기화 시간 및 데이터 건수 조회 (서버 쿨다운 판정용)
export async function getScheduleSyncMetadata(year: number): Promise<{ lastSyncedAt: string | null; count: number }> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('academic_schedules')
        .select('updated_at')
        .like('start_date', `${year}%`)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0 && data[0].updated_at) {
        return { lastSyncedAt: data[0].updated_at, count: data.length };
      }
    } catch (e) {
      console.warn('[Sync metadata check failed]', e);
    }
  }
  return { lastSyncedAt: null, count: 0 };
}
