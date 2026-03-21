# Brevo SMTP → Supabase 연결 (이메일 한도 넉넉하게)

Supabase **기본 이메일**은 시간당 발송 수가 매우 적습니다.  
**Brevo**(구 Sendinblue) SMTP를 쓰면 무료 플랜에서도 **일일 수백 통** 수준으로 쓰는 경우가 많습니다. (정책은 Brevo·Supabase 최신 약관 기준)

---

## A. Brevo 쪽 준비

### 1) 가입

1. 브라우저에서 **https://www.brevo.com** 접속  
2. **Sign up** / 가입 후 로그인  

### 2) SMTP 정보 확인

1. 로그인 후 오른쪽 위 **이름 또는 톱니바퀴** → **SMTP & API** (또는 **Settings → SMTP & API**)  
2. **SMTP** 탭 선택  
3. 아래를 메모해 둡니다. (화면에 그대로 나옵니다)

| 항목 | 보통의 값 |
|------|-----------|
| **SMTP server** | `smtp-relay.brevo.com` |
| **Port** | `587` (권장) 또는 `465` |
| **Login** | Brevo에 표시된 **이메일 주소** (SMTP login) |
| **Password** | **SMTP key** (비밀번호처럼 보이는 긴 키 — **재발급·복사** 가능) |

> **주의:** “API key”와 “SMTP key”는 다를 수 있습니다. **SMTP** 화면에 나온 **SMTP key**를 쓰세요.

### 3) 발신 주소 (Sender)

- **처음에는** Brevo 가입에 쓴 **이메일 주소**를 발신자로 쓰는 것이 가장 간단합니다.  
- 나중에 `noreply@본인도메인.com` 을 쓰려면 Brevo에서 **도메인 인증**을 추가로 진행하면 됩니다.

---

## B. Supabase 쪽 연결 (핵심)

### 1) 프로젝트 열기

1. **https://supabase.com/dashboard** 로그인  
2. **프로젝트** 선택 (예: `cykzrqbifpvuwdsbzyzy` 프로젝트)

### 2) SMTP 설정 화면으로 이동

아래 **둘 중 하나**로 들어갑니다. (대시보드 버전에 따라 이름이 조금 다를 수 있음)

- **방법 1:** 왼쪽 **Project Settings**(톱니바퀴) → **Authentication** → 아래로 스크롤 → **SMTP Settings**  
- **방법 2:** 주소창에 직접 (프로젝트 ID만 본인 것으로):

```text
https://supabase.com/dashboard/project/프로젝트ID/settings/auth
```

열린 페이지에서 **SMTP** / **Custom SMTP** / **Enable Custom SMTP** 관련 블록을 찾습니다.

### 3) 값 입력

1. **Enable Custom SMTP** (또는 **Use custom SMTP**) 를 **켭니다** (체크).  
2. 아래처럼 입력합니다.

| Supabase 필드 | 넣을 값 |
|----------------|---------|
| **Sender email** | Brevo에서 쓸 **발신 이메일** (가입 이메일 가능) |
| **Sender name** | 예: `미미살롱펫` |
| **Host** | `smtp-relay.brevo.com` |
| **Port** | `587` |
| **Username** | Brevo **SMTP Login** (이메일) |
| **Password** | Brevo **SMTP key** |
| **Minimum interval between emails** | 기본값 두거나, 스팸 방지용으로 **몇 초** 설정 가능 |

3. **Save** / **저장** 을 누릅니다.

### 4) 동작 확인

1. **https://mimisalon.vercel.app/login** 접속  
2. 본인 이메일 입력 → **로그인 링크 받기**  
3. 메일함(스팸함 포함)에서 메일 수신 확인  
4. 문제 있으면 Supabase → **Authentication** → **Logs** 에서 오류 확인  

---

## C. 자주 나는 이슈

| 현상 | 확인 |
|------|------|
| 여전히 한도 메시지 | 저장 직후 **몇 분** 걸릴 수 있음. 한도 해제까지 **시간** 두고 재시도. |
| 메일이 안 옴 | 발신 이메일이 Brevo에 **허용된 발신자**인지, 스팸함, Brevo 대시보드 **통계/로그** |
| 인증 실패 | Host/Port/Login/**SMTP key** 오타, **587** 방화벽 차단 여부 |

---

## D. 다른 업체를 쓰고 싶을 때

원리는 동일합니다. **SMTP 서버 주소·포트·아이디·비밀번호**를 해당 서비스에서 받아 Supabase **Custom SMTP**에 그대로 넣으면 됩니다. (SendGrid, Mailgun, 네이버웍스 등)

---

**한 줄 요약:** Brevo에서 **SMTP 서버·로그인·SMTP key** 확인 → Supabase **Project Settings → Authentication → SMTP** 에 넣고 저장 → 사이트에서 로그인 메일 테스트.
