/**
 * Superbase (Supabase) Database Schema & Row Level Security (RLS) SQL
 * 
 * 아래 SQL 쿼리를 Supabase 대시보드의 'SQL Editor'에 붙여넣고 'RUN'을 실행하시면
 * 인가된 사용자 전용 테이블 생성, RLS 보안 정책 및 인덱스가 모두 자동 구성됩니다.
 */

export const SUPABASE_SETUP_SQL = `-- ==========================================================
-- 1. 일정(tasks) 테이블 생성
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  category_id TEXT NOT NULL,
  importance TEXT NOT NULL CHECK (importance IN ('A', 'B', 'C', 'D', 'E')),
  urgency TEXT NOT NULL CHECK (urgency IN ('상', '중', '하')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  all_day BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==========================================================
-- 2. 카테고리(categories) 테이블 생성
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  dot_color TEXT NOT NULL,
  badge_bg TEXT NOT NULL,
  badge_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==========================================================
-- 3. Row Level Security (RLS) 보안 활성화
-- (인가된 사용자만 본인 데이터에 접근 가능)
-- ==========================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 존재할 경우 삭제 후 재등록
DROP POLICY IF EXISTS "인가된 사용자 본인 일정 조회" ON public.tasks;
DROP POLICY IF EXISTS "인가된 사용자 일정 누적 저장 (INSERT)" ON public.tasks;
DROP POLICY IF EXISTS "인가된 사용자 본인 일정 수정" ON public.tasks;
DROP POLICY IF EXISTS "인가된 사용자 본인 일정 삭제" ON public.tasks;

-- 4. 일정(tasks) RLS 정책 설정
-- 조회 (SELECT): 인가된 사용자는 본인의 일정만 열람 가능
CREATE POLICY "인가된 사용자 본인 일정 조회" 
  ON public.tasks FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 누적 등록 (INSERT): CSV 대량 등록 및 개별 일정을 본인 계정으로 누적 저장
CREATE POLICY "인가된 사용자 일정 누적 저장 (INSERT)" 
  ON public.tasks FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- 수정 (UPDATE): 본인의 일정만 수정 가능
CREATE POLICY "인가된 사용자 본인 일정 수정" 
  ON public.tasks FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 삭제 (DELETE): 본인의 일정만 삭제 가능
CREATE POLICY "인가된 사용자 본인 일정 삭제" 
  ON public.tasks FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- 5. 카테고리(categories) RLS 정책 설정
DROP POLICY IF EXISTS "인가된 사용자 카테고리 조회" ON public.categories;
DROP POLICY IF EXISTS "인가된 사용자 카테고리 등록" ON public.categories;
DROP POLICY IF EXISTS "인가된 사용자 카테고리 수정" ON public.categories;
DROP POLICY IF EXISTS "인가된 사용자 카테고리 삭제" ON public.categories;

CREATE POLICY "인가된 사용자 카테고리 조회" 
  ON public.categories FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "인가된 사용자 카테고리 등록" 
  ON public.categories FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "인가된 사용자 카테고리 수정" 
  ON public.categories FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "인가된 사용자 카테고리 삭제" 
  ON public.categories FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- ==========================================================
-- 6. 인덱스 생성 (대용량 CSV 누적 데이터 조회 속도 최적화)
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks (user_id, date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_importance ON public.tasks (importance);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks (created_at DESC);
`;
