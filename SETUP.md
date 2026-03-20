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
7. **Redirect URLs**에 추가 (하나라도 빠지면 로그인 후 “인증 실패”가 날 수 있음):
   - `https://mimisalon.vercel.app/**`
   - `https://mimisalon.vercel.app/auth/callback`
   - `http://localhost:5006/**` (로컬 개발용)
   - (쿼리 포함) `https://mimisalon.vercel.app/auth/callback**` — 이메일/카카오가 `?next=/booking` 형태로 돌아올 때 필요할 수 있음

---

## 3-1. 카카오 로그인 (Supabase 연동)

앱의 「카카오로 로그인」은 **Supabase Auth → Kakao** 를 거칩니다. **카카오 개발자 콘솔의 Redirect URI는 사이트 주소가 아니라 Supabase 콜백**이어야 합니다.

1. [Kakao Developers](https://developers.kakao.com/) → 내 애플리케이션 → **Kakao Login** 활성화
2. **Redirect URI**에 정확히 추가:
   - `https://<프로젝트-ref>.supabase.co/auth/v1/callback`
   - `<프로젝트-ref>`는 Supabase **Project Settings → API → Project URL** 에서 `https://xxxxx.supabase.co` 의 `xxxxx` 부분
3. Supabase 대시보드 → **Authentication** → **Providers** → **Kakao** → **Enable**
   - **Client ID**: 카카오 앱의 **REST API 키** (또는 문서에 안내된 키)
   - **Client Secret**: 카카오 **보안 → Client Secret** (발급 후 입력)
4. 저장 후 Vercel에 **재배포** (환경 변수·프로바이더 변경 후 캐시 반영)

> `redirect_uri_mismatch` 오류 → 카카오 Redirect URI 가 위 Supabase URL 과 **글자 하나라도 다르면** 발생합니다.

---

## 3-2. 이메일 로그인이 운영에서만 안 될 때

| 증상 | 조치 |
|------|------|
| 메일이 안 옴 | Supabase **기본 SMTP는 시간당 3통 제한**. **Project Settings → Auth → SMTP** 에 SendGrid/Resend 등 **Custom SMTP** 설정 권장 |
| 스팸함만 옴 | 발신 도메인 SPF/DKIM 설정 (SMTP 업체 안내) |
| 링크 누르면 “인증 실패” | **Authentication → URL Configuration** 의 **Site URL·Redirect URLs** 에 `https://mimisalon.vercel.app/auth/callback` 포함 여부 확인 |
| `rate limit` | 같은 이메일로 반복 요청 → 1시간 후 재시도 또는 SMTP 설정 |

---

## 3-3. 로그인 방식 (앱 UI)

로그인 화면은 **카카오톡**과 **이메일(매직 링크)** 만 제공합니다. 휴대폰 SMS OTP 로그인은 사용하지 않습니다. (예약·고객 정보에 전화번호를 입력하는 기능과는 별개입니다.)

**Supabase 대시보드**의 **Authentication → Providers → Phone** 이 켜져 있으면 “휴대폰 로그인”처럼 보일 수 있지만, **앱 UI에서는 Phone 로그인을 호출하지 않습니다.** 혼동을 줄이려면 Phone Provider를 **비활성화**해 두어도 됩니다.

배포 후 `/api/version` 응답의 `customerLoginMethods` 가 `["kakao","email"]` 이고 `customerPhoneOtpLogin` 이 `false` 이면 서버 설정이 최신입니다.

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
- **카카오 로그인**: 위 **3-1** 설정 후 로그인 버튼 → 카카오 동의 → `/auth/callback` 을 거쳐 홈(또는 `?redirect=` 목적지)으로 이동
- **데이터 동기화**: PC와 모바일에서 같은 디자이너/예약 데이터 공유
- **관리자**: 로컬에서만 사용 시 운영 `/admin` 은 차단될 수 있음 (프로젝트 설정 참고)

문제가 계속되면 브라우저 **개발자 도구 → Network/Console** 오류 메시지와 Supabase **Authentication → Logs** 를 함께 확인하세요.
