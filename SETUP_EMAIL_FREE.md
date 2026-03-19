# 이메일 인증 한도 초과 → 무료 SMTP 연결 (Brevo)

Supabase 기본 SMTP는 **시간당 3통** 제한. Brevo 무료 플랜으로 **일 300통**까지 확대.

---

## 1단계: Brevo 가입 (약 2분)

1. https://www.brevo.com 접속 → **Sign up free**
2. 이메일로 가입 후 로그인

---

## 2단계: Brevo SMTP 정보 확인

1. Brevo 로그인 후 우측 상단 **톱니바퀴** → **SMTP & API**
2. **SMTP** 탭 선택
3. 아래 값 확인/복사:
   - **SMTP server**: `smtp-relay.brevo.com`
   - **Login**: `본인 Brevo 로그인 이메일`
   - **SMTP key**: **Generate** 버튼으로 새 키 생성 후 복사 (비밀번호처럼 사용)

---

## 3단계: Supabase에 SMTP 설정

1. https://supabase.com/dashboard 접속
2. **mimisalon** 프로젝트 선택 (또는 해당 프로젝트)
3. SMTP 설정 페이지로 이동:
   - **방법 A**: 좌측 메뉴 **Authentication** → **Providers** 아래 또는 **Settings** 영역에서 **SMTP** 클릭
   - **방법 B**: 직접 링크 → https://supabase.com/dashboard/project/cykzrqbifpvuwdsbzyzy/auth/smtp
4. **Enable Custom SMTP** 체크
5. 아래 값 입력:

| 항목 | 입력값 |
|------|--------|
| Sender email | Brevo 가입 이메일 (예: `your@email.com`) |
| Sender name | `미미살롱펫` |
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | Brevo SMTP login (이메일) |
| Password | Brevo SMTP key (2단계에서 생성한 키) |

6. **Save** 클릭

---

## 4단계: 확인

- https://mimisalon.vercel.app/login 에서 이메일 로그인 테스트
- 인증 메일이 Brevo를 통해 발송됨 (일 300통 무료)

---

## 참고

- **발신 주소**: 무료 플랜에서는 Brevo 가입 이메일을 발신 주소로 사용
- **도메인 인증**: `noreply@mimisalon.vercel.app` 등 사용하려면 Brevo에서 도메인 인증 필요 (유료 플랜 또는 수동 설정)
