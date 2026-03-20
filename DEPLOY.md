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

## 홈 갤러리·추천 제품·공지·육아 노하우 (Supabase)

**Supabase가 설정된 경우** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — `/api/data`는 이 조합만 사용, 코드에 `SUPABASE_SERVICE_ROLE_KEY` 없음) 위 콘텐츠는 `app_data` 테이블에 저장됩니다. Vercel·로컬 모두 **같은 프로젝트 URL·anon 키**여야 동기화됩니다.

- **로컬과 운영(mimisalon.vercel.app)이 같은 Supabase 프로젝트**를 쓰면, 한쪽에서 저장한 내용이 다른 쪽에서도 새로고침 후 동일하게 보입니다.
- 관리자 **「서버에서 새로고침」**으로 Supabase → 이 브라우저로 예약·디자이너·요금·포인트·SMS·플랫폼 설정·홈·공지를 다시 불러옵니다.
- 로컬에서만 수정했고 서버에 한 번도 안 올라간 경우 운영과 다를 수 있습니다. 그때는 **「로컬→서버 업로드」**(대시보드)로 이 PC의 localStorage 내용을 Supabase에 덮어쓸 수 있습니다(다른 PC/운영 데이터가 덮어쓰일 수 있으니 확인 후 사용).
- **로컬 자동 백업** (`npm run dev` 전용): `mimi_*` 데이터를 브라우저 **IndexedDB**에 주기적으로 스냅샷 저장합니다. 관리자 대시보드에서 최근 백업 복원·JSON 내보내기 가능. 끄려면 `.env.local`에 `NEXT_PUBLIC_LOCAL_AUTOBACKUP=0`.
- **관리자 보안**: 관리자 비밀번호 해시는 **Supabase `app_data`** 와 동기화됩니다(브라우저마다 따로 ‘최초 설정’이 되던 문제 완화). 푸터 **「관리자」** 링크는 기본 **비노출**이며, 필요 시 Vercel에 `NEXT_PUBLIC_SHOW_ADMIN_LINK=1`. 운영에서 **최초** 비밀번호를 아직 못 올린 경우에만 `NEXT_PUBLIC_ALLOW_ADMIN_SETUP=1` 로 한 번 설정한 뒤 끄세요.
- `app_data` 키 예: `mimi_homepage_content`, `mimi_tips_content`, `mimi_notices_content`, `mimi_groomer_profiles`, `mimi_bookings`, `mimi_service_prices`, `mimi_additional_fees`, `mimi_point_settings`, `mimi_customer_points`, `mimi_sms_templates`, `mimi_admin_settings` 등.
- Supabase **Realtime**에서 `app_data`를 켜 두면 다른 탭/기기에서 변경 시 자동 반영에 가깝게 갱신됩니다.

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
