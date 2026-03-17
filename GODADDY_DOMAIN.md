# GoDaddy 도메인 → Vercel 연결 가이드

mimisalon.pet (GoDaddy)을 Vercel 배포 사이트에 연결하는 방법입니다.

---

## 사전 준비

- [ ] MimiSalonPet이 Vercel에 배포되어 있어야 합니다.
- [ ] `xxx.vercel.app` 주소로 접속이 되어야 합니다.

---

## 1단계: Vercel에서 도메인 추가

1. https://vercel.com 로그인
2. MimiSalonPet 프로젝트 클릭
3. **Settings** → **Domains** 메뉴
4. **Add** 버튼 클릭
5. `mimisalon.pet` 입력 후 **Add** 클릭
6. `www.mimisalon.pet`도 추가하려면 같은 방법으로 한 번 더 추가

---

## 2단계: GoDaddy DNS 설정

### GoDaddy 접속

1. https://www.godaddy.com 로그인
2. **내 제품** → **도메인** → **mimisalon.pet** 선택
3. **DNS** 또는 **DNS 관리** 클릭

### DNS 레코드 수정

**기존 레코드 정리 (선택):**
- `@` (루트) A 레코드가 있으면 수정
- `www` CNAME이 있으면 수정

**다음처럼 설정:**

| 유형 | 이름 | 값 | TTL |
|------|------|-----|-----|
| **A** | `@` | `76.76.21.21` | 600 (또는 1시간) |
| **CNAME** | `www` | `cname.vercel-dns.com` | 600 |

### GoDaddy 화면에서 하는 방법

1. **레코드 추가** 또는 **추가** 클릭
2. **A 레코드**:
   - 유형: `A`
   - 이름: `@` (또는 비워두기)
   - 값: `76.76.21.21`
   - TTL: `600` 또는 `1시간`
   - 저장

3. **CNAME 레코드** (www 사용 시):
   - 유형: `CNAME`
   - 이름: `www`
   - 값: `cname.vercel-dns.com`
   - TTL: `600` 또는 `1시간`
   - 저장

---

## 3단계: Vercel 네임서버 사용 (대안, 더 간단)

GoDaddy에서 DNS 대신 Vercel 네임서버를 쓰면, DNS 레코드는 Vercel에서 관리합니다.

### Vercel에서 네임서버 확인

1. Vercel → 프로젝트 → Settings → Domains
2. `mimisalon.pet` 선택
3. **Use Vercel Nameservers** 또는 **네임서버 사용** 선택
4. 안내되는 네임서버 주소 복사 (예: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`)

### GoDaddy에서 네임서버 변경

1. GoDaddy → mimisalon.pet → **관리**
2. **네임서버** → **변경** 클릭
3. **사용자 지정** 선택
4. Vercel에서 받은 네임서버 2개 입력
5. **저장**

---

## 4단계: 연결 확인

- DNS 전파: 보통 **5분~1시간**, 최대 24~48시간
- Vercel Domains 화면에서 `mimisalon.pet` 상태가 **Valid**로 바뀌면 연결 완료
- 브라우저에서 `https://mimisalon.pet` 접속 테스트

---

## 문제 해결

| 증상 | 확인 사항 |
|------|-----------|
| 연결 안 됨 | DNS 저장 후 1시간 정도 기다리기 |
| SSL 오류 | Vercel이 인증서 발급 중일 수 있음, 10~30분 후 재시도 |
| www만 됨 / 루트만 됨 | `@` A 레코드와 `www` CNAME 둘 다 설정했는지 확인 |
