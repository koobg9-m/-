# 실제 SMS 발송 설정 가이드

미미살롱펫에서 실제 휴대폰 SMS 인증을 사용하려면 아래 순서대로 진행하세요.

---

## 1단계: Twilio 가입 및 설정

### 1-1. Twilio 가입
1. https://www.twilio.com/try-twilio 접속
2. 무료 계정 생성 (이메일, 비밀번호)

### 1-2. Trial 번호 받기 (무료 테스트용)
1. Twilio 대시보드 → **Phone Numbers** → **Manage** → **Buy a number**
2. **Trial** 번호 선택 (한국 +82 번호는 유료, Trial은 미국 번호로 테스트)
3. 또는 **Verify** → **Phone Numbers**에서 본인 번호 인증 후 테스트

### 1-3. 인증 정보 확인
1. Twilio 대시보드 → **Account** → **API keys & tokens**
2. **Account SID**, **Auth Token** 복사해 두기

---

## 2단계: Supabase 설정

### 2-1. Supabase 프로젝트
1. https://supabase.com 가입/로그인
2. **New Project** 생성
3. 프로젝트 생성 완료 대기 (1~2분)

### 2-2. Phone Provider 연동
1. Supabase 대시보드 → **Authentication** → **Providers**
2. **Phone** 찾아서 **Enable** 클릭
3. Twilio 정보 입력:
   - **Twilio Account SID**: Twilio에서 복사한 값
   - **Twilio Auth Token**: Twilio에서 복사한 값
   - **Twilio Phone Number**: Twilio에서 구매/받은 번호 (예: +1234567890)
4. **Save** 클릭

### 2-3. API 키 확인
1. **Project Settings** → **API**
2. **Project URL** 복사
3. **anon public** 키 복사

---

## 3단계: .env.local 설정

프로젝트 폴더의 `.env.local` 파일을 아래처럼 수정:

```env
# Supabase (실제 값으로 교체)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=실제_anon_키

# 데모 모드 끄기 (실제 SMS 사용)
NEXT_PUBLIC_DEMO_AUTH=false
```

---

## 4단계: 테스트

1. `npm run dev` 실행
2. http://localhost:5000/login 접속
3. **본인 휴대폰 번호** 입력 (010-xxxx-xxxx)
4. **인증번호 받기** 클릭
5. 휴대폰으로 받은 **6자리 번호** 입력
6. **로그인** 클릭

---

## 주의사항

| 항목 | 설명 |
|------|------|
| **Twilio Trial** | Trial 계정은 인증된 번호로만 SMS 발송 가능 |
| **한국 번호** | Twilio 한국 번호는 유료 (월 약 $1) |
| **비용** | Trial: 무료 크레딧, 유료: SMS 1건당 약 $0.01 |

---

## 문제 해결

- **SMS 안 옴**: Twilio Trial은 Verify된 번호로만 발송
- **Invalid phone**: +82 10 xxxx xxxx 형식으로 입력
- **Provider not enabled**: Supabase에서 Phone Provider 활성화 확인
