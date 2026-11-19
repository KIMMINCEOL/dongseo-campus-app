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
