# Kakao Client ID / Client Secret 확인 방법

Supabase에 입력한 값이 맞는지 Kakao Developers에서 다시 확인하세요.

---

## 1. REST API 키 (Client ID) 확인

### 경로
1. https://developers.kakao.com 접속 → 로그인
2. **내 애플리케이션** → 사용 중인 앱 선택
3. **앱 설정** (좌측) → **앱 키**

### 확인
- **REST API 키** 항목의 값 확인
- 형식: 영문+숫자 조합, 32자 내외 (예: `a1b2c3d4e5f6...`)
- **JavaScript 키, Native 앱 키**가 아님 → **REST API 키**만 사용

### Supabase에 넣을 값
- Supabase **Kakao Client ID** = 이 **REST API 키** 전체를 복사해서 붙여넣기

---

## 2. Client Secret 확인

### 경로
1. **앱 설정** → **앱 키**
2. **REST API 키** 행에서 **키 설정** (또는 연필 아이콘) 클릭
3. **카카오 로그인** 섹션에서 **Client Secret** 확인

### 확인
- **Client Secret**이 없으면 → **코드 생성** 클릭 후 새로 생성
- 생성된 코드를 **한 번만** 복사 가능 → 복사 후 안전한 곳에 보관
- 형식: 영문+숫자 조합, 20~30자 내외

### Supabase에 넣을 값
- Supabase **Kakao Client Secret** = 이 **Client Secret** 전체를 복사해서 붙여넣기

### 자주 하는 실수
- REST API 키를 Client Secret에 넣음 → **X** (서로 다름)
- Client Secret을 생성하지 않고 빈 칸으로 둠 → **X** (반드시 생성 필요)
- 공백이나 줄바꿈이 함께 복사됨 → **X** (값만 정확히 복사)

---

## 3. 카카오 로그인 활성화 확인

1. **제품 설정** → **카카오 로그인** → **일반**
2. **활성화 설정** → **ON** 인지 확인

---

## 4. Redirect URI 확인 (Kakao)

1. **앱 설정** → **앱 키** → REST API 키 **키 설정**
2. **Redirect URI**에 아래가 **정확히** 있는지 확인:

```
https://cykzrqbifpvuwdsbzyzy.supabase.co/auth/v1/callback
```

- `http` 아님 → `https`
- `mimisalon.vercel.app` 아님 → `cykzrqbifpvuwdsbzyzy.supabase.co`
- 끝에 `/` 없음

---

## 5. Supabase에 다시 입력

값을 확인한 후:

1. https://supabase.com/dashboard/project/cykzrqbifpvuwdsbzyzy/auth/providers
2. **Kakao** → **Enable** ON
3. **Kakao Client ID**: REST API 키 (전체 복사)
4. **Kakao Client Secret**: Client Secret (전체 복사)
5. **Save** 클릭

---

## 6. Client Secret을 잃어버린 경우

- Kakao Developers → 앱 키 → REST API 키 **키 설정**
- **Client Secret** → **코드 재발급** (기존 코드는 더 이상 사용 불가)
- 새로 발급받은 코드를 Supabase에 다시 입력 후 **Save**
