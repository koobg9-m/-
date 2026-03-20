"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLayoutEffect } from "react";

/**
 * 운영(production) + NEXT_PUBLIC_DISABLE_ADMIN=1 일 때 /admin* 접근을 홈으로 보냄.
 * (기존 middleware 대체 — Windows 로컬 dev에서 middleware 번들 파일 잠금으로 500 나는 문제 회피)
 */
export default function AdminProductionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const disableProdAdmin =
    process.env.NODE_ENV === "production" &&
    (process.env.NEXT_PUBLIC_DISABLE_ADMIN === "1" || process.env.NEXT_PUBLIC_DISABLE_ADMIN === "true");

  const blocked = disableProdAdmin && !!pathname?.startsWith("/admin");

  useLayoutEffect(() => {
    if (!blocked) return;
    router.replace("/");
  }, [blocked, router]);

  if (blocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mimi-cream">
        <p className="text-stone-500 text-sm">이동 중…</p>
      </div>
    );
  }

  return <>{children}</>;
}
