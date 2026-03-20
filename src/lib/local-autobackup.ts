"use client";

/**
 * 로컬 개발 시 localStorage(mimi_*) 자동 스냅샷 → IndexedDB
 * 브라우저/PC 안에서만 보관 (서버 전송 없음)
 */

const DB_NAME = "mimi_local_autobackup_v1";
const STORE = "snapshots";
const DB_VERSION = 1;
const MAX_SNAPSHOTS = 25;
const PREFIX = "mimi_";

export type LocalBackupSnapshot = {
  id: number;
  ts: number;
  /** key → value (문자열 그대로) */
  entries: Record<string, string>;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

function collectMimiEntries(): Record<string, string> {
  const entries: Record<string, string> = {};
  if (typeof window === "undefined") return entries;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      const v = localStorage.getItem(key);
      if (v !== null) entries[key] = v;
    }
  } catch {
    /* ignore */
  }
  return entries;
}

/** 자동 백업 실행 (스냅샷 추가 + 오래된 것 삭제) */
export async function runLocalAutoBackup(): Promise<{ ok: boolean; ts?: number; keyCount?: number; error?: string }> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return { ok: false, error: "IndexedDB 사용 불가" };
  }
  try {
    const entries = collectMimiEntries();
    const keyCount = Object.keys(entries).length;
    if (keyCount === 0) {
      return { ok: true, ts: Date.now(), keyCount: 0 };
    }
    const db = await openDb();
    const ts = Date.now();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const st = tx.objectStore(STORE);
      const addReq = st.add({ ts, entries } as Omit<LocalBackupSnapshot, "id">);
      addReq.onerror = () => reject(addReq.error);
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });

    await trimOldSnapshots();
    return { ok: true, ts, keyCount };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function trimOldSnapshots(): Promise<void> {
  const db = await openDb();
  const all = await new Promise<LocalBackupSnapshot[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const st = tx.objectStore(STORE);
    const req = st.getAll();
    req.onsuccess = () => resolve((req.result as LocalBackupSnapshot[]) ?? []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
  if (all.length <= MAX_SNAPSHOTS) return;
  all.sort((a, b) => a.ts - b.ts);
  const toDelete = all.slice(0, all.length - MAX_SNAPSHOTS);
  const db2 = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db2.transaction(STORE, "readwrite");
    const st = tx.objectStore(STORE);
    let left = toDelete.length;
    if (left === 0) {
      db2.close();
      resolve();
      return;
    }
    for (const s of toDelete) {
      const del = st.delete(s.id);
      del.onsuccess = () => {
        left--;
        if (left === 0) {
          db2.close();
          resolve();
        }
      };
      del.onerror = () => reject(del.error);
    }
    tx.onerror = () => reject(tx.error);
  });
}

/** 최신 스냅샷 시각 (ms) */
export async function getLastBackupTimestamp(): Promise<number | null> {
  const list = await listSnapshots();
  if (!list.length) return null;
  return list[list.length - 1].ts;
}

export async function listSnapshots(): Promise<{ id: number; ts: number; keyCount: number }[]> {
  if (typeof window === "undefined" || !window.indexedDB) return [];
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const st = tx.objectStore(STORE);
      const req = st.getAll();
      req.onsuccess = () => {
        const raw = (req.result as LocalBackupSnapshot[]) ?? [];
        const out = raw.map((v) => ({
          id: v.id,
          ts: v.ts,
          keyCount: v.entries ? Object.keys(v.entries).length : 0,
        }));
        out.sort((a, b) => a.ts - b.ts);
        db.close();
        resolve(out);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function getSnapshotById(id: number): Promise<LocalBackupSnapshot | null> {
  const db = await openDb();
  return await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const st = tx.objectStore(STORE);
    const req = st.get(id);
    req.onsuccess = () => {
      db.close();
      resolve((req.result as LocalBackupSnapshot) ?? null);
    };
    req.onerror = () => reject(req.error);
  });
}

/** 스냅샷을 localStorage에 덮어쓰기 후 커스텀 이벤트 */
export async function restoreSnapshotToLocalStorage(id: number): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === "undefined") return { ok: false, error: "no window" };
  try {
    const snap = await getSnapshotById(id);
    if (!snap?.entries) return { ok: false, error: "스냅샷 없음" };
    for (const [k, v] of Object.entries(snap.entries)) {
      if (k.startsWith(PREFIX)) localStorage.setItem(k, v);
    }
    try {
      window.dispatchEvent(new CustomEvent("mimi_local_backup_restored"));
      window.dispatchEvent(new CustomEvent("mimi_homepage_updated"));
      window.dispatchEvent(new CustomEvent("mimi_tips_notices_updated"));
    } catch {
      /* ignore */
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** 최신 스냅샷 복원 */
export async function restoreLatestSnapshot(): Promise<{ ok: boolean; error?: string }> {
  const list = await listSnapshots();
  if (!list.length) return { ok: false, error: "백업 없음" };
  const last = list[list.length - 1];
  return restoreSnapshotToLocalStorage(last.id);
}

/** JSON 파일로 내보내기 (수동 보관용) */
export function downloadBackupJson(): void {
  if (typeof window === "undefined") return;
  const entries = collectMimiEntries();
  const blob = new Blob(
    [JSON.stringify({ exportedAt: new Date().toISOString(), entries }, null, 2)],
    { type: "application/json;charset=utf-8" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `mimi-local-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/** JSON 파일에서 복원 (사용자가 선택한 파일) */
export function restoreFromJsonFile(file: File): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const text = r.result as string;
        const parsed = JSON.parse(text) as { entries?: Record<string, string> };
        if (!parsed.entries || typeof parsed.entries !== "object") {
          resolve({ ok: false, error: "형식 오류 (entries 없음)" });
          return;
        }
        for (const [k, v] of Object.entries(parsed.entries)) {
          if (k.startsWith(PREFIX) && typeof v === "string") localStorage.setItem(k, v);
        }
        try {
          window.dispatchEvent(new CustomEvent("mimi_local_backup_restored"));
          window.dispatchEvent(new CustomEvent("mimi_homepage_updated"));
          window.dispatchEvent(new CustomEvent("mimi_tips_notices_updated"));
        } catch {
          /* ignore */
        }
        resolve({ ok: true });
      } catch (e) {
        resolve({ ok: false, error: e instanceof Error ? e.message : String(e) });
      }
    };
    r.onerror = () => resolve({ ok: false, error: "파일 읽기 실패" });
    r.readAsText(file);
  });
}

export function isLocalAutoBackupEnabled(): boolean {
  if (typeof process === "undefined") return false;
  if (process.env.NEXT_PUBLIC_LOCAL_AUTOBACKUP === "0") return false;
  return process.env.NODE_ENV === "development";
}
