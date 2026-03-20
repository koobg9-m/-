# 보안·의존성 메모

## Next.js

- 프로덕션은 **Next.js 14.2.35** (14.2.x 최신)를 사용합니다. [2025-12-11 보안 권고](https://nextjs.org/blog/security-update-2025-12-11)의 RSC 관련 패치가 포함된 버전입니다.
- `npm audit`이 **next@16** 으로의 업그레이드를 권할 수 있습니다. 메이저 업그레이드는 호환 검증이 필요하므로 **의도적으로 14.x 유지**할 수 있습니다. 감사 DB의 영향 범위 표기와 실제 패치 라인이 다를 수 있습니다.

## glob (eslint-config-next 하위)

- `package.json`의 **`overrides`** 로 `glob`을 **10.4.6+** 로 맞춰 [CLI 관련 권고](https://github.com/advisories/GHSA-5j98-mcp5-4vw2)를 완화합니다.

## xlsx (SheetJS)

- `npm audit`에 **Prototype Pollution / ReDoS** 항목이 남을 수 있으며, 공개 npm의 `xlsx` 패키지에는 **공식 수정 버전이 없는 경우**가 많습니다.
- 관리자·정산 등 **신뢰할 수 있는 엑셀 파일만** 업로드·파싱하고, 필요 시 향후 `exceljs` 등으로 교체를 검토하세요.

## 운영 권장

- 배포 후 비밀 키·API 키 **정기 교체** (특히 인증 관련 이슈 공지 후).
- `npm audit` 결과는 참고용이며, **빌드·실행 테스트**와 공식 권고문을 함께 확인하세요.
