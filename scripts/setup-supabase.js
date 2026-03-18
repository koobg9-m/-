#!/usr/bin/env node
/**
 * Supabase PC/모바일 동기화 설정 스크립트
 * 1. .env.local에 Supabase 변수 추가
 * 2. app_data 테이블 생성 SQL 출력
 */

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const envExample = path.join(__dirname, "..", ".env.example");

let envContent = "";
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, "utf8");
} else if (fs.existsSync(envExample)) {
  envContent = fs.readFileSync(envExample, "utf8");
  console.log("⚠ .env.local이 없어 .env.example을 기반으로 합니다.");
}

// Supabase 변수가 없거나 비어있으면 추가
const hasSupabaseUrl = /NEXT_PUBLIC_SUPABASE_URL\s*=\s*[^\s#]/.test(envContent);
const hasSupabaseKey = /NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*[^\s#]/.test(envContent);

if (!hasSupabaseUrl || !hasSupabaseKey) {
  // 기존 주석 처리된 Supabase 설정 제거 후 새로 추가
  envContent = envContent.replace(
    /#?\s*NEXT_PUBLIC_SUPABASE_URL.*\n#?\s*NEXT_PUBLIC_SUPABASE_ANON_KEY.*\n?/g,
    ""
  );
  envContent += `
# Supabase (PC/모바일 데이터 동기화)
# 1. https://supabase.com 에서 프로젝트 생성
# 2. Project Settings > API 에서 URL, anon key 복사
# 3. 아래 값 입력 후 이 스크립트 다시 실행
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
`;
  fs.writeFileSync(envPath, envContent.trim() + "\n");
  console.log("✅ .env.local에 Supabase 변수를 추가했습니다.");
  console.log("   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 값을 입력해 주세요.\n");
} else {
  console.log("✅ Supabase 환경 변수가 이미 설정되어 있습니다.\n");
}

console.log("📋 Supabase 대시보드에서 실행할 SQL:");
console.log("   https://supabase.com/dashboard → 프로젝트 선택 → SQL Editor\n");
console.log("--- 아래 SQL 복사 후 실행 ---\n");

const sqlPath = path.join(__dirname, "..", "supabase", "migrations", "20250314000000_app_data.sql");
const sql = fs.existsSync(sqlPath)
  ? fs.readFileSync(sqlPath, "utf8")
  : `CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER PUBLICATION supabase_realtime ADD TABLE app_data;
ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON app_data
  FOR ALL TO anon USING (true) WITH CHECK (true);`;

console.log(sql);
console.log("\n--- SQL 끝 ---\n");
console.log("실행 후 PC와 모바일에서 데이터가 동기화됩니다.");
