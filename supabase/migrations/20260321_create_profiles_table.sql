-- profiles 테이블 생성 함수
CREATE OR REPLACE FUNCTION create_profiles_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- profiles 테이블이 존재하지 않으면 생성
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      name TEXT,
      avatar_url TEXT,
      provider TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- RLS 정책 설정
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- 사용자가 자신의 프로필만 읽을 수 있도록 정책 설정
    CREATE POLICY "사용자는 자신의 프로필을 읽을 수 있음" ON public.profiles
      FOR SELECT USING (auth.uid() = id);

    -- 사용자가 자신의 프로필만 업데이트할 수 있도록 정책 설정
    CREATE POLICY "사용자는 자신의 프로필을 업데이트할 수 있음" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);

    -- 서비스 롤은 모든 프로필을 읽고 업데이트할 수 있음
    CREATE POLICY "서비스 롤은 모든 프로필을 읽을 수 있음" ON public.profiles
      FOR SELECT USING (auth.role() = 'service_role');

    CREATE POLICY "서비스 롤은 모든 프로필을 업데이트할 수 있음" ON public.profiles
      FOR UPDATE USING (auth.role() = 'service_role');

    CREATE POLICY "서비스 롤은 모든 프로필을 삽입할 수 있음" ON public.profiles
      FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
END;
$$;