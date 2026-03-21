"use client";

import { useEffect, useState } from "react";
import { getGroomerById } from "@/lib/groomer-storage";
import { verifyPassword } from "@/lib/auth-utils";

const MY_GROOMER_KEY = "mimi_my_groomer_id";
const GROOMER_AUTH_KEY = "mimi_groomer_authenticated";
const GROOMER_AUTO_LOGIN_KEY = "mimi_groomer_auto_login";

/**
 * 디자이너 자동 로그인 컴포넌트
 * 
 * 이 컴포넌트는 디자이너 페이지에서 사용되며, 자동 로그인 설정이 있는 경우
 * 자동으로 로그인을 시도합니다.
 */
export default function GroomerAutoLogin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        // 자동 로그인 설정 확인
        const autoLoginData = localStorage.getItem(GROOMER_AUTO_LOGIN_KEY);
        if (!autoLoginData) {
          setIsLoading(false);
          return;
        }

        // 자동 로그인 데이터 파싱
        const { id, password } = JSON.parse(autoLoginData);
        if (!id || !password) {
          setIsLoading(false);
          return;
        }

        // 이미 인증된 경우 확인
        const auth = sessionStorage.getItem(GROOMER_AUTH_KEY);
        if (auth === id) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // 그루머 정보 가져오기
        const groomer = await getGroomerById(id);
        if (!groomer || !groomer.passwordHash) {
          setIsLoading(false);
          return;
        }

        // 비밀번호 검증
        const isValid = await verifyPassword(password, groomer.passwordHash);
        if (isValid) {
          // 인증 성공
          sessionStorage.setItem(GROOMER_AUTH_KEY, id);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("자동 로그인 오류:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAutoLogin();
  }, []);

  return null; // UI를 렌더링하지 않음
}

/**
 * 디자이너 자동 로그인 설정
 * 
 * @param id 디자이너 ID
 * @param password 디자이너 비밀번호
 * @param enabled 자동 로그인 활성화 여부
 */
export function setGroomerAutoLogin(id: string, password: string, enabled: boolean) {
  if (enabled) {
    localStorage.setItem(GROOMER_AUTO_LOGIN_KEY, JSON.stringify({ id, password }));
  } else {
    localStorage.removeItem(GROOMER_AUTO_LOGIN_KEY);
  }
}

/**
 * 디자이너 자동 로그인 설정 확인
 * 
 * @returns 자동 로그인 설정 여부
 */
export function isGroomerAutoLoginEnabled() {
  return !!localStorage.getItem(GROOMER_AUTO_LOGIN_KEY);
}

/**
 * 디자이너 자동 로그인 설정 삭제
 */
export function clearGroomerAutoLogin() {
  localStorage.removeItem(GROOMER_AUTO_LOGIN_KEY);
}