# mimisalon.pet 배포 가이드

## 1단계: Vercel에 배포

### 방법 A: Vercel 웹사이트에서 (추천)

1. **Vercel 가입**: https://vercel.com (GitHub 계정으로 로그인 권장)

2. **프로젝트 업로드**
   - "Add New..." → "Project" 클릭
   - MimiSalonPet 폴더를 GitHub에 올린 후 연결하거나
   - "Import Third-Party Git Repository" 대신 **로컬 폴더를 드래그**해서 업로드

3. **GitHub 사용 시** (권장)
   ```bash
   cd MimiSalonPet
   git init
   git add .
   git commit -m "Initial commit"
   # GitHub에 새 저장소 생성 후
   git remote add origin https://github.com/사용자명/MimiSalonPet.git
   git push -u origin main
   ```
   - Vercel → "Import Project" → GitHub 저장소 선택

4. **환경 변수 설정** (Vercel 프로젝트 설정 → Environment Variables)
   - `NEXT_PUBLIC_SUPABASE_URL` (실제 Supabase URL, 없으면 데모 모드)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (실제 키)
   - **`NEXT_PUBLIC_DEMO_AUTH` = `true`** ← 로그인 동작을 위해 권장 (Supabase 휴대폰 인증 미설정 시 필수)

5. **Deploy** 클릭 → 배포 완료 후 `xxx.vercel.app` 주소 확인

---

### 방법 B: Vercel CLI로

```bash
cd MimiSalonPet
npm i -g vercel
vercel login
vercel
```

---

## 2단계: mimisalon.pet 도메인 연결

1. Vercel 대시보드 → 프로젝트 선택 → **Settings** → **Domains**

2. **Add** 클릭 → `mimisalon.pet` 입력

3. Vercel이 DNS 설정 방법을 안내합니다:
   - **A 레코드**: `76.76.21.21` (Vercel IP)
   - **CNAME**: `cname.vercel-dns.com`

4. **도메인 구매처**에서 DNS 설정
   - **GoDaddy 사용 시**: `GODADDY_DOMAIN.md` 참고

5. 전파에 **몇 분~24시간** 걸릴 수 있습니다.

---

## 3단계: HTTPS (자동)

Vercel이 `mimisalon.pet`에 대해 **자동으로 SSL 인증서**를 발급합니다. 별도 설정 불필요.

---

## 체크리스트

- [ ] Vercel 배포 완료
- [ ] `xxx.vercel.app` 접속 확인
- [ ] mimisalon.pet 도메인 추가
- [ ] DNS 설정 완료
- [ ] https://mimisalon.pet 접속 확인
