# 이메일 로그인 설정 (Twilio 불필요)

이메일 로그인은 **Supabase 기본 기능**이라 별도 SMS 서비스 없이 바로 사용할 수 있습니다.

---

## 1단계: Supabase 프로젝트

1. https://supabase.com 가입/로그인
2. **New Project** 생성
3. 프로젝트 생성 완료 대기 (1~2분)

---

## 2단계: 이메일 Provider 확인

Supabase에서 **Email**은 기본 활성화되어 있습니다.

- **Authentication** → **Providers** → **Email** 확인
- 필요 시 **Confirm email** 끄면 이메일 인증 없이 바로 로그인 가능 (개발용)

---

## 3단계: Redirect URL 등록

1. Supabase 대시보드 → **Authentication** → **URL Configuration**
2. **Redirect URLs**에 아래 추가:
   - `http://localhost:5000/auth/callback` (개발)
   - `https://mimisalon.pet/auth/callback` (배포)

---

## 4단계: .env.local 설정

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=실제_anon_키

# 데모 모드 끄기 (실제 이메일 사용)
NEXT_PUBLIC_DEMO_AUTH=false
```

**Project URL**과 **anon public** 키는 **Project Settings** → **API**에서 확인하세요.

---

## 5단계: 테스트

1. `npm run dev` 실행
2. http://localhost:5000/login 접속
3. **이메일** 탭 선택
4. 이메일 주소 입력 → **로그인 링크 받기** 클릭
5. 받은 이메일에서 링크 클릭 → 자동 로그인

---

## 데모 모드 (현재)

`NEXT_PUBLIC_DEMO_AUTH=true` 이면:

- 이메일/휴대폰 입력 후 **데모: 바로 로그인** 버튼으로 테스트
- 실제 메일/SMS 발송 없음
