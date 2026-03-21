# 이메일 로그인 (고객용 + 운영자 설정)

이메일 로그인은 **Supabase 기본 기능**이라 별도 SMS 서비스 없이 쓸 수 있습니다.

---

## 고객이 하는 일 — 이메일로 로그인할 때

**디자이너·관리자 절차가 아닙니다.** 예약·마이페이지 등에 쓰는 **일반 고객**만 해당합니다.

1. 사이트에서 **로그인** 메뉴로 이동 (`/login`).
2. **카카오로 시작** 대신 아래쪽에서 **이메일 주소**를 입력합니다.
3. **로그인 링크 받기**를 누릅니다.
4. 잠시 후 해당 이메일로 온 메일을 열고, 안에 있는 **로그인 링크**를 탭/클릭합니다.  
   - 받은 편지함에 없으면 **스팸함**도 확인합니다.
5. 브라우저가 열리면 로그인이 완료된 상태입니다. (예약 페이지로 가려면 예약 전에 로그인해 두면 됩니다.)

> 운영 쪽에서 **데모 모드**가 켜져 있으면 실제 메일이 가지 않고, 화면에 **「데모: 바로 로그인」** 같은 버튼만 보일 수 있습니다. 그때는 운영자에게 문의하세요.

**고객은 Supabase·Vercel 설정을 할 필요가 없습니다.** 아래부터는 **사이트 운영자**가 처음 한 번 하는 설정입니다.

---

## 운영자 전용 — 처음 설정하기

### 1단계: Supabase 프로젝트

1. https://supabase.com 가입/로그인
2. **New Project** 생성
3. 프로젝트 생성 완료 대기 (1~2분)

---

### 2단계: 이메일 Provider 확인

Supabase에서 **Email**은 기본 활성화되어 있습니다.

- **Authentication** → **Providers** → **Email** 확인
- 필요 시 **Confirm email** 끄면 이메일 인증 없이 바로 로그인 가능 (개발용)

---

### 3단계: Redirect URL 등록

1. Supabase 대시보드 → **Authentication** → **URL Configuration**
2. **Site URL** 은 실제로 쓰는 도메인(예: `https://mimisalon.vercel.app` 또는 커스텀 도메인)
3. **Redirect URLs**에 아래 추가(쿼리 `?next=` 포함 리다이렉트를 쓰므로 `**` 와일드카드 권장):
   - `http://localhost:5006/auth/callback**` (개발 — 이 프로젝트 dev 포트는 **5006**)
   - `https://mimisalon.vercel.app/auth/callback**` (Vercel)
   - `https://mimisalon.pet/auth/callback**` (커스텀 도메인 쓰는 경우)

---

### 4단계: .env.local 설정

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=실제_anon_키

# 데모 모드 끄기 (실제 이메일 사용)
NEXT_PUBLIC_DEMO_AUTH=false

# (선택) 콜백 주소를 직접 지정할 때만. 보통은 비워 두면 됨 — 코드가 localhost 에서
# 자동으로 https://mimisalon.vercel.app/auth/callback 으로 보냅니다.
# NEXT_PUBLIC_SITE_URL=https://mimisalon.vercel.app
# 로컬에서만 메일 링크를 localhost 로 받고 싶을 때: NEXT_PUBLIC_USE_LOCAL_AUTH_CALLBACK=1
```

**Project URL**과 **anon public** 키는 **Project Settings** → **API**에서 확인하세요.

---

### 5단계: 테스트 (운영자가 동작 확인)

1. `npm run dev` 실행 (포트 **5006**)
2. http://localhost:5006/login 접속
3. 이메일 주소 입력 → **로그인 링크 받기** 클릭
4. 받은 이메일에서 링크 클릭 → `/auth/callback` 을 거쳐 자동 로그인
5. 메일이 안 오면 스팸함 확인, Supabase **Auth → Logs**에서 발송·오류 확인

---

### 운영자: 이메일 로그인을 다시 시도할 때 체크리스트

| 확인 | 설명 |
|------|------|
| **데모 끄기** | `.env.local` 에 `NEXT_PUBLIC_DEMO_AUTH=false` 또는 변수 삭제. `true`면 실제 메일이 안 갑니다. |
| **Supabase 사용** | `NEXT_PUBLIC_SKIP_SUPABASE=1` 이 아니어야 합니다. |
| **Redirect URL** | 위 3단계 URL이 Supabase에 **정확히** 들어가 있는지(포트 5006, `**` 포함). **고객이 접속하는 주소**와 같아야 함 (`www` 유무, `http`/`https` 포함). |
| **Site URL** | Supabase **Authentication → URL Configuration → Site URL** 이 실제 서비스 도메인과 맞는지 (다르면 메일 속 링크가 엉뚱한 곳으로 갈 수 있음). |
| **스팸·지연** | 기본 SMTP는 시간당 통수 제한이 있을 수 있음. Custom SMTP 권장(운영). |
| **한도 초과** | [SETUP_BREVO_SMTP.md](./SETUP_BREVO_SMTP.md) — Brevo SMTP를 Supabase에 연결하는 **세부 단계**. |
| **메일에서 링크를 눌렀는데 안 될 때** | 메일 앱 **내장 브라우저**에서 토큰이 막히는 경우가 있음 → **Safari/Chrome 등으로 링크 열기** 시도. Supabase **Auth → Logs** 에서 오류 확인. |
| **다른 기기에서 링크 열기** | implicit 플로우로 교차 기기 동작을 맞춰 둠. 그래도 안 되면 위 Redirect·Site URL 재확인. |
| **ERR_CONNECTION_REFUSED · localhost** | 주소창이나 메일 링크가 `http://localhost:...` 인데 **개발 서버(`npm run dev`)가 꺼져 있으면** 브라우저가 거부합니다. **해결:** (1) **https://mimisalon.vercel.app/login** 에서 다시 「로그인 링크 받기」 (최신 코드는 로컬에서도 기본으로 배포 주소로 링크를 보냄). (2) Supabase **Authentication → URL Configuration → Site URL** 이 `https://mimisalon.vercel.app` 인지 확인(로컬만 있으면 메일이 엉뚱할 수 있음). (3) **Redirect URLs**에 `https://mimisalon.vercel.app/auth/callback**` 포함. |
| **`localhost:3000/#access_token` · 거부한 호스트** | Supabase 기본 예시는 포트 **3000**인데, 이 프로젝트 `npm run dev`는 **5006**입니다. 대시보드 **Site URL** 이 `http://localhost:3000` 이면 메일/리다이렉트가 3000으로 가서 연결 거부·호스트 불일치가 납니다. **해결:** Site URL 을 `http://localhost:5006` 로 바꾸거나 운영 도메인으로 두고, **Redirect URLs**에 `http://localhost:5006/auth/callback**` 추가. 로컬 콜백을 쓸 때는 `.env.local`에 `NEXT_PUBLIC_USE_LOCAL_AUTH_CALLBACK=1` 권장. |

---

### 데모 모드 (현재)

`NEXT_PUBLIC_DEMO_AUTH=true` 이면:

- 이메일 입력 후 **데모: 바로 로그인** 버튼으로 테스트
- 실제 메일 발송 없음
