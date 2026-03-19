# 카카오 로그인 "provider is not enabled" 해결

---

## 1. 프로젝트 확인 (가장 중요)

앱이 사용하는 Supabase 프로젝트 ID: **cykzrqbifpvuwdsbzyzy**

### 확인 방법
1. Supabase 대시보드 (https://supabase.com/dashboard) 접속
2. 프로젝트 목록에서 **mimisalon** 클릭
3. **브라우저 주소창** 확인:
   - ✅ 올바름: `https://supabase.com/dashboard/project/cykzrqbifpvuwdsbzyzy/...`
   - ❌ 잘못됨: `https://supabase.com/dashboard/project/다른문자열/...`

**다른 프로젝트 ID가 보이면** → 그 프로젝트가 아닙니다. 프로젝트 이름이 "mimisalon"인 항목을 찾아, 클릭 후 URL에 **cykzrqbifpvuwdsbzyzy**가 있는지 확인하세요.

---

## 2. Kakao Provider 설정

1. https://supabase.com/dashboard/project/cykzrqbifpvuwdsbzyzy/auth/providers 접속
2. **Kakao** 찾기 (Google, GitHub 아래에 있을 수 있음)
3. **Kakao** 클릭 → 설정 펼치기
4. **Enable** 스위치 → **ON** (파란색)
5. **Kakao Client ID**: Kakao Developers REST API 키 (32자 내외)
6. **Kakao Client Secret**: Kakao Developers에서 생성한 코드
7. **Save** 클릭
8. 페이지 새로고침 후 설정이 유지되는지 확인

---

## 3. Supabase 조직(Organization) 확인

여러 Supabase 조직이 있다면:
- 프로젝트 **cykzrqbifpvuwdsbzyzy**가 속한 조직에 로그인했는지 확인
- 좌측 상단 조직 이름 클릭 → 올바른 조직 선택

---

## 4. 그래도 안 될 때

1. **Supabase 지원**: https://supabase.com/dashboard/support
2. **프로젝트 재생성**: 새 Supabase 프로젝트 생성 후 .env.local의 URL, anon key 교체 (마지막 수단)
