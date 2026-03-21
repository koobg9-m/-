"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 운영(production) + NEXT_PUBLIC_DISABLE_ADMIN=1 일 때만 /admin* 접근을 막음.
 * 관리자를 쓰려면 Vercel에서 이 값을 삭제하고 재배포하세요.
 * (middleware 대체 — Windows 로컬 dev에서 middleware 번들 잠금 회피)
 */
export default function AdminProductionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const disableProdAdmin =
    process.env.NODE_ENV === "production" &&
    (process.env.NEXT_PUBLIC_DISABLE_ADMIN === "1" || process.env.NEXT_PUBLIC_DISABLE_ADMIN === "true");

  const blocked = disableProdAdmin && !!pathname?.startsWith("/admin");

  if (blocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-mimi-cream p-6">
        <div className="w-full max-w-md card p-8 text-center shadow-elevated">
          <p className="text-3xl mb-2" aria-hidden>
            🔒
          </p>
          <h1 className="text-lg font-bold text-gray-800 mb-3">관리자 페이지가 비활성화되어 있습니다</h1>
          <p className="text-sm text-gray-600 leading-relaxed mb-2">
            Vercel 환경 변수에{" "}
            <code className="text-xs bg-stone-100 px-1.5 py-0.5 rounded font-mono">NEXT_PUBLIC_DISABLE_ADMIN</code>
            이 켜져 있어 운영에서 <code className="text-xs font-mono">/admin</code> 전체가 차단된 상태입니다.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-6">
            관리자를 사용하려면 Vercel → Settings → Environment Variables 에서 해당 변수를{" "}
            <strong className="text-stone-800">삭제</strong>하거나 <strong className="text-stone-800">0</strong>으로 바꾼 뒤{" "}
            <strong className="text-stone-800">재배포</strong>하세요.
          </p>
          <p className="text-xs text-stone-500 mb-4">
            배포 후 확인: <code className="font-mono">/api/version</code> 의{" "}
            <code className="font-mono">adminPanelBlocked</code> 가 <code className="font-mono">false</code> 여야 합니다.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-mimi-orange text-white font-bold hover:bg-mimi-orange/90"
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
