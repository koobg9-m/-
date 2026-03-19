# 카카오 로그인 경로 상세 가이드 (인증 실패 해결)

인증 실패 시 아래 경로와 URL을 **정확히** 맞춰주세요.

---

## ⚠️ 핵심: 두 가지 Redirect가 다릅니다

| 구분 | 누가 → 어디로 | 설정하는 곳 |
|------|---------------|-------------|
| **Kakao Redirect URI** | 카카오 → Supabase | Kakao Developers |
| **Supabase Redirect URLs** | Supabase → 우리 앱 | Supabase Dashboard |

---

## 1. Kakao Developers 설정

### 1-1. 접속
- https://developers.kakao.com
- 로그인 → **내 애플리케이션**

### 1-2. Redirect URI 등록 (가장 중요)

**경로 A (최신 UI):**
1. **내 애플리케이션** → 앱 선택
2. **앱 설정** (좌측) → **앱 키**
3. **REST API 키** 행에서 **키 설정** (또는 연필 아이콘) 클릭
4. **Redirect URI** 입력란에 아래 **정확히** 입력:

```
https://cykzrqbifpvuwdsbzyzy.supabase.co/auth/v1/callback
```

5. **저장** 클릭

**경로 B (플랫폼):**
1. **앱 설정** → **플랫폼**
2. **Web** 플랫폼이 없으면 **Web** 추가
3. **사이트 도메인**에 `https://mimisalon.vercel.app` 추가
4. **Redirect URI**에 위와 동일한 URL 추가

**로컬 테스트 시 추가:**
```
http://localhost:5006/auth/callback
```
※ 주의: 로컬에서 테스트할 때만. 프로덕션에서는 Supabase callback만 사용.

### 1-3. 카카오 로그인 활성화
1. **제품 설정** → **카카오 로그인** → **일반**
2. **활성화 설정** → **ON**

### 1-4. Client Secret
1. **앱 설정** → **앱 키** → REST API 키 **키 설정**
2. **카카오 로그인 활성화** → **Client Secret** → **코드 생성**
3. 생성된 코드 복사

---

## 2. Supabase 설정

### 2-1. Kakao Provider
1. https://supabase.com/dashboard
2. **mimisalon** 프로젝트 선택
3. **Authentication** → **Configuration** → **Sign In / Providers**
4. **Kakao** 펼치기 → **Enable** ON
5. **Kakao Client ID**: Kakao REST API 키
6. **Kakao Client Secret**: 위에서 복사한 Client Secret
7. **Save**

### 2-2. Redirect URLs (필수)
1. **Authentication** → **Configuration** → **URL Configuration**
2. **Redirect URLs** 섹션에서 **Add URL** 클릭
3. 아래 URL들을 **각각** 추가:

```
https://mimisalon.vercel.app/auth/callback
```

```
http://localhost:5006/auth/callback
```

4. **Site URL** 확인:
   - 프로덕션: `https://mimisalon.vercel.app`
   - 또는 `https://mimisalon.vercel.app/` (끝에 / 있어도 됨)

5. **Save**

### 2-3. 직접 링크
- **URL Configuration**: https://supabase.com/dashboard/project/cykzrqbifpvuwdsbzyzy/auth/url-configuration
- **Providers**: https://supabase.com/dashboard/project/cykzrqbifpvuwdsbzyzy/auth/providers

---

## 3. URL 정리 (복사용)

### Kakao Developers에 넣을 URL (1개)
```
https://cykzrqbifpvuwdsbzyzy.supabase.co/auth/v1/callback
```

### Supabase Redirect URLs에 넣을 URL (2개)
```
https://mimisalon.vercel.app/auth/callback
http://localhost:5006/auth/callback
```

---

## 4. 인증 흐름 (확인용)

1. 사용자: `https://mimisalon.vercel.app/login` → **카카오로 시작하기** 클릭
2. 우리 앱: Supabase OAuth URL로 리다이렉트
3. Supabase: Kakao 로그인 페이지로 리다이렉트
4. 사용자: 카카오에서 로그인
5. **Kakao**: `https://cykzrqbifpvuwdsbzyzy.supabase.co/auth/v1/callback` 로 리다이렉트 ← **Kakao에 이 URL 등록 필수**
6. **Supabase**: `https://mimisalon.vercel.app/auth/callback` 로 리다이렉트 ← **Supabase Redirect URLs에 등록 필수**
7. 우리 앱: `/auth/callback`에서 세션 저장 후 메인으로 이동

---

## 5. 자주 하는 실수

| 실수 | 올바른 설정 |
|------|-------------|
| Kakao에 `mimisalon.vercel.app/auth/callback` 등록 | Kakao에는 **Supabase** callback URL 등록 |
| Supabase에 `supabase.co/auth/v1/callback` 등록 | Supabase Redirect URLs에는 **우리 앱** URL 등록 |
| URL 끝에 `/` 누락 또는 추가 | 정확히 위 예시대로 입력 |
| http / https 혼동 | 프로덕션: https, 로컬: http |

---

## 6. 에러별 확인

| 에러 | 확인할 곳 |
|------|-----------|
| `redirect_uri_mismatch` | Kakao Redirect URI가 `https://cykzrqbifpvuwdsbzyzy.supabase.co/auth/v1/callback` 인지 |
| `invalid redirect url` | Supabase Redirect URLs에 `https://mimisalon.vercel.app/auth/callback` 있는지 |
| `Provider not enabled` | Supabase Sign In / Providers에서 Kakao Enable 확인 |
| `KOE006` (카카오) | Kakao Redirect URI가 정확한지, 플랫폼 Web 추가했는지 |
