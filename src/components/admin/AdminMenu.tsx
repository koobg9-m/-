"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative mb-6">
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
      >
        <span>관리자 메뉴</span>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isMenuOpen && (
        <div className="absolute z-10 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <Link 
              href="/admin" 
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
            >
              관리자 대시보드
            </Link>
            <Link 
              href="/admin/batch-email" 
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" 
              role="menuitem"
              onClick={() => setIsMenuOpen(false)}
            >
              대량 이메일 인증 관리
            </Link>
            <hr className="my-1" />
            <button 
              onClick={() => {
                setIsMenuOpen(false);
                // 로그아웃 처리
                fetch("/api/admin-auth/logout", { method: "POST" })
                  .then(() => {
                    window.location.href = "/admin/login";
                  })
                  .catch(err => {
                    console.error("로그아웃 오류:", err);
                    window.location.href = "/admin/login";
                  });
              }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" 
              role="menuitem"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}