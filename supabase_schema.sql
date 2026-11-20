-- 동서대 캠퍼스 앱 학식 리뷰 테이블 생성 SQL
CREATE TABLE IF NOT EXISTS public.meal_reviews (
  id TEXT PRIMARY KEY,
  menu_id TEXT,
  restaurant TEXT NOT NULL,
  date TEXT NOT NULL,
  student_email_masked TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS(Row Level Security) 설정: 모든 사용자가 읽고 쓸 수 있도록 허용
ALTER TABLE public.meal_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON public.meal_reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert access"
  ON public.meal_reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ==============================================================
-- 📅 동서대 공식 학사일정 테이블 (초고속 조회 & 자동 동기화용)
-- ==============================================================
CREATE TABLE IF NOT EXISTS public.academic_schedules (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  category TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS: 모든 사용자가 조회 가능, 익명/인증 사용자 쓰기 및 업데이트 허용
ALTER TABLE public.academic_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for schedules"
  ON public.academic_schedules
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public upsert access for schedules"
  ON public.academic_schedules
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

