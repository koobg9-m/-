# 미미살롱펫 배포 가이드

## 근본적 해결: 로컬 → Vercel 직접 배포

GitHub 연동 문제 없이 **로컬에서 바로 Vercel로 배포**하는 방법입니다.

---

## 1. Vercel CLI로 직접 배포 (권장)

### 1단계: Vercel 로그인 (최초 1회)

```powershell
npx vercel login
```

브라우저가 열리면 로그인 후 이메일 인증을 완료하세요.

### 2단계: 배포 실행

```powershell
cd c:\Users\미미살롱펫2\Desktop\mimisalon
npm run deploy
```

- `npm run deploy` = 빌드 후 Vercel 프로덕션 배포
- `npm run deploy:force` = 캐시 삭제 후 다시 빌드·배포

### 3단계: 프로젝트 연결 (최초 1회)

처음 실행 시 Vercel이 물어봅니다:

- **Set up and deploy?** → Y
- **Which scope?** → 본인 계정 선택
- **Link to existing project?** → Y (mimisalon이 있으면)
- **Project name** → mimisalon

---

## 2. GitHub 푸시 후 자동 배포 (연동 시)

GitHub 연동이 되어 있다면:

```powershell
git add .
git commit -m "메시지"
git push origin main
```

Vercel이 자동으로 배포합니다.

### 연동이 안 될 때 확인

1. [Vercel 대시보드](https://vercel.com/dashboard) → mimisalon 프로젝트
2. **Settings** → **Git**
3. **Connected Git Repository**가 `koobg9-m/-` 인지 확인
4. **Production Branch**가 `main` 인지 확인
5. **Disconnect** 후 **Reconnect**로 다시 연결

---

## 3. GitHub 저장소 이름 변경 (선택)

저장소 이름 `-`가 문제일 수 있다면:

1. GitHub → 저장소 **Settings** → **General**
2. **Repository name**을 `mimisalon`으로 변경
3. 로컬에서 remote 업데이트:

```powershell
git remote set-url origin https://github.com/koobg9-m/mimisalon.git
git push -u origin main
```

4. Vercel에서 새 저장소로 다시 연결

---

## 4. 배포 확인

배포 후:

- **https://mimisalon.vercel.app/api/version** → `{"version":"v2.2",...}` 확인
- **https://mimisalon.vercel.app/** → 푸터에 v2.2 표시 확인

---

## 요약

| 방법 | 명령어 | 비고 |
|------|--------|------|
| **직접 배포** | `npm run deploy` | 가장 확실 |
