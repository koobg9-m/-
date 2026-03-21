# 로컬에서 `Internal Server Error`가 날 때

브라우저에 **Internal Server Error**만 보이면, 원인은 거의 항상 **개발 서버(터미널)** 쪽에 출력됩니다. 아래 순서로 확인하세요.

## 1. 터미널 로그 확인

`npm run dev`를 실행한 **그 터미널**에 빨간색 스택 트레이스가 있는지 봅니다. 그 내용이 원인입니다.

## 2. 캐시 초기화 후 재시작 (가장 흔한 해결)

```bash
npm run clean
npm run dev
```

또는 한 번에:

```bash
npm run dev:fresh
```

(Windows: `.next` 삭제 + 필요 시 5006 포트 정리 후 `dev` 실행)

## 3. 포트 5006이 이미 쓰이는 경우

에러 예: `EADDRINUSE` / `address already in use :::5006`

- 다른 터미널에서 이미 `npm run dev`가 돌아가는지 확인하고 하나만 켜 두세요.
- 또는:

```bash
npm run dev:restart
```

다른 포트로 띄우려면:

```bash
npx next dev -p 5010
```

브라우저에서는 `http://localhost:5010` 으로 접속합니다.

## 4. `next start`로 볼 때

운영과 같이 `npm run build` 후 `npm run start`를 쓰는 경우, **먼저 빌드가 성공**해야 합니다.

```bash
npm run build
npm run start
```

빌드가 실패하면 `start`에서 500이 날 수 있습니다.

## 5. 그래도 안 되면

- `http://localhost:5006` 을 **직접** 주소창에 입력해 보세요 (프록시/다른 도구 경유 제외).
- Node 버전: **18 이상** 권장 (`node -v`).
- 프로젝트 루트에서 명령을 실행했는지 확인 (`package.json` 있는 폴더).

---

문제가 계속되면 **터미널에 나온 전체 에러 메시지**를 복사해 두면 원인 파악이 빠릅니다.
