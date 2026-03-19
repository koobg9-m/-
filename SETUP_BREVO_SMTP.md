# Brevo SMTP 설정 (Supabase 이메일 한도 확대)

> **빠른 설정**: [SETUP_EMAIL_FREE.md](./SETUP_EMAIL_FREE.md) 참고

Supabase 기본 SMTP는 시간당 3통 제한. Brevo를 사용하면 **무료 300통/일**까지 발송 가능.

---

## 1. Brevo 계정 준비

1. [Brevo](https://www.brevo.com) 가입
2. 로그인 후 **Settings** (톱니바퀴) → **SMTP & API** → **SMTP** 탭
3. **SMTP login** (이메일)과 **SMTP key** (비밀번호) 확인 또는 생성

---

## 2. Supabase에 Brevo SMTP 설정

1. [Supabase 대시보드](https://supabase.com/dashboard) → mimisalon 프로젝트
2. **Project Settings** → **Auth** → **SMTP Settings**
3. **Enable Custom SMTP** 체크
4. 아래 값 입력:

| 항목 | 값 |
|------|-----|
| **Sender email** | 발신 이메일 (Brevo에서 인증된 도메인 또는 가입 이메일) |
| **Sender name** | `미미살롱펫` |
| **Host** | `smtp-relay.brevo.com` |
| **Port** | `587` |
| **Username** | Brevo SMTP login (이메일) |
| **Password** | Brevo SMTP key |

5. **Save** 클릭

---

## 3. 발신 이메일 주소

- **무료 플랜**: Brevo 가입 시 사용한 이메일 주소 사용 가능
- **도메인 인증**: `noreply@mimisalon.vercel.app` 등 사용하려면 Brevo에서 도메인 인증 필요

---

## 4. 확인

설정 저장 후 Supabase가 자동으로 Brevo SMTP 사용.  
https://mimisalon.vercel.app/login 에서 이메일 로그인 테스트.
