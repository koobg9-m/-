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

## ⚠️ 변경사항이 반영 안 될 때

1. **배포 후 2~5분 대기** – 빌드 완료 전에 확인하면 이전 버전이 보입니다.
2. **배포 확인** – https://mimisalon.vercel.app/api/version 접속해 버전이 올라갔는지 확인.
3. **브라우저 강력 새로고침** – `Ctrl+Shift+R` (Windows) 또는 `Cmd+Shift+R` (Mac).
4. **시크릿/InPrivate 모드**로 접속해 캐시 없이 확인.
5. **Git 먼저 push** – Vercel이 Git과 연결되어 있으면, `git push` 후 `npm run deploy` 순서로 실행.
6. **Vercel 빌드 캐시 비활성화** – [Vercel 대시보드](https://vercel.com) → 프로젝트 → Settings → Environment Variables → `VERCEL_FORCE_NO_BUILD_CACHE` = `1` 추가 (Production).

---

## 흐름

```
로컬 수정 (localhost:5006) → npm run sync 또는 deploy → 서버에 반영 (2~5분)
```

1. **로컬에서 수정** 후 http://localhost:5006 에서 확인
2. **`npm run sync`** 또는 **`npm run deploy`** 실행
3. **2~5분 후** https://mimisalon.vercel.app 에서 동일한 화면 확인
4. **`/api/version`**으로 배포 버전 확인

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

## 방법 2: GitHub Actions (선택)

GitHub Actions는 **push 시 자동 실행 비활성화** 상태입니다. (Secrets 미설정 시 실패 이메일 방지)

배포는 **`npm run deploy`** 사용을 권장합니다.

---

## 배포 건너뛰기

커밋 메시지에 `[skip ci]`를 포함하면 해당 push는 배포하지 않습니다.

```
git commit -m "작업 중 [skip ci]"
```
