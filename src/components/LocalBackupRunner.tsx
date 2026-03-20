"use client";

import { useEffect, useRef } from "react";
import { isLocalAutoBackupEnabled, runLocalAutoBackup } from "@/lib/local-autobackup";

const INTERVAL_MS = 4 * 60 * 1000; // 4분

/**
 * 로컬 개발(npm run dev)에서만 IndexedDB 자동 백업 스케줄
 */
export default function LocalBackupRunner() {
  const mounted = useRef(false);

  useEffect(() => {
    if (!isLocalAutoBackupEnabled() || typeof window === "undefined") return;
    if (mounted.current) return;
    mounted.current = true;

    const tick = () => {
      void runLocalAutoBackup().catch(() => {});
    };

    // 첫 로드 직후 약간 지연 (hydrate 이후 localStorage 채워진 뒤)
    const t0 = window.setTimeout(tick, 8000);
    const id = window.setInterval(tick, INTERVAL_MS);

    const onHide = () => {
      if (document.visibilityState === "hidden") tick();
    };
    const onUnload = () => tick();

    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);

    return () => {
      window.clearTimeout(t0);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  return null;
}
