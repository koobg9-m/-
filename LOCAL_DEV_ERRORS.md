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

## 6. Windows: `UNKNOWN: unknown error, open '.next\...\layout.js'` (errno -4094) → Internal Server Error

터미널에 위와 비슷한 메시지가 반복되면, **코드 오류가 아니라 PC가 `.next` 안 파일을 못 여는 경우**가 많습니다.

1. **Windows 보안(백신) 실시간 검사 제외**  
   프로젝트 폴더 `mimisalon` 전체를 **제외 목록**에 넣어 보세요. (특히 `.next` 가 자주 다시 쓰입니다.)

2. **OneDrive / 클라우드 동기화**  
   바탕화면·문서가 **OneDrive에 동기화**되면 `.next` 파일이 잠겨 같은 증상이 납니다.  
   - 가능하면 프로젝트를 **`C:\dev\mimisalon`** 처럼 **동기화 안 되는 경로**로 옮기거나,  
   - 해당 폴더만 동기화에서 제외하세요.

3. **개발 서버 하나만**  
   `npm run dev`가 **중복 실행**되지 않게 하고, 다른 터미널에서 같은 프로젝트를 켜지 마세요.

4. **다시 깨끗이**  
   ```bash
   npm run dev:fresh
   ```

5. **Turbo로 우회 (Webpack 대신)**  
   ```bash
   npm run dev:turbo
   ```  
   그다음 `http://localhost:5006` 으로 접속해 보세요.

## 7. `missing required error components, refreshing...` (개발 화면)

보통 **개발 서버 번들/캐시가 꼬였을 때** 또는 **Turbopack(`--turbo`)과 오버레이** 조합에서 나올 수 있습니다.

1. **`npm run clean` 후 일반 dev** (Turbo 없이)  
   ```bash
   npm run clean
   npm run dev
   ```
2. 그래도 같으면 **`npm run dev:turbo` 대신** 위처럼 **`npm run dev`만** 사용해 보세요.
3. 프로젝트에 **`src/app/not-found.tsx`** 가 있어야 App Router가 404/경계를 안정적으로 처리합니다. (저장소에 포함됨)

---

문제가 계속되면 **터미널에 나온 전체 에러 메시지**를 복사해 두면 원인 파악이 빠릅니다.
