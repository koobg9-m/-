# 미미살롱펫 (MimiSalonPet)

모바일 반려동물 미용 플랫폼 — 전문 그루머가 가정을 방문합니다.

## Tech Stack

- **Next.js** 14 (App Router)
- **TailwindCSS** for styling
- **Supabase** for backend (auth, database)

## 프로젝트 구조

```
미미살롱펫/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/       # React components
│   │   └── ui/           # Reusable UI components
│   ├── lib/              # Utilities and config
│   │   └── supabase/     # Supabase client (browser & server)
│   └── types/            # TypeScript types
├── public/
├── .env.example          # Environment variables template
└── package.json
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Add your Supabase project URL and anon key
   - **프로덕션 설정**: [SETUP.md](./SETUP.md) 참고 (Supabase, Auth, Vercel)

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5006](http://localhost:5006) (포트 5006)

### 로컬에서 `Internal Server Error` (500)가 날 때

터미널에 `UNKNOWN: unknown error, open '...\.next\...'` (예: `app\admin\page.js`, `chunks\...`) 가 보이면 **Windows에서 `.next` 파일 잠금·손상**인 경우가 많습니다. 관리자 페이지는 번들이 커서 잘 발생할 수 있습니다. (`next.config.js`에서 dev 시 웹팩 캐시를 끄도록 설정해 두었습니다.)

1. **개발 서버 종료** (실행 중인 터미널에서 `Ctrl+C`)
2. **캐시 삭제 후 재시작**
   ```bash
   npm run dev:fresh
   ```
   (`clean` + 포트 5006 정리 + `dev` — `package.json` 참고)

그래도 같으면: **백신 실시간 검사에서 프로젝트 폴더 제외**, **OneDrive 등 동기화 폴더 밖**에 클론, 다른 프로세스가 `.next`를 잡고 있지 않은지 확인.

### 코드·데이터는 로컬에서만 수정할 때 (운영에서 관리자 안 씀)

| 항목 | 설명 |
|------|------|
| **가능 여부** | 가능. `npm run dev`로 로컬 관리자에서 수정 후 `git push` / 배포하면 됨. |
| **Supabase** | 로컬과 운영이 **같은 Supabase 프로젝트**면, 로컬에서 저장한 홈·공지 등 데이터는 **운영 사이트에도 그대로 반영**됩니다(동일 DB). 분리하려면 프로젝트를 나누거나 마이그레이션 전략이 필요합니다. |
| **푸터 「관리자」** | **로컬·운영 기본 표시**. 숨기려면 `NEXT_PUBLIC_HIDE_ADMIN_LINK=1`. |
| **운영 관리자 비밀번호** | Vercel **`ADMIN_PASSWORD`** 또는 로컬에서 설정·동기화한 비밀번호(Supabase 해시)로 `/admin/login` 진입. |
| **운영에서 /admin 완전 차단** | `NEXT_PUBLIC_DISABLE_ADMIN=1` → 프로덕션에서 `/admin` 이 홈으로 이동(로컬 dev는 영향 없음). |
| **최초 설정** | 운영에서 관리자를 막았다면 `NEXT_PUBLIC_ALLOW_ADMIN_SETUP`은 `0`이면 충분합니다. |

자세한 변수 설명은 `.env.example` 참고.

## 지도 API (선택, 거리 기반 매칭용)

Kakao 또는 Naver 지도 API 키를 설정하면 **실제 거리**로 미용사 매칭이 됩니다.

- **Kakao** (권장): [developers.kakao.com](https://developers.kakao.com) → REST API 키 → `.env.local`에 `KAKAO_REST_API_KEY` 추가
- **Naver**: [console.ncloud.com](https://console.ncloud.com) → Maps Geocoding → `NAVER_MAPS_CLIENT_ID`, `NAVER_MAPS_CLIENT_SECRET` 추가

API 키가 없으면 주소 기반 추정으로 동작합니다.

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Project Settings → API
3. Add them to `.env.local`
4. **PC/모바일 데이터 동기화**: Supabase 대시보드 → SQL Editor에서 `supabase/migrations/20250314000000_app_data.sql` 내용 실행
   - 디자이너, 예약, 고객 등 데이터가 Supabase에 저장되어 PC와 핸드폰에서 동시에 접근 가능
   - Supabase 미설정 시 기존처럼 localStorage 사용 (기기별 데이터)
