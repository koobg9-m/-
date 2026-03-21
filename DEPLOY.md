# 배포 (자동)

## Vercel + GitHub 연동 시 (권장)

1. [Vercel 대시보드](https://vercel.com) → 프로젝트 → **Settings → Git** 에서 이 저장소가 연결되어 있으면  
2. **`main` 브랜치에 `git push`** 할 때마다 **프로덕션 배포가 자동**으로 진행됩니다.

별도 명령 없이 **푸시만** 하면 됩니다.

## 수동 배포 (CLI)

Git 연동 없이 또는 강제 배포가 필요할 때:

```bash
npm run build
npm run deploy
```

(프로젝트에 맞는 `deploy` 스크립트 사용)

## GitHub Actions 워크플로

`.github/workflows/deploy.yml` 은 **수동 실행(`workflow_dispatch`)** 위주입니다.  
`VERCEL_TOKEN` 등 Secrets를 넣고 `push` 트리거를 켜면 Actions로도 배포할 수 있으나, **Vercel Git 연동과 중복 배포**되지 않도록 보통은 한 가지만 사용합니다.
