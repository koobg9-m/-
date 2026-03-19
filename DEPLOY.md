# 자동 배포 설정

**로컬(5006) 화면 → 서버(mimisalon.vercel.app)에 반영**

---

## ⭐ 로컬과 서버가 다를 때 (가장 중요)

**`npm run sync`** 또는 **`npm run deploy`** 실행

| 명령어 | 설명 |
|--------|------|
| **`npm run sync`** | GitHub push + Vercel 배포 (로컬 → 서버 동기화) |
| **`npm run deploy`** | 로컬 코드를 Vercel에 직접 배포 (가장 확실) |

GitHub push만으로는 Vercel이 자동 배포하지 않을 수 있습니다. **`npm run deploy`**가 로컬 코드를 서버에 직접 올립니다.

---

## 흐름

```
로컬 수정 (localhost:5006) → npm run sync 또는 deploy → 서버에 반영 (2~5분)
```

1. **로컬에서 수정** 후 http://localhost:5006 에서 확인
2. **`npm run sync`** 또는 **`npm run deploy`** 실행
3. **2~5분 후** https://mimisalon.vercel.app 에서 동일한 화면 확인

---

## 기타 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run push` | GitHub에만 push (Vercel 자동 배포 시) |
| `npm run watch:push` | 파일 변경 감시 → 15초 후 자동 push |
| `deploy-push.bat` | Windows: add → commit → push |

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
