import { createClient } from '@supabase/supabase-js';
import { MealReview } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 로컬 인메모리 리뷰 저장소 (Supabase 키가 설정되지 않았을 때 폴백)
let localReviews: MealReview[] = [
  {
    id: 'rev-1',
    menuId: 'caf-1',
    restaurant: '학생식당',
    date: '2026-09-27',
    studentEmailMasked: 'kim***@dongseo.ac.kr',
    rating: 5,
    comment: '돈까스 바삭하고 소스도 진해서 오늘 완전 최고였습니다! 가성비 짱',
    createdAt: '2026-09-27T12:30:00Z',
  },
  {
    id: 'rev-2',
    menuId: 'caf-1',
    restaurant: '학생식당',
    date: '2026-09-27',
    studentEmailMasked: 'lee***@dongseo.ac.kr',
    rating: 4,
    comment: '미니 우동 국물이 조금 짰지만 돈까스는 매우 만족스러웠어요.',
    createdAt: '2026-09-27T12:45:00Z',
  },
  {
    id: 'rev-3',
    menuId: 'caf-2',
    restaurant: '학생식당',
    date: '2026-09-27',
    studentEmailMasked: 'park***@dongseo.ac.kr',
    rating: 4,
    comment: '김치찌개 고기 듬뿍 들어있어서 든든하게 먹었습니다.',
    createdAt: '2026-09-27T13:10:00Z',
  }
];

export async function getMealReviews(menuId?: string, restaurant?: string): Promise<MealReview[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('meal_reviews').select('*').order('created_at', { ascending: false });
      if (menuId) query = query.eq('menu_id', menuId);
      if (restaurant) query = query.eq('restaurant', restaurant);
      const { data, error } = await query;
      if (!error && data) {
        return data as MealReview[];
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
      const { data, error } = await supabase
        .from('meal_reviews')
        .insert([newReview])
        .select()
        .single();
      if (!error && data) {
        return data as MealReview;
      }
    } catch (e) {
      console.warn('Supabase insert failed, storing locally', e);
    }
  }

  localReviews.unshift(newReview);
  return newReview;
}
