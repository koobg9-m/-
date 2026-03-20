"use client";

import { useState, useEffect, useRef } from "react";
import {
  isLocalAutoBackupEnabled,
  runLocalAutoBackup,
  getLastBackupTimestamp,
  listSnapshots,
  restoreLatestSnapshot,
  restoreSnapshotToLocalStorage,
  downloadBackupJson,
  restoreFromJsonFile,
} from "@/lib/local-autobackup";

type Props = {
  onRestored?: () => void;
};

export default function AdminLocalBackupCard({ onRestored }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [lastTs, setLastTs] = useState<number | null>(null);
  const [snaps, setSnaps] = useState<{ id: number; ts: number; keyCount: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEnabled(isLocalAutoBackupEnabled());
  }, []);

  const refresh = () => {
    void getLastBackupTimestamp().then(setLastTs);
    void listSnapshots().then(setSnaps);
  };

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const id = window.setInterval(refresh, 20000);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  const fmt = (ts: number) =>
    new Date(ts).toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "medium" });

  return (
    <div className="card p-5 border border-sky-200 bg-sky-50/40">
      <h3 className="font-bold text-gray-800 mb-1">로컬 자동 백업 (이 PC 브라우저)</h3>
      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
        <code className="bg-white/80 px-1 rounded">npm run dev</code>일 때만{" "}
        <strong>mimi_*</strong> 데이터를 IndexedDB에 약 4분마다·탭 나갈 때 자동 저장합니다. 운영 배포본에는
        동작하지 않습니다.
      </p>
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700 mb-3">
        <span>
          최근 백업:{" "}
          <strong className="text-sky-900">{lastTs ? fmt(lastTs) : "없음"}</strong>
        </span>
        <span className="text-gray-400">|</span>
        <span>스냅샷 {snaps.length}개 (최대 25개 유지)</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await runLocalAutoBackup();
              refresh();
              alert("지금 백업 완료");
            } catch (e) {
              alert(String(e));
            } finally {
              setBusy(false);
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-white border border-sky-300 text-sky-900 text-sm hover:bg-sky-100 disabled:opacity-50"
        >
          지금 백업
        </button>
        <button
          type="button"
          disabled={busy || snaps.length === 0}
          onClick={async () => {
            if (!confirm("가장 최근 스냅샷으로 localStorage를 덮어씁니다. 계속할까요?")) return;
            setBusy(true);
            try {
              const r = await restoreLatestSnapshot();
              if (!r.ok) {
                alert(r.error ?? "실패");
                return;
              }
              onRestored?.();
              alert("복원 완료. 필요하면 새로고침하세요.");
            } finally {
              setBusy(false);
            }
          }}
          className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-sm hover:bg-sky-700 disabled:opacity-50"
        >
          최근 백업으로 복원
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => downloadBackupJson()}
          className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-800 text-sm hover:bg-gray-50"
        >
          JSON 파일로 저장
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-800 text-sm hover:bg-gray-50"
        >
          JSON에서 복원
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) return;
            setBusy(true);
            try {
              const r = await restoreFromJsonFile(f);
              if (!r.ok) {
                alert(r.error ?? "실패");
                return;
              }
              onRestored?.();
              alert("JSON에서 복원했습니다.");
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
      {snaps.length > 0 && (
        <div className="text-xs text-gray-600 space-y-1 max-h-28 overflow-y-auto border border-sky-100 rounded-lg p-2 bg-white/60">
          {[...snaps].reverse().slice(0, 8).map((s) => (
            <div key={s.id} className="flex justify-between gap-2">
              <span>{fmt(s.ts)} · 키 {s.keyCount}개</span>
              <button
                type="button"
                disabled={busy}
                className="text-sky-700 underline shrink-0"
                onClick={async () => {
                  if (!confirm("이 시점으로 복원합니다. 계속할까요?")) return;
                  setBusy(true);
                  try {
                    const r = await restoreSnapshotToLocalStorage(s.id);
                    if (!r.ok) {
                      alert(r.error ?? "실패");
                      return;
                    }
                    onRestored?.();
                    alert("복원 완료");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                이 시점 복원
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
