import { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * 사용자 프로필 정보 인터페이스
 */
export interface UserProfile {
  id: string;
  email?: string | null;
  name?: string | null;
  avatar_url?: string | null;
  provider?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * 사용자 프로필 정보 가져오기
 * @param supabase Supabase 클라이언트
 * @param user 사용자 객체
 * @returns 사용자 프로필 정보
 */
export async function getUserProfile(supabase: SupabaseClient, user: User): Promise<UserProfile | null> {
  try {
    // 프로필 정보 조회
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("프로필 정보 조회 오류:", error);
      return createDefaultProfile(user);
    }

    return data || createDefaultProfile(user);
  } catch (err) {
    console.error("사용자 프로필 정보 가져오기 오류:", err);
    return createDefaultProfile(user);
  }
}

/**
 * 기본 프로필 정보 생성
 * @param user 사용자 객체
 * @returns 기본 프로필 정보
 */
function createDefaultProfile(user: User): UserProfile {
  // 카카오 사용자 정보 추출
  const kakaoData = user.user_metadata?.kakao_data;
  const kakaoName = kakaoData?.properties?.nickname || kakaoData?.kakao_account?.profile?.nickname;
  const kakaoEmail = kakaoData?.kakao_account?.email;
  const kakaoAvatar = kakaoData?.properties?.profile_image || kakaoData?.kakao_account?.profile?.profile_image_url;
  
  // 제공자 확인
  const provider = user.app_metadata?.provider || 'email';

  return {
    id: user.id,
    email: user.email || kakaoEmail || null,
    name: kakaoName || user.user_metadata?.full_name || null,
    avatar_url: kakaoAvatar || user.user_metadata?.avatar_url || null,
    provider,
    created_at: user.created_at,
    updated_at: new Date().toISOString()
  };
}

/**
 * 사용자 프로필 정보 업데이트 또는 생성
 * @param supabase Supabase 클라이언트
 * @param profile 프로필 정보
 * @returns 업데이트된 프로필 정보
 */
export async function updateUserProfile(
  supabase: SupabaseClient, 
  profile: UserProfile
): Promise<UserProfile | null> {
  try {
    // profiles 테이블이 없는 경우 새로 생성
    const { error: tableError } = await supabase.rpc('create_profiles_if_not_exists');
    if (tableError) {
      console.error("프로필 테이블 생성 오류:", tableError);
    }

    // 프로필 정보 업데이트 또는 생성
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        avatar_url: profile.avatar_url,
        provider: profile.provider,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("프로필 정보 업데이트 오류:", error);
      return null;
    }

    return data;
  } catch (err) {
    console.error("사용자 프로필 정보 업데이트 오류:", err);
    return null;
  }
}