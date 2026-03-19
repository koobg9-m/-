# 휴대폰 번호 로그인 설정 (상세 가이드)

로그인 페이지의 **휴대폰** 탭에서 SMS 인증번호로 로그인하려면 **Twilio** + **Supabase** 설정이 필요합니다.

---

## 1단계: Twilio 가입 및 설정

### 1-1. Twilio 가입

1. 브라우저에서 https://www.twilio.com/try-twilio 접속
2. **Sign up** 클릭
3. 이메일, 비밀번호, 이름 입력 후 가입
4. **본인 휴대폰 번호**로 인증 (가입 과정에서 요청됨)
   - Trial 계정은 **인증된 번호로만** SMS 발송 가능
   - 테스트 시 받을 번호를 미리 Verify 해두세요

### 1-2. Account SID, Auth Token 확인

1. Twilio 로그인 후 대시보드 화면
2. **Account** 메뉴 (우측 상단 프로필 아이콘 근처) 클릭
3. **API keys & tokens** 선택
4. 아래 값 복사:
   - **Account SID**: `AC`로 시작하는 32자리 문자열
   - **Auth Token**: **Show** 클릭 후 복사 (비밀번호처럼 보관)

### 1-3. 전화번호 발급 (Twilio Phone Number)

1. Twilio 대시보드 좌측 메뉴 → **Phone Numbers** → **Manage** → **Buy a number**
2. **Country** → `United States` 선택 (한국 번호는 유료)
3. **Capabilities** → **SMS** 체크
4. **Search** 클릭 후 나온 번호 중 하나 선택
5. **Buy** 클릭
   - Trial: 무료 크레딧으로 미국 번호 발급 가능
6. 발급된 번호 확인 (예: `+1 234 567 8901`)
   - **+1** 포함한 전체 번호를 복사해 두세요

### 1-4. (Trial 한정) SMS 받을 번호 Verify

Trial 계정은 **Verify된 번호로만** SMS 발송 가능합니다.

1. Twilio 대시보드 → **Verify** → **Phone Numbers** (또는 **Messaging** → **Try it out** → **Verify a number**)
2. **Add a new number** 클릭
3. SMS를 받을 **한국 휴대폰 번호** 입력 (010-xxxx-xxxx)
4. 인증 코드 수신 후 입력
5. Verify 완료

→ 이제 이 번호로 로그인 테스트 시 SMS를 받을 수 있습니다.

---

## 2단계: Supabase에 Phone Provider 설정

### 2-1. Supabase 대시보드 접속

1. https://supabase.com/dashboard 접속
2. 로그인 (없으면 가입)
3. **mimisalon** 프로젝트 클릭

### 2-2. Authentication → Providers 이동

**방법 A: 직접 링크 (권장)**

아래 주소를 브라우저 주소창에 붙여넣고 접속:

```
https://supabase.com/dashboard/project/cykzrqbifpvuwdsbzyzy/auth/providers
```

**방법 B: 메뉴로 이동**

1. 좌측 사이드바에서 **Authentication** (자물쇠 아이콘) 클릭
2. **Configuration** 영역에서 **Sign In / Providers** 또는 **Providers** 클릭
   - UI 버전에 따라 "Providers", "Sign In", "Sign-in providers" 등으로 표시될 수 있음
3. Providers가 보이지 않으면:
   - **Authentication** 클릭 후 상단 탭에서 **Providers** 찾기
   - 또는 **Authentication** → **Settings** → **Auth Providers** 확인

### 2-3. Phone Provider 활성화

1. **Providers** 목록에서 **Phone** 찾기
2. **Phone** 행의 **Enable** 스위치를 켜기 (오른쪽으로)
3. **Phone** 행을 클릭하거나 확장하여 설정 폼 열기

### 2-4. Twilio 정보 입력

아래 항목에 1단계에서 복사한 값을 입력:

| Supabase 필드 | 입력할 값 | 예시 |
|---------------|-----------|------|
| **Twilio Account SID** | Twilio Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| **Twilio Auth Token** | Twilio Auth Token | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| **Twilio Phone Number** | Twilio에서 발급한 번호 (국가코드 포함) | `+12345678901` |

- **Twilio Phone Number**는 반드시 `+`로 시작 (예: `+12345678901`)
- 공백 없이 입력

### 2-5. 저장

1. **Save** 버튼 클릭
2. 저장 완료 메시지 확인

---

## 3단계: .env.local 확인

프로젝트 폴더의 `.env.local` 파일을 확인:

```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://cykzrqbifpvuwdsbzyzy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# 아래가 있으면 삭제 또는 false로 설정
# NEXT_PUBLIC_DEMO_AUTH=true   ← 삭제 또는 false
# NEXT_PUBLIC_SKIP_SUPABASE=1  ← 삭제
```

- `NEXT_PUBLIC_DEMO_AUTH`가 `true`이면 실제 SMS 대신 데모 모드로 동작
- `NEXT_PUBLIC_SKIP_SUPABASE`가 `1`이면 Supabase 비활성화
- 실제 SMS 사용 시에는 위 두 변수를 **삭제**하거나 `false`로 설정

---

## 4단계: 확인 및 테스트

### 4-1. 로그인 페이지 접속

1. https://mimisalon.vercel.app/login 접속
2. **휴대폰** 탭이 기본으로 선택됩니다

### 4-2. SMS 인증 테스트

1. **휴대폰 번호** 입력 (010-xxxx-xxxx)
   - Trial: 1-4에서 Verify한 번호만 입력
2. **인증번호 받기** 클릭
3. 휴대폰으로 받은 **6자리 번호** 입력
4. **로그인** 클릭

### 4-3. 문제 발생 시

| 증상 | 확인 사항 |
|------|-----------|
| **Providers 안 보임** | 아래 "Providers 찾기" 참고 |
| SMS가 안 옴 | Twilio Trial: Verify된 번호인지 확인 |
| Provider not enabled | Supabase → Authentication → Providers → Phone Enable 확인 |
| Invalid phone | `+82` 형식으로 자동 변환됨. 010-xxxx-xxxx 입력 |
| 401 / 권한 오류 | Supabase anon key, URL 확인 |

---

## Providers 찾기 (메뉴에 안 보일 때)

1. **직접 URL로 접속** (가장 확실함):
   ```
   https://supabase.com/dashboard/project/cykzrqbifpvuwdsbzyzy/auth/providers
   ```
   - mimisalon 프로젝트에 로그인된 상태에서 위 주소 입력

2. **다른 경로 시도**:
   - Authentication → **Sign In** 탭
   - Authentication → **Configuration** → **Auth Providers**
   - Authentication 클릭 후 페이지 상단/좌측의 **Providers** 링크

3. **프로젝트 확인**:
   - 우측 상단에서 올바른 프로젝트(mimisalon) 선택했는지 확인

---

## 요약 체크리스트

- [ ] Twilio 가입 후 Account SID, Auth Token, Phone Number 확인
- [ ] (Trial) SMS 받을 번호 Twilio Verify 완료
- [ ] Supabase → Authentication → Providers → Phone Enable
- [ ] Twilio 정보 3가지 입력 후 Save
- [ ] .env.local에서 DEMO_AUTH, SKIP_SUPABASE 제거
- [ ] 로그인 페이지에서 휴대폰 번호로 테스트
