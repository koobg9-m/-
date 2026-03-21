"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AdminMenu from "@/components/admin/AdminMenu";
import { hashPassword } from "@/lib/auth-utils";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

export default function AdminPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    
    // 비밀번호 유효성 검사
    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("비밀번호와 확인 비밀번호가 일치하지 않습니다.");
      return;
    }
    
    setLoading(true);
    
    try {
      // 비밀번호 변경 API 호출
      const response = await fetch("/api/admin-auth/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "비밀번호 변경 중 오류가 발생했습니다.");
      }
      
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "비밀번호 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <AdminMenu />
          
          <h1 className="text-2xl font-bold text-gray-800 mb-6">관리자 비밀번호 변경</h1>
          
          <div className="card p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                  placeholder="새 비밀번호 (6자 이상)"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 확인
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                  placeholder="비밀번호 확인"
                  required
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="p-3 bg-green-50 text-green-700 rounded-lg">
                  비밀번호가 성공적으로 변경되었습니다.
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-mimi-orange text-white rounded-xl font-medium hover:bg-mimi-orange/90 disabled:opacity-60"
                >
                  {loading ? "변경 중..." : "비밀번호 변경"}
                </button>
                
                <Link
                  href="/admin"
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300"
                >
                  취소
                </Link>
              </div>
            </form>
          </div>
          
          <div className="card p-6 bg-blue-50">
            <h2 className="text-lg font-medium text-gray-800 mb-3">비밀번호 변경 안내</h2>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>비밀번호는 최소 6자 이상이어야 합니다.</li>
              <li>보안을 위해 영문, 숫자, 특수문자를 조합하는 것이 좋습니다.</li>
              <li>비밀번호 변경 후 새 비밀번호로 로그인할 수 있습니다.</li>
              <li>비밀번호를 잊어버린 경우, 개발자에게 문의하세요.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}