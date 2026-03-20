"use client";

import { fetchData, saveData, subscribeDataKey } from "./data-sync";

export const TIPS_KEY = "mimi_tips_content";
export const NOTICES_KEY = "mimi_notices_content";

export type TipItem = {
  id: string;
  title: string;
  slug: string;
  content: string;
  order: number;
};

export type NoticeItem = {
  id: string;
  type: "공지" | "이벤트";
  title: string;
  date: string;
  content?: string;
  url?: string;
  /** 고정 공지 (상단 고정) */
  pinned?: boolean;
  order: number;
};

const DEFAULT_TIPS: TipItem[] = [
  { id: "nail", title: "손톱 관리 방법", slug: "nail-care", content: "개손톱은 주기적으로 관리해 주세요. 너무 길게 자라면 걸을 때 불편하고, 발가락에 상처가 날 수 있습니다. 2~4주마다 한 번씩 깎아 주시고, 처음부터 무는 아이는 전문 그루머에게 맡길 것을 권장합니다.", order: 0 },
  { id: "bath", title: "목욕 주기와 방법", slug: "bath-tips", content: "강아지 목욕은 견종과 피부 상태에 따라 다릅니다. 일반적으로 2~4주마다 한 번씩 목욕하는 것이 좋습니다. 너무 자주 목욕하면 피부 보호막이 손상될 수 있으니 주의하세요.", order: 1 },
  { id: "coat", title: "털 관리 노하우", slug: "coat-care", content: "일상적인 브러싱은 털결을 부드럽게 하고 탈모를 줄입니다. 장모종은 매일, 단모종은 2~3일에 한 번씩 빗어 주세요. 털이 엉키기 전에 미용하는 것이 좋습니다.", order: 2 },
  { id: "stress", title: "미용 시 스트레스 줄이기", slug: "stress-reduction", content: "미용 전에 산책을 시켜 긴장을 풀어 주세요. 익숙한 장소(집)에서 미용을 받으면 더 편안합니다. 미미살롱펫은 찾아가는 서비스로, 아이가 편한 공간에서 미용받을 수 있습니다.", order: 3 },
];

const DEFAULT_NOTICES: NoticeItem[] = [
  { id: "n1", type: "공지", title: "미미살롱펫에 오신 것을 환영합니다!", date: "25.03.14", pinned: true, content: "찾아가는 펫 미용 서비스 미미살롱펫입니다. 전문 그루머가 고객님 댁으로 방문하여 안전하고 편안한 미용 서비스를 제공합니다.", order: 0 },
  { id: "n2", type: "공지", title: "대선일 휴무 안내", date: "25.03.01", order: 1 },
  { id: "n3", type: "이벤트", title: "사료 공동구매 합니다.", date: "25.02.28", content: "사료 공동구매 이벤트입니다. 참여를 원하시면 연락 주세요.", order: 2 },
];

function getStored<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw) as T;
  } catch {
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(key, JSON.stringify(val));
    try {
      window.dispatchEvent(new CustomEvent("mimi_tips_notices_updated"));
    } catch {
      /* ignore */
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Supabase에서 팁·공지를 가져와 localStorage에 반영.
 */
export async function hydrateTipsNoticesFromRemote(): Promise<void> {
  if (typeof window === "undefined") return;
  const [remoteTips, remoteNotices] = await Promise.all([
    fetchData<TipItem[]>(TIPS_KEY),
    fetchData<NoticeItem[]>(NOTICES_KEY),
  ]);
  if (remoteTips != null && Array.isArray(remoteTips)) {
    const withOrder = remoteTips.map((t, i) => ({ ...t, order: t.order ?? i }));
    setStored(TIPS_KEY, withOrder);
  }
  if (remoteNotices != null && Array.isArray(remoteNotices)) {
    const withOrder = remoteNotices.map((n, i) => ({ ...n, order: n.order ?? i }));
    setStored(NOTICES_KEY, withOrder);
  }
}

/** Realtime: 팁 또는 공지 변경 시 */
export function subscribeTipsNoticesRemote(onUpdate: () => void): () => void {
  const u1 = subscribeDataKey(TIPS_KEY, () => {
    void hydrateTipsNoticesFromRemote().finally(() => onUpdate());
  });
  const u2 = subscribeDataKey(NOTICES_KEY, () => {
    void hydrateTipsNoticesFromRemote().finally(() => onUpdate());
  });
  return () => {
    u1();
    u2();
  };
}

export function getTips(): TipItem[] {
  const stored = getStored<TipItem[]>(TIPS_KEY, []);
  if (stored.length === 0) return [...DEFAULT_TIPS];
  return stored.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function saveTips(tips: TipItem[]): boolean {
  const withOrder = tips.map((t, i) => ({ ...t, order: i }));
  const ok = setStored(TIPS_KEY, withOrder);
  void saveData(TIPS_KEY, withOrder);
  return ok;
}

export function addTip(item: Omit<TipItem, "id" | "order">): TipItem {
  const tips = getTips();
  const slug = item.slug || item.title.replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9가-힣-]/g, "");
  const newItem: TipItem = {
    ...item,
    slug: slug || `tip-${Date.now()}`,
    id: `T${Date.now()}`,
    order: tips.length,
  };
  tips.push(newItem);
  saveTips(tips);
  return newItem;
}

export function updateTip(id: string, updates: Partial<TipItem>): void {
  const tips = getTips();
  const idx = tips.findIndex((t) => t.id === id);
  if (idx >= 0) {
    tips[idx] = { ...tips[idx], ...updates };
    saveTips(tips);
  }
}

export function removeTip(id: string): void {
  const tips = getTips().filter((t) => t.id !== id);
  tips.forEach((t, i) => (t.order = i));
  saveTips(tips);
}

export function getTipBySlug(slug: string): TipItem | null {
  return getTips().find((t) => t.slug === slug) ?? null;
}

export function getNotices(): NoticeItem[] {
  const stored = getStored<NoticeItem[]>(NOTICES_KEY, []);
  if (stored.length === 0) return [...DEFAULT_NOTICES];
  return stored.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

export function saveNotices(notices: NoticeItem[]): boolean {
  const withOrder = notices.map((n, i) => ({ ...n, order: i }));
  const ok = setStored(NOTICES_KEY, withOrder);
  void saveData(NOTICES_KEY, withOrder);
  return ok;
}

export function addNotice(item: Omit<NoticeItem, "id" | "order">): NoticeItem {
  const notices = getNotices();
  const newItem: NoticeItem = {
    ...item,
    id: `N${Date.now()}`,
    order: notices.length,
  };
  notices.push(newItem);
  saveNotices(notices);
  return newItem;
}

export function updateNotice(id: string, updates: Partial<NoticeItem>): void {
  const notices = getNotices();
  const idx = notices.findIndex((n) => n.id === id);
  if (idx >= 0) {
    notices[idx] = { ...notices[idx], ...updates };
    saveNotices(notices);
  }
}

export function removeNotice(id: string): void {
  const notices = getNotices().filter((n) => n.id !== id);
  notices.forEach((n, i) => (n.order = i));
  saveNotices(notices);
}
