# 자동 배포 설정

코드를 GitHub에 push하면 서버(Vercel)가 자동으로 업그레이드됩니다.

---

## 로컬 → GitHub 자동 push

| 명령어 | 설명 |
|--------|------|
| `npm run push` | 변경사항 즉시 1회 push |
| `npm run watch:push` | 파일 변경 감시 → 15초 후 자동 push |
| `npm run dev:auto` | 개발 서버 + 자동 push 동시 실행 |

**자동 push 흐름**: 파일 수정 → 15초 대기 → git add/commit/push → GitHub Actions → Vercel 배포

---

## 방법 1: Vercel Git 연동 (가장 간단)

1. [Vercel 대시보드](https://vercel.com) → 프로젝트 선택
2. **Settings** → **Git** → **Connect Git Repository**
3. GitHub 저장소 연결
4. **Production Branch**: `main` (또는 `master`) 설정

이후 `main` 브랜치에 push할 때마다 **자동 배포**됩니다.

---

## 방법 2: GitHub Actions (이미 설정됨)

`.github/workflows/deploy.yml`이 추가되어 있습니다.  
`main` 또는 `master` 브랜치에 push 시 자동으로 Vercel 프로덕션에 배포됩니다.

### 필수 설정: GitHub Secrets

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions**에서 아래 시크릿을 추가하세요.

| Secret 이름 | 설명 | 얻는 방법 |
|-------------|------|-----------|
| `VERCEL_TOKEN` | Vercel API 토큰 | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create |
| `VERCEL_ORG_ID` | 팀/계정 ID | 프로젝트 루트에서 `vercel` 실행 후 `.vercel/project.json`의 `orgId` |
| `VERCEL_PROJECT_ID` | 프로젝트 ID | `.vercel/project.json`의 `projectId` |

### VERCEL_ORG_ID, VERCEL_PROJECT_ID 확인

```bash
# 프로젝트 폴더에서
npx vercel link
# 프롬프트에 따라 프로젝트 연결 후
cat .vercel/project.json
# orgId, projectId 값을 GitHub Secrets에 추가
```

---

## 배포 건너뛰기

커밋 메시지에 `[skip ci]`를 포함하면 해당 push는 배포하지 않습니다.

```
git commit -m "작업 중 [skip ci]"
```
