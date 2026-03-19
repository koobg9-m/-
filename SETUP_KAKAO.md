# 카카오 로그인 설정

로그인 페이지의 **카카오로 시작하기** 버튼이 동작하려면 Kakao Developers + Supabase 설정이 필요합니다.

---

## 1단계: Kakao Developers 앱 생성

1. https://developers.kakao.com 접속 → 로그인
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 이름, 사업자명 등 입력 후 저장

---

## 2단계: REST API 키 확인

1. 앱 선택 → **앱 설정** → **앱 키**
2. **REST API 키** 복사 (이게 `client_id`)

---

## 3단계: Redirect URI 등록

1. **앱 설정** → **플랫폼** → **Web** 플랫폼 추가 (없으면)
2. **사이트 도메인**에 `https://mimisalon.vercel.app` 추가
3. **앱 설정** → **플랫폼** → **Web** → **Redirect URI**에 아래 추가:

   ```
   https://cykzrqbifpvuwdsbzyzy.supabase.co/auth/v1/callback
   ```

   (로컬 테스트 시: `http://localhost:3000/auth/callback` 도 추가 가능)

---

## 4단계: Kakao Login 활성화

1. **제품 설정** → **카카오 로그인** → **일반**
2. **활성화 설정** → **ON**
3. **제품 설정** → **카카오 로그인** → **동의 항목**
4. `profile_nickname`, `profile_image` (필수), `account_email` (선택) 활성화

---

## 5단계: Client Secret 발급

1. **앱 설정** → **앱 키** → REST API 키 행의 **키 설정** 클릭
2. **카카오 로그인 활성화** → **Client Secret** → **코드 생성**
3. 생성된 **Client Secret** 복사 (이게 `client_secret`)

---

## 6단계: Supabase에 Kakao 설정

1. https://supabase.com/dashboard → mimisalon 프로젝트
2. **Authentication** → **Sign In / Providers**
3. **Kakao** 찾아서 **Enable** 켜기
4. 입력:
   - **Kakao Client ID**: REST API 키
   - **Kakao Client Secret**: Client Secret
5. **Save** 클릭

---

## 7단계: Supabase Redirect URL 허용

1. **Authentication** → **URL Configuration**
2. **Redirect URLs**에 `https://mimisalon.vercel.app/auth/callback` 추가
3. (로컬) `http://localhost:3000/auth/callback` 추가
4. **Save**

---

## 8단계: 테스트

1. https://mimisalon.vercel.app/login 접속
2. **카카오로 시작하기** 클릭
3. 카카오 로그인 후 마이페이지로 이동
