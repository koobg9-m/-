# 카카오 로그인 설정 가이드

이 가이드는 미미살롱 애플리케이션에 카카오 로그인을 설정하는 방법을 안내합니다.

## 1. 카카오 개발자 계정 설정

### 1.1 카카오 개발자 계정 생성 및 앱 등록
1. [카카오 개발자 사이트](https://developers.kakao.com/)에 접속합니다.
2. 로그인 후 상단의 "내 애플리케이션" 메뉴를 클릭합니다.
3. "애플리케이션 추가하기" 버튼을 클릭합니다.
4. 앱 이름(예: "미미살롱펫"), 사업자명을 입력하고 "저장" 버튼을 클릭합니다.

### 1.2 카카오 로그인 활성화
1. 생성된 애플리케이션을 클릭합니다.
2. 왼쪽 메뉴에서 "카카오 로그인"을 선택합니다.
3. "활성화 설정" 상태를 ON으로 변경합니다.

### 1.3 동의 항목 설정
1. "동의 항목" 탭을 클릭합니다.
2. 필요한 동의 항목을 설정합니다:
   - 닉네임 (필수)
   - 프로필 사진 (선택)
   - 이메일 (선택)

### 1.4 리디렉션 URI 설정
1. "카카오 로그인" 메뉴의 "Redirect URI" 섹션에서 "등록하기" 버튼을 클릭합니다.
2. 다음 URI를 추가합니다:
   - 개발 환경: `http://localhost:3000/auth/callback`
   - 프로덕션 환경: `https://mimisalon.vercel.app/auth/callback`

### 1.5 앱 키 확인
1. "앱 설정" > "요약 정보"에서 "REST API 키"를 확인합니다. 이 키는 Supabase 설정에 필요합니다.
2. "카카오 로그인" > "보안" 탭에서 "Client Secret" 코드를 생성합니다. 이 키도 Supabase 설정에 필요합니다.

## 2. Supabase 설정

### 2.1 Supabase 대시보드 접속
1. [Supabase 대시보드](https://app.supabase.com/)에 로그인합니다.
2. 미미살롱 프로젝트를 선택합니다.

### 2.2 카카오 OAuth 설정
1. 왼쪽 메뉴에서 "Authentication" > "Providers"를 선택합니다.
2. "Kakao" 제공자를 찾아 활성화합니다.
3. 다음 정보를 입력합니다:
   - Client ID: 카카오 개발자 사이트에서 확인한 "REST API 키"
   - Secret: 카카오 개발자 사이트에서 생성한 "Client Secret" 코드
   - Redirect URL: `https://mimisalon.vercel.app/auth/callback` (자동으로 설정됨)
4. "Save" 버튼을 클릭합니다.

## 3. 코드 확인 및 테스트

### 3.1 코드 확인
현재 미미살롱 프로젝트의 `src/components/auth/LoginForm.tsx` 파일에는 이미 카카오 로그인 기능이 구현되어 있습니다. 다음 함수가 카카오 로그인을 처리합니다:

```javascript
const handleKakaoLogin = async () => {
  if (DEMO_MODE || !isSupabaseConfigured()) {
    setError("카카오 로그인을 사용할 수 없습니다. (설정 확인 필요)");
    return;
  }
  setError("");
  try {
    const { createClient } = await import("@/lib/supabase/client");
    // 항상 프로덕션 URL 사용
    const redirectTo = "https://mimisalon.vercel.app/auth/callback?next=%2F";
    
    const { error: err } = await createClient().auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo },
    });
    if (err) throw err;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "카카오 로그인 실패";
    if (msg.includes("provider is not enabled") || msg.includes("Unsupported provider")) {
      setError("카카오 로그인이 아직 준비되지 않았습니다. 이메일로 시도해 주세요.");
    } else {
      setError(msg);
    }
  }
};
```

### 3.2 테스트
1. 설정이 완료되면 애플리케이션에서 카카오 로그인 버튼을 클릭하여 테스트합니다.
2. 카카오 계정으로 로그인하면 애플리케이션으로 리디렉션되어야 합니다.
3. 개발자 콘솔에서 오류가 없는지 확인합니다.

## 4. 문제 해결

### 4.1 "provider is not enabled" 오류
이 오류가 발생하면 Supabase에서 카카오 제공자가 올바르게 설정되지 않은 것입니다. Supabase 대시보드에서 카카오 제공자 설정을 확인하세요.

### 4.2 리디렉션 오류
리디렉션 오류가 발생하면 카카오 개발자 사이트와 Supabase에 설정된 리디렉션 URI가 정확히 일치하는지 확인하세요.

### 4.3 기타 오류
카카오 개발자 사이트의 "카카오 로그인" > "고급" 탭에서 "OpenID Connect" 활성화를 확인하세요. Supabase는 OpenID Connect를 통한 인증을 선호합니다.

## 5. 추가 설정 (선택 사항)

### 5.1 사용자 정보 활용
카카오 로그인 후 사용자 정보를 활용하려면 `src/app/auth/callback/page.tsx` 파일에서 사용자 정보를 처리하는 코드를 추가할 수 있습니다.

### 5.2 카카오 로그인 버튼 스타일 개선
카카오에서 제공하는 [디자인 가이드](https://developers.kakao.com/docs/latest/ko/reference/design-guide)에 따라 로그인 버튼 스타일을 개선할 수 있습니다.

---

이 설정을 완료하면 사용자는 카카오 계정으로 미미살롱 애플리케이션에 로그인할 수 있습니다.