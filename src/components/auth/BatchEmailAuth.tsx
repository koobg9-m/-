"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-callback-url";

type EmailStatus = {
  email: string;
  status: "pending" | "sent" | "error";
  message?: string;
};

const BATCH_SIZE = 5; // 한 번에 처리할 이메일 수
const DELAY_MS = 2000; // 배치 사이의 지연 시간 (밀리초)

export default function BatchEmailAuth() {
  const [emails, setEmails] = useState<string>("");
  const [emailList, setEmailList] = useState<EmailStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [progress, setProgress] = useState(0);

  // 이메일 리스트 처리
  const handleEmailsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEmails(e.target.value);
  };

  // 이메일 유효성 검사
  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 이메일 리스트 준비
  const prepareEmailList = () => {
    const list = emails
      .split(/[\n,;]/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0)
      .map((email) => ({
        email,
        status: validateEmail(email) ? "pending" : "error",
        message: validateEmail(email) ? undefined : "유효하지 않은 이메일 형식",
      })) as EmailStatus[];

    setEmailList(list);
    const validEmails = list.filter((item) => item.status === "pending");
    setTotalBatches(Math.ceil(validEmails.length / BATCH_SIZE));
    return list;
  };

  // 이메일 인증 링크 전송
  const sendAuthLinks = async () => {
    if (!isSupabaseConfigured()) {
      alert("Supabase 설정이 완료되지 않았습니다.");
      return;
    }

    const list = prepareEmailList();
    if (list.length === 0) {
      alert("처리할 이메일이 없습니다.");
      return;
    }

    const validEmails = list.filter((item) => item.status === "pending");
    if (validEmails.length === 0) {
      alert("유효한 이메일이 없습니다.");
      return;
    }

    setIsProcessing(true);
    setCurrentBatch(0);
    setProgress(0);

    try {
      const supabase = createClient();
      const redirectTo = getAuthCallbackUrl();

      // 배치 단위로 처리
      for (let i = 0; i < validEmails.length; i += BATCH_SIZE) {
        setCurrentBatch(Math.floor(i / BATCH_SIZE) + 1);
        
        const batch = validEmails.slice(i, i + BATCH_SIZE);
        
        // 배치 내 이메일 병렬 처리
        await Promise.all(
          batch.map(async (item, index) => {
            try {
              const { error } = await supabase.auth.signInWithOtp({
                email: item.email,
                options: {
                  emailRedirectTo: redirectTo,
                  shouldCreateUser: true,
                },
              });

              setEmailList((prev) => {
                const newList = [...prev];
                const emailIndex = newList.findIndex((e) => e.email === item.email);
                if (emailIndex !== -1) {
                  newList[emailIndex] = {
                    ...newList[emailIndex],
                    status: error ? "error" : "sent",
                    message: error ? error.message : "발송 완료",
                  };
                }
                return newList;
              });
            } catch (err) {
              const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류";
              
              setEmailList((prev) => {
                const newList = [...prev];
                const emailIndex = newList.findIndex((e) => e.email === item.email);
                if (emailIndex !== -1) {
                  newList[emailIndex] = {
                    ...newList[emailIndex],
                    status: "error",
                    message: errorMessage,
                  };
                }
                return newList;
              });
            }
          })
        );

        // 진행률 업데이트
        const newProgress = Math.min(100, Math.round(((i + batch.length) / validEmails.length) * 100));
        setProgress(newProgress);

        // 마지막 배치가 아니라면 지연 시간 추가
        if (i + BATCH_SIZE < validEmails.length) {
          await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
        }
      }
    } catch (error) {
      console.error("이메일 인증 링크 전송 중 오류 발생:", error);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  // CSV 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setEmails(content);
      }
    };
    reader.readAsText(file);
  };

  // 결과 다운로드
  const downloadResults = () => {
    const csvContent = "이메일,상태,메시지\n" + 
      emailList.map(item => `"${item.email}","${item.status}","${item.message || ''}"`).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `이메일인증결과_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">대량 이메일 인증 링크 발송</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          이메일 목록 (줄바꿈, 쉼표, 세미콜론으로 구분)
        </label>
        <textarea
          value={emails}
          onChange={handleEmailsChange}
          disabled={isProcessing}
          className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-mimi-orange focus:border-mimi-orange"
          placeholder="example1@email.com&#10;example2@email.com&#10;example3@email.com"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          또는 CSV 파일 업로드
        </label>
        <input
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          disabled={isProcessing}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-mimi-orange file:text-white hover:file:bg-mimi-orange/90"
        />
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={sendAuthLinks}
          disabled={isProcessing || !emails.trim()}
          className="px-4 py-2 bg-mimi-orange text-white font-medium rounded-md hover:bg-mimi-orange/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? "처리 중..." : "인증 링크 일괄 발송"}
        </button>
        
        {emailList.length > 0 && (
          <button
            onClick={downloadResults}
            disabled={isProcessing}
            className="px-4 py-2 bg-gray-600 text-white font-medium rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            결과 다운로드 (CSV)
          </button>
        )}
      </div>

      {isProcessing && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              진행 중: 배치 {currentBatch}/{totalBatches}
            </span>
            <span className="text-sm font-medium text-gray-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-mimi-orange h-2.5 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {emailList.length > 0 && (
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이메일
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  메시지
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {emailList.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.status === "sent" ? "bg-green-100 text-green-800" :
                      item.status === "error" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {item.status === "sent" ? "발송 완료" :
                       item.status === "error" ? "오류" :
                       "대기 중"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.message || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}