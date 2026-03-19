# "provider is not enabled" 에러 해결

에러: `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}`

→ **Supabase에서 Kakao Provider를 아직 켜지 않았습니다.**

---

## 해결: Supabase에서 Kakao 활성화

### 1. Supabase Providers 페이지로 이동

**직접 링크 (mimisalon 프로젝트):**
```
https://supabase.com/dashboard/project/cykzrqbifpvuwdsbzyzy/auth/providers
```

또는:
1. https://supabase.com/dashboard
2. **mimisalon** 프로젝트 클릭
3. 좌측 **Authentication** → **Configuration** → **Sign In / Providers**

---

### 2. Kakao 찾기

Providers 목록에서 **Kakao** (카카오) 를 찾습니다.
- Google, GitHub, Apple 등과 함께 있습니다.
- 스크롤해서 **Kakao** 행을 찾으세요.

---

### 3. Kakao Enable (가장 중요)

1. **Kakao** 행의 **Enable** 스위치를 **ON** (오른쪽으로) 으로 변경
2. Kakao 행을 클릭하면 설정 폼이 펼쳐집니다.

---

### 4. Client ID, Client Secret 입력

| Supabase 필드 | 넣을 값 |
|---------------|---------|
| **Kakao Client ID** | Kakao Developers → 앱 설정 → 앱 키 → **REST API 키** |
| **Kakao Client Secret** | Kakao Developers → 앱 키 → REST API 키 **키 설정** → **Client Secret** (코드 생성) |

- Client Secret이 없으면: Kakao Developers → 앱 키 → REST API 키 옆 **키 설정** → **카카오 로그인 활성화** → **Client Secret** → **코드 생성**

---

### 5. Save 클릭

설정 후 반드시 **Save** 버튼을 눌러 저장합니다.

---

### 6. 확인

1. Enable이 **ON** 인지 다시 확인
2. Client ID, Client Secret이 비어 있지 않은지 확인
3. https://mimisalon.vercel.app/login 에서 **카카오로 시작하기** 다시 시도

---

## Kakao Developers에서 확인할 것

- **제품 설정** → **카카오 로그인** → **일반** → **활성화 설정 ON**
- **앱 설정** → **앱 키** → REST API 키 **키 설정** → **Redirect URI**에 아래 추가:
  ```
  https://cykzrqbifpvuwdsbzyzy.supabase.co/auth/v1/callback
  ```
