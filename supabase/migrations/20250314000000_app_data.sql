-- 미미살롱펫: PC/모바일 실시간 데이터 동기화용 키-값 저장소
-- Supabase 대시보드 SQL Editor에서 실행하거나: supabase db push

CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Realtime 활성화 (변경 시 모든 클라이언트에 푸시)
-- Supabase 대시보드 Database > Replication에서도 활성화 가능
ALTER PUBLICATION supabase_realtime ADD TABLE app_data;

-- RLS 비활성화 (관리자/디자이너/고객 데이터는 앱 내부에서 구분)
-- 프로덕션에서는 Supabase Auth + RLS로 보안 강화 권장
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON app_data
  FOR ALL TO anon USING (true) WITH CHECK (true);

COMMENT ON TABLE app_data IS '미미살롱펫 공유 데이터 (디자이너, 예약, 고객 등) - PC/모바일 동기화';
