# 로컬 개발 — 어디를 보면 되나요?

나중에 **로컬만** 손볼 때 아래 순서로 찾으면 됩니다.

## 1. 포트 & 실행

| 항목 | 위치 |
|------|------|
| 개발 서버 포트 **5006** (Next 기본 3000 아님) | `package.json` → `scripts.dev`, `dev:simple` |
| 주소 | **http://localhost:5006** |
| 캐시 꼬임·500 에러 | `README.md` → 「로컬에서 Internal Server Error」 / `npm run dev:fresh` |

## 2. 환경 변수 (로컬)

| 항목 | 위치 |
|------|------|
| 변수 목록·설명 | **`.env.example`** (복사해서 `.env.local` 사용) |
| 고객 로그인 콜백(이메일·카카오) | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_USE_LOCAL_AUTH_CALLBACK`, `NEXT_PUBLIC_LOCAL_DEV_ORIGIN` → `.env.example` 참고 |
| 관리자 비밀번호(서버 전용) | `ADMIN_PASSWORD`, `ADMIN_PASSWORDS` → `.env.example` |

## 3. 코드에서 로그인·콜백이 나가는 곳

| 용도 | 파일 |
|------|------|
| 이메일/카카오 **리다이렉트 URL** 조립 | `src/lib/auth-callback-url.ts` |
| 로그인 UI (이메일·카카오) | `src/components/auth/LoginForm.tsx` |
| 로그인 후 돌아오는 페이지 | `src/app/auth/callback/page.tsx` |
| Supabase 클라이언트 | `src/lib/supabase/client.ts` |

## 4. 문서 (상세 설정)

| 내용 | 파일 |
|------|------|
| 이메일 로그인·Redirect URL | **SETUP_EMAIL.md** |
| 카카오 | **SETUP_KAKAO.md**, **SETUP_KAKAO_DETAILED.md** |
| 전체 배포·Supabase | **SETUP.md**, **DEPLOY.md** |

## 5. 자주 헷갈리는 것

- **3000 vs 5006**: 이 레포는 **5006**이 맞음. Supabase에 `localhost:3000`만 넣어 두면 메일 링크가 엉뚱한 포트로 감 → **SETUP_EMAIL.md** 표 참고.
- **배포와 로컬**: 운영만 쓸 거면 로그인은 **배포 URL**에서 하고, Supabase **Site URL**도 그 도메인에 맞추는 게 가장 단순함.

---

**한 줄 요약:** 로컬 설정은 **`.env.example` + 이 파일(LOCAL_DEV.md)** 부터 보면 됩니다.
