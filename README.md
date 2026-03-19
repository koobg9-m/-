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
