# 관리자 로그인 — 운영에서 상태 확인하기 (비밀번호는 안 보임)

브라우저 주소창에 아래를 넣고 **JSON**만 보면 됩니다. **비밀번호 문자열은 어디에도 나오지 않습니다.**

## 1) 한 번에 보기 (권장)

**https://mimisalon.vercel.app/api/version**

확인할 필드:

| 필드 | 의미 |
|------|------|
| `adminPanelBlocked` | `true`면 관리자 전체 차단 → Vercel에서 `NEXT_PUBLIC_DISABLE_ADMIN` 끄고 재배포 |
| `supabaseConfigured` | `false`면 Supabase URL/anon 키가 서버에 없음 |
| `adminEnvPasswordSet` | `true`면 Vercel에 **`ADMIN_PASSWORD`** 가 설정된 것 (내용은 안 보임) |
| `adminPasswordHashInDatabase` | `true`면 Supabase에 **로컬에서 올린 관리자 해시**가 있는 것 |
| `adminLoginReady` | `true`면 (차단만 아니면) **로그인 시도 자체는 가능한 상태** |

## 2) 같은 내용 (config 전용)

**https://mimisalon.vercel.app/api/admin-auth/config**

- `envPasswordAuth` ≈ `adminEnvPasswordSet`
- `hasPasswordHashInDb` ≈ `adminPasswordHashInDatabase`

## 3) 해석

- **`adminEnvPasswordSet`: false 이고 `adminPasswordHashInDatabase`: false**  
  → Vercel에 `ADMIN_PASSWORD`도 없고, Supabase에도 해시가 없음 → **둘 중 하나를 만들어야** `/admin/login` 가능.

- **`adminPasswordHashInDatabase`: true**  
  → 로컬에서 정한 **평문 비밀번호**(그때 입력한 것)로 로그인하면 됨. `ADMIN_PASSWORD` 없어도 됨.

- **`adminEnvPasswordSet`: true**  
  → Vercel에 넣은 **`ADMIN_PASSWORD`와 동일한 문자열**로 로그인.

---

※ `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 **관리자 비밀번호가 아니라** Supabase 연결용 키입니다.
