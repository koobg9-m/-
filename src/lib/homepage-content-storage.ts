"use client";

const HOMEPAGE_CONTENT_KEY = "mimi_homepage_content";

export type GalleryItem = {
  id: string;
  type: "image" | "video";
  url: string;
  title?: string;
  order: number;
};

export type ProductLink = {
  id: string;
  title: string;
  url: string;
  imageUrl?: string;
  order: number;
};

export type HomepageContent = {
  gallery: GalleryItem[];
  productLinks: ProductLink[];
};

/** 제품용 기본 이미지 (public 폴더 경로 사용) */
const PRODUCT_PLACEHOLDER = "/hero-dog.svg";

/** 기본 갤러리 (첫 방문 시 표시) */
const DEFAULT_GALLERY: GalleryItem[] = [
  { id: "default-g1", type: "image", url: "/hero-maltese.jpg", title: "미용 전후", order: 0 },
];

const DEFAULT: HomepageContent = {
  gallery: [],
  productLinks: [],
};

function parseContent(raw: string | null): HomepageContent {
  if (!raw) return DEFAULT;
  try {
    const parsed = JSON.parse(raw) as Partial<HomepageContent>;
    const productLinks = Array.isArray(parsed?.productLinks) ? parsed.productLinks : [];
    // 기존 기본 쿠팡 링크 제거 (입력하지 않은 제품)
    const filtered = productLinks.filter((p) => !p.id?.startsWith("default-"));
    return {
      gallery: Array.isArray(parsed?.gallery) ? parsed.gallery : [],
      productLinks: filtered,
    };
  } catch {
    return DEFAULT;
  }
}

export function getHomepageContent(): HomepageContent {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const fromLocal = localStorage.getItem(HOMEPAGE_CONTENT_KEY);
    if (fromLocal) {
      const parsed = parseContent(fromLocal);
      if (parsed.gallery.length === 0) parsed.gallery = [...DEFAULT_GALLERY];
      if (parsed.productLinks.some((p) => p.id?.startsWith("default-"))) {
        parsed.productLinks = parsed.productLinks.filter((p) => !p.id?.startsWith("default-"));
        saveHomepageContent(parsed);
      }
      return parsed;
    }
    const fromSession = sessionStorage.getItem(HOMEPAGE_CONTENT_KEY);
    if (fromSession) {
      const parsed = parseContent(fromSession);
      if (parsed.gallery.length === 0) parsed.gallery = [...DEFAULT_GALLERY];
      if (parsed.productLinks.some((p) => p.id?.startsWith("default-"))) {
        parsed.productLinks = parsed.productLinks.filter((p) => !p.id?.startsWith("default-"));
        saveHomepageContent(parsed);
      }
      return parsed;
    }
    return { gallery: [...DEFAULT_GALLERY], productLinks: [] };
  } catch {
    return { gallery: [...DEFAULT_GALLERY], productLinks: [] };
  }
}

export function saveHomepageContent(content: HomepageContent): boolean {
  if (typeof window === "undefined") return false;
  try {
    const json = JSON.stringify(content);
    localStorage.setItem(HOMEPAGE_CONTENT_KEY, json);
    sessionStorage.setItem(HOMEPAGE_CONTENT_KEY, json);
    try {
      window.dispatchEvent(new CustomEvent("mimi_homepage_updated", { detail: content }));
    } catch {
      /* ignore */
    }
    return true;
  } catch {
    return false;
  }
}

export function addGalleryItem(item: Omit<GalleryItem, "id" | "order">): GalleryItem {
  const content = getHomepageContent();
  const order = content.gallery.length;
  const newItem: GalleryItem = {
    ...item,
    id: `G${Date.now()}`,
    order,
  };
  content.gallery.push(newItem);
  saveHomepageContent(content);
  return newItem;
}

/** 여러 항목 한 번에 추가 (파일 업로드 시 효율적) */
export function addGalleryItems(items: Omit<GalleryItem, "id" | "order">[]): GalleryItem[] {
  const content = getHomepageContent();
  const baseOrder = content.gallery.length;
  const now = Date.now();
  const newItems: GalleryItem[] = items.map((item, i) => ({
    ...item,
    id: `G${now + i}`,
    order: baseOrder + i,
  }));
  content.gallery.push(...newItems);
  saveHomepageContent(content);
  return newItems;
}

export function updateGalleryItem(id: string, updates: Partial<GalleryItem>): void {
  const content = getHomepageContent();
  const idx = content.gallery.findIndex((g) => g.id === id);
  if (idx >= 0) {
    content.gallery[idx] = { ...content.gallery[idx], ...updates };
    saveHomepageContent(content);
  }
}

export function removeGalleryItem(id: string): void {
  const content = getHomepageContent();
  content.gallery = content.gallery.filter((g) => g.id !== id);
  content.gallery.forEach((g, i) => (g.order = i));
  saveHomepageContent(content);
}

const MAX_IMAGE_URL_LENGTH = 150000; // localStorage 용량 절약

export function addProductLink(item: Omit<ProductLink, "id" | "order">): { ok: boolean; item?: ProductLink; error?: string } {
  try {
    const content = getHomepageContent();
    const order = content.productLinks.length;
    let imageUrl = item.imageUrl;
    if (imageUrl?.startsWith("data:") && imageUrl.length > MAX_IMAGE_URL_LENGTH) {
      imageUrl = "/hero-dog.svg";
    }
    const newItem: ProductLink = {
      ...item,
      imageUrl,
      id: `P${Date.now()}`,
      order,
    };
    content.productLinks.push(newItem);
    const saved = saveHomepageContent(content);
    if (!saved) return { ok: false, error: "저장에 실패했습니다. 저장 공간이 부족할 수 있습니다." };
    return { ok: true, item: newItem };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.includes("QuotaExceeded") ? "저장 공간이 부족합니다. 이미지를 줄이거나 제거해 주세요." : `저장 실패: ${msg}` };
  }
}

export function updateProductLink(id: string, updates: Partial<ProductLink>): void {
  const content = getHomepageContent();
  const idx = content.productLinks.findIndex((p) => p.id === id);
  if (idx >= 0) {
    content.productLinks[idx] = { ...content.productLinks[idx], ...updates };
    saveHomepageContent(content);
  }
}

export function removeProductLink(id: string): void {
  const content = getHomepageContent();
  content.productLinks = content.productLinks.filter((p) => p.id !== id);
  content.productLinks.forEach((p, i) => (p.order = i));
  saveHomepageContent(content);
}

/** 테스트용 샘플 이미지 (public 폴더) */
const SAMPLE_IMAGE = "/hero-maltese.jpg";

/** 테스트용 샘플 데이터 추가 (표시 확인용) */
export function addSampleHomepageContent(): void {
  const content = getHomepageContent();
  if (content.gallery.length > 0 && content.productLinks.length > 0) return;
  const now = Date.now();
  if (content.gallery.length === 0) {
    content.gallery = [
      { id: `G${now}`, type: "image" as const, url: SAMPLE_IMAGE, title: "샘플 사진 1", order: 0 },
      { id: `G${now + 1}`, type: "image" as const, url: SAMPLE_IMAGE, title: "샘플 사진 2", order: 1 },
    ];
  }
  if (content.productLinks.length === 0) {
    content.productLinks = [
      { id: `P${now}`, title: "샘플 제품", url: "https://example.com", imageUrl: PRODUCT_PLACEHOLDER, order: 0 },
    ];
  }
  saveHomepageContent(content);
}
