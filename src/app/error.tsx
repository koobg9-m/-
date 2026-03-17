"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const msg = error?.message || "잠시 후 다시 시도해 주세요.";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-mimi-yellow/20 to-mimi-orange/10">
      <div className="text-center max-w-md">
        <span className="text-6xl">😿</span>
        <h1 className="text-2xl font-bold text-gray-800 mt-4">문제가 발생했어요</h1>
        <p className="text-gray-600 mt-2">{msg}</p>
        <div className="flex gap-4 justify-center mt-8">
          <button
            onClick={reset}
            className="px-6 py-3 bg-mimi-orange text-white rounded-full font-medium hover:bg-mimi-orange/90"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-white text-mimi-orange border-2 border-mimi-orange rounded-full font-medium hover:bg-mimi-orange/10"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
