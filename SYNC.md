# 로컬-서버 데이터 동기화

## 동기화 상태 확인

**관리자 페이지 → 대시보드** 상단에서 확인:
- **✓ 서버 동기화 정상**: Supabase 연결 성공
- **⚠ 오류 메시지**: 원인에 따라 조치 (아래 참고)
- **Supabase 미설정**: `.env.local` 또는 Vercel 환경 변수 확인

**서버에서 새로고침** 버튼: 데이터를 Supabase에서 다시 불러옴

## 동기화되는 데이터 (Supabase app_data)

| 키 | 내용 |
|----|------|
| `mimi_groomer_profiles` | 디자이너 프로필 목록 |
| `mimi_bookings` | 예약 목록 |
| `mimi_admin_settings` | 관리자 설정 (수수료율, 정산계좌 등) |

## 동기화되지 않는 데이터 (localStorage만)

- 관리자 비밀번호
- 디자이너 비밀번호
- 서비스 요금표 (가격)
- 포인트 설정
- 고객 프로필 (로그인 시 연락처/이메일 기준)

## 동기화 흐름

1. **읽기**: API(Supabase) → 실패 시 localStorage 폴백 (재시도 2회)
2. **쓰기**: localStorage 즉시 반영 + API(Supabase) 전송 (실패 시 1회 재시도)

## 필수 설정

### 1. .env.local (로컬 개발)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```
- `NEXT_PUBLIC_SKIP_SUPABASE=1` 이 있으면 **동기화 비활성화**됨 (삭제 필요)

### 2. Vercel 환경 변수
- Project Settings → Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정
- 설정 후 **Redeploy** 필수

### 3. Supabase app_data 테이블
SETUP.md의 SQL로 테이블 생성. 없으면 "app_data 테이블이 없습니다" 오류.

## 문제 해결

| 증상 | 조치 |
|------|------|
| Supabase 미설정 | .env.local / Vercel에 URL, anon key 설정 |
| app_data 테이블이 없습니다 | Supabase SQL Editor에서 SETUP.md의 CREATE TABLE 실행 |
| Write failed / Read failed | Supabase 대시보드 → app_data 테이블, RLS 정책 확인 |
| 로컬과 서버 데이터 다름 | "서버에서 새로고침" 클릭, F5 새로고침 |
| 입력한 데이터만 보임 | 동기화 정상이면 다른 기기에서도 보임. 새로고침 후 확인 |
