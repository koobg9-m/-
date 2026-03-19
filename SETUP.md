# 미미살롱펫 프로덕션 설정 가이드

데모가 아닌 **실제 서비스**로 운영하기 위한 설정입니다.

---

## 1. Supabase 프로젝트 생성

1. [Supabase 대시보드](https://supabase.com/dashboard) 접속
2. **New Project** 클릭
3. Organization 선택 (없으면 생성)
4. 프로젝트 이름: `mimisalon`
5. 데이터베이스 비밀번호 설정 (안전하게 저장)
6. 리전: **Northeast Asia (Seoul)** 권장
7. **Create new project** 클릭

---

## 2. app_data 테이블 생성

1. Supabase 대시보드 → **SQL Editor**
2. **New query** 클릭
3. 아래 SQL 붙여넣고 **Run** 실행:

```sql
CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for anon" ON app_data;
CREATE POLICY "Allow all for anon" ON app_data
  FOR ALL TO anon USING (true) WITH CHECK (true);
```

4. (선택) **Database** → **Replication** → `app_data` 테이블 추가 시 실시간 동기화 가능

---

## 3. Supabase Auth 설정 (이메일 로그인)

1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Email** 활성화 (기본 활성화됨)
3. **(권장) Custom SMTP 설정** – 기본 SMTP는 시간당 3통 제한. 프로덕션에서는 Custom SMTP 필수:
   - **Project Settings** → **Auth** → **SMTP Settings**
   - SendGrid, Resend, AWS SES 등 SMTP 서비스 설정
   - 설정 시 이메일 발송 한도가 크게 늘어남
5. **Authentication** → **URL Configuration**
6. **Site URL**: `https://mimisalon.vercel.app`
7. **Redirect URLs**에 추가:
   - `https://mimisalon.vercel.app/**`
   - `https://mimisalon.vercel.app/auth/callback`
   - `http://localhost:5006/**` (로컬 개발용)

---

## 4. Supabase API 키 복사

1. Supabase 대시보드 → **Project Settings** (톱니바퀴)
2. **API** 메뉴
3. 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 5. Vercel 환경 변수 설정

1. [Vercel mimisalon](https://vercel.com/koobg9-ms-projects/mimisalon) → **Settings** → **Environment Variables**
2. 아래 변수 추가 (Production, Preview, Development 모두 체크):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public 키 |

3. **삭제할 변수** (있다면):
   - `NEXT_PUBLIC_SKIP_SUPABASE` → 삭제
   - `NEXT_PUBLIC_DEMO_AUTH` → 삭제

4. **Save** 후 **Redeploy** (Deployments → 최신 배포 → Redeploy)

---

## 6. 로컬 .env.local 설정

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

`NEXT_PUBLIC_SKIP_SUPABASE`와 `NEXT_PUBLIC_DEMO_AUTH`는 **설정하지 않습니다**.

---

## 7. 배포

```powershell
npm run deploy
```

---

## 확인

- **이메일 로그인**: https://mimisalon.vercel.app/login → 이메일 입력 → 실제 로그인 링크 수신
- **데이터 동기화**: PC와 모바일에서 같은 디자이너/예약 데이터 공유
- **관리자**: https://mimisalon.vercel.app/admin (비밀번호 설정 필요)
