"use client";

import { Suspense } from "react";
import BatchEmailAuth from "@/components/auth/BatchEmailAuth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BatchEmailPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">대량 이메일 인증 관리</h1>
          <Link 
            href="/admin" 
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            관리자 대시보드로 돌아가기
          </Link>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <Suspense fallback={<div>로딩 중...</div>}>
            <BatchEmailAuth />
          </Suspense>
        </div>

        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">대량 이메일 인증 사용 가이드</h2>
          
          <div className="prose max-w-none">
            <h3>사용 방법</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>이메일 목록을 텍스트 영역에 입력하거나 CSV 파일을 업로드합니다.</li>
              <li>이메일은 줄바꿈, 쉼표, 또는 세미콜론으로 구분할 수 있습니다.</li>
              <li>&quot;인증 링크 일괄 발송&quot; 버튼을 클릭하여 처리를 시작합니다.</li>
              <li>처리 결과는 테이블에 표시되며, CSV 파일로 다운로드할 수 있습니다.</li>
            </ol>

            <h3 className="mt-4">주의 사항</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Supabase의 이메일 발송 제한을 고려하여 배치 단위로 처리됩니다.</li>
              <li>대량 발송 시 Supabase 요금제에 따른 제한이 있을 수 있습니다.</li>
              <li>이메일 형식이 올바르지 않은 경우 오류로 표시됩니다.</li>
              <li>이미 가입된 사용자에게도 로그인 링크가 발송됩니다.</li>
            </ul>

            <h3 className="mt-4">CSV 파일 형식</h3>
            <p>CSV 파일은 다음과 같은 형식이어야 합니다:</p>
            <pre className="bg-gray-100 p-2 rounded">
              email@example.com<br/>
              another@example.com<br/>
              third@example.com
            </pre>
            <p>또는 헤더가 있는 형식:</p>
            <pre className="bg-gray-100 p-2 rounded">
              Email<br/>
              email@example.com<br/>
              another@example.com<br/>
              third@example.com
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}