# 보안·의존성 메모

## Next.js

- 프로덕션은 **Next.js 14.2.35** (14.2.x 최신)를 사용합니다. [2025-12-11 보안 권고](https://nextjs.org/blog/security-update-2025-12-11)의 RSC 관련 패치가 포함된 버전입니다.
- `npm audit`이 **next@16** 으로의 업그레이드를 권할 수 있습니다. 메이저 업그레이드는 호환 검증이 필요하므로 **의도적으로 14.x 유지**할 수 있습니다. 감사 DB의 영향 범위 표기와 실제 패치 라인이 다를 수 있습니다.

## Supabase 키가 브라우저에 “보이는” 이유

- **`NEXT_PUBLIC_` 로 시작하는 환경 변수**는 빌드 시 클라이언트(브라우저) JavaScript에 **그대로 포함**됩니다. DevTools·소스맵·번들에서 값이 보이는 것이 **정상 동작**이며, 이를 숨기려면 `NEXT_PUBLIC_` 을 쓰면 안 됩니다.
- Supabase **anon public** 키는 **공개되도록 설계된 키**입니다. 데이터 접근 제어는 대시보드의 **Row Level Security(RLS)** 와 정책으로 합니다. anon 키만으로는 “관리자 권한”이 아니며, **service_role** 키와는 다릅니다.
- **절대 하면 안 됨**
  - `service_role` / **Secret** 키를 `NEXT_PUBLIC_` 로 넣거나 프론트 코드에 넣기
  - GitHub에 `.env.local` 커밋
- anon 키 유출이 걱정되면 Supabase 대시보드에서 **API 키 로테이션**을 할 수 있으나, 클라이언트 앱을 쓰는 한 **새 anon 키도 브라우저에는 노출**됩니다(구조상 동일).

## 이메일 매직 링크 (Supabase)

- 브라우저 클라이언트는 **implicit** 플로우를 사용합니다. `@supabase/ssr`의 `createBrowserClient`는 **PKCE만 강제**해, 메일을 **다른 기기**에서 열면 세션이 안 잡히는 문제가 흔합니다.
- **Redirect URLs**에 `https://(도메인)/auth/callback**` 및 로컬 `http://localhost:5006/auth/callback**` 가 Supabase 대시보드에 등록돼 있어야 합니다.

## glob (eslint-config-next 하위)

- `package.json`의 **`overrides`** 로 `glob`을 **10.4.6+** 로 맞춰 [CLI 관련 권고](https://github.com/advisories/GHSA-5j98-mcp5-4vw2)를 완화합니다.

## xlsx (SheetJS)

- `npm audit`에 **Prototype Pollution / ReDoS** 항목이 남을 수 있으며, 공개 npm의 `xlsx` 패키지에는 **공식 수정 버전이 없는 경우**가 많습니다.
- 관리자·정산 등 **신뢰할 수 있는 엑셀 파일만** 업로드·파싱하고, 필요 시 향후 `exceljs` 등으로 교체를 검토하세요.

## 운영 권장

- 배포 후 비밀 키·API 키 **정기 교체** (특히 인증 관련 이슈 공지 후).
- `npm audit` 결과는 참고용이며, **빌드·실행 테스트**와 공식 권고문을 함께 확인하세요.
